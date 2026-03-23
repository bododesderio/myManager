import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(email: string, source?: string) {
    await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { source: source ?? undefined },
      create: { email, source },
    });
    return { success: true };
  }

  async listSubscribers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({
        skip,
        take: limit,
        orderBy: { subscribed_at: 'desc' },
      }),
      this.prisma.newsletterSubscriber.count(),
    ]);
    return { items, total, page, limit };
  }
}
