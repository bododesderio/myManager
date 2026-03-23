import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { Metadata } from 'next';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getCmsPage(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/pages/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
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

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('about');
  const hero = getFields(page, 'hero');
  return {
    title: hero.meta_title || 'About — myManager',
    description: hero.meta_description || 'Learn about the team and mission behind myManager.',
  };
}

export default async function AboutPage() {
  const page = await getCmsPage('about');

  const hero = getFields(page, 'hero');
  const story = getFields(page, 'story');
  const values = getFields(page, 'values');
  const team = getFields(page, 'team');
  const mission = getFields(page, 'mission');

  const valuesList: { title: string; description: string }[] = safeParse(values.values_json, [
    { title: 'Simplicity', description: 'Powerful features with an intuitive interface.' },
    { title: 'Transparency', description: 'Honest pricing, open communication, no surprises.' },
    { title: 'Reliability', description: 'Your posts go out on time, every time.' },
  ]);
  const teamMembers: { name: string; role: string; avatar?: string }[] = safeParse(team.team_json);
  const stats: { value: string; label: string }[] = safeParse(hero.stats_json);

  return (
    <main className="min-h-screen bg-bg font-body text-text">
      {/* ── HERO ── */}
      <section className="mx-auto max-w-4xl px-5 pt-16 pb-12 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
          {hero.label || 'About Us'}
        </p>
        <h1 className="mt-2 text-[42px] font-extrabold leading-tight lg:text-[46px]">
          {hero.headline || 'About myManager'}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-text-2">
          {hero.subtext || 'Learn about the team and mission behind myManager.'}
        </p>
      </section>

      {/* ── STATS ── */}
      {stats.length > 0 && (
        <section className="bg-stats-bg py-12 text-stats-text">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 text-center lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-[34px] font-extrabold">{s.value}</p>
                <p className="text-[12px] opacity-65">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── STORY ── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl space-y-6 px-5 text-[15px] leading-relaxed text-text-2">
          {story.label && (
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
              {story.label}
            </p>
          )}
          {story.headline && (
            <h2 className="text-[28px] font-bold text-text">{story.headline}</h2>
          )}
          <p>
            {story.body_1 || 'myManager was built to simplify social media management for businesses of all sizes. We believe that managing your online presence should not require juggling dozens of tools.'}
          </p>
          {story.body_2 && <p>{story.body_2}</p>}
          {!story.body_2 && !story.body_1 && (
            <p>
              Our platform brings together publishing, analytics, collaboration, and engagement into a
              single, powerful dashboard. Whether you are a solo creator or a large agency managing
              hundreds of accounts, myManager scales with your needs.
            </p>
          )}
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="bg-bg-2 py-16">
        <div className="mx-auto max-w-4xl px-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
            {mission.label || 'Our Mission'}
          </p>
          <h2 className="mt-2 text-[28px] font-bold text-text">
            {mission.headline || 'Our Mission'}
          </h2>
          <p className="mt-4 text-[15px] text-text-2">
            {mission.body || 'To empower businesses and creators to build meaningful connections with their audience through efficient, data-driven social media management.'}
          </p>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
              {values.label || 'Our Values'}
            </p>
            <h2 className="mt-2 text-[28px] font-bold text-text">
              {values.headline || 'Our Values'}
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {valuesList.map((value) => (
              <div key={value.title} className="rounded-card border border-border bg-white p-6 transition hover:border-primary">
                <h3 className="text-[14px] font-bold text-primary">
                  {value.title}
                </h3>
                <p className="mt-2 text-[13px] text-text-2">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      {teamMembers.length > 0 && (
        <section className="bg-bg-2 py-16">
          <div className="mx-auto max-w-5xl px-5">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                {team.label || 'The Team'}
              </p>
              <h2 className="mt-2 text-[28px] font-bold text-text">
                {team.headline || 'Meet the Team'}
              </h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member) => (
                <div key={member.name} className="rounded-card border border-border bg-white p-5 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-[20px] font-bold text-primary">
                    {member.avatar ? (
                      <Image src={member.avatar} alt={member.name} width={64} height={64} className="h-16 w-16 rounded-full object-cover" unoptimized />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </div>
                  <h3 className="mt-3 text-[14px] font-bold text-text">{member.name}</h3>
                  <p className="text-[12px] text-text-2">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
