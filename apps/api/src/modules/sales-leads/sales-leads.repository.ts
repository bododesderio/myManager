import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SalesLeadsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(status: string | undefined, offset: number, limit: number): Promise<[unknown[], number]> {
    const where = status ? { status } : {};
    const [leads, total] = await Promise.all([
      this.prisma.salesLead.findMany({ where, skip: offset, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.salesLead.count({ where }),
    ]);
    return [leads, total];
  }

  async findById(id: string) { return this.prisma.salesLead.findUnique({ where: { id } }); }
  async create(data: Record<string, unknown>) { return this.prisma.salesLead.create({ data } as unknown as Parameters<typeof this.prisma.salesLead.create>[0]); }
  async update(id: string, data: Record<string, unknown>) { return this.prisma.salesLead.update({ where: { id }, data }); }
  async delete(id: string) { return this.prisma.salesLead.delete({ where: { id } }); }
}
