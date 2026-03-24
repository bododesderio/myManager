import { PrismaClient, PostStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── Resolve demo user & workspace from demo.seed.ts ──────────
  const user = await prisma.user.findUnique({ where: { email: 'demo@mymanager.app' } });
  if (!user) throw new Error('Demo user not found — run demo.seed.ts first');

  const workspace = await prisma.workspace.findFirst({ where: { owner_id: user.id } });
  if (!workspace) throw new Error('Demo workspace not found — run main seed first');

  // ── Resolve platforms ────────────────────────────────────────
  const [fbPlatform, igPlatform, xPlatform, liPlatform] = await Promise.all([
    prisma.platform.findUnique({ where: { slug: 'facebook' } }),
    prisma.platform.findUnique({ where: { slug: 'instagram' } }),
    prisma.platform.findUnique({ where: { slug: 'x' } }),
    prisma.platform.findUnique({ where: { slug: 'linkedin' } }),
  ]);

  if (!fbPlatform || !igPlatform || !xPlatform || !liPlatform) {
    throw new Error('Platforms not found — run platforms.seed.ts first');
  }

  // ── Helper: date math ────────────────────────────────────────
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
  const dateOnly = (d: Date) => new Date(d.toISOString().split('T')[0] + 'T00:00:00.000Z');

  // ── 1. Social Accounts ──────────────────────────────────────
  const socialAccounts = [
    {
      workspace_id: workspace.id,
      platform_id: fbPlatform.id,
      platform_user_id: 'fb_demo_100001',
      platform_username: 'mymanagerdemo',
      display_name: 'MyManager Demo',
      access_token_encrypted: 'demo_fb_access_token_encrypted',
      refresh_token_encrypted: 'demo_fb_refresh_token_encrypted',
      token_expires_at: daysFromNow(60),
      scopes: ['pages_manage_posts', 'pages_read_engagement'],
      metadata: {},
      is_active: true,
    },
    {
      workspace_id: workspace.id,
      platform_id: igPlatform.id,
      platform_user_id: 'ig_demo_200001',
      platform_username: 'mymanager.demo',
      display_name: 'MyManager Demo',
      access_token_encrypted: 'demo_ig_access_token_encrypted',
      refresh_token_encrypted: 'demo_ig_refresh_token_encrypted',
      token_expires_at: daysFromNow(60),
      scopes: ['instagram_basic', 'instagram_content_publish'],
      metadata: {},
      is_active: true,
    },
    {
      workspace_id: workspace.id,
      platform_id: xPlatform.id,
      platform_user_id: 'x_demo_300001',
      platform_username: 'mymanagerdemo',
      display_name: 'MyManager Demo',
      access_token_encrypted: 'demo_x_access_token_encrypted',
      refresh_token_encrypted: 'demo_x_refresh_token_encrypted',
      token_expires_at: daysFromNow(60),
      scopes: ['tweet.read', 'tweet.write', 'users.read'],
      metadata: {},
      is_active: true,
    },
    {
      workspace_id: workspace.id,
      platform_id: liPlatform.id,
      platform_user_id: 'li_demo_400001',
      platform_username: 'mymanager-demo',
      display_name: 'MyManager Demo',
      access_token_encrypted: 'demo_li_access_token_encrypted',
      refresh_token_encrypted: 'demo_li_refresh_token_encrypted',
      token_expires_at: daysFromNow(60),
      scopes: ['w_member_social', 'r_liteprofile'],
      metadata: {},
      is_active: true,
    },
  ];

  for (const sa of socialAccounts) {
    await prisma.socialAccount.upsert({
      where: {
        workspace_id_platform_id_platform_user_id: {
          workspace_id: sa.workspace_id,
          platform_id: sa.platform_id,
          platform_user_id: sa.platform_user_id,
        },
      },
      update: {},
      create: sa,
    });
  }
  console.log('Social accounts seeded (4 platforms)');

  // ── 2. Posts ─────────────────────────────────────────────────
  // Stable IDs so the seed is idempotent with upsert
  const postIds = {
    pub1: '10000000-aaaa-4000-8000-000000000001',
    pub2: '10000000-aaaa-4000-8000-000000000002',
    pub3: '10000000-aaaa-4000-8000-000000000003',
    sched1: '10000000-bbbb-4000-8000-000000000001',
    sched2: '10000000-bbbb-4000-8000-000000000002',
    sched3: '10000000-bbbb-4000-8000-000000000003',
    draft1: '10000000-cccc-4000-8000-000000000001',
    draft2: '10000000-cccc-4000-8000-000000000002',
  };

  const posts = [
    // ── Published ──
    {
      id: postIds.pub1,
      workspace_id: workspace.id,
      user_id: user.id,
      caption:
        'Consistency beats perfection every time. The brands that show up daily on social media are the ones that build real trust. Start with 3 posts per week and scale from there. #SocialMediaMarketing #ContentStrategy',
      content_type: 'post',
      platforms: ['instagram', 'facebook'],
      status: PostStatus.PUBLISHED,
      published_at: daysAgo(2),
      scheduled_at: daysAgo(2),
      platform_options: {},
    },
    {
      id: postIds.pub2,
      workspace_id: workspace.id,
      user_id: user.id,
      caption:
        'Your audience does not care about your product — they care about their problem. Flip the script: lead with the pain point, then position your offer as the solution. That is the secret to high-converting social copy.',
      content_type: 'post',
      platforms: ['linkedin'],
      status: PostStatus.PUBLISHED,
      published_at: daysAgo(4),
      scheduled_at: daysAgo(4),
      platform_options: {},
    },
    {
      id: postIds.pub3,
      workspace_id: workspace.id,
      user_id: user.id,
      caption:
        'Short-form video is still king in 2026. Here are 5 hooks that stop the scroll: 1) Start with a bold claim 2) Ask a polarizing question 3) Use a pattern interrupt 4) Share a surprising stat 5) Tell a micro-story. Save this for later!',
      content_type: 'post',
      platforms: ['x', 'instagram'],
      status: PostStatus.PUBLISHED,
      published_at: daysAgo(6),
      scheduled_at: daysAgo(6),
      platform_options: {},
    },
    // ── Scheduled ──
    {
      id: postIds.sched1,
      workspace_id: workspace.id,
      user_id: user.id,
      caption:
        'Behind every viral post is a strategy you did not see. Tomorrow we are breaking down the exact framework we use to plan a month of content in one afternoon. Stay tuned. #ContentPlanning #MarketingTips',
      content_type: 'post',
      platforms: ['facebook', 'instagram', 'linkedin'],
      status: PostStatus.SCHEDULED,
      scheduled_at: daysFromNow(1),
      platform_options: {},
    },
    {
      id: postIds.sched2,
      workspace_id: workspace.id,
      user_id: user.id,
      caption:
        'Engagement rate dropping? Here is what most brands overlook: your posting times matter less than your reply times. Respond within the first 30 minutes and watch your reach climb.',
      content_type: 'post',
      platforms: ['x', 'linkedin'],
      status: PostStatus.SCHEDULED,
      scheduled_at: daysFromNow(3),
      platform_options: {},
    },
    {
      id: postIds.sched3,
      workspace_id: workspace.id,
      user_id: user.id,
      caption:
        'We analyzed 10,000 Instagram Reels so you do not have to. The sweet spot? 15-30 seconds, native captions, and a hook in the first 1.5 seconds. Full breakdown in our new guide — link in bio.',
      content_type: 'post',
      platforms: ['instagram'],
      status: PostStatus.SCHEDULED,
      scheduled_at: daysFromNow(5),
      platform_options: {},
    },
    // ── Drafts ──
    {
      id: postIds.draft1,
      workspace_id: workspace.id,
      user_id: user.id,
      caption:
        'Draft: Case study on how [Client Name] grew their LinkedIn following by 240% in 90 days using our content batching approach. Need to finalize metrics and add testimonial quote.',
      content_type: 'post',
      platforms: ['linkedin', 'facebook'],
      status: PostStatus.DRAFT,
      platform_options: {},
    },
    {
      id: postIds.draft2,
      workspace_id: workspace.id,
      user_id: user.id,
      caption:
        'The algorithm does not hate you — it just rewards conversations over broadcasts. Here is how to turn every post into a two-way dialogue with your audience...',
      content_type: 'post',
      platforms: ['x', 'instagram', 'facebook'],
      status: PostStatus.DRAFT,
      platform_options: {},
    },
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { id: post.id },
      update: {
        caption: post.caption,
        platforms: post.platforms,
        status: post.status,
        scheduled_at: post.scheduled_at ?? null,
        published_at: post.published_at ?? null,
      },
      create: post,
    });
  }
  console.log('Posts seeded (3 published, 3 scheduled, 2 drafts)');

  // ── 3. Post Analytics for published posts ────────────────────
  const analyticsData = [
    { post_id: postIds.pub1, platform: 'instagram', reach: 4820, impressions: 7350, likes: 312, comments: 47, shares: 28, saves: 85, clicks: 134, engagement_rate: 6.5 },
    { post_id: postIds.pub1, platform: 'facebook', reach: 2100, impressions: 3800, likes: 145, comments: 23, shares: 41, saves: 12, clicks: 89, engagement_rate: 4.8 },
    { post_id: postIds.pub2, platform: 'linkedin', reach: 6200, impressions: 9100, likes: 287, comments: 64, shares: 92, saves: 0, clicks: 210, engagement_rate: 7.1 },
    { post_id: postIds.pub3, platform: 'x', reach: 3400, impressions: 5600, likes: 198, comments: 31, shares: 76, saves: 0, clicks: 112, engagement_rate: 5.4 },
    { post_id: postIds.pub3, platform: 'instagram', reach: 5100, impressions: 8200, likes: 421, comments: 58, shares: 35, saves: 112, clicks: 167, engagement_rate: 7.8 },
  ];

  for (const a of analyticsData) {
    await prisma.postAnalytics.upsert({
      where: {
        post_id_platform: {
          post_id: a.post_id,
          platform: a.platform,
        },
      },
      update: {
        reach: a.reach,
        impressions: a.impressions,
        likes: a.likes,
        comments: a.comments,
        shares: a.shares,
        saves: a.saves,
        clicks: a.clicks,
        engagement_rate: a.engagement_rate,
      },
      create: {
        ...a,
        views: 0,
        play_duration_seconds: 0,
        avg_view_percentage: 0,
      },
    });
  }
  console.log('Post analytics seeded');

  // ── 4. Workspace Analytics Daily (last 7 days) ───────────────
  const platformDailyBase: Record<string, { reach: number; impressions: number; engagements: number; followers: number }> = {
    facebook:  { reach: 1800, impressions: 3200, engagements: 220, followers: 4850 },
    instagram: { reach: 3500, impressions: 5800, engagements: 480, followers: 12300 },
    x:         { reach: 1200, impressions: 2100, engagements: 150, followers: 3200 },
    linkedin:  { reach: 2800, impressions: 4500, engagements: 310, followers: 7600 },
  };

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = dateOnly(daysAgo(dayOffset));

    for (const [platform, base] of Object.entries(platformDailyBase)) {
      // Add some variance so the chart looks natural (+-25%)
      const jitter = () => 0.75 + Math.random() * 0.5;
      const reach = Math.round(base.reach * jitter());
      const impressions = Math.round(base.impressions * jitter());
      const engagements = Math.round(base.engagements * jitter());
      const followers = base.followers + Math.round((6 - dayOffset) * (15 + Math.random() * 10));
      const engagementRate = parseFloat(((engagements / reach) * 100).toFixed(2));

      await prisma.workspaceAnalyticsDaily.upsert({
        where: {
          workspace_id_platform_date: {
            workspace_id: workspace.id,
            platform,
            date,
          },
        },
        update: {
          total_reach: reach,
          total_impressions: impressions,
          total_engagements: engagements,
          follower_count: followers,
          engagement_rate: engagementRate,
          posts_count: platform === 'instagram' ? 2 : 1,
        },
        create: {
          workspace_id: workspace.id,
          platform,
          date,
          posts_count: platform === 'instagram' ? 2 : 1,
          total_reach: reach,
          total_impressions: impressions,
          total_engagements: engagements,
          follower_count: followers,
          engagement_rate: engagementRate,
        },
      });
    }
  }
  console.log('Workspace analytics daily seeded (7 days x 4 platforms)');

  // ── 5. Platform results for published posts ──────────────────
  const platformResults = [
    { post_id: postIds.pub1, platform: 'instagram', status: 'PUBLISHED', platform_post_id: 'ig_post_90001', platform_post_url: 'https://instagram.com/p/demo90001', published_at: daysAgo(2) },
    { post_id: postIds.pub1, platform: 'facebook', status: 'PUBLISHED', platform_post_id: 'fb_post_90001', platform_post_url: 'https://facebook.com/mymanagerdemo/posts/demo90001', published_at: daysAgo(2) },
    { post_id: postIds.pub2, platform: 'linkedin', status: 'PUBLISHED', platform_post_id: 'li_post_90002', platform_post_url: 'https://linkedin.com/feed/update/demo90002', published_at: daysAgo(4) },
    { post_id: postIds.pub3, platform: 'x', status: 'PUBLISHED', platform_post_id: 'x_post_90003', platform_post_url: 'https://x.com/mymanagerdemo/status/demo90003', published_at: daysAgo(6) },
    { post_id: postIds.pub3, platform: 'instagram', status: 'PUBLISHED', platform_post_id: 'ig_post_90003', platform_post_url: 'https://instagram.com/p/demo90003', published_at: daysAgo(6) },
  ];

  for (const pr of platformResults) {
    await prisma.postPlatformResult.upsert({
      where: {
        post_id_platform: {
          post_id: pr.post_id,
          platform: pr.platform,
        },
      },
      update: {},
      create: pr,
    });
  }
  console.log('Post platform results seeded');

  console.log('\nDashboard demo data seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
