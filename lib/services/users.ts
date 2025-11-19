import { supabase } from '@/lib/supabase/client';
import { uploadImage, deleteImage } from './storage';

export interface UserProfile {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  level: number;
  total_distance: number;
  total_trails: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  username?: string;
  full_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

/**
 * 사용자 프로필을 조회합니다
 */
export async function getUserProfile(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { profile, error: null };
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return { profile: null, error: error.message };
  }
}

/**
 * 현재 로그인한 사용자의 프로필을 조회합니다
 */
export async function getMyProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    return await getUserProfile(user.id);
  } catch (error: any) {
    console.error('Error fetching my profile:', error);
    return { profile: null, error: error.message };
  }
}

/**
 * 사용자 프로필을 업데이트합니다
 */
export async function updateProfile(userId: string, updates: UpdateProfileData) {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { profile, error: null };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { profile: null, error: error.message };
  }
}

/**
 * 내 프로필을 업데이트합니다
 */
export async function updateMyProfile(updates: UpdateProfileData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    return await updateProfile(user.id, updates);
  } catch (error: any) {
    console.error('Error updating my profile:', error);
    return { profile: null, error: error.message };
  }
}

/**
 * 아바타 이미지를 업로드하고 프로필을 업데이트합니다
 */
export async function uploadAvatar(file: File) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    // 기존 아바타 URL 가져오기
    const { profile: currentProfile } = await getUserProfile(user.id);
    const oldAvatarUrl = currentProfile?.avatar_url;

    // 새 아바타 업로드
    const { url, error: uploadError } = await uploadImage(
      file,
      'user-avatars',
      user.id, // 사용자 ID를 폴더명으로 사용
      true // 압축 적용
    );

    if (uploadError || !url) {
      throw new Error(uploadError || '이미지 업로드에 실패했습니다.');
    }

    // 프로필 업데이트
    const { profile, error: updateError } = await updateProfile(user.id, {
      avatar_url: url,
    });

    if (updateError) throw new Error(updateError);

    // 기존 아바타 삭제 (업로드 성공 후)
    if (oldAvatarUrl && oldAvatarUrl !== url) {
      await deleteImage('user-avatars', oldAvatarUrl);
    }

    return { profile, url, error: null };
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return { profile: null, url: null, error: error.message };
  }
}

/**
 * 사용자 이름 중복 확인
 */
export async function checkUsernameAvailability(username: string, excludeUserId?: string) {
  try {
    let query = supabase
      .from('users')
      .select('id')
      .eq('username', username);

    // 현재 사용자 제외
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const isAvailable = !data || data.length === 0;
    return { isAvailable, error: null };
  } catch (error: any) {
    console.error('Error checking username:', error);
    return { isAvailable: false, error: error.message };
  }
}

/**
 * 사용자 활동 통계를 조회합니다
 */
export async function getUserStats(userId: string) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_distance, total_trails, level, created_at')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 게시글 수 조회
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 댓글 수 조회
    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 받은 좋아요 수 조회
    const { count: likesCount } = await supabase
      .from('likes')
      .select('post_id', { count: 'exact', head: true })
      .in('post_id',
        supabase
          .from('posts')
          .select('id')
          .eq('user_id', userId)
      );

    return {
      stats: {
        totalDistance: user.total_distance || 0,
        totalTrails: user.total_trails || 0,
        level: user.level || 1,
        postsCount: postsCount || 0,
        commentsCount: commentsCount || 0,
        likesReceived: likesCount || 0,
        memberSince: user.created_at,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return { stats: null, error: error.message };
  }
}

/**
 * 사용자 레벨을 계산합니다 (거리 기반)
 */
export function calculateUserLevel(totalDistance: number): number {
  // 1km = 1 포인트
  // 레벨 1: 0-10km
  // 레벨 2: 10-30km
  // 레벨 3: 30-60km
  // 레벨 4: 60-100km
  // 레벨 5: 100km+

  const distanceInKm = totalDistance / 1000;

  if (distanceInKm < 10) return 1;
  if (distanceInKm < 30) return 2;
  if (distanceInKm < 60) return 3;
  if (distanceInKm < 100) return 4;
  return 5;
}

/**
 * 사용자 레벨 이름을 반환합니다
 */
export function getLevelName(level: number): string {
  const levelNames = {
    1: '입문자',
    2: '초보 등산가',
    3: '등산가',
    4: '베테랑',
    5: '마스터',
  };
  return levelNames[level as keyof typeof levelNames] || '입문자';
}

/**
 * 다음 레벨까지 필요한 거리를 반환합니다
 */
export function getDistanceToNextLevel(totalDistance: number): number {
  const distanceInKm = totalDistance / 1000;

  if (distanceInKm < 10) return (10 - distanceInKm) * 1000;
  if (distanceInKm < 30) return (30 - distanceInKm) * 1000;
  if (distanceInKm < 60) return (60 - distanceInKm) * 1000;
  if (distanceInKm < 100) return (100 - distanceInKm) * 1000;
  return 0; // 최대 레벨
}

/**
 * 계정을 삭제합니다 (복구 불가능)
 */
export async function deleteAccount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    // 1. users 테이블에서 프로필 삭제 (CASCADE로 관련 데이터 자동 삭제)
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (profileError) throw profileError;

    // 2. Supabase Auth에서 계정 삭제
    const { error: authError } = await supabase.rpc('delete_user');

    // RPC 함수가 없는 경우 사용자에게 알림
    if (authError) {
      console.warn('Auth deletion failed, user should contact support:', authError);
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return { error: error.message };
  }
}
