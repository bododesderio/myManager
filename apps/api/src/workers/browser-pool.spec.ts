const launchMock = jest.fn();

jest.mock('puppeteer', () => ({
  __esModule: true,
  default: { launch: (...args: any[]) => launchMock(...args) },
}));

/** A fake Chromium whose `connected` flag can be flipped to simulate a crash. */
function makeFakeBrowser() {
  const state = { connected: true };
  const page = {};
  const context = {
    newPage: jest.fn().mockResolvedValue(page),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const browser: any = {
    createBrowserContext: jest.fn().mockResolvedValue(context),
    close: jest.fn().mockResolvedValue(undefined),
    __crash: () => {
      state.connected = false;
    },
  };
  Object.defineProperty(browser, 'connected', { get: () => state.connected });
  return browser;
}

/** Import BrowserPool fresh with a given pool size baked in (it reads the env
 *  var at module-eval time). */
function loadPool(poolSize: string) {
  process.env.PUPPETEER_POOL_SIZE = poolSize;
  let BrowserPool!: any;
  jest.isolateModules(() => {
    ({ BrowserPool } = require('./browser-pool'));
  });
  return new BrowserPool();
}

const flush = () => new Promise((r) => setImmediate(r));

describe('BrowserPool concurrency', () => {
  beforeEach(() => {
    launchMock.mockReset();
  });

  it('never launches more than MAX_BROWSERS under a concurrent burst', async () => {
    launchMock.mockImplementation(async () => makeFakeBrowser());
    const pool = loadPool('2');

    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });

    // 6 jobs arrive at once; each holds its browser until the gate opens.
    const jobs = Array.from({ length: 6 }, () =>
      pool.withPage(async () => {
        await gate;
        return 'ok';
      }),
    );

    await flush(); // let the first two launch and the rest queue
    release();
    const results = await Promise.all(jobs);

    expect(results).toEqual(Array(6).fill('ok'));
    // The cap held: only two browsers were ever spawned, the other four reused.
    expect(launchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects a queued waiter when the replacement browser fails to launch', async () => {
    const first = makeFakeBrowser();
    launchMock
      .mockResolvedValueOnce(first) // job1's browser
      .mockRejectedValueOnce(new Error('spawn failed')); // replacement for job2
    const pool = loadPool('1');

    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });

    const job1 = pool.withPage(async () => {
      first.__crash(); // browser dies mid-use → forces a recycle on release
      await gate;
      return 'ok';
    });
    const job2 = pool.withPage(async () => 'ok2'); // queues behind the single slot

    await flush();
    release();

    await expect(job1).resolves.toBe('ok');
    // Before the fix this promise never settled — the waiter was stranded.
    await expect(job2).rejects.toThrow('spawn failed');
    expect(launchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects queued waiters on shutdown instead of hanging them', async () => {
    launchMock.mockImplementation(async () => makeFakeBrowser());
    const pool = loadPool('1');

    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });

    const job1 = pool.withPage(async () => {
      await gate;
      return 'ok';
    });
    const job2 = pool.withPage(async () => 'ok2'); // queued

    await flush();
    await pool.shutdown();

    await expect(job2).rejects.toThrow('shutting down');
    release();
    await expect(job1).resolves.toBe('ok');
  });
});
