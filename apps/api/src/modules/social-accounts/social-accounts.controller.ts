import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { SocialAccountsService } from './social-accounts.service';

@ApiTags('Social Accounts')
@ApiBearerAuth()
@Controller('social-accounts')
export class SocialAccountsController {
  constructor(private readonly socialAccountsService: SocialAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List connected social accounts for workspace' })
  async listAccounts(@Query('workspaceId') workspaceId: string) {
    return this.socialAccountsService.listByWorkspace(workspaceId);
  }

  @Post('connect/:platform')
  @ApiOperation({ summary: 'Initiate OAuth flow for a social platform' })
  async initiateConnect(
    @Param('platform') platform: string,
    @Req() req: Request,
    @Body() body: { workspaceId: string; redirectUri: string },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.socialAccountsService.initiateOAuth(platform, userId, body.workspaceId, body.redirectUri);
  }

  @Post('callback/:platform')
  @ApiOperation({ summary: 'Handle OAuth callback from social platform' })
  async handleCallback(
    @Param('platform') platform: string,
    @Body() body: { code: string; state: string; workspaceId: string },
  ) {
    return this.socialAccountsService.handleOAuthCallback(platform, body.code, body.state, body.workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get social account details' })
  async getAccount(@Param('id') id: string) {
    return this.socialAccountsService.getById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update social account settings' })
  async updateAccount(
    @Param('id') id: string,
    @Body() body: { metadata?: Record<string, unknown> },
  ) {
    return this.socialAccountsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect a social account' })
  async disconnectAccount(@Param('id') id: string) {
    return this.socialAccountsService.disconnect(id);
  }

  @Post(':id/refresh-token')
  @ApiOperation({ summary: 'Manually refresh OAuth token for an account' })
  async refreshToken(@Param('id') id: string) {
    return this.socialAccountsService.refreshToken(id);
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate that the account token is still working' })
  async validateAccount(@Param('id') id: string) {
    return this.socialAccountsService.validate(id);
  }

  @Get('platforms/supported')
  @ApiOperation({ summary: 'List supported platforms and their capabilities' })
  async listPlatforms() {
    return this.socialAccountsService.listSupportedPlatforms();
  }
}
