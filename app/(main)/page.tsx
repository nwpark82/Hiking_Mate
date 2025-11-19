'use client';

import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { Mountain, TrendingUp, Users, Activity, Sparkles, ArrowRight, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPopularTrails } from '@/lib/services/trails';
import { TrailCard } from '@/components/trails/TrailCard';
import type { Trail } from '@/types';

export default function HomePage() {
  const [popularTrails, setPopularTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopularTrails() {
      const trails = await getPopularTrails(3);
      setPopularTrails(trails);
      setLoading(false);
    }
    fetchPopularTrails();
  }, []);

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
        <section className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-forest-50/30 rounded-2xl p-5 shadow-soft border border-forest-100/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-forest-100 rounded-xl">
                <Mountain className="w-5 h-5 text-forest-600" />
              </div>
              <span className="text-sm text-gray-600 font-medium">등록된 등산로</span>
            </div>
            <p className="text-3xl font-bold text-forest-700">663<span className="text-xl text-gray-500 ml-1">개</span></p>
          </div>

          <div className="bg-gradient-to-br from-white to-sky-50/30 rounded-2xl p-5 shadow-soft border border-sky-100/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-sky-100 rounded-xl">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-sm text-gray-600 font-medium">활성 사용자</span>
            </div>
            <p className="text-3xl font-bold text-sky-700">5.6<span className="text-xl text-gray-500 ml-1">K+</span></p>
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

        {/* Popular Trails Preview */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-forest-600" />
              <h3 className="text-xl font-bold text-gray-900">인기 등산로</h3>
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
