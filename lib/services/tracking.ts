import { supabase } from '@/lib/supabase/client';
import type { GPSPoint } from '@/lib/utils/gps';

export interface TrackingSession {
  id: string;
  user_id: string;
  trail_id?: string | null;
  start_time: string;
  end_time?: string | null;
  distance: number; // meters
  duration: number; // seconds
  track_points: GPSPoint[];
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateTrackingSessionData {
  trail_id?: string | null;
  start_time: string;
  end_time?: string;
  distance: number;
  duration: number;
  track_points: GPSPoint[];
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
}

/**
 * 산행 세션을 저장합니다
 */
export async function saveTrackingSession(data: CreateTrackingSessionData) {
  try {
    // 현재 로그인한 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data: session, error } = await supabase
      .from('tracking_sessions')
      .insert({
        user_id: user.id,
        trail_id: data.trail_id,
        start_time: data.start_time,
        end_time: data.end_time || new Date().toISOString(),
        distance: Math.round(data.distance), // meters로 저장
        duration: Math.round(data.duration), // seconds로 저장
        track_points: data.track_points,
        status: data.status || 'completed',
      })
      .select()
      .single();

    if (error) throw error;

    // 사용자 통계 업데이트
    await updateUserStats(user.id);

    return { session, error: null };
  } catch (error: any) {
    console.error('Error saving tracking session:', error);
    return { session: null, error: error.message };
  }
}

/**
 * 사용자 통계 업데이트 (총 거리, 총 산행 횟수)
 */
async function updateUserStats(userId: string) {
  try {
    // 완료된 세션들의 총 거리 계산
    const { data: sessions } = await supabase
      .from('tracking_sessions')
      .select('distance')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (sessions) {
      const totalDistance = sessions.reduce((sum, s) => sum + (s.distance || 0), 0);
      const totalTrails = sessions.length;

      await supabase
        .from('users')
        .update({
          total_distance: Math.round(totalDistance),
          total_trails: totalTrails,
        })
        .eq('id', userId);
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

/**
 * 사용자의 산행 세션 목록을 가져옵니다
 */
export async function getUserTrackingSessions(userId: string, limit = 20, offset = 0) {
  try {
    const { data: sessions, error, count } = await supabase
      .from('tracking_sessions')
      .select(`
        *,
        trail:trails(id, name, region, difficulty)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { sessions, count, error: null };
  } catch (error: any) {
    console.error('Error fetching tracking sessions:', error);
    return { sessions: null, count: 0, error: error.message };
  }
}

/**
 * 특정 산행 세션의 상세 정보를 가져옵니다
 */
export async function getTrackingSessionById(sessionId: string) {
  try {
    const { data: session, error } = await supabase
      .from('tracking_sessions')
      .select(`
        *,
        user:users(id, username, avatar_url),
        trail:trails(id, name, region, difficulty, distance, elevation_gain)
      `)
      .eq('id', sessionId)
      .single();

    if (error) throw error;

    return { session, error: null };
  } catch (error: any) {
    console.error('Error fetching tracking session:', error);
    return { session: null, error: error.message };
  }
}

/**
 * 산행 세션을 수정합니다
 */
export async function updateTrackingSession(
  sessionId: string,
  updates: Partial<CreateTrackingSessionData>
) {
  try {
    const { data: session, error } = await supabase
      .from('tracking_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return { session, error: null };
  } catch (error: any) {
    console.error('Error updating tracking session:', error);
    return { session: null, error: error.message };
  }
}

/**
 * 산행 세션을 삭제합니다
 */
export async function deleteTrackingSession(sessionId: string) {
  try {
    const { error } = await supabase
      .from('tracking_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    // 사용자 통계 업데이트
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await updateUserStats(user.id);
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error deleting tracking session:', error);
    return { error: error.message };
  }
}

/**
 * 내 산행 기록 통계를 가져옵니다
 */
export async function getMyTrackingStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data: sessions } = await supabase
      .from('tracking_sessions')
      .select('distance, duration, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (!sessions || sessions.length === 0) {
      return {
        stats: {
          totalHikes: 0,
          totalDistance: 0,
          totalDuration: 0,
          averageDistance: 0,
          averageDuration: 0,
          longestHike: 0,
          recentHikes: [],
        },
        error: null,
      };
    }

    const totalHikes = sessions.length;
    const totalDistance = sessions.reduce((sum, s) => sum + (s.distance || 0), 0);
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const longestHike = Math.max(...sessions.map(s => s.distance || 0));

    return {
      stats: {
        totalHikes,
        totalDistance: Math.round(totalDistance),
        totalDuration: Math.round(totalDuration),
        averageDistance: Math.round(totalDistance / totalHikes),
        averageDuration: Math.round(totalDuration / totalHikes),
        longestHike: Math.round(longestHike),
        recentHikes: sessions.slice(0, 5),
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching tracking stats:', error);
    return { stats: null, error: error.message };
  }
}
