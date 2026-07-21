import { AnalyticsRepository } from './analytics.repository';
import { CampaignsRepository } from '../campaigns/campaigns.repository';
import { ProjectsRepository } from '../projects/projects.repository';

/**
 * M7 (docs/audit-2026-07-20.md): the three repositories below moved their
 * aggregation out of Node and into the database. These tests pin the shape and
 * arithmetic the callers depend on, and assert tenancy scoping is not widened.
 */
describe('M7 in-database aggregation', () => {
  describe('AnalyticsRepository.getHashtagPerformance (raw SQL GROUP BY)', () => {
    it('maps grouped rows to the caller shape and derives avgEngagements', async () => {
      const queryRaw = jest.fn().mockResolvedValue([
        { id: 'h1', text: '#launch', post_count: 3n, total_engagements: 90n, total_reach: 300n },
        { id: 'h2', text: '#promo', post_count: 0n, total_engagements: 0n, total_reach: 0n },
      ]);
      const prisma = { $queryRaw: queryRaw } as any;
      const repo = new AnalyticsRepository(prisma);

      const start = new Date('2026-01-01');
      const end = new Date('2026-06-30');
      const result = await repo.getHashtagPerformance('ws-1', start, end);

      expect(queryRaw).toHaveBeenCalledTimes(1);
      // Parameterized tagged template: workspaceId/dates are values, never concatenated.
      const values = queryRaw.mock.calls[0].slice(1);
      expect(values).toEqual(expect.arrayContaining(['ws-1', start, end]));

      expect(result).toEqual([
        {
          id: 'h1',
          text: '#launch',
          postCount: 3,
          totalEngagements: 90,
          totalReach: 300,
          avgEngagements: 30,
        },
        {
          id: 'h2',
          text: '#promo',
          postCount: 0,
          totalEngagements: 0,
          totalReach: 0,
          avgEngagements: 0, // guarded division by zero
        },
      ]);
      // bigints are normalized to numbers for the JSON boundary
      expect(typeof result[0].totalEngagements).toBe('number');
    });
  });

  describe('CampaignsRepository.getAnalytics (_sum aggregate)', () => {
    it('returns the same totals the in-memory loop produced', async () => {
      const count = jest.fn().mockResolvedValue(5);
      const aggregate = jest.fn().mockResolvedValue({
        _sum: { reach: 100, impressions: 200, clicks: 10, likes: 30, comments: 12, shares: 8 },
      });
      const prisma = {
        campaignPost: { count },
        postAnalytics: { aggregate },
      } as any;
      const repo = new CampaignsRepository(prisma);

      const result = await repo.getAnalytics('camp-1');

      expect(aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { post: { campaign_posts: { some: { campaign_id: 'camp-1' } } } },
        }),
      );
      expect(result).toEqual({
        posts: 5,
        reach: 100,
        impressions: 200,
        engagements: 50, // likes + comments + shares
        clicks: 10,
      });
    });

    it('coerces null sums (empty campaign) to zeros', async () => {
      const prisma = {
        campaignPost: { count: jest.fn().mockResolvedValue(0) },
        postAnalytics: {
          aggregate: jest.fn().mockResolvedValue({
            _sum: { reach: null, impressions: null, clicks: null, likes: null, comments: null, shares: null },
          }),
        },
      } as any;
      const repo = new CampaignsRepository(prisma);

      await expect(repo.getAnalytics('camp-empty')).resolves.toEqual({
        posts: 0,
        reach: 0,
        impressions: 0,
        engagements: 0,
        clicks: 0,
      });
    });
  });

  describe('ProjectsRepository.getProjectAnalytics (_sum aggregate, workspace-scoped)', () => {
    it('returns totals and keeps workspace_id in the aggregate filter', async () => {
      const count = jest.fn().mockResolvedValue(7);
      const aggregate = jest.fn().mockResolvedValue({
        _sum: { reach: 1000, impressions: 2000, clicks: 50, likes: 100, comments: 40, shares: 20 },
      });
      const prisma = {
        post: { count },
        postAnalytics: { aggregate },
      } as any;
      const repo = new ProjectsRepository(prisma);

      const start = new Date('2026-01-01');
      const end = new Date('2026-06-30');
      const result = await repo.getProjectAnalytics('proj-1', 'ws-1', start, end);

      const postWhere = {
        project_id: 'proj-1',
        workspace_id: 'ws-1',
        created_at: { gte: start, lte: end },
      };
      // Tenancy must not be widened: both the count and the aggregate carry it.
      expect(count).toHaveBeenCalledWith({ where: postWhere });
      expect(aggregate).toHaveBeenCalledWith(expect.objectContaining({ where: { post: postWhere } }));

      expect(result).toEqual({
        totalPosts: 7,
        totalReach: 1000,
        totalImpressions: 2000,
        totalEngagements: 160, // likes + comments + shares
        totalClicks: 50,
      });
    });
  });
});
