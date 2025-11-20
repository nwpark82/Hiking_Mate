/**
 * Naver OAuth 콜백 핸들러
 * Custom OAuth 구현 - Naver 인증 후 사용자 생성/로그인 처리
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
      new URL('/auth/login?error=naver_cancelled', request.url)
    );
  }

  // Authorization code 확인
  if (!code) {
    console.error('Naver callback: No authorization code received');
    return NextResponse.redirect(
      new URL('/auth/login?error=naver_no_code', request.url)
    );
  }

  // CSRF 방지: state 검증
  if (!state) {
    console.error('Naver callback: No state parameter');
    return NextResponse.redirect(
      new URL('/auth/login?error=naver_csrf', request.url)
    );
  }

  try {
    // 1. Access token 발급
    const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!,
        client_secret: process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET!,
        code,
        state,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Naver token error:', errorData);
      throw new Error('Failed to get Naver access token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // 2. 사용자 정보 가져오기
    const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get Naver user info');
    }

    const naverUserData = await userResponse.json();
    console.log('Naver user data:', naverUserData);

    // Naver 사용자 정보 구조:
    // {
    //   resultcode: "00",
    //   message: "success",
    //   response: {
    //     id: "...",
    //     email: "user@example.com",
    //     name: "홍길동",
    //     nickname: "닉네임",
    //     profile_image: "https://..."
    //   }
    // }

    if (naverUserData.resultcode !== '00') {
      throw new Error('Naver API returned error');
    }

    const naverUser = naverUserData.response;
    const email = naverUser.email;
    const nickname = naverUser.nickname || naverUser.name;
    const profileImage = naverUser.profile_image;

    if (!email) {
      throw new Error('Naver 계정에 이메일이 없습니다.');
    }

    // 3. Supabase에 사용자 생성 또는 로그인
    const supabase = createRouteHandlerClient({ cookies });

    // 3.1 이메일로 기존 사용자 확인
    const { data: existingAuth } = await supabase.auth.admin.listUsers();
    const existingUser = existingAuth?.users?.find(u => u.email === email);

    if (existingUser) {
      // 기존 사용자: 세션 생성
      const { error: signInError } = await supabase.auth.setSession({
        access_token: existingUser.id,
        refresh_token: '',
      });

      if (signInError) {
        console.error('Session creation error:', signInError);
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
            auth_provider: 'naver',
          },
        },
      });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        throw signUpError;
      }

      console.log('New Naver user created:', authData);
    }

    // 4. 성공: 홈으로 리디렉션
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error: any) {
    console.error('Naver OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message || 'naver_failed')}`, request.url)
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
