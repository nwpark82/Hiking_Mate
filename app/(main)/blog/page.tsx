import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { getAllBlogPosts, getAllCategories } from '@/lib/blog';
import { Clock, Calendar, Tag, ArrowRight } from 'lucide-react';

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export const metadata = {
  title: '등산 블로그 | 하이킹메이트',
  description: '등산 가이드, 장비 리뷰, 계절별 팁, 안전 수칙 등 유용한 등산 정보를 확인하세요. 초보자부터 전문가까지 모두를 위한 등산 콘텐츠.',
  keywords: ['등산블로그', '등산가이드', '등산팁', '등산장비', '등산안전', '등산정보'],
  openGraph: {
    title: '등산 블로그 | 하이킹메이트',
    description: '등산 가이드, 장비 리뷰, 계절별 팁 등 유용한 등산 정보를 확인하세요.',
    url: 'https://www.hikingmate.co.kr/blog',
    type: 'website',
    siteName: '하이킹메이트',
  },
  twitter: {
    card: 'summary_large_image',
    title: '등산 블로그 | 하이킹메이트',
    description: '등산 가이드, 장비 리뷰, 계절별 팁 등 유용한 등산 정보를 확인하세요.',
  },
};

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const categories = getAllCategories();

  // Debug: Log posts count
  console.log(`[Blog Page] Loaded ${posts.length} blog posts`);

  return (
    <>
      <Header title="등산 블로그" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-forest-500 to-forest-700 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-3">등산 가이드 & 팁</h1>
          <p className="text-forest-50 text-lg">
            초보자부터 전문가까지, 모두를 위한 유용한 등산 정보를 공유합니다
          </p>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">카테고리</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium hover:bg-forest-200 transition cursor-pointer"
                >
                  {category}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Blog Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">아직 작성된 블로그 포스트가 없습니다.</p>
          </div>
        ) : (
          <section className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    {/* Category Badge */}
                    <span className="inline-block px-3 py-1 bg-forest-100 text-forest-700 rounded-full text-xs font-semibold mb-3">
                      {post.category}
                    </span>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-forest-600 transition">
                      {post.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.date).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readingTime}분 읽기</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">by</span>
                        <span className="font-medium">{post.author}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center group-hover:bg-forest-200 transition">
                      <ArrowRight className="w-5 h-5 text-forest-600" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
