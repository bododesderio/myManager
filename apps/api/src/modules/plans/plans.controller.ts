import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all available plans' })
  async listPlans(@Query('currency') currency: string = 'USD') {
    return this.plansService.listAll(currency);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get plan details' })
  async getPlan(@Param('id') id: string) {
    return this.plansService.getById(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get plan by slug' })
  async getPlanBySlug(@Param('slug') slug: string) {
    return this.plansService.getBySlug(slug);
  }

  @SuperAdmin()
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new plan (superadmin only)' })
  async createPlan(@Body() body: {
    name: string;
    slug: string;
    price_monthly_usd: number;
    price_annual_usd: number;
    seat_price_usd: number;
    limits: Record<string, unknown>;
    features: Record<string, boolean>;
    is_active: boolean;
  }) {
    return this.plansService.create(body);
  }

  @SuperAdmin()
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a plan (superadmin only)' })
  async updatePlan(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.plansService.update(id, body);
  }

  @SuperAdmin()
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a plan (superadmin only)' })
  async deletePlan(@Param('id') id: string) {
    return this.plansService.delete(id);
  }

  @Public()
  @Get('compare/all')
  @ApiOperation({ summary: 'Get plan comparison data for pricing page' })
  async comparePlans() {
    return this.plansService.getComparison();
  }
}
