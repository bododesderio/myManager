import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async getVisible(placement?: string) {
    const where: Record<string, unknown> = { is_visible: true };
    if (placement) {
      where.placement = placement;
    }
    return this.prisma.testimonial.findMany({
      where,
      orderBy: { order_index: 'asc' },
    });
  }

  async listAll() {
    return this.prisma.testimonial.findMany({
      orderBy: { order_index: 'asc' },
    });
  }

  async create(data: {
    author_name: string;
    author_role: string;
    author_initials: string;
    company: string;
    quote: string;
    author_avatar_color?: string;
    rating?: number;
    placement?: string;
    order_index?: number;
    is_visible?: boolean;
  }) {
    return this.prisma.testimonial.create({ data });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.testimonial.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.testimonial.delete({ where: { id } });
  }
}
