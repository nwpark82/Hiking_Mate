'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMyProfile, getUserStats, type UserProfile } from '@/lib/services/users';
import { getMyTrackingStats } from '@/lib/services/tracking';
import { formatDistance } from '@/lib/utils/helpers';
import { formatDuration } from '@/lib/utils/gps';
import {
  User,
  Calendar,
  TrendingUp,
  Award,
  Mountain,
  MapPin,
  Clock,
  Loader2,
  Edit,
} from 'lucide-react';

interface UserStats {
  totalDistance: number;
  totalTrails: number;
  level: number;
  postsCount: number;
  commentsCount: number;
  likesReceived: number;
  memberSince: string;
}

interface TrackingStats {
  totalHikes: number;
  totalDistance: number;
  totalDuration: number;
  averageDistance: number;
  averageDuration: number;
  longestHike: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [trackingStats, setTrackingStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { profile: profileData, error: profileError } = await getMyProfile();
      if (profileError) throw new Error(profileError);
      if (profileData) setProfile(profileData);

      // Load user stats
      const { stats: userStatsData, error: userStatsError } = await getUserStats(user.id);
      if (userStatsError) throw new Error(userStatsError);
      if (userStatsData) setUserStats(userStatsData);

      // Load tracking stats
      const { stats: trackingStatsData, error: trackingStatsError } = await getMyTrackingStats();
      if (trackingStatsError) throw new Error(trackingStatsError);
      if (trackingStatsData) setTrackingStats(trackingStatsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header title="프로필" />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </>
    );
  }

  const memberSince = userStats?.memberSince
    ? new Date(userStats.memberSince).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
      })
    : '';

  return (
    <>
      <Header title="프로필" />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Profile Header */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-primary-600" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {profile?.username || '사용자'}
              </h1>
              <p className="text-sm text-gray-500 mb-2">{user?.email}</p>
              {profile?.bio && (
                <p className="text-gray-700 text-sm">{profile.bio}</p>
              )}
            </div>
            <button
              onClick={() => router.push('/profile/edit')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Edit className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{memberSince} 가입</span>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">등산 통계</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Mountain className="w-5 h-5" />
                <span className="text-sm text-primary-100">총 산행</span>
              </div>
              <p className="text-3xl font-bold">{trackingStats?.totalHikes || 0}</p>
              <p className="text-xs text-primary-100 mt-1">완료</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm text-green-100">총 거리</span>
              </div>
              <p className="text-3xl font-bold">
                {formatDistance(trackingStats?.totalDistance || 0)}
              </p>
              <p className="text-xs text-green-100 mt-1">누적</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm text-blue-100">총 시간</span>
              </div>
              <p className="text-3xl font-bold">
                {formatDuration(trackingStats?.totalDuration || 0)}
              </p>
              <p className="text-xs text-blue-100 mt-1">누적</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5" />
                <span className="text-sm text-orange-100">레벨</span>
              </div>
              <p className="text-3xl font-bold">{userStats?.level || 1}</p>
              <p className="text-xs text-orange-100 mt-1">등산 레벨</p>
            </div>
          </div>
        </section>

        {/* Recent Hikes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">최근 산행</h2>
            <button
              onClick={() => router.push('/record')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              전체 보기
            </button>
          </div>

          {trackingStats?.totalHikes === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">아직 완료한 산행이 없습니다</p>
              <button
                onClick={() => router.push('/record')}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                산행 시작하기
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-500 text-center">
                산행 기록은 다음 단계에서 표시됩니다
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
