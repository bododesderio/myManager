import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { MediaRepository } from './media.repository';

@Injectable()
export class MediaService {
  private readonly s3Client: S3Client | null;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly useLocalStorage: boolean;
  private readonly localStoragePath: string;
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly repository: MediaRepository,
    private readonly configService: ConfigService,
    @InjectQueue('media-processing') private mediaQueue: Queue,
  ) {
    const r2AccessKey = this.configService.get('CLOUDFLARE_R2_ACCESS_KEY');
    const storageDriver = this.configService.get('STORAGE_DRIVER', 'local');

    if (r2AccessKey && storageDriver !== 'local') {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${this.configService.get('CLOUDFLARE_R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: r2AccessKey,
          secretAccessKey: this.configService.get('CLOUDFLARE_R2_SECRET_KEY')!,
        },
      });
      this.bucketName = this.configService.get('CLOUDFLARE_R2_BUCKET')!;
      this.publicUrl = this.configService.get('CLOUDFLARE_R2_PUBLIC_URL')!;
      this.useLocalStorage = false;
      this.localStoragePath = '';
    } else {
      this.s3Client = null;
      this.bucketName = '';
      this.publicUrl = '';
      this.useLocalStorage = true;
      this.localStoragePath = this.configService.get('LOCAL_STORAGE_PATH', './uploads');
      this.logger.warn('CLOUDFLARE_R2_ACCESS_KEY not set — using local file storage');

      // Ensure local uploads directory exists
      if (!fs.existsSync(this.localStoragePath)) {
        fs.mkdirSync(this.localStoragePath, { recursive: true });
      }
    }
  }

  async list(workspaceId: string, type: string | undefined, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [assets, total] = await this.repository.findByWorkspace(workspaceId, type, offset, limit);
    return {
      data: assets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPresignedUploadUrl(userId: string, data: {
    workspaceId: string;
    fileName: string;
    contentType: string;
    fileSize: number;
  }) {
    const storageUsage = await this.repository.getStorageUsedBytes(data.workspaceId);
    const storageLimit = await this.repository.getStorageLimitBytes(data.workspaceId);
    if (storageUsage + BigInt(data.fileSize) > storageLimit) {
      throw new BadRequestException('Storage quota exceeded');
    }

    const fileExt = data.fileName.split('.').pop();
    const fileKey = `media/${data.workspaceId}/${crypto.randomUUID()}.${fileExt}`;

    if (this.useLocalStorage) {
      const localDir = path.join(this.localStoragePath, 'media', data.workspaceId);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const _localFilePath = path.join(this.localStoragePath, fileKey);
      const uploadUrl = `/uploads/${fileKey}`;

      const mediaAsset = await this.repository.create({
        workspace_id: data.workspaceId,
        user_id: userId,
        filename: data.fileName,
        mime_type: data.contentType,
        size_bytes: BigInt(data.fileSize),
        r2_key: fileKey,
        url: uploadUrl,
      });

      return { uploadUrl, mediaId: mediaAsset.id, r2Key: fileKey };
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: data.contentType,
      ContentLength: data.fileSize,
    });

    await this.s3Client!.send(command);
    const uploadUrl = `${this.publicUrl}/${fileKey}`;

    const mediaAsset = await this.repository.create({
      workspace_id: data.workspaceId,
      user_id: userId,
      filename: data.fileName,
      mime_type: data.contentType,
      size_bytes: BigInt(data.fileSize),
      r2_key: fileKey,
      url: `${this.publicUrl}/${fileKey}`,
    });

    return { uploadUrl, mediaId: mediaAsset.id, r2Key: fileKey };
  }

  async confirmUpload(mediaId: string, r2Key: string) {
    const asset = await this.repository.findById(mediaId);
    if (!asset) throw new NotFoundException('Media asset not found');

    await this.mediaQueue.add('process', {
      mediaId,
      r2Key,
      mimeType: asset.mime_type,
    }, {
      attempts: 3,
      backoff: { type: 'fixed', delay: 5000 },
    });

    return { message: 'Upload confirmed, processing started', mediaId };
  }

  async getById(id: string) {
    const asset = await this.repository.findById(id);
    if (!asset) throw new NotFoundException('Media asset not found');
    return asset;
  }

  async delete(id: string) {
    const asset = await this.repository.findById(id);
    if (!asset) throw new NotFoundException('Media asset not found');

    if (this.useLocalStorage) {
      const localFilePath = path.join(this.localStoragePath, asset.r2_key);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } else {
      await this.s3Client!.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: asset.r2_key,
      }));
    }

    await this.repository.delete(id);
    return { message: 'Media asset deleted' };
  }

  async bulkDelete(mediaIds: string[]) {
    const assets = await this.repository.findByIds(mediaIds);
    for (const asset of assets) {
      if (this.useLocalStorage) {
        const localFilePath = path.join(this.localStoragePath, asset.r2_key);
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } else {
        await this.s3Client!.send(new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: asset.r2_key,
        }));
      }
    }
    await this.repository.bulkDelete(mediaIds);
    return { deleted: mediaIds.length };
  }

  async getVariants(id: string) {
    const asset = await this.repository.findById(id);
    if (!asset) throw new NotFoundException('Media asset not found');
    return asset.variants || [];
  }

  async getStorageUsage(workspaceId: string) {
    const usedBytes = await this.repository.getStorageUsedBytes(workspaceId);
    const limitBytes = await this.repository.getStorageLimitBytes(workspaceId);
    const usedNum = Number(usedBytes);
    const limitNum = Number(limitBytes);
    return {
      usedBytes: usedNum,
      limitBytes: limitNum,
      usedFormatted: this.formatBytes(usedNum),
      limitFormatted: this.formatBytes(limitNum),
      percentUsed: limitNum > 0 ? Number(((usedNum / limitNum) * 100).toFixed(2)) : 0,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
