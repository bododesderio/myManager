import type { Metadata } from 'next';
import { fetchServerApi } from '@/lib/api/server';

async function getCmsPage(slug: string) {
  return fetchServerApi(`/api/v1/cms/pages/${slug}`, null, { label: `cms page:${slug}` });
}

async function getPlatforms() {
  return fetchServerApi('/api/v1/platforms', [], { label: 'features page platforms' });
}

function getFields(page: any, sectionKey: string): Record<string, string> {
  const section = page?.sections?.find((s: any) => s.section_key === sectionKey);
  if (!section) return {};
  const fields: Record<string, string> = {};
  for (const f of section.fields || []) fields[f.field_key] = f.value;
  return fields;
}

function safeParse(json: string | undefined, fallback: any[] = []) {
  if (!json) return fallback;
  try { return JSON.parse(json); } catch { return fallback; }
}

interface FeatureGroup {
  title: string;
  description?: string;
  features: { title: string; description: string }[];
}

const FALLBACK_GROUPS: FeatureGroup[] = [
  {
    title: 'Publishing',
    features: [
      { title: 'Multi-Platform Scheduling', description: 'Schedule and publish to 10+ social networks from a single composer.' },
      { title: 'Visual Content Calendar', description: 'Drag-and-drop calendar with campaign overlays and time slot management.' },
      { title: 'Bulk Scheduling', description: 'Upload CSV files or use templates to schedule hundreds of posts at once.' },
    ],
  },
  {
    title: 'Analytics',
    features: [
      { title: 'Cross-Platform Analytics', description: 'Unified metrics across all connected accounts with engagement tracking.' },
      { title: 'Custom Reports', description: 'Build branded PDF reports with drag-and-drop widgets and automated delivery.' },
      { title: 'Hashtag Analytics', description: 'Track hashtag performance and discover trending tags for your niche.' },
    ],
  },
  {
    title: 'Collaboration',
    features: [
      { title: 'Team Workspaces', description: 'Role-based access with content approval workflows and inline comments.' },
      { title: 'Client Portals', description: 'Share content calendars with clients for review and approval without login.' },
    ],
  },
];

const GROUP_THEMES = [
  { icon: 'text-primary', iconBg: 'bg-[var(--color-primary-light)]', accent: 'hover:border-primary' },
  { icon: 'text-[var(--color-secondary)]', iconBg: 'bg-[var(--color-secondary-light)]', accent: 'hover:border-[var(--color-secondary)]' },
  { icon: 'text-[var(--color-tertiary)]', iconBg: 'bg-[var(--color-tertiary-light)]', accent: 'hover:border-[var(--color-tertiary)]' },
  { icon: 'text-[var(--color-accent)]', iconBg: 'bg-[var(--color-accent-light)]', accent: 'hover:border-[var(--color-accent)]' },
];

const GROUP_ICONS = [
  'M13 10V3L4 14h7v7l9-11h-7z',
  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('features');
  const hero = getFields(page, 'feat_hero');
  return {
    title: hero.meta_title || 'Features — myManager',
    description: hero.meta_description || 'Explore all the features that make myManager the best social media management tool.',
  };
}

export default async function FeaturesPage() {
  const [page, platforms] = await Promise.all([
    getCmsPage('features'),
    getPlatforms(),
  ]);

  const hero = getFields(page, 'feat_hero');
  const groupsSection = getFields(page, 'feat_groups');
  const groups: FeatureGroup[] = safeParse(groupsSection.groups_json, FALLBACK_GROUPS);

  return (
    <main className="min-h-screen bg-bg font-body text-text">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="pattern-dots absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-12 text-center">
          <p className="animate-fade-in-up text-[11px] font-bold uppercase tracking-wide text-primary">
            {hero.label || 'Features'}
          </p>
          <h1 className="animate-fade-in-up delay-100 mt-2 text-[42px] font-extrabold leading-tight lg:text-[46px]">
            {hero.headline || 'Everything You Need to Manage Social Media'}
          </h1>
          <p className="animate-fade-in-up delay-200 mx-auto mt-4 max-w-xl text-[15px] text-text-2">
            {hero.subtext || 'Powerful tools for publishing, analytics, collaboration, and engagement.'}
          </p>
        </div>
      </section>

      {/* ── FEATURE GROUPS ── */}
      {groups.map((group, gi) => {
        const theme = GROUP_THEMES[gi % GROUP_THEMES.length];
        const isAlt = gi % 2 !== 0;
        return (
          <section key={group.title} className={isAlt ? 'bg-[var(--color-bg-2)] py-16' : 'bg-white py-16'}>
            <div className="mx-auto max-w-5xl px-5">
              <h2 className="animate-fade-in-up text-[11px] font-bold uppercase tracking-wide text-primary">
                {group.title}
              </h2>
              {group.description && (
                <p className="animate-fade-in-up delay-100 mt-2 text-[15px] text-text-2">{group.description}</p>
              )}
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {group.features.map((feature, fi) => (
                  <div
                    key={feature.title}
                    className={`animate-fade-in-up card-hover rounded-card border border-border bg-white p-6 ${theme.accent} ${['', 'delay-100', 'delay-200'][fi] || ''}`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-icon ${theme.iconBg}`}>
                      <svg className={`h-5 w-5 ${theme.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={GROUP_ICONS[gi % GROUP_ICONS.length]} />
                      </svg>
                    </div>
                    <h3 className="mt-3 text-[14px] font-bold text-text">{feature.title}</h3>
                    <p className="mt-1 text-[13px] text-text-2">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* ── PLATFORM TABLE ── */}
      {platforms.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-5xl px-5">
            <div className="animate-fade-in-up text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                Supported Platforms
              </p>
              <h2 className="mt-2 text-[28px] font-bold text-text">
                {hero.platforms_headline || 'Works with all major platforms'}
              </h2>
            </div>
            <div className="animate-fade-in-up delay-200 mt-10 overflow-x-auto rounded-card border border-border shadow-[var(--shadow-card)]">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-border bg-[var(--color-bg-2)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-text">Platform</th>
                    <th className="px-5 py-3 font-semibold text-text">Scheduling</th>
                    <th className="px-5 py-3 font-semibold text-text">Analytics</th>
                    <th className="px-5 py-3 font-semibold text-text">Inbox</th>
                  </tr>
                </thead>
                <tbody>
                  {platforms.map((p: any) => (
                    <tr key={p.id || p.slug} className="border-b border-border transition-colors last:border-0 hover:bg-[var(--color-bg-2)]">
                      <td className="flex items-center gap-2 px-5 py-3 font-medium text-text">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {p.name}
                      </td>
                      <td className="px-5 py-3 text-text-2">{p.supports_scheduling !== false ? '✓' : '—'}</td>
                      <td className="px-5 py-3 text-text-2">{p.supports_analytics !== false ? '✓' : '—'}</td>
                      <td className="px-5 py-3 text-text-2">{p.supports_inbox ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
