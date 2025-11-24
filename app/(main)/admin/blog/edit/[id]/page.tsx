'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { updateBlog, getBlogById } from '@/lib/services/blog.client';
import type { Blog } from '@/lib/services/blog.types';
import dynamic from 'next/dynamic';
import { Save, ArrowLeft, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

const CATEGORIES = [
  '가이드',
  '장비 가이드',
  '계절별 팁',
  '안전 가이드',
  '등산로 리뷰',
  '등산 팁',
];

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [preview, setPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    author_name: '',
    category: '가이드',
    tags: '',
    cover_image: '',
    published: false,
  });

  useEffect(() => {
    loadBlog();
  }, [blogId]);

  const loadBlog = async () => {
    setFetching(true);
    const { blog, error } = await getBlogById(blogId);

    if (error || !blog) {
      alert('블로그를 불러올 수 없습니다: ' + error?.message);
      router.push('/admin/blog');
      return;
    }

    setFormData({
      title: blog.title,
      description: blog.description || '',
      content: blog.content,
      author_name: blog.author_name,
      category: blog.category,
      tags: blog.tags.join(', '),
      cover_image: blog.cover_image || '',
      published: blog.published,
    });

    setFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { error } = await updateBlog(blogId, {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        author_name: formData.author_name,
        category: formData.category,
        tags,
        cover_image: formData.cover_image || undefined,
        published: formData.published,
      });

      if (error) {
        alert('블로그 수정 실패: ' + error.message);
        return;
      }

      alert('블로그가 성공적으로 수정되었습니다!');
      router.push('/admin/blog');
    } catch (error: any) {
      alert('오류: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <>
        <Header title="블로그 수정" />
        <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="블로그 수정" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        {/* Back Button */}
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-6 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          관리자 대시보드로
        </Link>

        <div className="bg-white rounded-2xl shadow-soft p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">블로그 수정</h1>
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Eye className="w-4 h-4" />
              {preview ? '편집 모드' : '미리보기'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
                placeholder="블로그 제목을 입력하세요"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                요약 설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
                rows={3}
                placeholder="블로그 요약 설명 (SEO에 사용됩니다)"
              />
            </div>

            {/* Category & Author */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  카테고리 *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  작성자 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
                placeholder="예: 등산, 초보자, 가이드"
              />
            </div>

            {/* Cover Image URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                커버 이미지 URL
              </label>
              <input
                type="url"
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                내용 * (마크다운)
              </label>
              <div data-color-mode="light">
                <MDEditor
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val || '' })}
                  preview={preview ? 'preview' : 'edit'}
                  height={500}
                  visibleDragbar={false}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                마크다운 문법을 사용하여 작성하세요. (제목: #, 굵게: **, 리스트: -, 등)
              </p>
            </div>

            {/* Published Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-5 h-5 text-forest-600 rounded focus:ring-forest-500"
              />
              <label htmlFor="published" className="text-sm font-medium text-gray-700">
                바로 게시하기 (체크 해제 시 임시 저장)
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-forest-600 text-white rounded-xl font-semibold hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Save className="w-5 h-5" />
                {loading ? '저장 중...' : formData.published ? '게시하기' : '임시 저장'}
              </button>
              <Link
                href="/admin/blog"
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                취소
              </Link>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
