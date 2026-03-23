import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminDashboardService } from './admin-dashboard.service';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @SuperAdmin()
  @Get('api-health')
  @ApiOperation({ summary: 'Get API health status including database and Redis (superadmin)' })
  async getApiHealth() {
    return this.adminDashboardService.getApiHealth();
  }

  @SuperAdmin()
  @Get('queue/stats')
  @ApiOperation({ summary: 'Get publishing and email queue statistics (superadmin)' })
  async getQueueStats() {
    return this.adminDashboardService.getQueueStats();
  }

  @SuperAdmin()
  @Post('queue/retry/:jobId')
  @ApiOperation({ summary: 'Retry a failed queue job by ID (superadmin)' })
  async retryJob(@Param('jobId') jobId: string) {
    return this.adminDashboardService.retryJob(jobId);
  }

  @SuperAdmin()
  @Get('pending-actions')
  @ApiOperation({ summary: 'Get summary of pending actions across the platform (superadmin)' })
  async getPendingActions() {
    return this.adminDashboardService.getPendingActions();
  }
}
