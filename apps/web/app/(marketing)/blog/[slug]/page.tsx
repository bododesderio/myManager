import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import DOMPurify from 'isomorphic-dompurify';

const API_URL = process.env.API_URL || 'http://localhost:3001';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getBlogPost(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/blog/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch { return null; }
}

async function getRelatedPosts(category: string, excludeSlug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/blog?category=${encodeURIComponent(category)}&limit=3`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    const posts = data.posts || data || [];
    return posts.filter((p: any) => p.slug !== excludeSlug);
  } catch { return []; }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
}

/** Minimal markdown-to-HTML renderer for blog post body */
function renderMarkdown(md: string): string {
  let html = md
    // headings
    .replace(/^### (.+)$/gm, '<h3 class="mt-6 mb-2 text-[18px] font-bold text-text">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-8 mb-3 text-[22px] font-bold text-text">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="mt-8 mb-3 text-[26px] font-extrabold text-text">$1</h1>')
    // bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
    // unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-text-2">$1</li>')
    // line breaks → paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mt-4 text-[15px] leading-relaxed text-text-2">')
    // single newlines
    .replace(/\n/g, '<br/>');

  // wrap in paragraph
  html = `<p class="text-[15px] leading-relaxed text-text-2">${html}</p>`;
  // wrap consecutive <li> in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>(?:\s*<br\/>)*)+/g, (match) => {
    return `<ul class="mt-2 space-y-1">${match.replace(/<br\/>/g, '')}</ul>`;
  });

  return html;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    const title = slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return {
      title,
      description: `Read our article about ${title.toLowerCase()}.`,
    };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || `Read our article: ${post.title}`,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  // Fallback if CMS is unavailable
  if (!post) {
    const title = slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return (
      <main className="min-h-screen bg-bg px-5 py-20 font-body text-text">
        <article className="mx-auto max-w-3xl">
          <Link href="/blog" className="text-[13px] font-medium text-primary hover:underline">
            &larr; Back to Blog
          </Link>
          <h1 className="mt-6 text-[32px] font-extrabold leading-tight lg:text-[38px]">{title}</h1>
          <p className="mt-6 text-[15px] text-text-2">This post could not be loaded. Please try again later.</p>
        </article>
      </main>
    );
  }

  const relatedPosts = post.category ? await getRelatedPosts(post.category, slug) : [];

  return (
    <main className="min-h-screen bg-bg px-5 py-20 font-body text-text">
      <article className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-[13px] font-medium text-primary hover:underline">
          &larr; Back to Blog
        </Link>

        <h1 className="mt-6 text-[32px] font-extrabold leading-tight lg:text-[38px]">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-text-muted">
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
          {post.read_time && (
            <>
              <span>&middot;</span>
              <span>{post.read_time} min read</span>
            </>
          )}
          {post.author && (
            <>
              <span>&middot;</span>
              <span>By {post.author}</span>
            </>
          )}
        </div>

        {post.cover_image && (
          <div className="relative mt-6 aspect-video overflow-hidden rounded-card">
            <Image src={post.cover_image} alt={post.title} fill className="object-cover" unoptimized />
          </div>
        )}

        {/* ── POST BODY ── */}
        {post.body ? (
          <div
            className="prose mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(post.body)) }}
          />
        ) : post.excerpt ? (
          <div className="mt-10">
            <p className="text-[15px] leading-relaxed text-text-2">{post.excerpt}</p>
          </div>
        ) : null}

        {/* ── TAGS ── */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <span key={tag} className="rounded-full border border-border px-3 py-1 text-[11px] text-text-muted">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* ── RELATED POSTS ── */}
      {relatedPosts.length > 0 && (
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-primary">Related Posts</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((rp: any) => (
              <Link
                key={rp.slug || rp.id}
                href={`/blog/${rp.slug}`}
                className="rounded-card border border-border bg-white p-5 transition hover:border-primary"
              >
                <h3 className="text-[14px] font-bold text-text">{rp.title}</h3>
                {rp.excerpt && <p className="mt-1 text-[12px] text-text-2 line-clamp-2">{rp.excerpt}</p>}
                {(rp.published_at || rp.date) && (
                  <p className="mt-2 text-[11px] text-text-muted">{formatDate(rp.published_at || rp.date)}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
