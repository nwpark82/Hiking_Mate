'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { getMyBlogs, deleteBlog } from '@/lib/services/blog.client';
import type { Blog } from '@/lib/services/blog.types';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    const { blogs: data, error } = await getMyBlogs();

    if (error) {
      alert('블로그 로드 실패: ' + error.message);
    } else {
      setBlogs(data || []);
    }

    setLoading(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 블로그를 삭제하시겠습니까?`)) {
      return;
    }

    const { error } = await deleteBlog(id);

    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      alert('블로그가 삭제되었습니다.');
      loadBlogs();
    }
  };

  return (
    <>
      <Header title="블로그 관리" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">블로그 관리</h1>
            <p className="text-gray-600">작성한 블로그 글을 관리하세요</p>
          </div>
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-2 px-6 py-3 bg-forest-600 text-white rounded-xl font-semibold hover:bg-forest-700 transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            새 블로그 작성
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-soft">
            <div className="bg-forest-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-forest-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">작성된 블로그가 없습니다</h3>
            <p className="text-gray-600 mb-6">첫 블로그를 작성해보세요!</p>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-forest-600 text-white rounded-xl font-semibold hover:bg-forest-700 transition"
            >
              <Plus className="w-5 h-5" />
              블로그 작성하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-md transition border border-gray-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-forest-100 text-forest-700 rounded-full text-xs font-semibold">
                        {blog.category}
                      </span>
                      {blog.published ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <Eye className="w-4 h-4" />
                          게시됨
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500 text-sm font-medium">
                          <EyeOff className="w-4 h-4" />
                          임시 저장
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{blog.title}</h3>

                    {blog.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{blog.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(blog.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                      <span>조회수: {blog.view_count}</span>
                      {blog.tags.length > 0 && (
                        <span className="flex gap-1">
                          {blog.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-1 bg-gray-100 rounded">
                              #{tag}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/blog/edit/${blog.id}`}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="수정"
                    >
                      <Edit className="w-5 h-5 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => handleDelete(blog.id, blog.title)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
