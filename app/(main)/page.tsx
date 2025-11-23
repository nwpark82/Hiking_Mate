import { Header } from '@/components/layout/Header';
import { SearchSection } from '@/components/home/SearchSection';
import Link from 'next/link';
import { Mountain, TrendingUp, Users, Activity, Sparkles, ArrowRight } from 'lucide-react';
import { getPopularTrails } from '@/lib/services/trails';

// ISR: 1시간마다 재생성
export const revalidate = 3600;

export default async function HomePage() {
  // 서버에서 데이터 fetch
  const trails = await getPopularTrails(6);
  const popularTrails = trails.slice(0, 3);
  const weekendTrails = trails.slice(3, 6);

  return (
    <>
      <Header title="하이킹메이트" showNotification={true} showSettings={true} />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Hero Section with Search */}
        <SearchSection />

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

          {weekendTrails.length > 0 ? (
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
                    {trail.name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      trail.difficulty === '고급' || trail.difficulty === '전문가' ? 'bg-red-100 text-red-700' :
                      trail.difficulty === '중급' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {trail.difficulty}
                    </span>
                    <span>• {Math.floor(trail.duration / 60)}h {trail.duration % 60}m</span>
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

          {popularTrails.length > 0 ? (
            <div className="space-y-3">
              {popularTrails.map((trail, index) => (
                <Link
                  key={trail.id}
                  href={`/explore/${trail.id}`}
                  className="group flex items-center gap-4 bg-white rounded-2xl p-4 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 border border-gray-100"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-forest-500 to-forest-600 text-white rounded-xl font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1 group-hover:text-forest-600 transition-colors">
                      {trail.name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        trail.difficulty === '고급' || trail.difficulty === '전문가' ? 'bg-red-100 text-red-700' :
                        trail.difficulty === '중급' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {trail.difficulty}
                      </span>
                      <span>• {trail.region}</span>
                      <span>• {Math.floor(trail.duration / 60)}h {trail.duration % 60}m</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-forest-600 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-soft text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-500 font-medium">인기 등산로를 준비 중입니다</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
