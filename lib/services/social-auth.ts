/**
 * 소셜 로그인 서비스
 * Google, Kakao, Naver 소셜 로그인 처리
 */

import { supabase } from '@/lib/supabase/client';

/**
 * Google 소셜 로그인
 * Supabase가 기본 지원하는 OAuth Provider
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Google login error:', error);
    return { data: null, error: error.message || 'Google 로그인에 실패했습니다.' };
  }
}

/**
 * Kakao 소셜 로그인 시작
 * Custom OAuth 구현 - Kakao 인증 페이지로 리디렉션
 */
export function signInWithKakao() {
  const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`;

  if (!KAKAO_REST_API_KEY) {
    console.error('Kakao REST API Key가 설정되지 않았습니다.');
    alert('Kakao 로그인이 설정되지 않았습니다. 관리자에게 문의하세요.');
    return;
  }

  // CSRF 방지를 위한 state 생성
  const state = generateRandomState();
  sessionStorage.setItem('kakao_oauth_state', state);

  // Kakao OAuth 인증 URL
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=${state}`;

  // Kakao 로그인 페이지로 리디렉션
  window.location.href = kakaoAuthUrl;
}

/**
 * Naver 소셜 로그인 시작
 * Custom OAuth 구현 - Naver 인증 페이지로 리디렉션
 */
export function signInWithNaver() {
  const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
  const REDIRECT_URI = `${window.location.origin}/auth/naver/callback`;

  if (!NAVER_CLIENT_ID) {
    console.error('Naver Client ID가 설정되지 않았습니다.');
    alert('Naver 로그인이 설정되지 않았습니다. 관리자에게 문의하세요.');
    return;
  }

  // CSRF 방지를 위한 state 생성
  const state = generateRandomState();
  sessionStorage.setItem('naver_oauth_state', state);

  // Naver OAuth 인증 URL
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;

  // Naver 로그인 페이지로 리디렉션
  window.location.href = naverAuthUrl;
}

/**
 * CSRF 방지를 위한 랜덤 state 생성
 */
function generateRandomState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 소셜 로그인용 안전한 랜덤 비밀번호 생성
 * 사용자는 이 비밀번호를 모름 (소셜 로그인만 사용)
 */
export function generateSecureRandomPassword(): string {
  const length = 32;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}
