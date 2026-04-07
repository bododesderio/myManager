import { ListeningSyncCron } from './listening-sync.cron';

describe('ListeningSyncCron sentiment classification', () => {
  function makeCron() {
    const prisma = {
      listeningTerm: { findMany: jest.fn().mockResolvedValue([]) },
      mentionEvent: { create: jest.fn() },
      mentionAnalyticsDaily: { upsert: jest.fn() },
    } as any;
    return new ListeningSyncCron(prisma);
  }

  it('detects positive sentiment', () => {
    const cron = makeCron();
    expect((cron as any).classifySentiment('I love this product, it is great!')).toBe('positive');
  });

  it('detects negative sentiment', () => {
    const cron = makeCron();
    expect((cron as any).classifySentiment('This is terrible, broken and awful')).toBe('negative');
  });

  it('falls back to neutral when mixed or unknown', () => {
    const cron = makeCron();
    expect((cron as any).classifySentiment('Good but also kind of bad')).toBe('neutral');
    expect((cron as any).classifySentiment('Just an observation')).toBe('neutral');
  });

  it('handles empty string without crashing', () => {
    const cron = makeCron();
    expect((cron as any).classifySentiment('')).toBe('neutral');
  });
});
