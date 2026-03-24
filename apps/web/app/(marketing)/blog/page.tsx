import Link from 'next/link';
import type { Metadata } from 'next';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getCmsPage(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/pages/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch { return null; }
}

async function getBlogPosts(params: string = 'page=1&limit=5') {
  try {
    const res = await fetch(`${API_URL}/api/v1/blog?${params}`, { next: { revalidate: 300 } });
    if (!res.ok) return { posts: [], total: 0 };
    const json = await res.json();
    const data = json?.data ?? json;
    return { posts: data.posts || data || [], total: data.total || 0 };
  } catch { return { posts: [], total: 0 }; }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/api/v1/blog/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? json;
  } catch { return []; }
}

async function getFeaturedPost() {
  try {
    const res = await fetch(`${API_URL}/api/v1/blog?is_featured=true&limit=1`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    const posts = data.posts || data || [];
    return posts[0] || null;
  } catch { return null; }
}

async function getPopularPosts() {
  try {
    const res = await fetch(`${API_URL}/api/v1/blog?sort=views&limit=4`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    return data.posts || data || [];
  } catch { return []; }
}

function getFields(page: any, sectionKey: string): Record<string, string> {
  const section = page?.sections?.find((s: any) => s.section_key === sectionKey);
  if (!section) return {};
  const fields: Record<string, string> = {};
  for (const f of section.fields || []) fields[f.field_key] = f.value;
  return fields;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('blog');
  const hero = getFields(page, 'blog_hero');
  return {
    title: hero.meta_title || 'Blog — myManager',
    description: hero.meta_description || 'Tips, guides, and insights on social media management.',
  };
}

export default async function BlogPage() {
  const [page, { posts }, categories, featuredPost, popularPosts] = await Promise.all([
    getCmsPage('blog'),
    getBlogPosts('page=1&limit=5'),
    getCategories(),
    getFeaturedPost(),
    getPopularPosts(),
  ]);

  const hero = getFields(page, 'blog_hero');

  return (
    <main className="min-h-screen bg-bg font-body text-text">
      {/* ── HERO ── */}
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-12 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
          {hero.label || 'Blog'}
        </p>
        <h1 className="mt-2 text-[42px] font-extrabold leading-tight lg:text-[46px]">
          {hero.headline || 'Blog'}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-text-2">
          {hero.subtext || 'Tips, guides, and insights on social media management.'}
        </p>
      </section>

      {/* ── CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat: any) => (
              <span
                key={cat.id || cat.slug || cat.name}
                className="rounded-full border border-border bg-white px-4 py-1.5 text-[12px] font-medium text-text-2 transition hover:border-primary hover:text-primary"
              >
                {cat.name || cat}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* ── MAIN COLUMN ── */}
          <div>
            {/* Featured Post */}
            {featuredPost && (
              <article className="mb-10 rounded-card border border-primary bg-primary-light p-6">
                <span className="inline-block rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase text-white">
                  Featured
                </span>
                <h2 className="mt-3 text-[22px] font-bold text-text">
                  <Link href={`/blog/${featuredPost.slug}`} className="hover:text-primary">
                    {featuredPost.title}
                  </Link>
                </h2>
                {featuredPost.excerpt && (
                  <p className="mt-2 text-[14px] text-text-2">{featuredPost.excerpt}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-[12px] text-text-muted">
                  {featuredPost.category && <span>{featuredPost.category}</span>}
                  {featuredPost.published_at && (
                    <>
                      <span>&middot;</span>
                      <time dateTime={featuredPost.published_at}>{formatDate(featuredPost.published_at)}</time>
                    </>
                  )}
                </div>
              </article>
            )}

            {/* Post List */}
            <div className="space-y-6">
              {posts.map((post: any) => (
                <article
                  key={post.slug || post.id}
                  className="rounded-card border border-border bg-white p-6 transition hover:border-primary"
                >
                  <div className="flex items-center gap-3 text-[12px] text-text-muted">
                    {post.category && (
                      <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary">
                        {post.category}
                      </span>
                    )}
                    {(post.published_at || post.date) && (
                      <time dateTime={post.published_at || post.date}>
                        {formatDate(post.published_at || post.date)}
                      </time>
                    )}
                  </div>
                  <h2 className="mt-3 text-[18px] font-bold text-text">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-[14px] text-text-2">{post.excerpt}</p>
                  )}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-3 inline-block text-[13px] font-semibold text-primary hover:underline"
                  >
                    Read More &rarr;
                  </Link>
                </article>
              ))}

              {posts.length === 0 && (
                <p className="text-center text-[14px] text-text-muted">No posts yet. Check back soon!</p>
              )}
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="space-y-8">
            {/* Popular Posts */}
            {popularPosts.length > 0 && (
              <div className="rounded-card border border-border bg-white p-5">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-text">Popular Posts</h3>
                <div className="mt-4 space-y-4">
                  {popularPosts.map((post: any) => (
                    <div key={post.slug || post.id}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-[14px] font-semibold text-text hover:text-primary"
                      >
                        {post.title}
                      </Link>
                      {(post.published_at || post.date) && (
                        <p className="mt-0.5 text-[11px] text-text-muted">
                          {formatDate(post.published_at || post.date)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Sidebar */}
            {categories.length > 0 && (
              <div className="rounded-card border border-border bg-white p-5">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-text">Categories</h3>
                <div className="mt-4 space-y-2">
                  {categories.map((cat: any) => (
                    <div
                      key={cat.id || cat.slug || cat.name}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <span className="text-text-2">{cat.name || cat}</span>
                      {cat.count != null && (
                        <span className="text-[11px] text-text-muted">{cat.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
