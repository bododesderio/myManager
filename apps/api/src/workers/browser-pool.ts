import puppeteer, { Browser, Page } from 'puppeteer';
import { Logger } from '@nestjs/common';

/**
 * A small pool of reusable Chromium instances (docs/audit-2026-07-20.md §H5).
 *
 * Previously every PDF called `puppeteer.launch()`: ~150-200MB RSS and 3-5s of
 * startup each. Ten concurrent reports meant ~2GB of browser processes and a
 * near-certain OOM, with most of the latency being startup rather than render.
 *
 * The pool bounds that cost. Concurrency above MAX_BROWSERS queues rather than
 * spawning, so memory is capped no matter how deep the report queue gets.
 *
 * Each job still gets a fresh *page* in an isolated incognito context, so no
 * cookies, storage or JS state leak between workspaces — only the expensive
 * process is shared.
 */

const MAX_BROWSERS = Number(process.env.PUPPETEER_POOL_SIZE ?? 2);
/** Recycle a browser after this many pages to bound Chromium's memory creep. */
const MAX_USES_PER_BROWSER = 50;

interface PooledBrowser {
  browser: Browser;
  uses: number;
  busy: boolean;
}

class BrowserPool {
  private readonly logger = new Logger(BrowserPool.name);
  private readonly browsers: PooledBrowser[] = [];
  private readonly waiters: Array<(entry: PooledBrowser) => void> = [];
  private shuttingDown = false;

  private async launch(): Promise<PooledBrowser> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const entry: PooledBrowser = { browser, uses: 0, busy: true };
    this.browsers.push(entry);
    this.logger.log(`Launched pooled browser (${this.browsers.length}/${MAX_BROWSERS})`);
    return entry;
  }

  private async acquire(): Promise<PooledBrowser> {
    if (this.shuttingDown) {
      throw new Error('Browser pool is shutting down');
    }

    const idle = this.browsers.find((b) => !b.busy);
    if (idle) {
      idle.busy = true;
      return idle;
    }

    if (this.browsers.length < MAX_BROWSERS) {
      return this.launch();
    }

    // Pool exhausted — wait for a release rather than launching more.
    return new Promise<PooledBrowser>((resolve) => this.waiters.push(resolve));
  }

  private async release(entry: PooledBrowser): Promise<void> {
    entry.uses += 1;

    // Recycle a tired or dead browser before handing it on.
    const disconnected = !entry.browser.connected;
    if (disconnected || entry.uses >= MAX_USES_PER_BROWSER) {
      const index = this.browsers.indexOf(entry);
      if (index !== -1) this.browsers.splice(index, 1);
      await entry.browser.close().catch(() => undefined);
      this.logger.log(
        disconnected
          ? 'Discarded disconnected pooled browser'
          : `Recycled pooled browser after ${entry.uses} uses`,
      );

      const waiter = this.waiters.shift();
      if (waiter) {
        // Replace the retired browser for whoever is waiting.
        void this.launch().then(waiter);
      }
      return;
    }

    const waiter = this.waiters.shift();
    if (waiter) {
      waiter(entry); // stays busy — handed straight to the next caller
      return;
    }

    entry.busy = false;
  }

  /**
   * Run `fn` with a page from a pooled browser. The page and its isolated
   * browser context are always torn down; the browser process is retained.
   */
  async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const entry = await this.acquire();
    // Isolated context per job: no shared cookies/storage across workspaces.
    const context = await entry.browser.createBrowserContext();

    try {
      const page = await context.newPage();
      return await fn(page);
    } finally {
      await context.close().catch(() => undefined);
      await this.release(entry);
    }
  }

  /** Close every browser. Call on process shutdown so Chromium is not orphaned. */
  async shutdown(): Promise<void> {
    this.shuttingDown = true;
    const all = this.browsers.splice(0, this.browsers.length);
    await Promise.all(all.map((e) => e.browser.close().catch(() => undefined)));
    this.logger.log('Browser pool shut down');
  }
}

export const browserPool = new BrowserPool();

// Chromium does not die with the parent by default; leaked processes survive a
// container restart and are a common source of "mystery" memory use.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void browserPool.shutdown();
  });
}
