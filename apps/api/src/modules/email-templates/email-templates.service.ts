import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

interface TemplateInput {
  name: string;
  subject: string;
  trigger: string;
  body: string;
}

@Injectable()
export class EmailTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.emailTemplate.findMany({ orderBy: { name: 'asc' } });
    return {
      items: rows.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        trigger: t.trigger,
        body: t.body,
        lastEdited: t.updated_at,
      })),
    };
  }

  async create(data: TemplateInput) {
    try {
      return await this.prisma.emailTemplate.create({ data });
    } catch (err) {
      throw this.mapError(err);
    }
  }

  async update(id: string, data: Partial<TemplateInput>) {
    try {
      return await this.prisma.emailTemplate.update({ where: { id }, data });
    } catch (err) {
      throw this.mapError(err);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.emailTemplate.delete({ where: { id } });
      return { success: true };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  private mapError(err: unknown): Error {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') return new ConflictException('A template with that trigger already exists');
      if (err.code === 'P2025') return new NotFoundException('Email template not found');
    }
    return err as Error;
  }
}
