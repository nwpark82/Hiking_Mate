'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { KakaoMap } from '@/components/map/KakaoMap';
import { ElevationChart } from '@/components/trails/ElevationChart';
import { WeatherWidget } from '@/components/trails/WeatherWidget';
import { getTrailById } from '@/lib/services/trails';
import { isFavorite as checkIsFavorite, toggleFavorite } from '@/lib/services/favorites';
import type { Trail } from '@/types';
import {
  MapPin,
  Clock,
  TrendingUp,
  Mountain,
  Heart,
  Share2,
  AlertTriangle,
  Loader2,
  Eye,
  ThumbsUp
} from 'lucide-react';
import { formatDistance } from '@/lib/utils/helpers';

const difficultyColors = {
  '초급': 'bg-green-100 text-green-700 border-green-200',
  '중급': 'bg-blue-100 text-blue-700 border-blue-200',
  '고급': 'bg-orange-100 text-orange-700 border-orange-200',
  '전문가': 'bg-red-100 text-red-700 border-red-200',
};

export default function TrailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [trail, setTrail] = useState<Trail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    async function fetchTrail() {
      if (!params.id) return;

      const data = await getTrailById(params.id as string);
      console.log('🗺️ Trail data received:', {
        id: data?.id,
        name: data?.name,
        start_latitude: data?.start_latitude,
        start_longitude: data?.start_longitude,
        path_coordinates_length: data?.path_coordinates ? (data.path_coordinates as any).length : 0,
        has_gps: !!(data?.start_latitude && data?.start_longitude)
      });
      setTrail(data);

      // Check if this trail is favorited (임시 비활성화 - 디버깅용)
      // const favorited = await checkIsFavorite(params.id as string);
      // setIsFavorite(favorited);
      setIsFavorite(false);

      setLoading(false);
    }

    fetchTrail();
  }, [params.id]);

  // Auto-redirect when trail is not found
  useEffect(() => {
    if (!loading && !trail) {
      const timer = setTimeout(() => {
        router.push('/explore');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, trail, router]);

  const handleToggleFavorite = async () => {
    if (!trail) return;

    // Optimistic update
    setIsFavorite(!isFavorite);

    // Call backend service
    const success = await toggleFavorite(trail.id);

    // If failed, revert
    if (!success) {
      setIsFavorite(isFavorite);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trail?.name,
          text: `${trail?.mountain} - ${trail?.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // Fallback: 클립보드에 복사
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다!');
    }
  };

  if (loading) {
    return (
      <>
        <Header title="등산로 상세" />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </>
    );
  }

  if (!trail) {
    return (
      <>
        <Header title="등산로 상세" />
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Mountain className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">등산로를 찾을 수 없습니다</p>
          <p className="text-sm text-gray-400 mb-4">잠시 후 목록 페이지로 이동합니다...</p>
          <button
            onClick={() => router.push('/explore')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            등산로 목록으로
          </button>
        </div>
      </>
    );
  }

  const difficultyColor = difficultyColors[trail.difficulty] || difficultyColors['초급'];

  return (
    <>
      <Header title={trail.name} />

      <main className="max-w-screen-lg mx-auto pb-20">
        {/* Hero Image / Map */}
        <section className="h-80 bg-gray-200 overflow-hidden">
          {trail.start_latitude && trail.start_longitude ? (
            <KakaoMap
              latitude={trail.start_latitude}
              longitude={trail.start_longitude}
              level={6}
              markers={(() => {
                const pathCoords = (trail.path_coordinates as any) || [];
                const markers = [];

                // 출발지점 마커
                if (pathCoords.length > 0) {
                  markers.push({
                    lat: pathCoords[0].lat,
                    lng: pathCoords[0].lng,
                    title: '🚩 출발',
                  });
                }

                // 종료지점 마커 (출발지점과 다른 경우만)
                if (pathCoords.length > 1) {
                  const lastIdx = pathCoords.length - 1;
                  const startLat = pathCoords[0].lat;
                  const startLng = pathCoords[0].lng;
                  const endLat = pathCoords[lastIdx].lat;
                  const endLng = pathCoords[lastIdx].lng;

                  // 출발점과 종료점이 다른 경우만 종료지점 마커 표시
                  if (Math.abs(startLat - endLat) > 0.0001 || Math.abs(startLng - endLng) > 0.0001) {
                    markers.push({
                      lat: endLat,
                      lng: endLng,
                      title: '🏁 도착',
                    });
                  }
                }

                return markers;
              })()}
              pathCoordinates={trail.path_coordinates as any || []}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <MapPin className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </section>

        {/* Trail Info */}
        <section className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${difficultyColor}`}>
                  {trail.difficulty}
                </span>
                {trail.region && (
                  <span className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full">
                    {trail.region}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{trail.name}</h1>
              <p className="text-lg text-gray-600">{trail.mountain}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleToggleFavorite}
                className={`p-3 rounded-full transition ${
                  isFavorite
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isFavorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
                title="공유하기"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gradient-to-br from-white to-forest-50/30 rounded-2xl p-4 shadow-soft border border-forest-100/50 text-center">
              <div className="p-2 bg-forest-100 rounded-xl w-fit mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-forest-600" />
              </div>
              <p className="text-xs text-gray-600 mb-1 font-medium">거리</p>
              <p className="text-xl font-bold text-forest-700">{formatDistance(trail.distance)}</p>
            </div>
            <div className="bg-gradient-to-br from-white to-sky-50/30 rounded-2xl p-4 shadow-soft border border-sky-100/50 text-center">
              <div className="p-2 bg-sky-100 rounded-xl w-fit mx-auto mb-2">
                <Clock className="w-6 h-6 text-sky-600" />
              </div>
              <p className="text-xs text-gray-600 mb-1 font-medium">소요시간</p>
              <p className="text-xl font-bold text-sky-700">
                {Math.floor(trail.duration / 60)}시간 {trail.duration % 60}분
              </p>
            </div>
            <div className="bg-gradient-to-br from-white to-sunset-50/30 rounded-2xl p-4 shadow-soft border border-sunset-100/50 text-center">
              <div className="p-2 bg-sunset-100 rounded-xl w-fit mx-auto mb-2">
                <Mountain className="w-6 h-6 text-sunset-600" />
              </div>
              <p className="text-xs text-gray-600 mb-1 font-medium">고도</p>
              {trail.avg_altitude ? (
                <div>
                  <p className="text-xl font-bold text-sunset-700">{trail.avg_altitude}m</p>
                  <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                    {trail.min_altitude && trail.max_altitude && (
                      <p>{trail.min_altitude}m ~ {trail.max_altitude}m</p>
                    )}
                    {trail.elevation_gain && (
                      <p className="text-sunset-600 font-medium">↑{trail.elevation_gain}m</p>
                    )}
                  </div>
                </div>
              ) : trail.max_altitude ? (
                <p className="text-xl font-bold text-sunset-700">{trail.max_altitude}m</p>
              ) : (
                <p className="text-xl font-bold text-gray-400">-</p>
              )}
            </div>
          </div>

          {/* Additional Stats */}
          {(trail.elevation_gain || trail.view_count || trail.like_count) && (
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
              {trail.elevation_gain && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  누적 상승 {trail.elevation_gain}m
                </span>
              )}
              {trail.view_count > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {trail.view_count}
                </span>
              )}
              {trail.like_count > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {trail.like_count}
                </span>
              )}
            </div>
          )}

          {/* Elevation Chart */}
          {trail.path_coordinates && (trail.path_coordinates as any).length > 0 && (
            <ElevationChart
              pathCoordinates={trail.path_coordinates as any}
              minAltitude={trail.min_altitude}
              maxAltitude={trail.max_altitude}
              elevationGain={trail.elevation_gain}
            />
          )}

          {/* Weather Widget */}
          {trail.start_latitude && trail.start_longitude && (
            <WeatherWidget
              latitude={trail.start_latitude}
              longitude={trail.start_longitude}
              mountainName={trail.mountain}
            />
          )}

          {/* Description */}
          {trail.description && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-forest-600 rounded-full"></span>
                코스 소개
              </h2>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {trail.description}
                </p>
              </div>
            </div>
          )}

          {/* Features */}
          {trail.features && (trail.features as string[]).length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-forest-600 rounded-full"></span>
                코스 특징
              </h2>
              <div className="flex flex-wrap gap-2">
                {(trail.features as string[]).map((feature, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-forest-50 to-forest-100/50 text-forest-700 text-sm font-medium rounded-xl border border-forest-200/50 shadow-sm"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Health Benefits */}
          {trail.health_benefits && (trail.health_benefits as string[]).length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-forest-600 rounded-full"></span>
                건강 효과
              </h2>
              <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-4 border border-green-100">
                <ul className="space-y-2">
                  {(trail.health_benefits as string[]).map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700">
                      <span className="text-green-600 mt-1 text-lg">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Attractions */}
          {trail.attractions && (trail.attractions as string[]).length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-forest-600 rounded-full"></span>
                주요 볼거리
              </h2>
              <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-4 border border-blue-100">
                <ul className="space-y-2">
                  {(trail.attractions as string[]).map((attraction, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700">
                      <span className="text-blue-600 mt-1 text-lg">🏔️</span>
                      <span>{attraction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Warnings */}
          {trail.warnings && (trail.warnings as string[]).length > 0 && (
            <div className="mb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-bold text-orange-900">주의사항</h2>
                </div>
                <ul className="space-y-2">
                  {(trail.warnings as string[]).map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-orange-800">
                      <span className="text-orange-600 mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Access Info */}
          {trail.access_info && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-forest-600 rounded-full"></span>
                교통 정보
              </h2>
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border border-gray-200">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {trail.access_info}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <section className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-screen-lg mx-auto flex gap-3">
            <button
              onClick={() => router.push(`/record?trailId=${trail.id}`)}
              className="flex-1 bg-gradient-to-r from-forest-600 to-forest-500 text-white py-4 px-6 rounded-xl font-bold hover:from-forest-700 hover:to-forest-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              🚀 이 코스로 산행 시작
            </button>
            <button
              onClick={() => router.push('/community?createPost=true')}
              className="px-6 py-4 border-2 border-forest-200 text-forest-700 rounded-xl font-bold hover:bg-forest-50 transition-all duration-300 hover:border-forest-300"
            >
              ✍️ 후기 작성
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
