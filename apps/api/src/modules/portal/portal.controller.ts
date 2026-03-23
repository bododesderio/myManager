import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PortalService } from './portal.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Public()
  @Get(':token')
  @ApiOperation({ summary: 'Get client portal data for a signed portal link' })
  async getPortal(@Param('token') token: string) {
    return this.portalService.getPortalData(token);
  }

  @Public()
  @Post(':token/approvals/:id/approve')
  @ApiOperation({ summary: 'Client approves a post via portal link' })
  async approvePost(
    @Param('token') token: string,
    @Param('id') postId: string,
    @Body() body: { comment?: string },
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
    return this.portalService.approvePost(token, postId, body.comment, ipAddress);
  }

  @Public()
  @Post(':token/approvals/:id/revise')
  @ApiOperation({ summary: 'Client requests revisions on a post via portal link' })
  async revisePost(
    @Param('token') token: string,
    @Param('id') postId: string,
    @Body() body: { comment: string },
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
    return this.portalService.revisePost(token, postId, body.comment, ipAddress);
  }
}
