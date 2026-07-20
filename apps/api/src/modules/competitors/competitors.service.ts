import { Injectable, NotFoundException } from '@nestjs/common';
import { CompetitorsRepository } from './competitors.repository';

@Injectable()
export class CompetitorsService {
  constructor(private readonly repository: CompetitorsRepository) {}

  async list(workspaceId: string) { return this.repository.findByWorkspace(workspaceId); }

  async add(data: { workspaceId: string; platform: string; platformUsername: string; displayName: string }) {
    return this.repository.create(data);
  }

  async getById(id: string, workspaceId: string) {
    const profile = await this.repository.findById(id, workspaceId);
    if (!profile) throw new NotFoundException('Competitor profile not found');
    return profile;
  }

  async remove(id: string, workspaceId: string) {
    const deleted = await this.repository.delete(id, workspaceId);
    if (!deleted) throw new NotFoundException('Competitor profile not found');
    return { message: 'Competitor profile removed' };
  }

  async getSnapshots(id: string, days: number) { return this.repository.findSnapshots(id, days); }

  async getBenchmarks(workspaceId: string, platform: string) {
    const [own, competitors] = await Promise.all([
      this.repository.getOwnMetrics(workspaceId, platform),
      this.repository.getCompetitorMetrics(workspaceId, platform),
    ]);
    return { own, competitors };
  }
}
