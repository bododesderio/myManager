import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import puppeteer from 'puppeteer';

interface ReportGenerateJobData {
  reportId: string;
}

export class ReportGeneratorWorker {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
      },
    });
    this.bucket = process.env.CLOUDFLARE_R2_BUCKET!;
  }

  async process(job: Job<ReportGenerateJobData>): Promise<void> {
    const { reportId } = job.data;

    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error(`Report ${reportId} not found`);

    await this.prisma.report.update({ where: { id: reportId }, data: { status: 'generating' } });

    try {
      if (report.file_format === 'pdf') {
        await this.generatePdf(report);
      } else if (report.file_format === 'csv') {
        await this.generateCsv(report);
      }

      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: 'COMPLETED', generated_at: new Date() },
      });
    } catch (error: unknown) {
      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: 'FAILED', metadata: { error: error instanceof Error ? error.message : String(error) } },
      });
      throw error;
    }
  }

  private async generatePdf(report: { id: string; workspace_id: string }): Promise<void> {
    const renderUrl = `${process.env.NEXTAUTH_URL}/internal/report-render/${report.id}`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto(renderUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    await browser.close();

    const r2Key = `reports/${report.workspace_id}/${report.id}.pdf`;
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: r2Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    }));

    await this.prisma.report.update({
      where: { id: report.id },
      data: {
        file_url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${r2Key}`,
      },
    });
  }

  private async generateCsv(report: { id: string; workspace_id: string; date_from: Date | null; date_to: Date | null; platforms: string[] | null }): Promise<void> {
    const analytics = await this.prisma.postAnalytics.findMany({
      where: {
        post: {
          workspace_id: report.workspace_id,
          published_at: { gte: report.date_from ?? undefined, lte: report.date_to ?? undefined },
        },
        ...(report.platforms?.length ? { platform: { in: report.platforms } } : {}),
      },
      include: { post: { select: { caption: true, platforms: true, published_at: true } } },
      orderBy: { synced_at: 'desc' },
    });

    const header = 'Post Caption,Platform,Published At,Impressions,Reach,Engagements,Clicks,Likes,Comments,Shares\n';
    const rows = analytics.map((a) =>
      `"${(a.post.caption || '').replace(/"/g, '""').substring(0, 100)}",${a.platform},${a.post.published_at?.toISOString() || ''},${a.impressions || 0},${a.reach || 0},${(a.likes + a.comments + a.shares) || 0},${a.clicks || 0},${a.likes || 0},${a.comments || 0},${a.shares || 0}`
    ).join('\n');

    const csvBuffer = Buffer.from(header + rows, 'utf-8');
    const r2Key = `reports/${report.workspace_id}/${report.id}.csv`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: r2Key,
      Body: csvBuffer,
      ContentType: 'text/csv',
    }));

    await this.prisma.report.update({
      where: { id: report.id },
      data: {
        file_url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${r2Key}`,
      },
    });
  }
}
