import { Injectable } from '@nestjs/common';
import { BrandRepository } from './brand.repository';

@Injectable()
export class BrandService {
  constructor(private readonly repository: BrandRepository) {}

  async getPlatformBrand() {
    return this.repository.getPlatformBrandConfig();
  }

  async updatePlatformBrand(data: Record<string, unknown>) {
    const config = await this.repository.updatePlatformBrandConfig(data);
    await this.repository.invalidateBrandCache();
    return config;
  }

  async getWorkspaceBrand(workspaceId: string) {
    return this.repository.getWorkspaceBrandConfig(workspaceId);
  }

  async updateWorkspaceBrand(workspaceId: string, data: Record<string, unknown>) {
    return this.repository.upsertWorkspaceBrandConfig(workspaceId, data);
  }

  async getProjectBrand(projectId: string) {
    return this.repository.getProjectBrandConfig(projectId);
  }

  async updateProjectBrand(projectId: string, data: Record<string, unknown>) {
    return this.repository.upsertProjectBrandConfig(projectId, data);
  }

  async resolveBrand(workspaceId?: string, projectId?: string) {
    const platform = await this.repository.getPlatformBrandConfig();
    let resolved = { ...platform };

    if (workspaceId) {
      const workspace = await this.repository.getWorkspaceBrandConfig(workspaceId);
      if (workspace) {
        resolved = this.mergeConfigs(resolved, workspace as Record<string, any>);
      }
    }

    if (projectId) {
      const project = await this.repository.getProjectBrandConfig(projectId);
      if (project) {
        resolved = this.mergeConfigs(resolved, project as Record<string, any>);
      }
    }

    return resolved;
  }

  private mergeConfigs(base: Record<string, any>, override: Record<string, any>): Record<string, any> {
    const merged = { ...base };
    for (const [key, value] of Object.entries(override)) {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value) && typeof merged[key] === 'object') {
          merged[key] = this.mergeConfigs(merged[key], value);
        } else {
          merged[key] = value;
        }
      }
    }
    return merged;
  }
}
