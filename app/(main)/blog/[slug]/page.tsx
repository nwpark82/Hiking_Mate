import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/blog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, Calendar, Tag, ArrowLeft, User } from 'lucide-react';

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다 | 하이킹메이트',
    };
  }

  return {
    title: `${post.title} | 하이킹메이트`,
    description: post.description,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header title="블로그" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">블로그 목록으로</span>
        </Link>

        {/* Article Container */}
        <article className="bg-white rounded-2xl shadow-soft p-8 md:p-12">
          {/* Category Badge */}
          <span className="inline-block px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-semibold mb-4">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 mb-6">
            {post.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 mb-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium text-gray-700">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readingTime}분 읽기</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-8">
              <Tag className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-gray-700 leading-relaxed mb-4" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="ml-4" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-forest-500 pl-4 italic text-gray-600 my-4" {...props} />
                ),
                code: ({ node, ...props }) => (
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="my-8 border-gray-200" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-gray-900" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-gray-700" {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a className="text-forest-600 hover:text-forest-700 underline" {...props} />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* CTA */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-gradient-to-br from-forest-50 to-forest-100 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                등산로를 직접 확인해보세요!
              </h3>
              <p className="text-gray-700 mb-6">
                하이킹메이트에서 전국 663개 등산로 정보를 확인하고, 나만의 산행 기록을 남겨보세요.
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 bg-forest-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-forest-700 transition"
              >
                등산로 탐색하기
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </Link>
            </div>
          </div>
        </article>

        {/* Back to List Button */}
        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>블로그 목록으로 돌아가기</span>
          </Link>
        </div>
      </main>
    </>
  );
}
