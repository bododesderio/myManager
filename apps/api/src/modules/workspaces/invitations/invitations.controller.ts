import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { InvitationsService } from './invitations.service';
import { Public } from '../../../common/decorators/public.decorator';
import { WorkspaceRoles } from '../../../common/decorators/workspace-roles.decorator';

@ApiTags('Workspace Invitations')
@Controller('workspaces/:workspaceId/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiBearerAuth()
  @WorkspaceRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Invite a member to the workspace' })
  async invite(
    @Param('workspaceId') workspaceId: string,
    @Req() req: Request,
    @Body() body: { email: string; role: 'ADMIN' | 'MEMBER' },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.invitationsService.createInvitation(workspaceId, userId, body.email, body.role);
  }

  @Get()
  @ApiBearerAuth()
  @WorkspaceRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'List pending invitations' })
  async list(@Param('workspaceId') workspaceId: string) {
    return this.invitationsService.listInvitations(workspaceId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @WorkspaceRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Cancel an invitation' })
  async cancel(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.invitationsService.cancelInvitation(workspaceId, id);
  }
}

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationAcceptController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('accept')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a workspace invitation' })
  async accept(@Body() body: { token: string; workspaceId: string }) {
    return this.invitationsService.acceptInvitation(body.token, body.workspaceId);
  }
}
