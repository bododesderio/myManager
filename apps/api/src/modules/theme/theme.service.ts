import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ThemeService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveTheme() {
    const theme = await this.prisma.themeConfig.findFirst();
    if (!theme) {
      throw new NotFoundException('No active theme config found');
    }
    return theme;
  }

  async updateActiveTheme(data: Record<string, unknown>) {
    const existing = await this.prisma.themeConfig.findFirst();
    if (existing) {
      return this.prisma.themeConfig.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.themeConfig.create({ data });
  }

  async listPresets() {
    return this.prisma.themePreset.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async applyPreset(id: string) {
    const preset = await this.prisma.themePreset.findUnique({ where: { id } });
    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    // Mark all presets as inactive, then mark this one active
    await this.prisma.themePreset.updateMany({ data: { is_active: false } });
    await this.prisma.themePreset.update({
      where: { id },
      data: { is_active: true },
    });

    // Update ThemeConfig from preset config
    const existing = await this.prisma.themeConfig.findFirst();
    const config = preset.config as Record<string, unknown>;
    if (existing) {
      return this.prisma.themeConfig.update({
        where: { id: existing.id },
        data: config,
      });
    }
    return this.prisma.themeConfig.create({ data: config });
  }

  async createPreset(data: { name: string; label?: string; description?: string; config: Record<string, any>; is_built_in?: boolean }) {
    return this.prisma.themePreset.create({
      data: { name: data.name, label: data.label || data.name, description: data.description || '', config: data.config, is_built_in: data.is_built_in ?? false },
    });
  }

  async deletePreset(id: string) {
    const preset = await this.prisma.themePreset.findUnique({ where: { id } });
    if (!preset) {
      throw new NotFoundException('Preset not found');
    }
    if (preset.is_built_in) {
      throw new BadRequestException('Cannot delete a built-in preset');
    }
    return this.prisma.themePreset.delete({ where: { id } });
  }
}
