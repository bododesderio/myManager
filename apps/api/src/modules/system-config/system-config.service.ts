import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SystemConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(category?: string) {
    const where = category ? { category } : {};
    const configs = await this.prisma.systemConfig.findMany({ where, orderBy: { key: 'asc' } });

    return configs.map((config) => ({
      ...config,
      value: config.is_secret ? `****${config.value.length > 4 ? this.decrypt(config.value).slice(-4) : ''}` : this.decrypt(config.value),
    }));
  }

  async upsert(key: string, data: { value: string; category: string; is_secret?: boolean }) {
    const isSecret = data.is_secret ?? true;
    const encryptedValue = this.encrypt(data.value);

    return this.prisma.systemConfig.upsert({
      where: { key },
      create: {
        key,
        value: encryptedValue,
        category: data.category,
        is_secret: isSecret,
      },
      update: {
        value: encryptedValue,
        category: data.category,
        is_secret: isSecret,
      },
    });
  }

  async delete(key: string) {
    return this.prisma.systemConfig.delete({ where: { key } });
  }

  /**
   * Get a config value by key.
   * 1. Checks SystemConfig table first
   * 2. Falls back to process.env[key]
   * 3. Decrypts if is_secret
   */
  async getConfigValue(key: string): Promise<string | undefined> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });

    if (config) {
      return this.decrypt(config.value);
    }

    return process.env[key];
  }

  private encrypt(value: string): string {
    const key = Buffer.from(this.configService.get<string>('ENCRYPTION_KEY')!, 'hex');
    const iv = crypto.randomBytes(12); // GCM uses 12-byte IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(encrypted: string): string {
    const key = Buffer.from(this.configService.get<string>('ENCRYPTION_KEY')!, 'hex');
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format — expected GCM format (iv:authTag:ciphertext)');
    }
    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
