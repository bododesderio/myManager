import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { withDistributedLock } from '../common/utils/distributed-lock';

@Injectable()
export class MonthlyReportsCron {
  constructor(@InjectQueue('report-generation') private reportQueue: Queue, private readonly prisma: PrismaService) {}

  @Cron('0 2 1 * *') // 2:00 AM on the 1st of each month
  async generateMonthlyReports() {
    await withDistributedLock('monthly-reports', 23 * 60 * 60 * 1000, async () => {
      const configs = await this.prisma.reportConfig.findMany({
        where: { is_active: true },
      });

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

      for (const config of configs) {
        const report = await this.prisma.report.create({
          data: {
            workspace_id: config.workspace_id,
            title: config.name,
            type: config.type,
            date_from: startDate,
            date_to: endDate,
            platforms: config.platforms || [],
            status: 'pending',
          },
        });

        await this.reportQueue.add('generate', { reportId: report.id }, { attempts: 2, backoff: { type: 'fixed', delay: 30000 } });
      }
    });
  }
}
