import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesRepository } from './workspaces.repository';
import { InvitationsController, InvitationAcceptController } from './invitations/invitations.controller';
import { InvitationsService } from './invitations/invitations.service';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [WorkspacesController, InvitationsController, InvitationAcceptController],
  providers: [WorkspacesService, WorkspacesRepository, InvitationsService, PrismaService],
  exports: [WorkspacesService, InvitationsService],
})
export class WorkspacesModule {}
