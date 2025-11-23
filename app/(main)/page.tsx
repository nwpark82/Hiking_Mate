'use client';

import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { Mountain, TrendingUp, Users, Activity, Sparkles, ArrowRight, MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPopularTrails } from '@/lib/services/trails';
import { TrailCard } from '@/components/trails/TrailCard';
import type { Trail } from '@/types';

export default function HomePage() {
  const [popularTrails, setPopularTrails] = useState<Trail[]>([]);
  const [weekendTrails, setWeekendTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchPopularTrails() {
      const trails = await getPopularTrails(6);
      setPopularTrails(trails.slice(0, 3));
      setWeekendTrails(trails.slice(3, 6));
      setLoading(false);
    }
    fetchPopularTrails();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <Header title="하이킹메이트" showNotification={true} showSettings={true} />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-forest-500 via-forest-600 to-forest-700 rounded-3xl p-8 text-white mb-6 overflow-hidden shadow-soft-lg">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Mountain className="w-8 h-8" />
              <span className="text-forest-100 font-medium">Hiking Mate</span>
            </div>
            <h2 className="text-3xl font-bold mb-3 leading-tight">
              자연과 함께하는<br />
              특별한 산행 경험
            </h2>
            <p className="text-forest-50 mb-6 text-base leading-relaxed">
              전국 663개 등산로 정보와 GPS 기록,<br />
              그리고 등산 커뮤니티까지 한 곳에서
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-400" />
                <input
                  type="text"
                  placeholder="등산로, 산 이름 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/30 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-white focus:bg-white transition-all duration-300 font-medium shadow-lg"
                />
              </div>
            </form>

            <Link
              href="/explore"
              className="inline-flex items-center gap-2 bg-white text-forest-600 px-6 py-3 rounded-xl font-bold hover:bg-forest-50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <MapPin className="w-5 h-5" />
              등산로 탐색하기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gradient-to-br from-white to-forest-50/30 rounded-2xl p-4 shadow-soft border border-forest-100/50">
            <div className="p-2 bg-forest-100 rounded-xl w-fit mb-2">
              <Mountain className="w-8 h-8 text-forest-600" />
            </div>
            <p className="text-2xl font-bold text-forest-700 mb-1">663</p>
            <span className="text-xs text-gray-600 font-medium">등산로</span>
          </div>

          <div className="bg-gradient-to-br from-white to-sky-50/30 rounded-2xl p-4 shadow-soft border border-sky-100/50">
            <div className="p-2 bg-sky-100 rounded-xl w-fit mb-2">
              <Users className="w-8 h-8 text-sky-600" />
            </div>
            <p className="text-2xl font-bold text-sky-700 mb-1">5.6K+</p>
            <span className="text-xs text-gray-600 font-medium">사용자</span>
          </div>

          <div className="bg-gradient-to-br from-white to-sunset-50/30 rounded-2xl p-4 shadow-soft border border-sunset-100/50">
            <div className="p-2 bg-sunset-100 rounded-xl w-fit mb-2">
              <Activity className="w-8 h-8 text-sunset-600" />
            </div>
            <p className="text-2xl font-bold text-sunset-700 mb-1">12K+</p>
            <span className="text-xs text-gray-600 font-medium">기록</span>
          </div>
        </section>

        {/* Features */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-sunset-500" />
            <h3 className="text-xl font-bold text-gray-900">주요 기능</h3>
          </div>

          <div className="space-y-3">
            <Link
              href="/explore"
              className="group block bg-gradient-to-br from-white to-forest-50/20 rounded-2xl p-5 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 border border-forest-100/30"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-forest-400 to-forest-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Mountain className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-forest-600 transition-colors">등산로 탐색</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">난이도별, 지역별로 다양한 등산로를 검색하고 탐색해보세요</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-forest-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link
              href="/record"
              className="group block bg-gradient-to-br from-white to-sunset-50/20 rounded-2xl p-5 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 border border-sunset-100/30"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-sunset-400 to-sunset-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-sunset-600 transition-colors">산행 기록</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">GPS로 나만의 등산 기록을 남기고 추억을 간직하세요</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-sunset-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link
              href="/community"
              className="group block bg-gradient-to-br from-white to-mountain-50/20 rounded-2xl p-5 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 border border-mountain-100/30"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-mountain-400 to-mountain-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-mountain-600 transition-colors">커뮤니티</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">등산 정보를 공유하고 동행을 찾아보세요</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-mountain-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </div>
        </section>

        {/* Weekend Recommendations */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-sunset-500" />
            <h3 className="text-xl font-bold text-gray-900">이번 주말 추천</h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-soft animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : weekendTrails.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {weekendTrails.map((trail) => (
                <Link
                  key={trail.id}
                  href={`/explore/${trail.id}`}
                  className="group bg-white rounded-2xl p-4 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-forest-50 to-mountain-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                    <Mountain className="w-16 h-16 text-forest-200 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1 group-hover:text-forest-600 transition-colors">
                    {trail.mntn_nm}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      trail.mntn_dffl === '상' ? 'bg-red-100 text-red-700' :
                      trail.mntn_dffl === '중' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {trail.mntn_dffl}
                    </span>
                    <span>• {trail.mntn_uppl} 시간</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-soft text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-500 font-medium">추천 등산로를 준비 중입니다</p>
            </div>
          )}
        </section>

        {/* Real-time Popular Trails */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-forest-600" />
              <h3 className="text-xl font-bold text-gray-900">실시간 인기 등산로</h3>
            </div>
            <Link href="/explore" className="text-sm text-forest-600 font-semibold hover:text-forest-700 transition-colors flex items-center gap-1">
              전체보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 shadow-soft text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-3 text-gray-200 animate-pulse" />
              <p className="text-sm text-gray-500 font-medium">등산로 데이터를 불러오는 중...</p>
            </div>
          ) : popularTrails.length > 0 ? (
            <div className="space-y-4 animate-fade-in">
              {popularTrails.map((trail) => (
                <TrailCard key={trail.id} trail={trail} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-soft text-center">
              <Mountain className="w-16 h-16 mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-500 font-medium">등산로 데이터가 없습니다</p>
              <Link
                href="/explore"
                className="inline-block mt-4 text-forest-600 font-semibold hover:text-forest-700"
              >
                등산로 둘러보기 →
              </Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
