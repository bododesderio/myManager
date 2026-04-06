import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
// @ts-expect-error sharp types not installed
import sharp from 'sharp';

const execFileAsync = promisify(execFile);

interface MediaProcessJobData {
  mediaId: string;
  r2Key: string;
  contentType: string;
}

const VARIANTS = [
  { name: 'thumbnail', width: 200, height: 200, fit: 'cover' as const },
  { name: 'small', width: 400, height: 400, fit: 'inside' as const },
  { name: 'medium', width: 800, height: 800, fit: 'inside' as const },
  { name: 'large', width: 1200, height: 1200, fit: 'inside' as const },
];

export class MediaProcessorWorker {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
      },
    });
    this.bucket = process.env.CLOUDFLARE_R2_BUCKET!;
  }

  async process(job: Job<MediaProcessJobData>): Promise<void> {
    const { mediaId, r2Key, contentType } = job.data;

    if (contentType.startsWith('image/')) {
      await this.processImage(mediaId, r2Key, contentType);
    } else if (contentType.startsWith('video/')) {
      await this.processVideo(mediaId, r2Key);
    }
  }

  private async processImage(mediaId: string, r2Key: string, _contentType: string): Promise<void> {
    const getCommand = new GetObjectCommand({ Bucket: this.bucket, Key: r2Key });
    const response = await this.s3Client.send(getCommand);
    const originalBuffer = Buffer.from(await response.Body!.transformToByteArray());

    const metadata = await sharp(originalBuffer).metadata();
    await this.prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        width: metadata.width,
        height: metadata.height,
      },
    });

    const variants: Record<string, string> = {};

    for (const variant of VARIANTS) {
      const processedBuffer = await sharp(originalBuffer)
        .resize(variant.width, variant.height, { fit: variant.fit, withoutEnlargement: true })
        .removeAlpha()
        .jpeg({ quality: 80 })
        .toBuffer();

      const variantKey = r2Key.replace(/\.[^.]+$/, `_${variant.name}.jpg`);

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: variantKey,
        Body: processedBuffer,
        ContentType: 'image/jpeg',
      }));

      variants[variant.name] = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${variantKey}`;
    }

    await this.prisma.mediaAsset.update({
      where: { id: mediaId },
      data: { variants },
    });
  }

  private async processVideo(mediaId: string, r2Key: string): Promise<void> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mm-video-'));
    const inputPath = path.join(tmpDir, 'input' + path.extname(r2Key));
    const thumbPath = path.join(tmpDir, 'thumb.jpg');

    try {
      // Download original from R2
      const getCommand = new GetObjectCommand({ Bucket: this.bucket, Key: r2Key });
      const response = await this.s3Client.send(getCommand);
      const buffer = Buffer.from(await response.Body!.transformToByteArray());
      await fs.writeFile(inputPath, buffer);

      // Probe metadata
      let width: number | undefined;
      let height: number | undefined;
      let durationSec: number | undefined;
      try {
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'error',
          '-select_streams', 'v:0',
          '-show_entries', 'stream=width,height,duration',
          '-of', 'json',
          inputPath,
        ]);
        const meta = JSON.parse(stdout);
        const stream = meta?.streams?.[0];
        if (stream) {
          width = stream.width;
          height = stream.height;
          durationSec = stream.duration ? parseFloat(stream.duration) : undefined;
        }
      } catch {
        // metadata extraction failed; continue without it
      }

      // Extract thumbnail at 1s (or 0 if shorter)
      const seekTime = durationSec && durationSec < 1 ? '0' : '1';
      await execFileAsync('ffmpeg', [
        '-y',
        '-ss', seekTime,
        '-i', inputPath,
        '-frames:v', '1',
        '-vf', 'scale=400:-1',
        '-q:v', '4',
        thumbPath,
      ]);

      const thumbBuffer = await fs.readFile(thumbPath);
      const thumbKey = r2Key.replace(/\.[^.]+$/, '_thumb.jpg');
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: thumbKey,
        Body: thumbBuffer,
        ContentType: 'image/jpeg',
      }));

      const variants: Record<string, string> = {
        thumbnail: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${thumbKey}`,
      };

      await this.prisma.mediaAsset.update({
        where: { id: mediaId },
        data: {
          width,
          height,
          duration_seconds: durationSec,
          variants,
        },
      });
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
