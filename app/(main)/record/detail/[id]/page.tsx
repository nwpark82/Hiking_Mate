'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import { getTrackingSessionById } from '@/lib/services/tracking';
import { formatDistance } from '@/lib/utils/helpers';
import { formatDuration } from '@/lib/utils/gps';
import { Calendar, Clock, TrendingUp, Mountain, MapPin, Loader2, Trash2 } from 'lucide-react';

export default function RecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user && sessionId) {
      loadSession();
    }
  }, [user, authLoading, sessionId, router]);

  const loadSession = async () => {
    try {
      const { session: data, error } = await getTrackingSessionById(sessionId);
      if (error) throw new Error(error);
      setSession(data);
    } catch (error) {
      console.error('Error loading session:', error);
      alert('산행 기록을 불러올 수 없습니다.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header title="산행 상세" />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Header title="산행 상세" />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">산행 기록을 찾을 수 없습니다.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="산행 상세" />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Date Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {new Date(session.start_time).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </h1>
          <p className="text-gray-600">
            {new Date(session.start_time).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            시작
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm text-primary-100">총 거리</span>
            </div>
            <p className="text-3xl font-bold">{formatDistance(session.distance / 1000)}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm text-blue-100">총 시간</span>
            </div>
            <p className="text-3xl font-bold">{formatDuration(session.duration)}</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">상세 정보</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">시작 시간</span>
              <span className="font-semibold text-gray-900">
                {new Date(session.start_time).toLocaleString('ko-KR')}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">종료 시간</span>
              <span className="font-semibold text-gray-900">
                {new Date(session.end_time).toLocaleString('ko-KR')}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">상태</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  session.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {session.status === 'completed' ? '완료' : '진행중'}
              </span>
            </div>

            {session.track_points && (
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">GPS 포인트</span>
                <span className="font-semibold text-gray-900">
                  {Array.isArray(session.track_points) ? session.track_points.length : 0}개
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Map Placeholder */}
        {session.track_points && Array.isArray(session.track_points) && session.track_points.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">경로 지도</h2>
            <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2" />
                <p>지도 표시 기능은 다음 업데이트에서 구현됩니다</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            뒤로 가기
          </button>
        </div>
      </main>
    </>
  );
}
