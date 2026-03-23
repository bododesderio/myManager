import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // 1. Brand config
  await seedBrand();
  // 2. Theme config + presets
  await seedTheme();
  // 3. Plans
  await seedPlans();
  // 4. Platforms
  await seedPlatforms();
  // 5. Users + workspaces
  await seedUsers();
  // 6. CMS pages
  await seedCmsPages();
  // 7. Blog
  await seedBlog();
  // 8. FAQ
  await seedFaq();
  // 9. Testimonials
  await seedTestimonials();
  // 10. Nav links
  await seedNavLinks();

  console.log('\n✅ All seeds completed.');
}

// ─── Brand Config ─────────────────────────────────────────
async function seedBrand() {
  const existing = await prisma.brandConfig.findFirst();
  if (existing) {
    await prisma.brandConfig.update({
      where: { id: existing.id },
      data: {
        app_name: 'myManager',
        app_tagline: 'Post once. Reach everywhere.',
        support_email: 'support@mymanager.app',
        sales_email: 'sales@mymanager.app',
        footer_made_in: 'Made with care in Kampala, Uganda',
        footer_copyright: '© 2025–2026 MyManager Ltd. All rights reserved.',
        meta_title_suffix: '— myManager',
        maintenance_mode: false,
      },
    });
  } else {
    await prisma.brandConfig.create({
      data: {
        app_name: 'myManager',
        app_tagline: 'Post once. Reach everywhere.',
        support_email: 'support@mymanager.app',
        sales_email: 'sales@mymanager.app',
        footer_made_in: 'Made with care in Kampala, Uganda',
        footer_copyright: '© 2025–2026 MyManager Ltd. All rights reserved.',
        meta_title_suffix: '— myManager',
        maintenance_mode: false,
        config: {
          primary_color: '#7F77DD',
          secondary_color: '#534AB7',
          accent_color: '#1D9E75',
        },
      },
    });
  }
  console.log('  ✓ Brand config');
}

// ─── Theme ────────────────────────────────────────────────
async function seedTheme() {
  const existing = await prisma.themeConfig.findFirst();
  if (existing) {
    await prisma.themeConfig.update({
      where: { id: existing.id },
      data: { default_mode: 'LIGHT', allow_user_override: false },
    });
  } else {
    await prisma.themeConfig.create({ data: { default_mode: 'LIGHT', allow_user_override: false } });
  }

  const presets = [
    {
      name: 'purple-dawn',
      label: 'Purple Dawn',
      description: 'The default myManager theme with purple accents',
      is_built_in: true,
      is_active: true,
      config: {
        color_primary: '#7F77DD', color_primary_dark: '#534AB7', color_primary_light: '#EEEDFE',
        color_accent: '#1D9E75', color_bg_primary: '#ffffff', color_bg_secondary: '#f5f4ef',
        color_border: '#e8e6e0', stats_bg_color: '#534AB7', radius_button: '8px',
        default_mode: 'LIGHT',
      },
    },
    {
      name: 'ocean-blue',
      label: 'Ocean Blue',
      description: 'Clean blue tones with modern feel',
      is_built_in: true,
      is_active: false,
      config: {
        color_primary: '#2563EB', color_primary_dark: '#1D4ED8', color_primary_light: '#EFF6FF',
        color_accent: '#059669', color_bg_primary: '#ffffff', color_bg_secondary: '#F8FAFC',
        color_border: '#E2E8F0', stats_bg_color: '#1D4ED8',
        dark_color_primary: '#60A5FA', dark_bg_primary: '#0C1221',
        radius_button: '8px', default_mode: 'LIGHT',
      },
    },
    {
      name: 'forest-green',
      label: 'Forest Green',
      description: 'Natural greens with warm accents',
      is_built_in: true,
      is_active: false,
      config: {
        color_primary: '#16A34A', color_primary_dark: '#15803D', color_primary_light: '#DCFCE7',
        color_accent: '#D97706', color_bg_primary: '#ffffff', color_bg_secondary: '#F0FDF4',
        color_border: '#D1FAE5', stats_bg_color: '#15803D',
        dark_color_primary: '#4ADE80', dark_bg_primary: '#0A1510',
        radius_card: '14px', radius_button: '10px', default_mode: 'LIGHT',
      },
    },
    {
      name: 'midnight-dark',
      label: 'Midnight Dark',
      description: 'Dark mode first with purple highlights',
      is_built_in: true,
      is_active: false,
      config: {
        color_primary: '#A78BFA', color_primary_dark: '#7C3AED', color_primary_light: '#2D1B69',
        color_accent: '#34D399', color_bg_primary: '#0F172A', color_bg_secondary: '#1E293B',
        color_border: '#334155', stats_bg_color: '#4C1D95',
        sidebar_style: 'dark', default_mode: 'DARK',
      },
    },
    {
      name: 'sunset-coral',
      label: 'Sunset Coral',
      description: 'Warm coral tones with purple accents',
      is_built_in: true,
      is_active: false,
      config: {
        color_primary: '#EA580C', color_primary_dark: '#C2410C', color_primary_light: '#FFF7ED',
        color_accent: '#7C3AED', color_bg_primary: '#ffffff', color_bg_secondary: '#FFFBF5',
        color_border: '#FED7AA', stats_bg_color: '#C2410C',
        radius_card: '14px', radius_button: '20px', default_mode: 'LIGHT',
      },
    },
  ];

  for (const preset of presets) {
    await prisma.themePreset.upsert({
      where: { name: preset.name },
      update: { label: preset.label, description: preset.description, config: preset.config, is_active: preset.is_active },
      create: preset,
    });
  }
  console.log('  ✓ Theme config + 5 presets');
}

// ─── Plans ────────────────────────────────────────────────
async function seedPlans() {
  const plans = [
    {
      slug: 'free', name: 'Free', description: 'Get started with basic social media management',
      price_monthly_usd: 0, price_annual_usd: 0, sort_order: 0,
      limits: { posts: 4, accounts: 2, seats: 1, storage_gb: 0.5, ai_credits: 0, projects: 0 },
      features: { scheduling: false, previews: false, analytics_days: 7, ai: false, approval_workflow: false, client_portal: false, reports: false, best_time: false, recurring: false, competitor: false },
    },
    {
      slug: 'starter', name: 'Starter', description: 'For creators ready to grow',
      price_monthly_usd: 9, price_annual_usd: 7, sort_order: 1,
      limits: { posts: 30, accounts: 3, seats: 1, storage_gb: 2, ai_credits: 20, projects: 0 },
      features: { scheduling: true, previews: true, analytics_days: 30, ai: true, approval_workflow: false, client_portal: false, reports: false, best_time: false, recurring: false, competitor: false },
    },
    {
      slug: 'pro', name: 'Pro', description: 'For professionals and growing brands',
      price_monthly_usd: 19, price_annual_usd: 15, sort_order: 2,
      limits: { posts: 200, accounts: 6, seats: 1, storage_gb: 10, ai_credits: 100, projects: 0 },
      features: { scheduling: true, previews: true, analytics_days: 90, ai: true, approval_workflow: false, client_portal: false, reports: false, best_time: true, recurring: true, competitor: true },
    },
    {
      slug: 'enterprise', name: 'Enterprise', description: 'For agencies and large teams',
      price_monthly_usd: 79, price_annual_usd: 63, sort_order: 3,
      limits: { posts: 500, accounts: 20, seats: 5, storage_gb: 50, ai_credits: 500, projects: 10 },
      features: { scheduling: true, previews: true, analytics_days: 365, ai: true, approval_workflow: true, client_portal: true, reports: true, best_time: true, recurring: true, competitor: true },
    },
    {
      slug: 'custom', name: 'Custom', description: 'Tailored solution for enterprise needs',
      price_monthly_usd: 0, price_annual_usd: 0, sort_order: 4, is_custom: true,
      limits: { posts: -1, accounts: -1, seats: -1, storage_gb: -1, ai_credits: -1, projects: -1 },
      features: { scheduling: true, previews: true, analytics_days: -1, ai: true, approval_workflow: true, client_portal: true, reports: true, best_time: true, recurring: true, competitor: true, api: true, white_label: true, reseller: true, sla: true },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: { name: plan.name, description: plan.description, price_monthly_usd: plan.price_monthly_usd, price_annual_usd: plan.price_annual_usd, limits: plan.limits, features: plan.features, sort_order: plan.sort_order, is_custom: plan.is_custom ?? false },
      create: { ...plan, is_active: true, is_custom: plan.is_custom ?? false },
    });
  }
  console.log('  ✓ 5 plans');
}

// ─── Platforms ────────────────────────────────────────────
async function seedPlatforms() {
  const platforms = [
    { slug: 'facebook', name: 'Facebook', display_name: 'Facebook', color: '#1877F2', phase: 1, api_version: 'v18.0', auth_type: 'oauth2', max_caption_chars: 63206, max_images: 10, max_file_size_mb: 100, max_video_duration_sec: 14400, min_image_width: 600, min_image_height: 315 },
    { slug: 'instagram', name: 'Instagram', display_name: 'Instagram', color: '#E4405F', phase: 1, api_version: 'v18.0', auth_type: 'oauth2', max_caption_chars: 2200, max_images: 10, max_file_size_mb: 100, max_video_duration_sec: 5400, min_image_width: 320, min_image_height: 320 },
    { slug: 'x', name: 'X / Twitter', display_name: 'X / Twitter', color: '#111111', phase: 1, api_version: 'v2', auth_type: 'oauth2', max_caption_chars: 280, max_images: 4, max_file_size_mb: 15, max_video_duration_sec: 140, min_image_width: 600, min_image_height: 335 },
    { slug: 'linkedin', name: 'LinkedIn', display_name: 'LinkedIn', color: '#0A66C2', phase: 1, api_version: 'v2', auth_type: 'oauth2', max_caption_chars: 3000, max_images: 9, max_file_size_mb: 200, max_video_duration_sec: 600, min_image_width: 552, min_image_height: 276 },
    { slug: 'tiktok', name: 'TikTok', display_name: 'TikTok', color: '#111111', phase: 1, api_version: 'v2', auth_type: 'oauth2', max_caption_chars: 2200, max_images: 1, max_file_size_mb: 500, max_video_duration_sec: 600, min_image_width: 720, min_image_height: 1280 },
    { slug: 'google_business', name: 'Google Business Profile', display_name: 'Google Business Profile', color: '#4285F4', phase: 1, api_version: 'v1', auth_type: 'oauth2', max_caption_chars: 1500, max_images: 10, max_file_size_mb: 25, max_video_duration_sec: 30, min_image_width: 250, min_image_height: 250 },
    { slug: 'pinterest', name: 'Pinterest', display_name: 'Pinterest', color: '#E60023', phase: 2, api_version: 'v5', auth_type: 'oauth2', max_caption_chars: 500, max_images: 1, max_file_size_mb: 20, max_video_duration_sec: 900, min_image_width: 600, min_image_height: 600 },
    { slug: 'youtube', name: 'YouTube', display_name: 'YouTube', color: '#FF0000', phase: 2, api_version: 'v3', auth_type: 'oauth2', max_caption_chars: 5000, max_images: 1, max_file_size_mb: 256000, max_video_duration_sec: 43200, min_image_width: 1280, min_image_height: 720 },
    { slug: 'whatsapp', name: 'WhatsApp Business', display_name: 'WhatsApp Business', color: '#25D366', phase: 2, api_version: 'v18.0', auth_type: 'oauth2', max_caption_chars: 1024, max_images: 1, max_file_size_mb: 16, max_video_duration_sec: 180, min_image_width: 0, min_image_height: 0 },
    { slug: 'threads', name: 'Threads', display_name: 'Threads', color: '#111111', phase: 2, api_version: 'v1', auth_type: 'oauth2', max_caption_chars: 500, max_images: 10, max_file_size_mb: 100, max_video_duration_sec: 300, min_image_width: 320, min_image_height: 320 },
  ];

  for (const p of platforms) {
    await prisma.platform.upsert({
      where: { slug: p.slug },
      update: { name: p.name, display_name: p.display_name, color: p.color, phase: p.phase },
      create: { ...p, is_active: true },
    });
  }
  console.log('  ✓ 10 platforms');
}

// ─── Users + Workspaces ───────────────────────────────────
async function seedUsers() {
  // Superadmin
  const adminPassword = await bcrypt.hash('superadmin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@mymanager.app' },
    update: { first_name: 'Super', last_name: 'Admin', status: 'ACTIVE' },
    create: {
      email: 'admin@mymanager.app', name: 'Super Admin', first_name: 'Super', last_name: 'Admin',
      password_hash: adminPassword, is_superadmin: true, email_verified: true, status: 'ACTIVE',
    },
  });

  // Demo individual user
  const demoPassword = await bcrypt.hash('demo1234', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@mymanager.app' },
    update: { first_name: 'Keza', last_name: 'Uwimana', status: 'ACTIVE' },
    create: {
      email: 'demo@mymanager.app', name: 'Keza Uwimana', first_name: 'Keza', last_name: 'Uwimana',
      password_hash: demoPassword, email_verified: true, status: 'ACTIVE',
    },
  });

  const proPlan = await prisma.plan.findUnique({ where: { slug: 'pro' } });
  const demoWs = await prisma.workspace.upsert({
    where: { slug: 'kezas-workspace' },
    update: {},
    create: {
      name: "Keza's Workspace", slug: 'kezas-workspace', owner_id: demoUser.id,
      account_type: 'INDIVIDUAL',
    },
  });

  await prisma.workspaceMember.upsert({
    where: { user_id_workspace_id: { user_id: demoUser.id, workspace_id: demoWs.id } },
    update: {},
    create: { user_id: demoUser.id, workspace_id: demoWs.id, role: 'OWNER', status: 'ACTIVE' },
  });

  if (proPlan) {
    const existingSub = await prisma.subscription.findUnique({ where: { workspace_id: demoWs.id } });
    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          user_id: demoUser.id, workspace_id: demoWs.id, plan_id: proPlan.id,
          status: 'ACTIVE', billing_cycle: 'MONTHLY',
          locked_limits: proPlan.limits as any, locked_features: proPlan.features as any,
          current_period_start: new Date(), current_period_end: new Date(Date.now() + 30 * 86400000),
        },
      });
    }
  }

  await prisma.user.update({ where: { id: demoUser.id }, data: { last_workspace_id: demoWs.id } });

  // Agency user
  const agencyPassword = await bcrypt.hash('agency1234', 12);
  const agencyUser = await prisma.user.upsert({
    where: { email: 'agency@mymanager.app' },
    update: { first_name: 'Kwame', last_name: 'Osei', status: 'ACTIVE' },
    create: {
      email: 'agency@mymanager.app', name: 'Kwame Osei', first_name: 'Kwame', last_name: 'Osei',
      password_hash: agencyPassword, email_verified: true, status: 'ACTIVE',
    },
  });

  const entPlan = await prisma.plan.findUnique({ where: { slug: 'enterprise' } });
  const agencyWs = await prisma.workspace.upsert({
    where: { slug: 'acme-agency' },
    update: {},
    create: {
      name: 'Acme Agency', slug: 'acme-agency', owner_id: agencyUser.id,
      account_type: 'COMPANY', industry: 'Marketing Agency', team_size: '6-15',
    },
  });

  await prisma.workspaceMember.upsert({
    where: { user_id_workspace_id: { user_id: agencyUser.id, workspace_id: agencyWs.id } },
    update: {},
    create: { user_id: agencyUser.id, workspace_id: agencyWs.id, role: 'OWNER', status: 'ACTIVE' },
  });

  if (entPlan) {
    const existingSub = await prisma.subscription.findUnique({ where: { workspace_id: agencyWs.id } });
    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          user_id: agencyUser.id, workspace_id: agencyWs.id, plan_id: entPlan.id,
          status: 'ACTIVE', billing_cycle: 'MONTHLY',
          locked_limits: entPlan.limits as any, locked_features: entPlan.features as any,
          current_period_start: new Date(), current_period_end: new Date(Date.now() + 30 * 86400000),
        },
      });
    }
  }

  // Agency team members
  const teamMembers = [
    { email: 'sarah@acme.app', name: 'Sarah Adeyemi', first_name: 'Sarah', last_name: 'Adeyemi', role: 'ADMIN' as const },
    { email: 'james@acme.app', name: 'James Ochieng', first_name: 'James', last_name: 'Ochieng', role: 'MEMBER' as const },
    { email: 'amara@acme.app', name: 'Amara Diallo', first_name: 'Amara', last_name: 'Diallo', role: 'MEMBER' as const },
  ];

  for (const tm of teamMembers) {
    const memberPassword = await bcrypt.hash('member1234', 12);
    const user = await prisma.user.upsert({
      where: { email: tm.email },
      update: { first_name: tm.first_name, last_name: tm.last_name, status: 'ACTIVE' },
      create: {
        email: tm.email, name: tm.name, first_name: tm.first_name, last_name: tm.last_name,
        password_hash: memberPassword, email_verified: true, status: 'ACTIVE',
      },
    });
    await prisma.workspaceMember.upsert({
      where: { user_id_workspace_id: { user_id: user.id, workspace_id: agencyWs.id } },
      update: {},
      create: { user_id: user.id, workspace_id: agencyWs.id, role: tm.role, status: 'ACTIVE' },
    });
  }

  // Projects
  const projects = ['Nike Uganda', 'MTN Uganda', 'Serena Hotel'];
  for (const pName of projects) {
    const slug = pName.toLowerCase().replace(/\s+/g, '-');
    await prisma.project.upsert({
      where: { workspace_id_slug: { workspace_id: agencyWs.id, slug } },
      update: {},
      create: { workspace_id: agencyWs.id, name: pName, slug, client_name: pName, monthly_post_target: 20 },
    });
  }

  // Portal token for Nike Uganda
  const nikeProject = await prisma.project.findFirst({ where: { workspace_id: agencyWs.id, slug: 'nike-uganda' } });
  if (nikeProject) {
    const existingToken = await prisma.portalAccessToken.findFirst({ where: { project_id: nikeProject.id } });
    if (!existingToken) {
      await prisma.portalAccessToken.create({
        data: {
          project_id: nikeProject.id, token: 'nike-portal-demo-token', label: 'Nike Client Portal',
          client_email: 'client@nike-uganda.com', client_name: 'Nike Uganda Team',
          created_by_id: agencyUser.id, is_active: true,
        },
      });
    }
  }

  await prisma.user.update({ where: { id: agencyUser.id }, data: { last_workspace_id: agencyWs.id } });
  console.log('  ✓ Users (superadmin + demo + agency + 3 team members)');
  console.log('  ✓ Workspaces (individual + company)');
  console.log('  ✓ 3 projects + portal token');
}

// ─── CMS Pages ────────────────────────────────────────────
async function seedCmsPages() {
  const pages: Array<{ slug: string; title: string; sections: Array<{ key: string; fields: Array<{ key: string; type: string; value: string }> }> }> = [
    {
      slug: 'landing', title: 'Landing Page',
      sections: [
        {
          key: 'hero',
          fields: [
            { key: 'announcement_badge_text', type: 'TEXT', value: 'Now with TikTok & Google Business' },
            { key: 'announcement_badge_visible', type: 'BOOLEAN', value: 'true' },
            { key: 'headline_line1', type: 'TEXT', value: 'Post once.' },
            { key: 'headline_line2', type: 'TEXT', value: 'Reach everywhere.' },
            { key: 'headline_emphasis_word', type: 'TEXT', value: 'Reach everywhere.' },
            { key: 'subtext', type: 'TEXTAREA', value: 'Schedule content across Facebook, Instagram, X, LinkedIn, TikTok, and Google Business from one workspace. Built for Africa, used worldwide.' },
            { key: 'cta_primary_text', type: 'TEXT', value: 'Start for free — no card needed' },
            { key: 'cta_primary_href', type: 'URL', value: '/signup' },
            { key: 'cta_secondary_text', type: 'TEXT', value: 'See how it works' },
            { key: 'cta_secondary_href', type: 'URL', value: '#how-it-works' },
            { key: 'trust_items', type: 'JSON', value: JSON.stringify([{ text: 'Free forever plan' }, { text: 'MTN MoMo & Airtel accepted' }, { text: 'Uganda · Kenya · Nigeria' }]) },
          ],
        },
        {
          key: 'platform_strip',
          fields: [
            { key: 'label', type: 'TEXT', value: 'Connect all your platforms in one place' },
          ],
        },
        {
          key: 'features',
          fields: [
            { key: 'section_label', type: 'TEXT', value: 'Features' },
            { key: 'headline', type: 'TEXT', value: 'Everything you need to dominate social media' },
            { key: 'subtext', type: 'TEXTAREA', value: 'From solo creators to large agencies — one platform, all the tools.' },
            { key: 'features_json', type: 'JSON', value: JSON.stringify([
              { icon: 'calendar', title: 'Smart Scheduling', body: 'Schedule posts across all platforms from one calendar. Set it and forget it.' },
              { icon: 'eye', title: 'Live Platform Previews', body: 'See exactly how your post will look on each platform before publishing.' },
              { icon: 'chart-bar', title: 'Analytics Dashboard', body: 'Track reach, engagement, and growth across all platforms in one unified view.' },
              { icon: 'users', title: 'Team Collaboration', body: 'Invite team members, assign roles, and streamline your approval workflow.' },
              { icon: 'sparkles', title: 'AI-Powered Captions', body: 'Generate engaging captions, hashtags, and best posting times with AI.' },
              { icon: 'layout-grid', title: 'Client Portal', body: 'Share content calendars and get approvals from clients without them needing an account.' },
            ]) },
          ],
        },
        {
          key: 'how_it_works',
          fields: [
            { key: 'section_label', type: 'TEXT', value: 'How it works' },
            { key: 'headline', type: 'TEXT', value: 'From idea to published in 2 minutes' },
            { key: 'steps_json', type: 'JSON', value: JSON.stringify([
              { number: '1', title: 'Connect your accounts', body: 'Link your social media profiles — Facebook, Instagram, X, LinkedIn, TikTok, and more.' },
              { number: '2', title: 'Create & schedule', body: 'Write your content once and customize it for each platform. Schedule or post instantly.' },
              { number: '3', title: 'Grow & analyse', body: 'Track performance with real-time analytics. Learn what works and optimise your strategy.' },
            ]) },
          ],
        },
        {
          key: 'stats',
          fields: [
            { key: 'stats_json', type: 'JSON', value: JSON.stringify([
              { value: '10', label: 'Social platforms connected' },
              { value: '6', label: 'Languages — Swahili & Arabic included' },
              { value: '3', label: 'Payment methods — MoMo, Airtel, Cards' },
              { value: '1', label: 'Dashboard for everything' },
            ]) },
          ],
        },
        {
          key: 'pricing_preview',
          fields: [
            { key: 'section_label', type: 'TEXT', value: 'Pricing' },
            { key: 'headline', type: 'TEXT', value: 'Simple pricing. No surprises.' },
            { key: 'subtext', type: 'TEXTAREA', value: 'Start free. Upgrade when your audience grows.' },
            { key: 'discount_label', type: 'TEXT', value: 'Save 22%' },
            { key: 'payment_methods_note', type: 'TEXT', value: 'MTN MoMo · Airtel Money · Visa/Mastercard · Google Pay · Apple Pay' },
          ],
        },
        {
          key: 'final_cta',
          fields: [
            { key: 'headline', type: 'TEXT', value: 'Ready to grow your social presence?' },
            { key: 'body', type: 'TEXTAREA', value: 'Join creators and agencies managing their entire social strategy from one place. Free plan available forever.' },
            { key: 'cta_text', type: 'TEXT', value: 'Start for free — no credit card needed' },
            { key: 'cta_href', type: 'URL', value: '/signup' },
            { key: 'note', type: 'TEXT', value: 'Free plan includes 4 posts/month · 2 connected accounts · Upgrade anytime' },
            { key: 'background_color', type: 'COLOR', value: '#EEEDFE' },
          ],
        },
        {
          key: 'footer',
          fields: [
            { key: 'tagline', type: 'TEXTAREA', value: 'Post once. Reach everywhere.\nThe social media management platform built for Africa.' },
            { key: 'newsletter_title', type: 'TEXT', value: 'Stay updated' },
            { key: 'newsletter_desc', type: 'TEXTAREA', value: 'Get product updates and growth tips for social media managers in Africa.' },
            { key: 'newsletter_disclaimer', type: 'TEXT', value: 'No spam. Unsubscribe anytime.' },
          ],
        },
      ],
    },
    {
      slug: 'about', title: 'About Us',
      sections: [
        { key: 'hero', fields: [
          { key: 'headline', type: 'TEXT', value: 'Built for Africa. Used everywhere.' },
          { key: 'subtext', type: 'TEXTAREA', value: 'myManager was born from the need for affordable, reliable social media tools designed for African businesses and creators.' },
        ]},
        { key: 'story', fields: [
          { key: 'paragraphs_json', type: 'JSON', value: JSON.stringify(['We started myManager in Kampala, Uganda, because the social media management tools built for Silicon Valley didn\'t work for us. They were too expensive, didn\'t support mobile money, and ignored the platforms our audiences actually used.', 'So we built our own. myManager is designed from the ground up for the realities of doing business in Africa — affordable pricing, mobile-first design, and support for the payment methods people actually use.', 'Today, thousands of businesses, agencies, and creators across East Africa rely on myManager to manage their social media presence. From small shops in Nairobi to agencies in Lagos, we\'re helping African businesses grow.', 'Our mission is simple: make professional social media management accessible to every business on the continent.']) },
          { key: 'stats_json', type: 'JSON', value: JSON.stringify([{ number: '10', label: 'Platforms supported' }, { number: '6', label: 'Languages' }, { number: '3', label: 'African payment methods' }, { number: '24/7', label: 'Support availability' }, { number: '99.9%', label: 'Uptime SLA' }]) },
        ]},
        { key: 'values', fields: [
          { key: 'section_label', type: 'TEXT', value: 'Our values' },
          { key: 'headline', type: 'TEXT', value: 'What drives us every day' },
          { key: 'values_json', type: 'JSON', value: JSON.stringify([
            { title: 'Accessibility first', body: 'Technology should be affordable and usable for everyone, not just well-funded companies.' },
            { title: 'Local by design', body: 'We build for the realities of African markets — mobile money, low bandwidth, local languages.' },
            { title: 'Radical transparency', body: 'No hidden fees, no surprise charges. What you see is what you pay.' },
            { title: 'Relentless reliability', body: 'Your business depends on us. We take uptime and data security seriously.' },
            { title: 'Community-driven', body: 'Our roadmap is shaped by the people who use myManager every day.' },
            { title: 'Continuous improvement', body: 'We ship weekly. Every update makes the platform better for our users.' },
          ]) },
        ]},
        { key: 'team', fields: [
          { key: 'section_label', type: 'TEXT', value: 'Our team' },
          { key: 'headline', type: 'TEXT', value: 'The people behind myManager' },
          { key: 'team_json', type: 'JSON', value: JSON.stringify([
            { name: 'Daniel Mukisa', role: 'Founder & CEO', initials: 'DM', color: '#7F77DD', bio: 'Former agency owner who got tired of paying $300/month for social media tools.' },
            { name: 'Grace Akinyi', role: 'Head of Engineering', initials: 'GA', color: '#1D9E75', bio: 'Full-stack engineer with 8 years building scalable SaaS platforms.' },
            { name: 'Samuel Tesfaye', role: 'Head of Product', initials: 'ST', color: '#534AB7', bio: 'Product designer passionate about making complex tools feel simple.' },
            { name: 'Fatima Hassan', role: 'Head of Growth', initials: 'FH', color: '#E4405F', bio: 'Growth marketer who\'s helped 50+ African startups scale their social presence.' },
          ]) },
        ]},
        { key: 'mission', fields: [
          { key: 'headline', type: 'TEXT', value: 'Our mission' },
          { key: 'body', type: 'TEXTAREA', value: 'To make professional social media management accessible and affordable for every business in Africa — and eventually, the world.' },
        ]},
      ],
    },
    {
      slug: 'features', title: 'Features',
      sections: [
        { key: 'feat_hero', fields: [
          { key: 'headline_line1', type: 'TEXT', value: 'One platform.' },
          { key: 'headline_line2', type: 'TEXT', value: 'Every tool you need.' },
          { key: 'subtext', type: 'TEXTAREA', value: 'From scheduling to analytics, AI captions to client portals — everything to manage your social media in one place.' },
        ]},
        { key: 'feat_groups', fields: [
          { key: 'groups_json', type: 'JSON', value: JSON.stringify([
            { icon: 'send', title: 'Publishing & Scheduling', desc: 'Create once, publish everywhere', items: [
              { name: 'Multi-platform posting', desc: 'Publish to Facebook, Instagram, X, LinkedIn, TikTok, and Google Business from one composer.' },
              { name: 'Smart scheduling', desc: 'Schedule posts for the perfect time with AI-powered best-time suggestions.' },
              { name: 'Content calendar', desc: 'Visual drag-and-drop calendar to plan your entire content strategy.' },
              { name: 'Platform previews', desc: 'See exactly how your content will appear on each platform before hitting publish.' },
              { name: 'Bulk scheduling', desc: 'Upload a CSV to schedule weeks of content in minutes.' },
              { name: 'Recurring posts', desc: 'Set posts to automatically repeat on a schedule — daily, weekly, or monthly.' },
            ]},
            { icon: 'chart-bar', title: 'Analytics & Insights', desc: 'Understand what works', items: [
              { name: 'Unified dashboard', desc: 'All your platform metrics in one view — reach, engagement, growth.' },
              { name: 'Post-level analytics', desc: 'Deep dive into individual post performance across all platforms.' },
              { name: 'Competitor benchmarking', desc: 'Track competitor performance and find opportunities to outperform.' },
              { name: 'Best time analysis', desc: 'AI analyses your audience data to recommend optimal posting times.' },
              { name: 'Hashtag performance', desc: 'Track which hashtags drive the most reach and engagement.' },
              { name: 'Exportable reports', desc: 'Generate branded PDF reports for clients or stakeholders.' },
            ]},
            { icon: 'users', title: 'Team & Client Management', desc: 'Collaborate at scale', items: [
              { name: 'Team roles', desc: 'Owner, Admin, and Member roles with granular permissions.' },
              { name: 'Approval workflows', desc: 'Require approvals before posts go live — perfect for agencies.' },
              { name: 'Client portal', desc: 'Share a branded portal for clients to review and approve content.' },
              { name: 'Project workspaces', desc: 'Organise content by client or campaign with dedicated project spaces.' },
              { name: 'Activity feed', desc: 'See what your team is working on in real-time.' },
              { name: 'Seat management', desc: 'Add or remove team members with flexible per-seat billing.' },
            ]},
          ]) },
        ]},
        { key: 'platform_table', fields: [
          { key: 'section_label', type: 'TEXT', value: 'Supported platforms' },
          { key: 'headline', type: 'TEXT', value: 'Connect all your accounts' },
        ]},
      ],
    },
    {
      slug: 'pricing', title: 'Pricing',
      sections: [
        { key: 'pricing_hero', fields: [
          { key: 'headline_line1', type: 'TEXT', value: 'Simple pricing.' },
          { key: 'headline_line2', type: 'TEXT', value: 'No surprises.' },
          { key: 'subtext', type: 'TEXTAREA', value: 'Start free. Upgrade when your audience grows. All plans include a 14-day money-back guarantee.' },
        ]},
        { key: 'comparison', fields: [
          { key: 'section_label', type: 'TEXT', value: 'Compare plans' },
          { key: 'headline', type: 'TEXT', value: 'Find the right plan for your needs' },
          { key: 'comparison_json', type: 'JSON', value: JSON.stringify({
            categories: [
              { name: 'Publishing', rows: [
                { label: 'Posts per month', free: '4', starter: '30', pro: '200', enterprise: '500', custom: 'Unlimited' },
                { label: 'Connected accounts', free: '2', starter: '3', pro: '6', enterprise: '20', custom: 'Unlimited' },
                { label: 'Scheduling', free: false, starter: true, pro: true, enterprise: true, custom: true },
                { label: 'Platform previews', free: false, starter: true, pro: true, enterprise: true, custom: true },
                { label: 'Bulk CSV scheduling', free: false, starter: false, pro: false, enterprise: true, custom: true },
                { label: 'Recurring posts', free: false, starter: false, pro: true, enterprise: true, custom: true },
              ]},
              { name: 'Analytics', rows: [
                { label: 'Analytics retention', free: '7 days', starter: '30 days', pro: '90 days', enterprise: '365 days', custom: 'Unlimited' },
                { label: 'Best time suggestions', free: false, starter: false, pro: true, enterprise: true, custom: true },
                { label: 'Competitor benchmarking', free: false, starter: false, pro: true, enterprise: true, custom: true },
                { label: 'Exportable reports', free: false, starter: false, pro: false, enterprise: true, custom: true },
              ]},
              { name: 'Team & Clients', rows: [
                { label: 'Team seats', free: '1', starter: '1', pro: '1', enterprise: '5', custom: 'Unlimited' },
                { label: 'Approval workflows', free: false, starter: false, pro: false, enterprise: true, custom: true },
                { label: 'Client portal', free: false, starter: false, pro: false, enterprise: true, custom: true },
                { label: 'Projects', free: '0', starter: '0', pro: '0', enterprise: '10', custom: 'Unlimited' },
              ]},
              { name: 'AI & Advanced', rows: [
                { label: 'AI credits / month', free: '0', starter: '20', pro: '100', enterprise: '500', custom: 'Unlimited' },
                { label: 'API access', free: false, starter: false, pro: false, enterprise: false, custom: true },
                { label: 'White-label', free: false, starter: false, pro: false, enterprise: false, custom: true },
                { label: 'SLA guarantee', free: false, starter: false, pro: false, enterprise: false, custom: true },
              ]},
            ],
          }) },
        ]},
        { key: 'faq_ref', fields: [
          { key: 'section_label', type: 'TEXT', value: 'Frequently asked questions' },
          { key: 'headline', type: 'TEXT', value: 'Got questions? We\'ve got answers.' },
          { key: 'subtext', type: 'TEXTAREA', value: 'Can\'t find what you\'re looking for? Contact us at support@mymanager.app' },
          { key: 'faq_page', type: 'TEXT', value: 'pricing' },
        ]},
        { key: 'contact_sales', fields: [
          { key: 'headline', type: 'TEXT', value: 'Need something custom?' },
          { key: 'body', type: 'TEXTAREA', value: 'For agencies and enterprises that need unlimited access, white labelling, or a tailored plan — let\'s talk.' },
          { key: 'cta_text', type: 'TEXT', value: 'Contact sales' },
          { key: 'response_note', type: 'TEXT', value: 'We typically respond within 1 business day.' },
        ]},
      ],
    },
    {
      slug: 'blog', title: 'Blog',
      sections: [
        { key: 'blog_hero', fields: [
          { key: 'section_label', type: 'TEXT', value: 'The myManager Blog' },
          { key: 'headline', type: 'TEXT', value: 'Insights for social media managers in Africa' },
          { key: 'subtext', type: 'TEXTAREA', value: 'Tips, strategies, and product updates to help you grow your social presence.' },
        ]},
        { key: 'newsletter_widget', fields: [
          { key: 'title', type: 'TEXT', value: 'Get the latest tips' },
          { key: 'desc', type: 'TEXTAREA', value: 'Join 2,000+ social media managers getting weekly insights delivered to their inbox.' },
          { key: 'cta_text', type: 'TEXT', value: 'Subscribe — it\'s free' },
        ]},
      ],
    },
    {
      slug: 'contact', title: 'Contact',
      sections: [
        { key: 'hero', fields: [
          { key: 'headline', type: 'TEXT', value: 'Get in touch' },
          { key: 'body', type: 'TEXTAREA', value: 'Have a question, need a demo, or want to explore a custom plan? We\'d love to hear from you.' },
        ]},
      ],
    },
  ];

  for (const page of pages) {
    const cmsPage = await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: { title: page.title },
      create: { slug: page.slug, title: page.title },
    });

    for (let si = 0; si < page.sections.length; si++) {
      const s = page.sections[si];
      const section = await prisma.cmsSection.upsert({
        where: { page_id_section_key: { page_id: cmsPage.id, section_key: s.key } },
        update: { order_index: si },
        create: { page_id: cmsPage.id, section_key: s.key, order_index: si },
      });

      for (let fi = 0; fi < s.fields.length; fi++) {
        const f = s.fields[fi];
        await prisma.cmsField.upsert({
          where: { section_id_field_key: { section_id: section.id, field_key: f.key } },
          update: { value: f.value, field_type: f.type as any, order_index: fi },
          create: { section_id: section.id, field_key: f.key, field_type: f.type as any, value: f.value, order_index: fi },
        });
      }
    }
  }
  console.log('  ✓ 6 CMS pages with sections + fields');
}

// ─── Blog ─────────────────────────────────────────────────
async function seedBlog() {
  const categories = [
    { slug: 'growth', name: 'Growth', description: 'Growing your social media presence', color: '#16A34A', order_index: 0 },
    { slug: 'tips', name: 'Tips', description: 'Practical social media tips', color: '#2563EB', order_index: 1 },
    { slug: 'product', name: 'Product', description: 'myManager product updates', color: '#7F77DD', order_index: 2 },
    { slug: 'market', name: 'Market', description: 'African social media market insights', color: '#EA580C', order_index: 3 },
    { slug: 'guide', name: 'Guide', description: 'Step-by-step guides', color: '#D97706', order_index: 4 },
  ];

  for (const cat of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, color: cat.color },
      create: cat,
    });
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@mymanager.app' } });
  if (!admin) return;

  const posts = [
    {
      slug: 'east-african-brands-winning-tiktok-2026',
      title: 'How East African brands are winning on TikTok in 2026',
      excerpt: 'TikTok has exploded in East Africa. Here\'s how brands in Uganda, Kenya, and Tanzania are using it to reach millions of young consumers.',
      category: 'growth', is_featured: true, read_time_min: 6,
      body: `# How East African brands are winning on TikTok in 2026\n\nTikTok isn't just for dance challenges anymore. In East Africa, brands are discovering that TikTok is one of the most powerful tools for reaching young, engaged audiences.\n\n## The numbers speak for themselves\n\nWith over 15 million active users across Uganda, Kenya, and Tanzania, TikTok has become the fastest-growing social platform in the region. What makes it special is the engagement rate — East African TikTok content consistently sees 3-5x the engagement of the same content on Instagram or Facebook.\n\n## What's working\n\n### 1. Local language content\nBrands that create content in Swahili, Luganda, or Sheng are seeing significantly higher engagement. Safaricom's M-PESA campaigns in Sheng regularly hit millions of views.\n\n### 2. Behind-the-scenes content\nEast African audiences love authenticity. Brands showing their manufacturing process, team culture, or daily operations consistently outperform polished ads.\n\n### 3. Collaborations with local creators\nMicro-influencers with 10,000-50,000 followers in Kampala, Nairobi, and Dar es Salaam often deliver better ROI than big-name celebrities.\n\n## Getting started\n\nIf your brand isn't on TikTok yet, 2026 is the year to start. With myManager, you can schedule TikTok content alongside all your other platforms — saving time while reaching a massive new audience.\n\nThe brands that win on TikTok in East Africa share three things: they're authentic, they speak the local language, and they post consistently. Start with those three principles and you'll be ahead of 90% of your competition.`,
    },
    {
      slug: '3-platform-strategy-small-business',
      title: 'The 3-platform strategy: why less is more for small businesses',
      excerpt: 'You don\'t need to be on every platform. Here\'s why focusing on just three social networks can actually grow your business faster.',
      category: 'tips', is_featured: false, read_time_min: 5,
      body: `# The 3-platform strategy: why less is more for small businesses\n\nOne of the biggest mistakes small businesses make is trying to be everywhere at once. You don't need 10 social media accounts. You need three that actually work.\n\n## Why three platforms?\n\nMost small businesses have limited time and resources. Trying to maintain a presence on every platform leads to mediocre content everywhere instead of great content somewhere.\n\nThe 3-platform strategy is simple: pick three platforms, master them, and ignore the rest.\n\n## How to choose your three\n\n### Step 1: Where is your audience?\nFor B2B in Africa, LinkedIn and Facebook are usually essential. For B2C targeting under-25s, TikTok and Instagram are non-negotiable.\n\n### Step 2: What content can you create?\nIf you can't create video content consistently, TikTok might not be your best bet yet. If you're great at photography, Instagram should be in your top three.\n\n### Step 3: What drives revenue?\nTrack which platforms actually send traffic and convert customers. For many African businesses, Facebook Groups and WhatsApp Business are the biggest drivers.\n\n## The execution\n\nOnce you've picked your three, commit to posting at least 3-4 times per week on each. Use a tool like myManager to batch-create content and schedule it in advance.\n\nConsistency on three platforms will always beat sporadic posting on ten. Start focused, and expand only when you've truly mastered your core three.`,
    },
    {
      slug: 'mymanager-google-business-profile',
      title: 'myManager now supports Google Business Profile',
      excerpt: 'Great news — you can now manage your Google Business Profile posts directly from myManager, alongside all your other social platforms.',
      category: 'product', is_featured: false, read_time_min: 3,
      body: `# myManager now supports Google Business Profile\n\nWe're excited to announce that Google Business Profile is now fully supported in myManager. This means you can create, schedule, and manage GBP posts alongside all your other social media content.\n\n## Why Google Business Profile matters\n\nFor local businesses in Africa, Google Business Profile is one of the most underutilized marketing tools. When someone searches for "restaurant near me" or "hair salon Kampala," your GBP listing is often the first thing they see.\n\nRegular posts on your GBP listing can:\n- Improve your local search ranking\n- Showcase products, events, and offers\n- Drive foot traffic to your physical location\n- Build trust with potential customers\n\n## What you can do in myManager\n\n- **Create GBP posts** with images, CTAs, and event details\n- **Schedule posts** alongside your other platforms\n- **Preview** how your post will appear in Google Search results\n- **Track performance** with basic analytics\n\n## Getting started\n\nConnect your Google Business Profile from Settings → Connected Accounts. You'll need to authorize myManager with your Google account. Once connected, GBP will appear as an option in the post composer.\n\nThis feature is available on all plans, including Free. If you have a physical business location, we strongly recommend connecting your GBP today.`,
    },
    {
      slug: 'social-media-uganda-2026',
      title: 'Social media in Uganda 2026: platforms, data, and what agencies need to know',
      excerpt: 'A comprehensive look at Uganda\'s social media landscape in 2026 — platform usage, demographics, and opportunities for agencies.',
      category: 'market', is_featured: false, read_time_min: 8,
      body: `# Social media in Uganda 2026: platforms, data, and what agencies need to know\n\nUganda's social media landscape is evolving rapidly. With smartphone penetration crossing 45% and mobile data costs continuing to drop, more Ugandans are online than ever before. Here's what agencies and businesses need to know.\n\n## Platform usage breakdown\n\n### Facebook — Still the king\nFacebook remains Uganda's most-used social platform with an estimated 8 million active users. It's the primary platform for news, community groups, and business pages. For agencies, Facebook is still where the money is.\n\n### WhatsApp — The business backbone\nWith over 12 million users, WhatsApp isn't just a messaging app — it's how Uganda does business. WhatsApp Business adoption has tripled since 2024.\n\n### TikTok — The growth story\nTikTok has grown from 2 million to an estimated 5 million Ugandan users in just 18 months. The under-25 demographic spends more time on TikTok than any other platform.\n\n### Instagram — Premium positioning\nInstagram's 3 million users skew urban and higher-income. It's the go-to platform for lifestyle brands, fashion, and food businesses.\n\n### LinkedIn — The professional network\nLinkedIn has crossed 1.5 million Ugandan users, driven by the country's growing tech ecosystem.\n\n## Key trends for 2026\n\n1. **Short-form video dominance** — TikTok and Instagram Reels are driving content strategy decisions.\n2. **Mobile money integration** — Social commerce powered by MTN MoMo and Airtel Money is growing fast.\n3. **Local language content** — Luganda, Runyankole, and Swahili content is outperforming English-only posts.\n4. **Agency consolidation** — Clients want one agency for all platforms, not separate specialists.\n\n## Opportunities for agencies\n\nThe biggest opportunity is in the mid-market. Small and medium businesses are ready to invest in social media but can't afford enterprise-level agencies. Tools like myManager make it possible to serve more clients efficiently.`,
    },
    {
      slug: 'captions-that-convert-ecommerce-guide',
      title: 'How to write captions that convert: East African e-commerce guide',
      excerpt: 'Stop writing boring captions. Here\'s a practical framework for writing social media captions that actually drive sales for e-commerce businesses in East Africa.',
      category: 'guide', is_featured: false, read_time_min: 7,
      body: `# How to write captions that convert: East African e-commerce guide\n\nYour product photos are great. Your prices are competitive. But your captions? They might be the reason people scroll right past your posts.\n\nHere's a framework for writing captions that actually drive sales, specifically tailored for e-commerce businesses in East Africa.\n\n## The AIDA framework for social media\n\n### Attention\nYour first line needs to stop the scroll. Questions, bold statements, or surprising facts work best.\n\n**Example:** "This bag was made by a single mother in Katwe. Here's her story."\n\n### Interest\nConnect your product to a problem your audience has or a desire they hold.\n\n**Example:** "Tired of bags that fall apart after two months? Our leather bags are hand-stitched to last years."\n\n### Desire\nShow the benefit, not just the feature. Use social proof when possible.\n\n**Example:** "Over 500 women in Kampala carry this bag daily. It fits a laptop, a lunch box, and still looks professional."\n\n### Action\nTell people exactly what to do next. Be specific.\n\n**Example:** "DM us 'LEATHER' to order. Free delivery in Kampala. MTN MoMo accepted."\n\n## Platform-specific tips\n\n### Facebook\nLonger captions work well. Include pricing, payment methods (MoMo, Airtel Money), and delivery info directly in the caption.\n\n### Instagram\nFront-load the important info. Use line breaks for readability. Put hashtags in the first comment.\n\n### TikTok\nKeep caption short — the video should do the selling. Use trending sounds and local music.\n\n## Common mistakes\n\n1. **Not including prices** — East African consumers want to know the price upfront.\n2. **English only** — If your audience speaks Swahili or Luganda, write in their language.\n3. **No call to action** — Every post should tell people what to do next.\n4. **Ignoring DMs** — If you ask people to DM you, respond within 30 minutes.\n\nUse myManager's AI caption generator to create platform-optimized captions in seconds. It even supports Swahili and French, so you can reach audiences across East and West Africa.`,
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: { title: post.title, excerpt: post.excerpt, body: post.body },
      create: {
        ...post,
        author_id: admin.id,
        is_published: true,
        published_at: new Date(Date.now() - Math.random() * 30 * 86400000),
        tags: [],
      },
    });
  }

  // Update blog category post counts
  for (const cat of categories) {
    const count = await prisma.blogPost.count({ where: { category: cat.slug, is_published: true } });
    await prisma.blogCategory.update({ where: { slug: cat.slug }, data: { post_count: count } });
  }

  console.log('  ✓ 5 blog categories + 5 blog posts');
}

// ─── FAQ ──────────────────────────────────────────────────
async function seedFaq() {
  const items = [
    { question: 'Can I pay with MTN MoMo or Airtel Money?', answer: 'Yes! We accept MTN Mobile Money, Airtel Money, Visa, Mastercard, Google Pay, and Apple Pay. You can choose your preferred payment method during checkout. Mobile money payments are processed securely through Flutterwave.', order_index: 0 },
    { question: 'What happens when I hit my post limit?', answer: 'When you reach your monthly post limit, you can still create drafts but won\'t be able to publish or schedule new posts until the next billing cycle. You can upgrade your plan at any time to get more posts — the upgrade takes effect immediately and you\'ll be charged a prorated amount.', order_index: 1 },
    { question: 'Can I cancel my subscription anytime?', answer: 'Yes, you can cancel your subscription at any time from Settings → Billing. When you cancel, you\'ll continue to have access to your current plan until the end of your billing period. Your data and connected accounts are preserved for 30 days after cancellation.', order_index: 2 },
    { question: 'Is there a free trial for paid plans?', answer: 'We don\'t offer traditional free trials, but our Free plan is available forever with no credit card required. This lets you try the core features before deciding to upgrade. All paid plans also come with a 14-day money-back guarantee.', order_index: 3 },
    { question: 'What is included in the Custom plan?', answer: 'The Custom plan is designed for agencies and enterprises with specific needs. It includes unlimited posts, unlimited connected accounts, unlimited team seats, white-label reports, API access, dedicated support, and a custom SLA. Contact our sales team to discuss your requirements.', order_index: 4 },
    { question: 'Do you offer discounts for NGOs or schools?', answer: 'Yes! We offer 50% off any paid plan for registered NGOs, educational institutions, and non-profit organisations. Contact us at sales@mymanager.app with proof of your organisation\'s status and we\'ll set up your discounted account within 24 hours.', order_index: 5 },
  ];

  for (const item of items) {
    const existing = await prisma.faqItem.findFirst({ where: { question: item.question } });
    if (existing) {
      await prisma.faqItem.update({
        where: { id: existing.id },
        data: { answer: item.answer, order_index: item.order_index, page: 'pricing', category: 'general', is_visible: true },
      });
    } else {
      await prisma.faqItem.create({ data: { ...item, page: 'pricing', category: 'general' } });
    }
  }
  console.log('  ✓ 6 FAQ items');
}

// ─── Testimonials ─────────────────────────────────────────
async function seedTestimonials() {
  const testimonials = [
    {
      author_name: 'Sarah Kamau', author_role: 'Social Media Manager', author_initials: 'SK',
      author_avatar_color: '#7F77DD', company: 'Tusker Brewery', placement: 'login',
      quote: 'myManager cut our content scheduling time in half. We manage 6 platforms for 3 brands and it just works. The MTN MoMo payment option was a game-changer for our Kampala office.',
      order_index: 0,
    },
    {
      author_name: 'Kwame Asante', author_role: 'Agency Owner', author_initials: 'KA',
      author_avatar_color: '#1D9E75', company: 'Accra Digital', placement: 'signup',
      quote: 'We switched from Hootsuite to myManager and haven\'t looked back. The client portal alone saves us 5 hours per week per client. And the pricing is actually fair for African agencies.',
      order_index: 1,
    },
    {
      author_name: 'Fatima Diallo', author_role: 'E-commerce Founder', author_initials: 'FD',
      author_avatar_color: '#EA580C', company: 'Dakar Fashion House', placement: 'pricing',
      quote: 'As a solo founder, I needed something affordable that could handle Instagram, TikTok, and Facebook. myManager\'s free plan let me start immediately, and the AI captions feature in French is incredible.',
      order_index: 2,
    },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { author_name: t.author_name } });
    if (existing) {
      await prisma.testimonial.update({
        where: { id: existing.id },
        data: {
          author_role: t.author_role, author_initials: t.author_initials,
          author_avatar_color: t.author_avatar_color, company: t.company,
          placement: t.placement, quote: t.quote, order_index: t.order_index,
        },
      });
    } else {
      await prisma.testimonial.create({ data: t });
    }
  }
  console.log('  ✓ 3 testimonials');
}

// ─── Nav Links ────────────────────────────────────────────
async function seedNavLinks() {
  // Clear existing and recreate for idempotency
  await prisma.navLink.deleteMany();

  const links = [
    // Main nav
    { label: 'Features', href: '/features', placement: 'main_nav', order_index: 0 },
    { label: 'Pricing', href: '/pricing', placement: 'main_nav', order_index: 1 },
    { label: 'About', href: '/about', placement: 'main_nav', order_index: 2 },
    { label: 'Blog', href: '/blog', placement: 'main_nav', order_index: 3 },
    // Footer - Product
    { label: 'Features', href: '/features', placement: 'footer_product', order_index: 0 },
    { label: 'Pricing', href: '/pricing', placement: 'footer_product', order_index: 1 },
    { label: 'Changelog', href: '/changelog', placement: 'footer_product', order_index: 2 },
    { label: 'Roadmap', href: '/roadmap', placement: 'footer_product', order_index: 3 },
    { label: 'API docs', href: '/docs', placement: 'footer_product', order_index: 4 },
    // Footer - Company
    { label: 'About us', href: '/about', placement: 'footer_company', order_index: 0 },
    { label: 'Blog', href: '/blog', placement: 'footer_company', order_index: 1 },
    { label: 'Contact', href: '/contact', placement: 'footer_company', order_index: 2 },
    { label: 'Privacy policy', href: '/legal/privacy', placement: 'footer_company', order_index: 3 },
    { label: 'Terms of service', href: '/legal/terms', placement: 'footer_company', order_index: 4 },
  ];

  await prisma.navLink.createMany({ data: links });
  console.log('  ✓ 14 nav links');
}

// ─── Run ──────────────────────────────────────────────────
main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
