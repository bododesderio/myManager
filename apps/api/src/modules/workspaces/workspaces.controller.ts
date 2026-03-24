import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List workspaces for current user' })
  async listWorkspaces(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.workspacesService.listForUser(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  async createWorkspace(
    @Req() req: Request,
    @Body() body: { name: string; slug?: string },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.workspacesService.create(userId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details' })
  async getWorkspace(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.workspacesService.getById(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workspace details' })
  async updateWorkspace(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Body() body: { name?: string; slug?: string; avatarUrl?: string },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.workspacesService.update(id, userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workspace' })
  async deleteWorkspace(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.workspacesService.delete(id, userId);
  }

  @Get(':id/members')
  @WorkspaceRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'List workspace members' })
  async listMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.listMembers(id);
  }

  @Post(':id/members/invite')
  @WorkspaceRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Invite a member to workspace' })
  async inviteMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Body() body: { email: string; role: string },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.workspacesService.inviteMember(id, userId, body.email, body.role);
  }

  @Patch(':id/members/:memberId/role')
  @WorkspaceRoles('OWNER')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: string },
  ) {
    return this.workspacesService.updateMemberRole(id, memberId, body.role);
  }

  @Delete(':id/members/:memberId')
  @WorkspaceRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Remove member from workspace' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.removeMember(id, memberId);
  }

  @Get(':id/approval-config')
  @ApiOperation({ summary: 'Get workspace approval configuration' })
  async getApprovalConfig(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.getApprovalConfig(id);
  }

  @Put(':id/approval-config')
  @ApiOperation({ summary: 'Update workspace approval configuration' })
  async updateApprovalConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { require_approval: boolean; auto_approve_admins: boolean; require_client_review: boolean },
  ) {
    return this.workspacesService.updateApprovalConfig(id, body);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get workspace usage and quota limits' })
  async getUsage(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.workspacesService.getUsage(id, userId);
  }

  @Get(':id/team/activity')
  @WorkspaceRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get team member activity for workspace' })
  async getTeamActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.workspacesService.getTeamActivity(id, days);
  }
}
