'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { getPosts, Post } from '@/lib/services/posts';
import { Plus, MessageCircle, Heart, Eye, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'review', label: '후기' },
  { id: 'question', label: '질문' },
  { id: 'info', label: '정보' },
  { id: 'companion', label: '동행찾기' },
];

export default function CommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    setLoading(true);
    const { posts: data, error } = await getPosts(selectedCategory);

    if (error) {
      console.error('Failed to load posts:', error);
    } else {
      setPosts(data || []);
    }

    setLoading(false);
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find((c) => c.id === category)?.label || category;
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
  };

  return (
    <>
      <Header title="커뮤니티" showNotification={true} />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-mountain-500 to-mountain-600 text-white shadow-md scale-105'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-mountain-300 hover:bg-mountain-50 hover:scale-105'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Post List */}
        <section>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-mountain-400 animate-spin" />
                <MessageCircle className="w-6 h-6 text-mountain-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-600">게시글을 불러오는 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="space-y-6">
              {/* Empty State CTA */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-soft text-center border border-gray-100">
                <div className="bg-mountain-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-mountain-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">아직 게시글이 없습니다</h3>
                <p className="text-sm text-gray-600 mb-6">등산 정보를 공유하고 동료들과 소통해보세요</p>
                <Link
                  href="/community/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-mountain-500 to-mountain-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform duration-300 shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  첫 게시글 작성하기
                </Link>
              </div>

              {/* Community Guide */}
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  커뮤니티 이용 가이드
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-mountain-100 rounded-full flex items-center justify-center text-mountain-600 font-bold">1</div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-1">후기 공유</h5>
                      <p className="text-sm text-gray-600">다녀온 등산로의 솔직한 후기와 팁을 공유해주세요</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-mountain-100 rounded-full flex items-center justify-center text-mountain-600 font-bold">2</div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-1">동행 찾기</h5>
                      <p className="text-sm text-gray-600">함께 산행할 동료를 찾거나 모임을 만들어보세요</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-mountain-100 rounded-full flex items-center justify-center text-mountain-600 font-bold">3</div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-1">정보 교환</h5>
                      <p className="text-sm text-gray-600">등산 장비, 코스 정보, 날씨 등 유용한 정보를 나눠요</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Topics */}
              <div className="bg-gradient-to-br from-forest-50 to-mountain-50 rounded-2xl p-6 border border-forest-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-mountain-600" />
                  인기 주제
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm mb-1">🏔️ 계절별 추천 코스</p>
                    <p className="text-xs text-gray-600">봄꽃, 단풍, 설산 명소</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm mb-1">👥 주말 등산 모임</p>
                    <p className="text-xs text-gray-600">함께 오를 동료 찾기</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm mb-1">🎒 장비 추천</p>
                    <p className="text-xs text-gray-600">등산화, 배낭, 스틱 등</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm mb-1">📸 등산 사진</p>
                    <p className="text-xs text-gray-600">멋진 풍경 공유</p>
                  </div>
                </div>
              </div>

              {/* Explore Trails CTA */}
              <div className="bg-gradient-to-r from-forest-500 to-mountain-500 rounded-2xl p-6 text-white">
                <h4 className="text-lg font-bold mb-2">등산로 먼저 둘러보기</h4>
                <p className="text-forest-50 text-sm mb-4">전국 663개 등산로 정보를 확인해보세요</p>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 bg-white text-forest-600 px-4 py-2 rounded-lg font-semibold hover:bg-forest-50 transition-colors"
                >
                  등산로 탐색하기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-mountain-500" />
                <p className="text-sm font-semibold text-gray-700">
                  총 <span className="text-mountain-600 text-base">{posts.length}</span>개의 게시글
                </p>
              </div>

              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="group block bg-white rounded-2xl p-5 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-mountain-50 to-mountain-100 text-mountain-700 text-xs font-bold rounded-lg border border-mountain-200">
                      {getCategoryLabel(post.category)}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatTimeAgo(post.created_at)}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 mb-2 text-base group-hover:text-mountain-600 transition-colors line-clamp-1">
                    {post.title}
                  </h4>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Heart className="w-3.5 h-3.5 text-red-400" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <MessageCircle className="w-3.5 h-3.5 text-mountain-400" />
                        {post.comments_count || 0}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        {post.view_count || 0}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold px-2 py-1 bg-gray-50 rounded-lg">
                      {post.users?.username || '익명'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Write Button */}
      <Link
        href="/community/new"
        className="fixed right-4 bottom-20 w-16 h-16 bg-gradient-to-br from-mountain-500 to-mountain-600 text-white rounded-2xl shadow-soft-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:rotate-90 flex items-center justify-center z-50"
      >
        <Plus className="w-7 h-7" />
      </Link>
    </>
  );
}
