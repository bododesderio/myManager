import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EmailTemplatesService } from './email-templates.service';

/**
 * Regression tests for the /admin/email-templates CRUD (backed by the new
 * EmailTemplate model). The page reads `{ items: [{ ..., lastEdited }] }` and
 * relies on the unique `trigger` constraint surfacing as a clean 409 rather
 * than a 500.
 */
describe('EmailTemplatesService', () => {
  function createService(model: Record<string, jest.Mock> = {}) {
    const emailTemplate = {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      ...model,
    };
    const prisma = { emailTemplate } as any;
    return { service: new EmailTemplatesService(prisma), emailTemplate };
  }

  it('maps rows to items with updated_at surfaced as lastEdited', async () => {
    const { service } = createService({
      findMany: jest.fn().mockResolvedValue([
        {
          id: 't1',
          name: 'Welcome',
          subject: 'Hi',
          trigger: 'user.signup',
          body: '<p>x</p>',
          created_at: 'c',
          updated_at: 'u',
        },
      ]),
    });

    const result = await service.list();

    expect(result).toEqual({
      items: [
        { id: 't1', name: 'Welcome', subject: 'Hi', trigger: 'user.signup', body: '<p>x</p>', lastEdited: 'u' },
      ],
    });
  });

  it('creates a template', async () => {
    const { service, emailTemplate } = createService({
      create: jest.fn().mockResolvedValue({ id: 't2' }),
    });
    const input = { name: 'N', subject: 'S', trigger: 'tr', body: 'B' };

    await service.create(input);

    expect(emailTemplate.create).toHaveBeenCalledWith({ data: input });
  });

  it('translates a duplicate trigger (P2002) into a 409', async () => {
    const { service } = createService({
      create: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
      ),
    });

    await expect(service.create({ name: 'N', subject: 'S', trigger: 'dupe', body: 'B' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('translates a missing row (P2025) into a 404 on update', async () => {
    const { service } = createService({
      update: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: '6' }),
      ),
    });

    await expect(service.update('nope', { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes and returns success', async () => {
    const { service, emailTemplate } = createService({
      delete: jest.fn().mockResolvedValue({ id: 't3' }),
    });

    await expect(service.remove('t3')).resolves.toEqual({ success: true });
    expect(emailTemplate.delete).toHaveBeenCalledWith({ where: { id: 't3' } });
  });
});
