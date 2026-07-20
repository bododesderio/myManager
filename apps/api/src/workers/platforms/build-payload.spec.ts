import { XWorker } from './x.worker';
import { ThreadsWorker } from './threads.worker';
import { InstagramWorker } from './instagram.worker';
import { LinkedInWorker } from './linkedin.worker';
import { TikTokWorker } from './tiktok.worker';
import { PinterestWorker } from './pinterest.worker';
import { YouTubeWorker } from './youtube.worker';
import { FacebookWorker } from './facebook.worker';
import { GoogleBusinessWorker } from './google-business.worker';
import { WhatsAppWorker } from './whatsapp.worker';

/**
 * buildPayload contracts for every platform worker.
 *
 * These exist because of what writing them found: nine of the ten workers read
 * camelCase fields off a raw Prisma result whose columns are snake_case.
 *   post.contentType        -> column is content_type        -> undefined
 *   post.platformOptions    -> column is platform_options    -> undefined
 *   post.linkUrl            -> column is link_url            -> undefined
 *   post.firstCommentText   -> column is first_comment_text  -> undefined
 *   m.mediaAsset.url        -> relation is media_asset       -> TypeError
 *
 * base.worker passes the Prisma row straight through with no mapping layer, so
 * every one of those was silently undefined in production: platform options
 * dropped, links never appended, Instagram/Threads/TikTok throwing
 * "Unsupported content type: undefined", and any post WITH media crashing.
 * Only whatsapp.worker was wired correctly.
 *
 * The fixtures below therefore use the real snake_case shape deliberately. A
 * camelCase fixture would have let the bug pass.
 */

/** A post exactly as Prisma returns it — snake_case columns, media_asset relation. */
function prismaPost(over: Record<string, any> = {}) {
  return {
    id: 'post_1',
    caption: 'Hello world',
    content_type: 'image_single',
    platforms: ['x'],
    link_url: 'https://example.test/article',
    first_comment_text: 'first!',
    platform_options: {
      x: { reply_settings: 'following' },
      instagram: { location_id: '123' },
      threads: { reply_control: 'everyone' },
      linkedin: { visibility: 'PUBLIC' },
      tiktok: { privacy_level: 'PUBLIC_TO_EVERYONE' },
      pinterest: { board_id: 'b1' },
      youtube: { title: 'My video' },
      gbp: { topic_type: 'STANDARD' },
      facebook: { published: true },
    },
    media: [
      { sort_order: 0, media_asset: { url: 'https://cdn.test/1.jpg' } },
      { sort_order: 1, media_asset: { url: 'https://cdn.test/2.jpg' } },
    ],
    ...over,
  };
}

/** A social account as Prisma returns it. */
const prismaAccount = {
  id: 'sa_1',
  platform_id: 'x',
  platform_user_id: 'urn:li:person:ABC',
  platform_username: 'acme',
  access_token_encrypted: 'iv:tag:cipher',
};

const prisma = {} as never;

const WORKERS: Array<[string, any]> = [
  ['x', new XWorker(prisma)],
  ['threads', new ThreadsWorker(prisma)],
  ['instagram', new InstagramWorker(prisma)],
  ['linkedin', new LinkedInWorker(prisma)],
  ['tiktok', new TikTokWorker(prisma)],
  ['pinterest', new PinterestWorker(prisma)],
  ['youtube', new YouTubeWorker(prisma)],
  ['facebook', new FacebookWorker(prisma)],
  ['google-business', new GoogleBusinessWorker(prisma)],
  ['whatsapp', new WhatsAppWorker(prisma)],
];

describe('buildPayload — shared contract across all 10 platforms', () => {
  it.each(WORKERS)('%s extracts media urls from the media_asset relation', async (_name, worker) => {
    const payload = await worker.buildPayload(prismaPost(), prismaAccount);
    // The regression that motivated this file: reading m.mediaAsset threw, and
    // an empty array would mean media silently vanished from the post.
    expect(payload.mediaUrls).toEqual(['https://cdn.test/1.jpg', 'https://cdn.test/2.jpg']);
  });

  it.each(WORKERS)('%s reads content_type, not contentType', async (_name, worker) => {
    const payload = await worker.buildPayload(prismaPost(), prismaAccount);
    expect(payload.contentType).toBe('image_single');
  });

  it.each(WORKERS)('%s survives a post with no media', async (_name, worker) => {
    const payload = await worker.buildPayload(prismaPost({ media: [] }), prismaAccount);
    expect(payload.mediaUrls).toEqual([]);
  });

  it.each(WORKERS)('%s always returns a caption', async (_name, worker) => {
    const payload = await worker.buildPayload(prismaPost(), prismaAccount);
    expect(typeof payload.caption).toBe('string');
    expect(payload.caption.length).toBeGreaterThan(0);
  });
});

describe('platform-specific rules', () => {
  it('X truncates the caption to 280 characters', async () => {
    const worker = new XWorker(prisma);
    const payload = await worker.buildPayload(prismaPost({ caption: 'a'.repeat(400) }), prismaAccount);
    expect(payload.caption).toHaveLength(280);
  });

  it('X reads its own platform_options namespace', async () => {
    const worker = new XWorker(prisma);
    const payload = await worker.buildPayload(prismaPost(), prismaAccount);
    expect(payload.platformOptions).toEqual({ reply_settings: 'following' });
  });

  it('X falls back to an empty object when the namespace is absent', async () => {
    const worker = new XWorker(prisma);
    const payload = await worker.buildPayload(prismaPost({ platform_options: {} }), prismaAccount);
    expect(payload.platformOptions).toEqual({});
  });

  it('Threads truncates the caption to 500 characters', async () => {
    const worker = new ThreadsWorker(prisma);
    const payload = await worker.buildPayload(prismaPost({ caption: 'b'.repeat(900) }), prismaAccount);
    expect(payload.caption).toHaveLength(500);
  });

  it('Threads carries the account id through as threadsUserId', async () => {
    const worker = new ThreadsWorker(prisma);
    const payload = await worker.buildPayload(prismaPost(), prismaAccount);
    // Was account.platformAccountId — a column that does not exist — so this
    // reached the Threads API as undefined.
    expect(payload.platformOptions.threadsUserId).toBe('urn:li:person:ABC');
    expect(payload.platformOptions.reply_control).toBe('everyone');
  });

  it('LinkedIn carries the account id through as authorUrn', async () => {
    const worker = new LinkedInWorker(prisma);
    const payload = await worker.buildPayload(prismaPost(), prismaAccount);
    expect(payload.platformOptions.authorUrn).toBe('urn:li:person:ABC');
    expect(payload.platformOptions.visibility).toBe('PUBLIC');
  });

  it('Google Business carries the account id through as locationName', async () => {
    const worker = new GoogleBusinessWorker(prisma);
    const payload = await worker.buildPayload(prismaPost(), prismaAccount);
    expect(payload.platformOptions.locationName).toBe('urn:li:person:ABC');
  });

  it('Instagram passes first_comment_text through', async () => {
    const worker = new InstagramWorker(prisma);
    const payload = await worker.buildPayload(prismaPost(), prismaAccount);
    expect(payload.firstCommentText).toBe('first!');
  });

  it.each([
    ['x', XWorker],
    ['threads', ThreadsWorker],
    ['linkedin', LinkedInWorker],
    ['pinterest', PinterestWorker],
  ])('%s passes link_url through', async (_name, Worker) => {
    const worker = new (Worker as any)(prisma);
    const payload = await worker.buildPayload(prismaPost(), prismaAccount);
    expect(payload.linkUrl).toBe('https://example.test/article');
  });
});
