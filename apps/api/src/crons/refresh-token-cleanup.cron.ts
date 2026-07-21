import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuthRepository } from '../modules/auth/auth.repository';
import { withDistributedLock } from '../common/utils/distributed-lock';

/**
 * Prunes expired refresh tokens.
 *
 * Refresh tokens are retained after use/revocation so that a replay can be
 * detected as reuse (see AuthService.refreshTokens). Once a token is past its
 * expiry it can no longer be presented, so keeping it buys no further security
 * — it is just dead rows. This sweep removes them daily.
 */
@Injectable()
export class RefreshTokenCleanupCron {
  private readonly logger = new Logger(RefreshTokenCleanupCron.name);

  constructor(private readonly authRepository: AuthRepository) {}

  @Cron('30 3 * * *') // 3:30 AM daily
  async pruneExpiredTokens() {
    await withDistributedLock('refresh-token-cleanup', 23 * 60 * 60 * 1000, async () => {
      const { count } = await this.authRepository.deleteExpiredRefreshTokens();
      if (count > 0) {
        this.logger.log(`Pruned ${count} expired refresh token(s).`);
      }
    });
  }
}
