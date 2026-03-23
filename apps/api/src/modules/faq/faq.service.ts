import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async getVisibleFaqs(page?: string) {
    const where: Record<string, unknown> = { is_visible: true };
    if (page) {
      where.page = page;
    }
    return this.prisma.faqItem.findMany({
      where,
      orderBy: { order_index: 'asc' },
    });
  }

  async listAll() {
    return this.prisma.faqItem.findMany({
      orderBy: { order_index: 'asc' },
    });
  }

  async create(data: {
    question: string;
    answer: string;
    page?: string;
    order_index?: number;
    is_visible?: boolean;
  }) {
    return this.prisma.faqItem.create({ data });
  }

  async update(
    id: string,
    data: {
      question?: string;
      answer?: string;
      page?: string;
      order_index?: number;
      is_visible?: boolean;
    },
  ) {
    return this.prisma.faqItem.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.faqItem.delete({ where: { id } });
  }
}
