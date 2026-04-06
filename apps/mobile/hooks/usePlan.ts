import { useMemo, useEffect, useState } from 'react';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface PlanInfo {
  tier: PlanTier;
  name: string;
  maxAccounts: number;
  maxScheduledPosts: number;
  hasAnalytics: boolean;
  hasTeam: boolean;
  hasAI: boolean;
}

const PLANS: Record<PlanTier, PlanInfo> = {
  free: {
    tier: 'free',
    name: 'Free',
    maxAccounts: 3,
    maxScheduledPosts: 10,
    hasAnalytics: false,
    hasTeam: false,
    hasAI: false,
  },
  starter: {
    tier: 'starter',
    name: 'Starter',
    maxAccounts: 5,
    maxScheduledPosts: 30,
    hasAnalytics: true,
    hasTeam: false,
    hasAI: false,
  },
  professional: {
    tier: 'professional',
    name: 'Professional',
    maxAccounts: 15,
    maxScheduledPosts: 100,
    hasAnalytics: true,
    hasTeam: true,
    hasAI: true,
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    maxAccounts: -1,
    maxScheduledPosts: -1,
    hasAnalytics: true,
    hasTeam: true,
    hasAI: true,
  },
};

interface SubscriptionResponse {
  tier: PlanTier;
}

export function usePlan() {
  const [currentTier, setCurrentTier] = useState<PlanTier>('free');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentTier('free');
      return;
    }

    let cancelled = false;

    async function fetchSubscription() {
      try {
        const data = await apiClient.get<SubscriptionResponse>(
          '/users/me/subscription'
        );
        if (!cancelled && data.tier && PLANS[data.tier]) {
          setCurrentTier(data.tier);
        }
      } catch {
        // Fall back to free tier on error
      }
    }

    fetchSubscription();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const plan = useMemo(() => PLANS[currentTier], [currentTier]);

  const canUseFeature = (feature: keyof Pick<PlanInfo, 'hasAnalytics' | 'hasTeam' | 'hasAI'>) => {
    return plan[feature];
  };

  const isWithinLimit = (current: number, limitKey: 'maxAccounts' | 'maxScheduledPosts') => {
    const limit = plan[limitKey];
    return limit === -1 || current < limit;
  };

  return {
    plan,
    canUseFeature,
    isWithinLimit,
  };
}
