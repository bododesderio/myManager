import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Headers,
  UnauthorizedException,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';
import { BillingService } from './billing.service';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { SubscribeDto, ChangePlanDto, OverridePlanDto } from './dto';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription details' })
  async getSubscription(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.billingService.getSubscription(userId);
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize subscription payment with Flutterwave' })
  async subscribe(
    @Req() req: Request,
    @Body() body: SubscribeDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.billingService.initializeSubscription(userId, body);
  }

  @Post('change-plan')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade or downgrade subscription plan' })
  async changePlan(
    @Req() req: Request,
    @Body() body: ChangePlanDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.billingService.changePlan(userId, body.planId);
  }

  @Post('verify-payment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a completed Flutterwave checkout and activate subscription' })
  async verifyPayment(
    @Req() req: Request,
    @Body() body: {
      transaction_id: number;
      tx_ref?: string;
      plan?: string;
      billing_cycle?: 'monthly' | 'annual';
    },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.billingService.verifyPayment(userId, body);
  }

  @Post('cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription (effective at period end)' })
  async cancelSubscription(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.billingService.cancelSubscription(userId);
  }

  @Post('reactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate a cancelled subscription' })
  async reactivateSubscription(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.billingService.reactivateSubscription(userId);
  }

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get billing history' })
  async getBillingHistory(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    return this.billingService.getBillingHistory(userId, safePage, safeLimit);
  }

  @Get('invoice/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice details' })
  async getInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.getInvoice(id);
  }

  @Public()
  @Post('webhook/flutterwave')
  @ApiOperation({ summary: 'Handle Flutterwave webhook events' })
  async handleFlutterwaveWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('verif-hash') verifHash: string,
  ) {
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Webhook secret not configured');
    }
    if (!verifHash) {
      throw new UnauthorizedException('Missing webhook signature');
    }
    // Timing-safe comparison to prevent timing attacks
    const hashBuf = Buffer.from(verifHash, 'utf8');
    const secretBuf = Buffer.from(secret, 'utf8');
    if (hashBuf.length !== secretBuf.length || !timingSafeEqual(hashBuf, secretBuf)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    return this.billingService.handleWebhook(body);
  }

  @Post('add-seat')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an extra seat to Enterprise plan' })
  async addSeat(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.billingService.addSeat(userId);
  }

  @Post('remove-seat')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an extra seat from Enterprise plan' })
  async removeSeat(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.billingService.removeSeat(userId);
  }

  @SuperAdmin()
  @Get('admin/mrr')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get MRR and billing metrics (superadmin)' })
  async getMrr() {
    return this.billingService.getAdminMetrics();
  }

  @SuperAdmin()
  @Post('admin/override')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Override user plan (superadmin)' })
  async overridePlan(
    @Req() req: Request,
    @Body() body: OverridePlanDto,
  ) {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    return this.billingService.createPlanOverride(adminId, body);
  }

  @SuperAdmin()
  @Get('admin/mrr-history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get MRR history over time (superadmin)' })
  async getMrrHistory(
    @Query('months', new DefaultValuePipe(12), ParseIntPipe) months: number,
  ) {
    return this.billingService.getMrrHistory(months);
  }

  @SuperAdmin()
  @Get('admin/plan-distribution')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get plan distribution breakdown (superadmin)' })
  async getPlanDistribution() {
    return this.billingService.getPlanDistribution();
  }

  @SuperAdmin()
  @Get('admin/failed-payments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent failed payments (superadmin)' })
  async getFailedPayments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    return this.billingService.getFailedPayments(safePage, safeLimit);
  }
}
