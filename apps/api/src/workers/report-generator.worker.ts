import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { browserPool } from './browser-pool';

/** Rows fetched per page when streaming a CSV export. */
const CSV_PAGE_SIZE = 1000;
/** Hard ceiling on exported rows; exceeding it appends an explicit truncation row. */
const CSV_MAX_ROWS = 100_000;

interface ReportGenerateJobData {
  reportId: string;
}

export class ReportGeneratorWorker {
  private readonly logger = new Logger(ReportGeneratorWorker.name);
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
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Report ${reportId} generation failed: ${message}`, stack);
      await this.prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'FAILED',
          metadata: {
            error: message,
            failedAt: new Date().toISOString(),
            phase: report.file_format,
          },
        },
      });
      throw error;
    }
  }

  private async generatePdf(report: { id: string; workspace_id: string }): Promise<void> {
    const renderUrl = `${process.env.NEXTAUTH_URL}/internal/report-render/${report.id}`;

    // Pooled browser: launching one Chromium per PDF cost ~150-200MB and 3-5s
    // each, so concurrent reports OOM'd the worker. The pool caps that; excess
    // jobs queue instead of spawning.
    const pdfBuffer = await browserPool.withPage(async (page) => {
      await page.setViewport({ width: 1200, height: 800 });
      await page.goto(renderUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      return Buffer.from(
        await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        }),
      );
    });

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
    const where = {
      post: {
        workspace_id: report.workspace_id,
        published_at: { gte: report.date_from ?? undefined, lte: report.date_to ?? undefined },
      },
      ...(report.platforms?.length ? { platform: { in: report.platforms } } : {}),
    };

    // Paged with a cursor rather than one unbounded findMany. A six-month export
    // for an active workspace could otherwise pull 50k+ rows — each with a joined
    // post — into memory at once, on the same process that runs Chromium.
    const header =
      'Post Caption,Platform,Published At,Impressions,Reach,Engagements,Clicks,Likes,Comments,Shares\n';
    const chunks: string[] = [header];

    let cursor: string | undefined;
    let exported = 0;

    for (;;) {
      const batch = await this.prisma.postAnalytics.findMany({
        where,
        include: { post: { select: { caption: true, platforms: true, published_at: true } } },
        // Cursor paging requires a stable, unique ordering — synced_at alone is
        // neither, so rows could be skipped or repeated across pages.
        orderBy: { id: 'asc' },
        take: CSV_PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });

      if (batch.length === 0) break;

      for (const a of batch) {
        chunks.push(
          `"${(a.post.caption || '').replace(/"/g, '""').substring(0, 100)}",${a.platform},${a.post.published_at?.toISOString() || ''},${a.impressions || 0},${a.reach || 0},${(a.likes + a.comments + a.shares) || 0},${a.clicks || 0},${a.likes || 0},${a.comments || 0},${a.shares || 0}\n`,
        );
      }

      exported += batch.length;
      cursor = batch[batch.length - 1].id;

      if (batch.length < CSV_PAGE_SIZE) break;

      if (exported >= CSV_MAX_ROWS) {
        // Never truncate silently — a short CSV that looks complete is worse
        // than an explicit note that it is not.
        this.logger.warn(
          `Report ${report.id} hit the ${CSV_MAX_ROWS}-row export cap; output is truncated`,
        );
        chunks.push(`"Export truncated at ${CSV_MAX_ROWS} rows",,,,,,,,,\n`);
        break;
      }
    }

    const csvBuffer = Buffer.from(chunks.join(''), 'utf-8');
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
