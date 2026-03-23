import { Injectable, NotFoundException } from '@nestjs/common';
import { SalesLeadsRepository } from './sales-leads.repository';

@Injectable()
export class SalesLeadsService {
  constructor(private readonly repository: SalesLeadsRepository) {}

  async submit(data: Record<string, unknown>) {
    const lead = await this.repository.create({ ...data, status: 'new' });
    return { message: 'Thank you for your interest. Our sales team will contact you shortly.', leadId: lead.id };
  }

  async list(status: string | undefined, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [leads, total] = await this.repository.findAll(status, offset, limit);
    return { data: leads, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const lead = await this.repository.findById(id);
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async updateStatus(id: string, status: string, notes?: string) {
    return this.repository.update(id, { status, ...(notes ? { notes } : {}) });
  }

  async delete(id: string) { await this.repository.delete(id); return { message: 'Lead deleted' }; }
}
