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

interface Waiter {
  resolve: (entry: PooledBrowser) => void;
  reject: (err: Error) => void;
}

export class BrowserPool {
  private readonly logger = new Logger(BrowserPool.name);
  private readonly browsers: PooledBrowser[] = [];
  private readonly waiters: Waiter[] = [];
  private shuttingDown = false;
  /**
   * Slots claimed by in-flight `launch()` calls that have not yet pushed onto
   * `browsers`. Counted toward the pool size so two concurrent `acquire()`s
   * cannot both slip past the cap during the `await puppeteer.launch()` gap and
   * overshoot MAX_BROWSERS — which would defeat the memory bound entirely.
   */
  private pendingLaunches = 0;

  private get poolSize(): number {
    return this.browsers.length + this.pendingLaunches;
  }

  private async launch(): Promise<PooledBrowser> {
    // Reserve the slot synchronously, before the first await, so poolSize
    // reflects this launch for any acquire() that interleaves during startup.
    this.pendingLaunches += 1;
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const entry: PooledBrowser = { browser, uses: 0, busy: true };
      this.browsers.push(entry);
      this.logger.log(`Launched pooled browser (${this.browsers.length}/${MAX_BROWSERS})`);
      return entry;
    } finally {
      this.pendingLaunches -= 1;
    }
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

    if (this.poolSize < MAX_BROWSERS) {
      return this.launch();
    }

    // Pool exhausted — wait for a release rather than launching more.
    return new Promise<PooledBrowser>((resolve, reject) =>
      this.waiters.push({ resolve, reject }),
    );
  }

  /** Hand a live browser to the next waiter, launching a replacement if needed.
   *  A failed replacement launch must reject the waiter, never strand it. */
  private handOff(entry: PooledBrowser): void {
    const waiter = this.waiters.shift();
    if (waiter) waiter.resolve(entry); // stays busy — handed straight on
    else entry.busy = false;
  }

  private launchForNextWaiter(): void {
    const waiter = this.waiters.shift();
    if (!waiter) return;
    if (this.shuttingDown) {
      waiter.reject(new Error('Browser pool is shutting down'));
      return;
    }
    // Replace the retired browser for whoever is waiting. If the launch fails
    // we reject the waiter (and pendingLaunches self-corrects in launch()'s
    // finally), so the caller sees an error instead of hanging forever.
    this.launch().then(
      (fresh) => waiter.resolve(fresh),
      (err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        this.logger.error(`Replacement browser launch failed: ${error.message}`);
        waiter.reject(error);
      },
    );
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
      this.launchForNextWaiter();
      return;
    }

    this.handOff(entry);
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
    // Reject anyone still queued so their withPage() rejects instead of hanging
    // until the process is killed.
    while (this.waiters.length) {
      this.waiters.shift()!.reject(new Error('Browser pool is shutting down'));
    }
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
