'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserTrackingSessions } from '@/lib/services/tracking';
import { formatDistance } from '@/lib/utils/helpers';
import { formatDuration } from '@/lib/utils/gps';
import { Calendar, MapPin, Clock, TrendingUp, Loader2, Mountain } from 'lucide-react';

interface TrackingSession {
  id: string;
  trail_id: string | null;
  start_time: string;
  end_time: string;
  distance: number;
  duration: number;
  status: string;
  created_at: string;
}

export default function RecordHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadSessions();
    }
  }, [user, authLoading, router]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      const { sessions: data, error } = await getUserTrackingSessions(user.id);
      if (error) throw new Error(error);
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header title="산행 기록" />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="산행 기록" />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">전체 산행 기록</h1>
          <p className="text-gray-600">총 {sessions.length}건의 산행 기록</p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Mountain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">산행 기록이 없습니다</h3>
            <p className="text-gray-600 mb-6">첫 산행을 시작해보세요!</p>
            <button
              onClick={() => router.push('/record')}
              className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition"
            >
              산행 시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => router.push(`/record/detail/${session.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">
                      {new Date(session.start_time).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(session.start_time).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      session.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {session.status === 'completed' ? '완료' : '진행중'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">거리</p>
                      <p className="font-semibold text-gray-900">{formatDistance(session.distance / 1000)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">시간</p>
                      <p className="font-semibold text-gray-900">{formatDuration(session.duration)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">날짜</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(session.start_time).toLocaleDateString('ko-KR', {
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
