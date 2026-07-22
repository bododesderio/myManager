import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { BillingService } from './billing.service';

@ApiTags('Admin - Billing')
@ApiBearerAuth()
@Controller('admin/billing')
export class AdminBillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @SuperAdmin()
  @ApiOperation({ summary: 'Billing overview: MRR, subs, plan breakdown, recent transactions' })
  async overview() {
    return this.billingService.getAdminBillingOverview();
  }

  @Get('overrides')
  @SuperAdmin()
  @ApiOperation({ summary: 'List billing overrides (superadmin)' })
  async listOverrides() {
    return this.billingService.listBillingOverrides();
  }

  @Post('overrides')
  @SuperAdmin()
  @ApiOperation({ summary: 'Create a billing override (superadmin)' })
  async createOverride(
    @Req() req: Request,
    @Body() body: { workspaceId?: string; type: string; details: string; expiresAt?: string | null },
  ) {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    return this.billingService.createBillingOverride(adminId, body);
  }
}
