import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { encryptSecret, decryptSecret } from '../../common/crypto/crypto.util';

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
    return encryptSecret(value);
  }

  private decrypt(encrypted: string): string {
    return decryptSecret(encrypted);
  }
}
