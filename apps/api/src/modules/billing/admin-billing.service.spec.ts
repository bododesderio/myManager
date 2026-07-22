import { BillingService } from './billing.service';

/**
 * Regression tests for the superadmin billing endpoints, all of which 404'd
 * before being built:
 *   GET  /admin/billing            -> getAdminBillingOverview
 *   GET  /admin/billing/overrides  -> listBillingOverrides
 *   POST /admin/billing/overrides  -> createBillingOverride
 *
 * They pin the response shapes the /superadmin/billing pages read directly
 * (billing.mrr, subscriptionsByPlan[], recentTransactions[], overrides).
 */
describe('BillingService — admin endpoints', () => {
  function createService(repoOverrides: Record<string, jest.Mock> = {}) {
    const repository = {
      calculateMRR: jest.fn(),
      countActiveSubscriptions: jest.fn(),
      getPlanRevenueBreakdown: jest.fn(),
      getAllPlans: jest.fn(),
      getRecentTransactions: jest.fn(),
      listBillingOverrides: jest.fn(),
      createBillingOverride: jest.fn(),
      findWorkspaceNames: jest.fn(),
      ...repoOverrides,
    };
    const service = new BillingService(
      repository as any,
      { get: jest.fn() } as any,
      { dispatchEvent: jest.fn() } as any,
    );
    return { service, repository };
  }

  describe('getAdminBillingOverview', () => {
    it('assembles MRR, active subs, per-plan revenue and recent transactions', async () => {
      const { service } = createService({
        calculateMRR: jest.fn().mockResolvedValue(1234.5),
        countActiveSubscriptions: jest.fn().mockResolvedValue(7),
        getPlanRevenueBreakdown: jest.fn().mockResolvedValue([
          { plan_id: 'p1', _count: { id: 5 }, _sum: { billing_amount: 500 } },
          { plan_id: 'p2', _count: { id: 2 }, _sum: { billing_amount: null } },
        ]),
        getAllPlans: jest.fn().mockResolvedValue([
          { id: 'p1', name: 'Pro' },
          { id: 'p2', name: 'Enterprise' },
        ]),
        getRecentTransactions: jest.fn().mockResolvedValue([
          {
            id: 't1',
            amount: '19.99',
            status: 'PAID',
            created_at: 'd1',
            plan_name: 'Pro',
            workspace: { name: 'Acme', owner: { email: 'agency@mymanager.app' } },
          },
        ]),
      });

      const result = await service.getAdminBillingOverview();

      expect(result.mrr).toBe(1234.5);
      expect(result.activeSubscriptions).toBe(7);
      expect(result.subscriptionsByPlan).toEqual([
        { plan: 'Pro', count: 5, revenue: 500 },
        { plan: 'Enterprise', count: 2, revenue: 0 }, // null _sum -> 0
      ]);
      expect(result.recentTransactions).toEqual([
        { id: 't1', user: 'agency@mymanager.app', amount: 19.99, status: 'PAID', date: 'd1' },
      ]);
    });

    it('falls back through workspace name then plan name for the transaction user', async () => {
      const { service } = createService({
        calculateMRR: jest.fn().mockResolvedValue(0),
        countActiveSubscriptions: jest.fn().mockResolvedValue(0),
        getPlanRevenueBreakdown: jest.fn().mockResolvedValue([]),
        getAllPlans: jest.fn().mockResolvedValue([]),
        getRecentTransactions: jest.fn().mockResolvedValue([
          { id: 't2', amount: '5', status: 'PAID', created_at: 'd', plan_name: 'Starter', workspace: { name: 'WS', owner: null } },
          { id: 't3', amount: '5', status: 'PAID', created_at: 'd', plan_name: 'Starter', workspace: null },
        ]),
      });

      const result = await service.getAdminBillingOverview();

      expect(result.recentTransactions[0].user).toBe('WS'); // no owner -> workspace name
      expect(result.recentTransactions[1].user).toBe('Starter'); // no workspace -> plan name
    });
  });

  describe('listBillingOverrides', () => {
    it('resolves workspace names and shows — for a null workspace', async () => {
      const { service, repository } = createService({
        listBillingOverrides: jest.fn().mockResolvedValue([
          { id: 'o1', workspace_id: 'ws-1', type: 'discount', details: '20% off', expires_at: 'e1' },
          { id: 'o2', workspace_id: null, type: 'comp', details: 'Free', expires_at: null },
        ]),
        findWorkspaceNames: jest.fn().mockResolvedValue(new Map([['ws-1', 'Acme']])),
      });

      const { data } = await service.listBillingOverrides();

      expect(repository.findWorkspaceNames).toHaveBeenCalledWith(['ws-1']);
      expect(data).toEqual([
        { id: 'o1', workspaceName: 'Acme', type: 'discount', details: '20% off', expiresAt: 'e1' },
        { id: 'o2', workspaceName: '—', type: 'comp', details: 'Free', expiresAt: null },
      ]);
    });
  });

  describe('createBillingOverride', () => {
    it('maps the form payload to columns (empty workspace -> null, date parsed, admin recorded)', async () => {
      const { service, repository } = createService({
        createBillingOverride: jest.fn().mockResolvedValue({ id: 'o9' }),
      });

      await service.createBillingOverride('admin-1', {
        workspaceId: '',
        type: 'discount',
        details: '10%',
        expiresAt: '2026-12-31T00:00:00.000Z',
      });

      const arg = repository.createBillingOverride.mock.calls[0][0];
      expect(arg.workspace_id).toBeNull();
      expect(arg.type).toBe('discount');
      expect(arg.details).toBe('10%');
      expect(arg.created_by).toBe('admin-1');
      expect(arg.expires_at).toBeInstanceOf(Date);
      expect((arg.expires_at as Date).toISOString()).toBe('2026-12-31T00:00:00.000Z');
    });

    it('stores a null expiry when none is given', async () => {
      const { service, repository } = createService({
        createBillingOverride: jest.fn().mockResolvedValue({ id: 'o10' }),
      });

      await service.createBillingOverride('admin-1', { type: 'comp', details: 'x', expiresAt: null });

      expect(repository.createBillingOverride.mock.calls[0][0].expires_at).toBeNull();
    });
  });
});
