'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { formatDistance } from '@/lib/utils/helpers';
import { formatDuration, formatPace } from '@/lib/utils/gps';
import {
  Save,
  Loader2,
  Star,
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  TrendingUp,
  Clock,
  Activity,
  Zap,
  Mountain,
} from 'lucide-react';

interface PendingHikeData {
  trailId: string | null;
  gpsPoints: any[];
  distance: number;
  duration: number;
  pace: number;
  calories: number;
  elevationGain: number;
  photos: string[];
  startTime: string;
}

export default function SaveRecordPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hikeData, setHikeData] = useState<PendingHikeData | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [weather, setWeather] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      alert('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }

    const data = localStorage.getItem('pendingHike');
    if (data) {
      setHikeData(JSON.parse(data));
    } else {
      router.push('/record');
    }
  }, [router, user, authLoading]);

  const handleSave = async () => {
    if (!hikeData || !user) return;

    setIsSaving(true);

    try {
      const { data: hike, error } = await supabase
        .from('hikes')
        .insert({
          user_id: user.id,
          trail_id: hikeData.trailId,
          gpx_data: { points: hikeData.gpsPoints },
          distance: hikeData.distance,
          duration: hikeData.duration,
          avg_pace: hikeData.pace,
          calories: hikeData.calories,
          photos: hikeData.photos,
          notes: notes || null,
          rating: rating || null,
          weather: weather || null,
          is_public: isPublic,
          started_at: hikeData.startTime,
          completed_at: new Date().toISOString(),
          is_completed: true,
        })
        .select()
        .single();

      if (error) throw error;

      // 로컬 스토리지에서 제거
      localStorage.removeItem('pendingHike');

      // 성공 페이지로 이동
      router.push(`/record/detail/${hike.id}?success=true`);
    } catch (error) {
      console.error('Failed to save hike:', error);
      alert('산행 기록 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !hikeData) {
    return (
      <>
        <Header title="기록 저장" />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="산행 기록 저장" />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Summary Stats */}
        <section className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white mb-6">
          <h2 className="text-xl font-bold mb-4">산행 완료!</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm text-primary-100">거리</span>
              </div>
              <p className="text-2xl font-bold">{formatDistance(hikeData.distance)}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm text-primary-100">시간</span>
              </div>
              <p className="text-2xl font-bold">{formatDuration(hikeData.duration)}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-sm text-primary-100">페이스</span>
              </div>
              <p className="text-2xl font-bold">{formatPace(hikeData.pace)}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-sm text-primary-100">칼로리</span>
              </div>
              <p className="text-2xl font-bold">{hikeData.calories} kcal</p>
            </div>
          </div>
        </section>

        {/* Photos */}
        {hikeData.photos.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-5 h-5 text-gray-700" />
              <h3 className="font-bold text-gray-900">사진 {hikeData.photos.length}장</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {hikeData.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              ))}
            </div>
          </section>
        )}

        {/* Rating */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">별점</h3>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </section>

        {/* Weather */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">날씨</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['맑음', '흐림', '비', '눈', '안개'].map((w) => (
              <button
                key={w}
                onClick={() => setWeather(w)}
                className={`px-4 py-2 rounded-lg border transition ${
                  weather === w
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-600'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">메모</h3>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="산행 소감이나 특이사항을 기록해보세요..."
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={4}
          />
        </section>

        {/* Privacy */}
        <section className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-gray-700">다른 사용자에게 공개</span>
          </label>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              기록 저장
            </>
          )}
        </button>
      </main>
    </>
  );
}
