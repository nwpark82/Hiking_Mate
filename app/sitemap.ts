import { MetadataRoute } from 'next';
import { createPublicSupabaseClient } from '@/lib/supabase/server';
import { getAllBlogPosts } from '@/lib/blog';

// Sitemap은 동적으로 생성 (Supabase 데이터를 가져오기 때문)
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.hikingmate.co.kr';

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/record`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];

  // 동적 등산로 페이지
  let trailPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = createPublicSupabaseClient();
    // Supabase는 요청당 최대 1000행이므로 나눠서 조회
    const trails: { id: string; updated_at: string | null }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from('trails')
        .select('id, updated_at')
        .order('id')
        .range(from, from + 999);
      if (error) throw error;
      trails.push(...(data || []));
      if (!data || data.length < 1000) break;
    }

    if (trails.length > 0) {
      trailPages = trails.map((trail) => ({
        url: `${baseUrl}/explore/${trail.id}`,
        lastModified: trail.updated_at ? new Date(trail.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Error generating sitemap for trails:', error);
  }

  // 블로그 포스트 페이지
  const blogPosts = getAllBlogPosts();
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...trailPages, ...blogPages];
}
