import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mymanager.app';
const API_URL = process.env.API_URL || 'http://localhost:3001';

interface BlogPost {
  slug: string;
  updated_at?: string;
  created_at?: string;
}

interface BlogListResponse {
  data: BlogPost[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

async function fetchAllBlogSlugs(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];

  try {
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(
        `${API_URL}/api/v1/blog?page=${page}&limit=100`,
        { next: { revalidate: 3600 } },
      );

      if (!res.ok) break;

      const json: BlogListResponse = await res.json();
      posts.push(...json.data);
      totalPages = json.meta.totalPages;
      page++;
    } while (page <= totalPages);
  } catch {
    // If the API is unreachable, return whatever we have so far
  }

  return posts;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const blogPosts = await fetchAllBlogSlugs();

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at ?? post.created_at ?? new Date()),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}
