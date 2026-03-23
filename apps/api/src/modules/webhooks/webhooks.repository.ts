import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class WebhooksRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string) { return this.prisma.webhookEndpoint.findMany({ where: { workspace_id: workspaceId } }); }
  async findById(id: string) { return this.prisma.webhookEndpoint.findUnique({ where: { id } }); }
  async create(data: Record<string, unknown>) { return this.prisma.webhookEndpoint.create({ data } as unknown as Parameters<typeof this.prisma.webhookEndpoint.create>[0]); }
  async update(id: string, data: Record<string, unknown>) { return this.prisma.webhookEndpoint.update({ where: { id }, data }); }
  async delete(id: string) { return this.prisma.webhookEndpoint.delete({ where: { id } }); }

  async findActiveByWorkspaceAndEvent(workspaceId: string, event: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { workspace_id: workspaceId, is_active: true, events: { has: event } },
    });
  }

  async findDeliveries(endpointId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    const where = { webhook_endpoint_id: endpointId };
    const [deliveries, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({ where, skip: offset, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.webhookDelivery.count({ where }),
    ]);
    return [deliveries, total];
  }

  async createDelivery(data: Record<string, unknown>) { return this.prisma.webhookDelivery.create({ data } as unknown as Parameters<typeof this.prisma.webhookDelivery.create>[0]); }
  async updateDelivery(id: string, data: Record<string, unknown>) { return this.prisma.webhookDelivery.update({ where: { id }, data }); }
}
