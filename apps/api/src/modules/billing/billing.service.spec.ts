import axios from 'axios';
import { BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';

jest.mock('axios');

describe('BillingService', () => {
  function createService() {
    const repository = {
      findActiveSubscription: jest.fn(),
      findCancellingSubscription: jest.fn(),
      findPlanBySlug: jest.fn(),
      findPlanById: jest.fn(),
      findUserById: jest.fn(),
      findPrimaryWorkspaceForUser: jest.fn(),
      findBillingRecordByFlutterwaveRef: jest.fn(),
      findByFlutterwaveId: jest.fn(),
      createSubscription: jest.fn(),
      createBillingRecord: jest.fn(),
      updateBillingRecord: jest.fn(),
      updateSubscription: jest.fn(),
      updateUserStatus: jest.fn(),
      findUserByEmail: jest.fn(),
    };

    const configService = {
      get: jest.fn((key: string, fallback?: string) => {
        switch (key) {
          case 'FLUTTERWAVE_SECRET_KEY':
            return 'flw_secret';
          case 'FLUTTERWAVE_WEBHOOK_SECRET':
            return 'flw_webhook_secret';
          case 'NEXTAUTH_URL':
            return 'http://localhost:3000';
          default:
            return fallback;
        }
      }),
    };

    const webhooksService = {
      dispatchEvent: jest.fn().mockResolvedValue(undefined),
    };

    const service = new BillingService(
      repository as unknown as ConstructorParameters<typeof BillingService>[0],
      configService as unknown as ConstructorParameters<typeof BillingService>[1],
      webhooksService as unknown as ConstructorParameters<typeof BillingService>[2],
    );

    return { service, repository, webhooksService };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies a payment, activates the subscription, and dispatches a success event', async () => {
    const { service, repository, webhooksService } = createService();
    const mockedAxios = axios as jest.Mocked<typeof axios>;

    repository.findBillingRecordByFlutterwaveRef.mockResolvedValue(null);
    repository.findPlanBySlug.mockResolvedValue({
      id: 'plan_1',
      slug: 'pro',
      name: 'Pro',
      limits: {},
      features: {},
    });
    repository.findPlanById.mockResolvedValue({
      id: 'plan_1',
      slug: 'pro',
      name: 'Pro',
      limits: {},
      features: {},
    });
    repository.findUserById.mockResolvedValue({
      id: 'user_1',
      email: 'user@example.com',
      name: 'User',
      email_verified: false,
      status: 'PENDING_PAYMENT',
    });
    repository.findPrimaryWorkspaceForUser.mockResolvedValue('workspace_1');
    repository.findByFlutterwaveId.mockResolvedValue(null);
    repository.createSubscription.mockResolvedValue({ id: 'sub_1' });
    repository.createBillingRecord.mockResolvedValue({ id: 'bill_1' });

    mockedAxios.get.mockResolvedValue({
      data: {
        data: {
          id: 12345,
          status: 'successful',
          flw_ref: 'FLW-123',
          amount: 49,
          currency: 'USD',
          meta: { plan: 'pro', workspaceId: 'workspace_1', billing_cycle: 'monthly' },
        },
      },
    });

    const result = await service.verifyPayment('user_1', {
      transaction_id: 12345,
      plan: 'pro',
      billing_cycle: 'monthly',
    });

    expect(result).toEqual({
      message: 'Payment verified successfully',
      billingRecordId: 'bill_1',
      plan: { id: 'plan_1', slug: 'pro', name: 'Pro' },
    });
    expect(repository.createSubscription).toHaveBeenCalled();
    expect(repository.createBillingRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: 'workspace_1',
        user_id: 'user_1',
        status: 'PAID',
      }),
    );
    expect(repository.updateUserStatus).toHaveBeenCalledWith('user_1', 'PENDING_VERIFICATION');
    expect(webhooksService.dispatchEvent).toHaveBeenCalledWith(
      'workspace_1',
      'billing.payment_succeeded',
      expect.objectContaining({
        billingRecordId: 'bill_1',
        userId: 'user_1',
        planId: 'plan_1',
      }),
    );
  });

  it('rejects verification when the payment is not successful', async () => {
    const { service } = createService();
    const mockedAxios = axios as jest.Mocked<typeof axios>;

    mockedAxios.get.mockResolvedValue({
      data: { data: { status: 'failed' } },
    });

    await expect(
      service.verifyPayment('user_1', { transaction_id: 999 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
