import { Module } from '@nestjs/common';
import { SocialAccountsController } from './social-accounts.controller';
import { SocialAccountsService } from './social-accounts.service';
import { SocialAccountsRepository } from './social-accounts.repository';

@Module({
  controllers: [SocialAccountsController],
  providers: [SocialAccountsService, SocialAccountsRepository],
  exports: [SocialAccountsService],
})
export class SocialAccountsModule {}
