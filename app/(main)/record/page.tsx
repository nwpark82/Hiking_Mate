'use client';

import { Header } from '@/components/layout/Header';
import { Play, History, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RecordPage() {
  const router = useRouter();

  return (
    <>
      <Header title="기록" showSettings={true} />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Start Recording Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/record/active')}
            className="group w-full bg-gradient-to-br from-sunset-500 via-sunset-600 to-sunset-700 text-white rounded-3xl p-8 shadow-soft-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 fill-white" />
                </div>
                <span className="text-2xl font-bold">산행 시작하기</span>
              </div>
              <p className="text-sunset-50 text-sm font-medium">GPS로 실시간 경로를 기록하고 추억을 남겨보세요</p>
            </div>
          </button>
        </div>

        {/* Stats Grid */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-sunset-500" />
            <h3 className="text-xl font-bold text-gray-900">나의 통계</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-white to-sky-50/30 rounded-2xl p-5 shadow-soft border border-sky-100/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-sky-100 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-sky-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">총 거리</span>
              </div>
              <p className="text-3xl font-bold text-sky-700">0 <span className="text-xl text-gray-500">km</span></p>
            </div>

            <div className="bg-gradient-to-br from-white to-forest-50/30 rounded-2xl p-5 shadow-soft border border-forest-100/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-forest-100 rounded-xl">
                  <History className="w-5 h-5 text-forest-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">총 시간</span>
              </div>
              <p className="text-3xl font-bold text-forest-700">0<span className="text-xl text-gray-500">시간</span></p>
            </div>

            <div className="bg-gradient-to-br from-white to-sunset-50/30 rounded-2xl p-5 shadow-soft border border-sunset-100/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-sunset-100 rounded-xl">
                  <Award className="w-5 h-5 text-sunset-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">등산 횟수</span>
              </div>
              <p className="text-3xl font-bold text-sunset-700">0<span className="text-xl text-gray-500">회</span></p>
            </div>

            <div className="bg-gradient-to-br from-white to-mountain-50/30 rounded-2xl p-5 shadow-soft border border-mountain-100/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-mountain-100 rounded-xl text-xl flex items-center justify-center">
                  ⛰️
                </div>
                <span className="text-sm text-gray-600 font-medium">정복한 산</span>
              </div>
              <p className="text-3xl font-bold text-mountain-700">0<span className="text-xl text-gray-500">개</span></p>
            </div>
          </div>
        </section>

        {/* Recent Records */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-sunset-600" />
              <h3 className="text-xl font-bold text-gray-900">최근 기록</h3>
            </div>
            <Link
              href="/record/history"
              className="text-sm text-sunset-600 font-semibold hover:text-sunset-700 transition-colors"
            >
              전체보기 →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-12 shadow-soft text-center border border-gray-100">
            <div className="bg-sunset-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-10 h-10 text-sunset-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">아직 기록이 없습니다</h4>
            <p className="text-sm text-gray-600 mb-4">첫 산행을 시작해보세요!</p>
            <button
              onClick={() => router.push('/record/active')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sunset-500 to-sunset-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform duration-300 shadow-md"
            >
              <Play className="w-4 h-4 fill-white" />
              산행 시작하기
            </button>
          </div>
        </section>

      </main>
    </>
  );
}
