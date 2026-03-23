import type { Metadata } from 'next';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getCmsPage(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/pages/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getPlatforms() {
  try {
    const res = await fetch(`${API_URL}/api/v1/platforms`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
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

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2', instagram: '#E4405F', tiktok: '#010101',
  linkedin: '#0A66C2', x: '#000000', twitter: '#000000',
  pinterest: '#E60023', youtube: '#FF0000', whatsapp: '#25D366',
  threads: '#000000', gbp: '#4285F4',
};

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
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-12 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
          {hero.label || 'Features'}
        </p>
        <h1 className="mt-2 text-[42px] font-extrabold leading-tight lg:text-[46px]">
          {hero.headline || 'Everything You Need to Manage Social Media'}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-text-2">
          {hero.subtext || 'Powerful tools for publishing, analytics, collaboration, and engagement.'}
        </p>
      </section>

      {/* ── FEATURE GROUPS ── */}
      {groups.map((group, gi) => (
        <section key={group.title} className={gi % 2 === 0 ? 'bg-white py-16' : 'bg-bg-2 py-16'}>
          <div className="mx-auto max-w-5xl px-5">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-primary">
              {group.title}
            </h2>
            {group.description && (
              <p className="mt-2 text-[15px] text-text-2">{group.description}</p>
            )}
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {group.features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-card border border-border bg-white p-6 transition hover:border-primary hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-icon bg-primary-light">
                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-[14px] font-bold text-text">{feature.title}</h3>
                  <p className="mt-1 text-[13px] text-text-2">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── PLATFORM TABLE ── */}
      {platforms.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-5xl px-5">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                Supported Platforms
              </p>
              <h2 className="mt-2 text-[28px] font-bold text-text">
                {hero.platforms_headline || 'Works with all major platforms'}
              </h2>
            </div>
            <div className="mt-10 overflow-x-auto rounded-card border border-border">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-border bg-bg-2">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-text">Platform</th>
                    <th className="px-5 py-3 font-semibold text-text">Scheduling</th>
                    <th className="px-5 py-3 font-semibold text-text">Analytics</th>
                    <th className="px-5 py-3 font-semibold text-text">Inbox</th>
                  </tr>
                </thead>
                <tbody>
                  {platforms.map((p: any) => (
                    <tr key={p.id || p.slug} className="border-b border-border last:border-0">
                      <td className="flex items-center gap-2 px-5 py-3 font-medium text-text">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: PLATFORM_COLORS[(p.slug || p.name || '').toLowerCase()] || 'var(--color-primary)' }}
                        />
                        {p.name}
                      </td>
                      <td className="px-5 py-3 text-text-2">{p.supports_scheduling !== false ? 'Yes' : '—'}</td>
                      <td className="px-5 py-3 text-text-2">{p.supports_analytics !== false ? 'Yes' : '—'}</td>
                      <td className="px-5 py-3 text-text-2">{p.supports_inbox ? 'Yes' : '—'}</td>
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
