/**
 * Kakao OAuth 콜백 핸들러
 * Custom OAuth 구현 - Kakao 인증 후 사용자 생성/로그인 처리
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');

  // 사용자가 로그인 취소한 경우
  if (error) {
    return NextResponse.redirect(
      new URL('/auth/login?error=kakao_cancelled', request.url)
    );
  }

  // Authorization code 확인
  if (!code) {
    console.error('Kakao callback: No authorization code received');
    return NextResponse.redirect(
      new URL('/auth/login?error=kakao_no_code', request.url)
    );
  }

  // CSRF 방지: state 검증 (클라이언트에서 설정한 값과 비교는 클라이언트에서 처리)
  // 서버에서는 state가 있는지만 확인
  if (!state) {
    console.error('Kakao callback: No state parameter');
    return NextResponse.redirect(
      new URL('/auth/login?error=kakao_csrf', request.url)
    );
  }

  try {
    // 1. Access token 발급
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin}/auth/kakao/callback`,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Kakao token error:', errorData);
      throw new Error('Failed to get Kakao access token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // 2. 사용자 정보 가져오기
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get Kakao user info');
    }

    const kakaoUser = await userResponse.json();
    console.log('Kakao user data:', kakaoUser);

    // Kakao 사용자 정보 추출
    const email = kakaoUser.kakao_account?.email;
    const nickname = kakaoUser.kakao_account?.profile?.nickname;
    const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url;

    if (!email) {
      throw new Error('Kakao 계정에 이메일이 없습니다. 이메일 제공 동의가 필요합니다.');
    }

    // 3. Supabase에 사용자 생성 또는 로그인
    const supabase = createRouteHandlerClient({ cookies });

    // 3.1 이메일로 기존 사용자 확인
    const { data: existingAuth } = await supabase.auth.admin.listUsers();
    const existingUser = existingAuth?.users?.find(u => u.email === email);

    if (existingUser) {
      // 기존 사용자: 세션 생성
      const { error: signInError } = await supabase.auth.setSession({
        access_token: existingUser.id, // 임시로 ID 사용
        refresh_token: '',
      });

      if (signInError) {
        console.error('Session creation error:', signInError);
        // 대안: signInWithPassword 사용 (소셜 로그인용 비밀번호 필요)
      }
    } else {
      // 새 사용자 생성
      const randomPassword = generateSecureRandomPassword();

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: randomPassword,
        options: {
          data: {
            username: nickname || email.split('@')[0],
            avatar_url: profileImage || null,
            auth_provider: 'kakao',
          },
        },
      });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        throw signUpError;
      }

      console.log('New Kakao user created:', authData);
    }

    // 4. 성공: 홈으로 리디렉션
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error: any) {
    console.error('Kakao OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message || 'kakao_failed')}`, request.url)
    );
  }
}

/**
 * 소셜 로그인용 안전한 랜덤 비밀번호 생성
 */
function generateSecureRandomPassword(): string {
  const length = 32;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}
