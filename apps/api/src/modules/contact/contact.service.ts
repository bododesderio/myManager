import { Injectable } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async createLead(data: {
    name: string;
    email: string;
    company?: string;
    team_size?: string;
    message: string;
  }) {
    await this.prisma.contactLead.create({ data });
    return { success: true };
  }

  async listLeads(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as LeadStatus } : {};
    const [items, total] = await Promise.all([
      this.prisma.contactLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.contactLead.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async updateLead(
    id: string,
    data: { status?: LeadStatus; notes?: string; assigned_to?: string | null },
  ) {
    return this.prisma.contactLead.update({
      where: { id },
      data,
    });
  }
}
