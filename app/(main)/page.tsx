import { Header } from '@/components/layout/Header';
import { SearchSection } from '@/components/home/SearchSection';
import { TrailCard } from '@/components/home/TrailCard';
import { TrailCarousel } from '@/components/home/TrailCarousel';
import { Card, CardContent } from '@/components/ui/card';
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
          <Card className="border-forest-100/50 bg-gradient-to-br from-background to-forest-50/30 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="p-2 bg-forest-100 rounded-xl w-fit mb-2">
                <Mountain className="w-8 h-8 text-forest-600" />
              </div>
              <p className="text-2xl font-bold text-forest-700 mb-1">663</p>
              <span className="text-xs text-muted-foreground font-medium">등산로</span>
            </CardContent>
          </Card>

          <Card className="border-sky-100/50 bg-gradient-to-br from-background to-sky-50/30 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="p-2 bg-sky-100 rounded-xl w-fit mb-2">
                <Users className="w-8 h-8 text-sky-600" />
              </div>
              <p className="text-2xl font-bold text-sky-700 mb-1">5.6K+</p>
              <span className="text-xs text-muted-foreground font-medium">사용자</span>
            </CardContent>
          </Card>

          <Card className="border-sunset-100/50 bg-gradient-to-br from-background to-sunset-50/30 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="p-2 bg-sunset-100 rounded-xl w-fit mb-2">
                <Activity className="w-8 h-8 text-sunset-600" />
              </div>
              <p className="text-2xl font-bold text-sunset-700 mb-1">12K+</p>
              <span className="text-xs text-muted-foreground font-medium">기록</span>
            </CardContent>
          </Card>
        </section>

        {/* Features */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-sunset-500" />
            <h3 className="text-xl font-bold text-foreground">주요 기능</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Link href="/explore">
              <Card className="group border-forest-100/30 bg-gradient-to-br from-background to-forest-50/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-forest-400 to-forest-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <Mountain className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-1 text-lg group-hover:text-forest-600 transition-colors">등산로 탐색</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">난이도별, 지역별로 다양한 등산로를 검색하고 탐색해보세요</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-forest-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/guides">
              <Card className="group border-sky-100/30 bg-gradient-to-br from-background to-sky-50/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-sky-400 to-sky-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <span className="text-2xl">📚</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-1 text-lg group-hover:text-sky-600 transition-colors">등산 가이드</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">초보자를 위한 완벽한 등산 가이드와 안전수칙</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/record">
              <Card className="group border-sunset-100/30 bg-gradient-to-br from-background to-sunset-50/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-sunset-400 to-sunset-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <Activity className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-1 text-lg group-hover:text-sunset-600 transition-colors">산행 기록</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">GPS로 나만의 등산 기록을 남기고 추억을 간직하세요</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-sunset-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/community">
              <Card className="group border-mountain-100/30 bg-gradient-to-br from-background to-mountain-50/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-mountain-400 to-mountain-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-1 text-lg group-hover:text-mountain-600 transition-colors">커뮤니티</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">등산 정보를 공유하고 동행을 찾아보세요</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-mountain-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Weekend Recommendations */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-sunset-500" />
            <h3 className="text-xl font-bold text-foreground">이번 주말 추천</h3>
          </div>

          {weekendTrails.length > 0 ? (
            <TrailCarousel trails={weekendTrails} variant="featured" />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-3 text-muted" />
                <p className="text-sm text-muted-foreground font-medium">추천 등산로를 준비 중입니다</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Real-time Popular Trails */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-forest-600" />
              <h3 className="text-xl font-bold text-foreground">실시간 인기 등산로</h3>
            </div>
            <Link href="/explore" className="text-sm text-forest-600 font-semibold hover:text-forest-700 transition-colors flex items-center gap-1">
              전체보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {popularTrails.length > 0 ? (
            <div className="space-y-3">
              {popularTrails.map((trail, index) => (
                <TrailCard key={trail.id} trail={trail} rank={index + 1} variant="compact" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-3 text-muted" />
                <p className="text-sm text-muted-foreground font-medium">인기 등산로를 준비 중입니다</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </>
  );
}
