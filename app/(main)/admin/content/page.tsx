'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import {
  listPosts,
  listRecentComments,
  deleteContent,
  type AdminPost,
  type AdminComment,
} from '@/lib/services/admin';
import { Loader2, Search, Trash2, ExternalLink, Plus } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORY_LABELS: Record<string, string> = {
  notice: '공지',
  review: '후기',
  question: '질문',
  info: '정보',
  companion: '동행찾기',
};

type Tab = 'posts' | 'comments';

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>('posts');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (keyword = search) => {
    setLoading(true);
    if (tab === 'posts') {
      const result = await listPosts(keyword);
      setPosts(result.posts);
      setError(result.error);
    } else {
      const result = await listRecentComments(keyword);
      setComments(result.comments);
      setError(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tab]);

  const handleDelete = async (type: 'post' | 'comment', id: string, label: string) => {
    const name = type === 'post' ? '게시글' : '댓글';
    if (!confirm(`${name}을(를) 삭제하시겠습니까? 되돌릴 수 없습니다.\n\n${label}`)) return;

    const { error: deleteError } = await deleteContent(type, id);
    if (deleteError) {
      alert('삭제 실패: ' + deleteError);
      return;
    }
    load();
  };

  const formatDate = (value: string) => format(new Date(value), 'yyyy-MM-dd HH:mm');

  return (
    <>
      <Header title="콘텐츠 관리" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">콘텐츠 관리</h1>
          <Link
            href="/community/new?category=notice"
            className="flex items-center gap-1 px-4 py-2 bg-forest-600 text-white rounded-lg text-sm font-semibold hover:bg-forest-700 transition"
          >
            <Plus className="w-4 h-4" /> 공지 작성
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {(['posts', 'comments'] as Tab[]).map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`px-4 py-1.5 text-sm rounded-md transition ${
                  tab === value ? 'bg-forest-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {value === 'posts' ? '게시글' : '댓글'}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
            className="relative flex-1"
          >
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'posts' ? '제목 검색 (Enter)' : '댓글 내용 검색 (Enter)'}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 rounded-xl p-4">{error}</div>
        ) : tab === 'posts' ? (
          posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-soft text-gray-500">게시글이 없습니다.</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 divide-y divide-gray-100">
              {posts.map((post) => (
                <div key={post.id} className="p-4 flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                      post.category === 'notice' ? 'bg-red-100 text-red-700' : 'bg-forest-100 text-forest-700'
                    }`}
                  >
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{post.title}</div>
                    <div className="text-xs text-gray-500">
                      {post.users?.username || '알 수 없음'} · {formatDate(post.created_at)} · 조회 {post.view_count || 0}
                    </div>
                  </div>
                  <Link href={`/community/${post.id}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg" title="보기">
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </Link>
                  <button
                    onClick={() => handleDelete('post', post.id, post.title)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : comments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-soft text-gray-500">댓글이 없습니다.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 divide-y divide-gray-100">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 text-sm line-clamp-2">{comment.content}</div>
                  <div className="text-xs text-gray-500">
                    {comment.users?.username || '알 수 없음'} · {formatDate(comment.created_at)}
                  </div>
                </div>
                <Link
                  href={`/community/${comment.post_id}`}
                  target="_blank"
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="게시글 보기"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </Link>
                <button
                  onClick={() => handleDelete('comment', comment.id, comment.content.slice(0, 50))}
                  className="p-2 hover:bg-red-50 rounded-lg"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
