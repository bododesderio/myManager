import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchServerApi } from '@/lib/api/server';

async function getCmsPage(slug: string) {
  return fetchServerApi(`/api/v1/cms/pages/${slug}`, null, { label: `cms page:${slug}` });
}

async function getBlogPosts(params: string = 'page=1&limit=5') {
  const data = await fetchServerApi<any>(`/api/v1/blog?${params}`, null, { label: `blog posts:${params}` });
  return { posts: data?.posts || data || [], total: data?.total || 0 };
}

async function getCategories() {
  return fetchServerApi('/api/v1/blog/categories', [], { label: 'blog categories' });
}

async function getFeaturedPost() {
  const data = await fetchServerApi<any>('/api/v1/blog?is_featured=true&limit=1', null, { label: 'featured blog post' });
  const posts = data?.posts || data || [];
  return posts[0] || null;
}

async function getPopularPosts() {
  const data = await fetchServerApi<any>('/api/v1/blog?sort=views&limit=4', null, { label: 'popular blog posts' });
  return data?.posts || data || [];
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
  const [page, blogData, rawCategories, featuredPost, rawPopularPosts] = await Promise.all([
    getCmsPage('blog'),
    getBlogPosts('page=1&limit=5'),
    getCategories(),
    getFeaturedPost(),
    getPopularPosts(),
  ]);

  const posts = blogData?.posts ?? [];
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const popularPosts = Array.isArray(rawPopularPosts) ? rawPopularPosts : [];
  const hero = getFields(page, 'blog_hero');

  return (
    <main className="min-h-screen bg-bg font-body text-text">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="pattern-dots absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-12 text-center">
          <p className="animate-fade-in-up text-[11px] font-bold uppercase tracking-wide text-primary">
            {hero.label || 'Blog'}
          </p>
          <h1 className="animate-fade-in-up delay-100 mt-2 text-[42px] font-extrabold leading-tight lg:text-[46px]">
            {hero.headline || 'Blog'}
          </h1>
          <p className="animate-fade-in-up delay-200 mx-auto mt-4 max-w-xl text-[15px] text-text-2">
            {hero.subtext || 'Tips, guides, and insights on social media management.'}
          </p>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-8 pt-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat: any) => (
              <span
                key={cat.id || cat.slug || cat.name}
                className="card-hover cursor-pointer rounded-full border border-border bg-white px-4 py-1.5 text-[12px] font-medium text-text-2 hover:border-primary hover:text-primary"
              >
                {cat.category || cat.name || String(cat)}
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
              <article className="animate-fade-in-up mb-10 overflow-hidden rounded-card border border-primary bg-gradient-to-br from-[var(--color-primary-light)] to-white p-6 shadow-[var(--shadow-card)]">
                <span className="inline-block rounded-full bg-gradient-to-r from-primary to-[var(--color-primary-dark)] px-3 py-0.5 text-[10px] font-bold uppercase text-white">
                  Featured
                </span>
                <h2 className="mt-3 text-[22px] font-bold text-text">
                  <Link href={`/blog/${featuredPost.slug}`} className="transition-colors hover:text-primary">
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
              {posts.map((post: any, i: number) => (
                <article
                  key={post.slug || post.id}
                  className={`animate-fade-in-up card-hover rounded-card border border-border bg-white p-6 ${['', 'delay-100', 'delay-200', 'delay-300', 'delay-400'][i] || ''}`}
                >
                  <div className="flex items-center gap-3 text-[12px] text-text-muted">
                    {post.category && (
                      <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[11px] font-medium text-primary">
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
                    <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-primary">
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
          <aside className="animate-fade-in-up delay-300 space-y-8">
            {popularPosts.length > 0 && (
              <div className="rounded-card border border-border bg-white p-5 shadow-[var(--shadow-card)]">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-text">Popular Posts</h3>
                <div className="mt-4 space-y-4">
                  {popularPosts.map((post: any) => (
                    <div key={post.slug || post.id}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-[14px] font-semibold text-text transition-colors hover:text-primary"
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

            {categories.length > 0 && (
              <div className="rounded-card border border-border bg-white p-5 shadow-[var(--shadow-card)]">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-text">Categories</h3>
                <div className="mt-4 space-y-2">
                  {categories.map((cat: any) => (
                    <div
                      key={cat.id || cat.slug || cat.name}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <span className="text-text-2">{cat.category || cat.name || String(cat)}</span>
                      {(cat.post_count ?? cat.count) != null && (
                        <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-medium text-primary">{cat.post_count ?? cat.count}</span>
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
