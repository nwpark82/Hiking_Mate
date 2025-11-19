'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { KakaoMap } from '@/components/map/KakaoMap';
import { getTrailById } from '@/lib/services/trails';
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
      setTrail(data);
      setLoading(false);
    }

    fetchTrail();
  }, [params.id]);

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
        <section className="h-64 bg-gray-200">
          {trail.start_latitude && trail.start_longitude ? (
            <KakaoMap
              latitude={trail.start_latitude}
              longitude={trail.start_longitude}
              level={5}
              markers={[
                {
                  lat: trail.start_latitude,
                  lng: trail.start_longitude,
                  title: '등산로 시작점'
                }
              ]}
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
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-3 rounded-full transition ${
                  isFavorite
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <TrendingUp className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">거리</p>
              <p className="text-lg font-bold text-gray-900">{formatDistance(trail.distance)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">소요시간</p>
              <p className="text-lg font-bold text-gray-900">
                {Math.floor(trail.duration / 60)}시간 {trail.duration % 60}분
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <Mountain className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">고도</p>
              <p className="text-lg font-bold text-gray-900">
                {trail.max_altitude ? `${trail.max_altitude}m` : '-'}
              </p>
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

          {/* Description */}
          {trail.description && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">코스 소개</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {trail.description}
              </p>
            </div>
          )}

          {/* Features */}
          {trail.features && (trail.features as string[]).length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">코스 특징</h2>
              <div className="flex flex-wrap gap-2">
                {(trail.features as string[]).map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-primary-50 text-primary-700 text-sm rounded-lg"
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
              <h2 className="text-lg font-bold text-gray-900 mb-3">건강 효과</h2>
              <ul className="space-y-2">
                {(trail.health_benefits as string[]).map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attractions */}
          {trail.attractions && (trail.attractions as string[]).length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">주요 볼거리</h2>
              <ul className="space-y-2">
                {(trail.attractions as string[]).map((attraction, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{attraction}</span>
                  </li>
                ))}
              </ul>
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
              <h2 className="text-lg font-bold text-gray-900 mb-3">교통 정보</h2>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {trail.access_info}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <section className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="max-w-screen-lg mx-auto flex gap-3">
            <button
              onClick={() => router.push(`/record?trailId=${trail.id}`)}
              className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              이 코스로 산행 시작
            </button>
            <button
              onClick={() => router.push('/community?createPost=true')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              후기 작성
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
