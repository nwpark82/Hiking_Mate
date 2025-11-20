/**
 * OAuth 콜백 핸들러
 * Google 소셜 로그인 후 리디렉션 처리
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      // Exchange code for session
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL('/auth/login?error=google_auth_failed', request.url)
      );
    }
  }

  // 성공: 홈으로 리디렉션
  return NextResponse.redirect(new URL('/', request.url));
}
