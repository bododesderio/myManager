import { SetMetadata } from '@nestjs/common';
import type { QuotaType } from '../guards/quota.guard';

/**
 * Enforce a plan quota on a route. The globally-registered QuotaGuard reads this
 * metadata; without it the guard is a no-op. Example:
 *
 *   @RequireQuota('posts')
 *   @Post()
 *   create() { ... }
 */
export const RequireQuota = (type: QuotaType) => SetMetadata('quotaType', type);
