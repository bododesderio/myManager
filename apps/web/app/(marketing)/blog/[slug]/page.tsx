import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { fetchServerApi } from '@/lib/api/server';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  meta_title?: string;
  meta_description?: string;
  excerpt?: string;
  category?: string;
  published_at?: string;
  date?: string;
  read_time?: number;
  author?: string;
  cover_image?: string;
  body?: string;
  tags?: string[];
}

async function getBlogPost(slug: string) {
  return fetchServerApi<BlogPost | null>(`/api/v1/blog/${slug}`, null, { label: `blog post:${slug}` });
}

async function getRelatedPosts(category: string, excludeSlug: string) {
  const data = await fetchServerApi<{ posts?: BlogPost[] } | BlogPost[] | null>(
    `/api/v1/blog?category=${encodeURIComponent(category)}&limit=3`,
    null,
    { label: `related blog posts:${category}` },
  );
  const posts = Array.isArray(data) ? data : (data?.posts ?? []);
  return posts.filter((post) => post.slug !== excludeSlug);
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3 class="mt-6 mb-2 text-[18px] font-bold text-text">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-8 mb-3 text-[22px] font-bold text-text">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="mt-8 mb-3 text-[26px] font-extrabold text-text">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-text-2">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-4 text-[15px] leading-relaxed text-text-2">')
    .replace(/\n/g, '<br/>');

  html = `<p class="text-[15px] leading-relaxed text-text-2">${html}</p>`;
  html = html.replace(/(<li[^>]*>.*?<\/li>(?:\s*<br\/>)*)+/g, (match) => {
    return `<ul class="mt-2 space-y-1">${match.replace(/<br\/>/g, '')}</ul>`;
  });
  return html;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) {
    const title = slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return { title, description: `Read our article about ${title.toLowerCase()}.` };
  }
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || `Read our article: ${post.title}`,
  };
}

const TAG_COLORS = [
  'bg-[var(--color-primary-light)] text-primary border-[var(--color-primary-border)]',
  'bg-[var(--color-secondary-light)] text-[var(--color-secondary)] border-[var(--color-secondary)]',
  'bg-[var(--color-tertiary-light)] text-[var(--color-tertiary-dark)] border-[var(--color-tertiary)]',
  'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent-border)]',
];

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const relatedPosts = post.category ? await getRelatedPosts(post.category, slug) : [];
  const publishedAt = post.published_at || post.date;

  return (
    <main className="min-h-screen bg-bg px-5 py-20 font-body text-text">
      <article className="animate-fade-in-up mx-auto max-w-3xl">
        <Link href="/blog" className="text-[13px] font-medium text-primary hover:underline">
          &larr; Back to Blog
        </Link>

        <h1 className="mt-6 text-[32px] font-extrabold leading-tight lg:text-[38px]">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-text-muted">
          {post.category && (
            <span className="rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-[11px] font-medium text-primary">
              {post.category}
            </span>
          )}
          {publishedAt && <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>}
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
          <div className="relative mt-6 aspect-video overflow-hidden rounded-card shadow-[var(--shadow-card)]">
            <Image src={post.cover_image} alt={post.title} fill className="object-cover" unoptimized />
          </div>
        )}

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

        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag: string, i: number) => (
              <span
                key={tag}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {relatedPosts.length > 0 && (
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-primary">Related Posts</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((rp, i) => {
              const relatedPublishedAt = rp.published_at || rp.date;
              return (
                <Link
                  key={rp.slug || rp.id}
                  href={`/blog/${rp.slug}`}
                  className={`animate-fade-in-up card-hover rounded-card border border-border bg-white p-5 ${['', 'delay-100', 'delay-200'][i] || ''}`}
                >
                  <h3 className="text-[14px] font-bold text-text">{rp.title}</h3>
                  {rp.excerpt && <p className="mt-1 text-[12px] text-text-2 line-clamp-2">{rp.excerpt}</p>}
                  {relatedPublishedAt && (
                    <p className="mt-2 text-[11px] text-text-muted">{formatDate(relatedPublishedAt)}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
