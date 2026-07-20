import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BioPagesService } from './bio-pages.service';

/**
 * Anonymous access to the link-in-bio page.
 *
 * The controller previously carried no @Public() decorators despite two routes
 * documented as public, so every visitor got 401 and the feature did not work.
 * Adding @Public() naively would have been worse than the bug: the lookup
 * ignored `is_published` and returned the whole row, so drafts and tenant
 * identifiers would have become world-readable.
 *
 * These tests pin the two properties that make anonymous access safe.
 */
describe('BioPagesService — anonymous access', () => {
  function createService(overrides: Record<string, jest.Mock> = {}) {
    const repository = {
      findPublishedBySlug: jest.fn().mockResolvedValue(null),
      findPublishedIdBySlug: jest.fn().mockResolvedValue(null),
      recordClick: jest.fn().mockResolvedValue(undefined),
      getClickAnalytics: jest.fn().mockResolvedValue([]),
      findBySlug: jest.fn(),
      ...overrides,
    };
    return { service: new BioPagesService(repository as any), repository };
  }

  describe('getBySlug (public read)', () => {
    it('reads through the published-only lookup, never the unrestricted one', async () => {
      const { service, repository } = createService({
        findPublishedBySlug: jest.fn().mockResolvedValue({ id: 'b1', slug: 's', title: 'T' }),
      });

      await service.getBySlug('s');

      expect(repository.findPublishedBySlug).toHaveBeenCalledWith('s');
      // findBySlug returns drafts and every column — must not be on the public path.
      expect(repository.findBySlug).not.toHaveBeenCalled();
    });

    it('treats an unpublished page as not found', async () => {
      // The published-only query returns null for a draft.
      const { service } = createService();

      await expect(service.getBySlug('draft-slug')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('does not distinguish "unpublished" from "no such slug"', async () => {
      // Same error for both, so the endpoint cannot enumerate taken slugs.
      const { service } = createService();

      const a = await service.getBySlug('draft').catch((e) => e.message);
      const b = await service.getBySlug('nonexistent').catch((e) => e.message);
      expect(a).toBe(b);
    });
  });

  describe('trackClick (public write)', () => {
    it('rejects clicks on an unpublished page', async () => {
      const { service, repository } = createService();

      await expect(service.trackClick('draft', 0)).rejects.toBeInstanceOf(NotFoundException);
      // No anonymous write against a draft's analytics.
      expect(repository.recordClick).not.toHaveBeenCalled();
    });

    it.each([[-1], [1.5], [99999], [Number.NaN]])(
      'rejects an out-of-range link index (%p)',
      async (linkIndex) => {
        const { service, repository } = createService({
          findPublishedIdBySlug: jest.fn().mockResolvedValue('b1'),
        });

        await expect(service.trackClick('s', linkIndex as number)).rejects.toBeInstanceOf(
          BadRequestException,
        );
        expect(repository.recordClick).not.toHaveBeenCalled();
      },
    );

    it('truncates an attacker-supplied referrer', async () => {
      const { service, repository } = createService({
        findPublishedIdBySlug: jest.fn().mockResolvedValue('b1'),
      });

      await service.trackClick('s', 0, 'x'.repeat(5000));

      const [, , referrer] = repository.recordClick.mock.calls[0];
      expect(referrer).toHaveLength(512);
    });

    it('records a valid click against the resolved page id', async () => {
      const { service, repository } = createService({
        findPublishedIdBySlug: jest.fn().mockResolvedValue('b1'),
      });

      await expect(service.trackClick('s', 3, 'https://x.test')).resolves.toEqual({
        tracked: true,
      });
      expect(repository.recordClick).toHaveBeenCalledWith('b1', 3, 'https://x.test');
    });
  });

  describe('getAnalytics (authenticated)', () => {
    it('scopes click analytics by workspace', async () => {
      // Previously took a bare id, so another tenant's click analytics were
      // readable by anyone who knew the UUID.
      const { service, repository } = createService();

      await service.getAnalytics('b1', 'ws_1', 30);

      expect(repository.getClickAnalytics).toHaveBeenCalledWith('b1', 'ws_1', 30);
    });
  });
});
