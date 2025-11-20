# Kakao OAuth 구현 상세 가이드

## 목차
1. [Kakao Developers 설정](#1-kakao-developers-설정)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [백엔드 API 구현](#3-백엔드-api-구현)
4. [프론트엔드 구현](#4-프론트엔드-구현)
5. [Supabase 사용자 연동](#5-supabase-사용자-연동)

---

## 1. Kakao Developers 설정

### 1.1 애플리케이션 생성

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 로그인 후 "내 애플리케이션" > "애플리케이션 추가하기"
3. 앱 이름: "하이킹메이트"
4. 사업자명: 본인 이름

### 1.2 앱 키 확인

앱 설정 > 요약 정보에서 다음 키를 확인:
- **REST API 키**: 우리가 사용할 키
- JavaScript 키: 사용 안 함
- Native 앱 키: 사용 안 함

```
예시: 1234567890abcdef1234567890abcdef
```

### 1.3 플랫폼 설정

앱 설정 > 플랫폼에서:

**Web 플랫폼 추가:**
- 개발 환경: `http://localhost:3000`
- 프로덕션: `https://hiking-mate.vercel.app`

### 1.4 Redirect URI 설정

제품 설정 > 카카오 로그인 > Redirect URI 등록:

**개발 환경:**
```
http://localhost:3000/auth/kakao/callback
```

**프로덕션:**
```
https://hiking-mate.vercel.app/auth/kakao/callback
```

### 1.5 동의항목 설정

제품 설정 > 카카오 로그인 > 동의항목:

| 항목 | 설정 | 필수 여부 |
|------|------|-----------|
| 닉네임 | 수집 | 선택 |
| 프로필 사진 | 수집 | 선택 |
| **이메일** | **수집** | **필수** ⭐ |

**중요:** 이메일은 필수로 설정해야 Supabase 사용자와 연동 가능합니다.

---

## 2. 환경 변수 설정

`.env.local` 파일에 추가:

```env
# Kakao OAuth
NEXT_PUBLIC_KAKAO_REST_API_KEY=your_rest_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production
# NEXT_PUBLIC_SITE_URL=https://hiking-mate.vercel.app
```

---

## 3. 백엔드 API 구현

### 3.1 Kakao 인증 시작 함수

`lib/services/kakao-auth.ts` 생성:

```typescript
/**
 * Kakao OAuth 로그인 시작
 * 사용자를 Kakao 인증 페이지로 리디렉션
 */
export function initiateKakaoLogin() {
  const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/kakao/callback`;

  if (!KAKAO_REST_API_KEY) {
    throw new Error('Kakao REST API Key가 설정되지 않았습니다.');
  }

  // Kakao OAuth 인증 URL
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  // Kakao 로그인 페이지로 리디렉션
  window.location.href = kakaoAuthUrl;
}
```

### 3.2 Kakao 콜백 처리 API Route

`app/auth/kakao/callback/route.ts` 생성:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Kakao OAuth 콜백 핸들러
 *
 * Flow:
 * 1. Kakao로부터 authorization code 받기
 * 2. Code를 access token으로 교환
 * 3. Access token으로 사용자 정보 가져오기
 * 4. Supabase에 사용자 생성 또는 로그인
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // 1. Authorization code 확인
  if (!code) {
    console.error('Kakao callback: No authorization code received');
    return NextResponse.redirect(
      new URL('/auth/login?error=kakao_no_code', request.url)
    );
  }

  try {
    // 2. Access token 발급
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/kakao/callback`,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Kakao access token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // 3. 사용자 정보 가져오기
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

    // Kakao 사용자 정보 구조:
    // {
    //   id: 123456789,
    //   kakao_account: {
    //     email: "user@example.com",
    //     profile: {
    //       nickname: "홍길동",
    //       profile_image_url: "https://..."
    //     }
    //   }
    // }

    const email = kakaoUser.kakao_account?.email;
    const nickname = kakaoUser.kakao_account?.profile?.nickname;
    const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url;

    if (!email) {
      throw new Error('Kakao 계정에 이메일이 없습니다. 이메일 제공 동의가 필요합니다.');
    }

    // 4. Supabase에 사용자 생성 또는 로그인
    const supabase = createRouteHandlerClient({ cookies });

    // 4.1 이메일로 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // 기존 사용자 로그인
      // Supabase는 비밀번호 로그인만 지원하므로,
      // 소셜 로그인 전용 비밀번호를 생성하거나 세션을 직접 생성해야 함

      // 방법 1: Admin API로 세션 생성 (권장)
      const { data: session, error: sessionError } = await supabase.auth.admin.createSession({
        user: existingUser.id,
      });

      if (sessionError) throw sessionError;

      // 방법 2: 또는 임시 비밀번호로 signIn 처리
      // (이 경우 소셜 로그인 시 비밀번호를 저장해야 함)
    } else {
      // 새 사용자 생성
      // Supabase Auth에 사용자 생성
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

      if (signUpError) throw signUpError;

      // Profile 테이블은 Database Trigger로 자동 생성됨
    }

    // 5. 성공: 홈으로 리디렉션
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error: any) {
    console.error('Kakao OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}

/**
 * 소셜 로그인용 안전한 랜덤 비밀번호 생성
 * 사용자는 이 비밀번호를 알 필요가 없음 (소셜 로그인만 사용)
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
```

---

## 4. 프론트엔드 구현

### 4.1 로그인 페이지에 Kakao 버튼 추가

`app/auth/login/page.tsx` 수정:

```typescript
import { initiateKakaoLogin } from '@/lib/services/kakao-auth';

export default function LoginPage() {
  // ... 기존 코드 ...

  return (
    <div>
      {/* 기존 이메일/비밀번호 로그인 폼 */}
      <form onSubmit={handleSubmit}>
        {/* ... */}
      </form>

      {/* 소셜 로그인 구분선 */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">또는</span>
        </div>
      </div>

      {/* 소셜 로그인 버튼들 */}
      <div className="space-y-3">
        {/* Kakao 로그인 버튼 */}
        <button
          type="button"
          onClick={initiateKakaoLogin}
          className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#000000] py-3 rounded-lg font-semibold hover:bg-[#FDD835] transition"
        >
          <KakaoIcon />
          카카오로 시작하기
        </button>

        {/* Google 로그인 버튼 (기존) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          <GoogleIcon />
          Google로 시작하기
        </button>
      </div>
    </div>
  );
}

// Kakao 아이콘 컴포넌트
function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 0C4.477 0 0 3.58 0 8c0 2.86 1.847 5.37 4.633 6.867l-.933 3.467c-.067.25.2.467.433.333l4.233-2.8c.533.067 1.067.133 1.634.133 5.523 0 10-3.58 10-8s-4.477-8-10-8z"
        fill="#000000"
      />
    </svg>
  );
}
```

### 4.2 Kakao 로그인 에러 처리

`app/auth/login/page.tsx`에 에러 메시지 처리:

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    // URL 파라미터에서 에러 확인
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        'kakao_no_code': 'Kakao 로그인이 취소되었습니다.',
        'kakao_failed': 'Kakao 로그인에 실패했습니다. 다시 시도해주세요.',
      };

      setError(
        errorMessages[errorParam] ||
        decodeURIComponent(errorParam)
      );
    }
  }, [searchParams]);

  // ... 나머지 코드
}
```

---

## 5. Supabase 사용자 연동

### 5.1 문제: Supabase는 비밀번호 인증만 지원

Supabase Auth는 기본적으로 이메일/비밀번호 인증을 사용합니다.
소셜 로그인 사용자는 비밀번호가 없으므로, 다음 방법 중 하나를 선택해야 합니다:

#### 방법 1: 랜덤 비밀번호 생성 (권장)

```typescript
// 소셜 로그인 사용자를 위한 랜덤 비밀번호 생성
const randomPassword = generateSecureRandomPassword();

await supabase.auth.signUp({
  email,
  password: randomPassword, // 사용자는 이 비밀번호를 모름
  options: {
    data: {
      username: nickname,
      auth_provider: 'kakao', // 어떤 방법으로 가입했는지 표시
    },
  },
});
```

**장점:**
- 구현이 간단
- Supabase의 기본 인증 시스템 그대로 사용

**단점:**
- 사용자가 나중에 이메일/비밀번호로 로그인할 수 없음
  (비밀번호 재설정 기능으로 해결 가능)

#### 방법 2: Supabase Admin API 사용

```typescript
// Admin API로 세션 직접 생성 (서버에서만 가능)
const { data, error } = await supabase.auth.admin.createSession({
  user: userId,
});
```

**장점:**
- 더 정확한 OAuth 구현

**단점:**
- 서버 환경에서만 가능 (API Route 필요)
- Admin 권한 필요

#### 방법 3: profiles 테이블에 auth_provider 컬럼 추가

```sql
-- profiles 테이블에 컬럼 추가
ALTER TABLE profiles
ADD COLUMN auth_provider TEXT DEFAULT 'email';

-- 'email', 'kakao', 'google', 'naver' 등으로 구분
```

이렇게 하면 사용자가 어떤 방법으로 가입했는지 추적할 수 있습니다.

### 5.2 Database Trigger 수정

기존 Profile 자동 생성 Trigger에 auth_provider 추가:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. 테스트

### 6.1 로컬 테스트

1. 개발 서버 실행:
```bash
npm run dev
```

2. http://localhost:3000/auth/login 접속

3. "카카오로 시작하기" 버튼 클릭

4. Kakao 로그인 페이지에서 로그인

5. 권한 동의 후 자동으로 앱으로 돌아오는지 확인

### 6.2 디버깅

콘솔에서 확인할 수 있는 로그:

```typescript
// lib/services/kakao-auth.ts
console.log('Kakao OAuth URL:', kakaoAuthUrl);

// app/auth/kakao/callback/route.ts
console.log('1. Authorization code:', code);
console.log('2. Access token:', access_token);
console.log('3. Kakao user data:', kakaoUser);
console.log('4. Email:', email);
console.log('5. Supabase user created:', authData);
```

---

## 7. 보안 고려사항

### 7.1 CSRF 방지

OAuth state 파라미터 사용:

```typescript
// 로그인 시작 시 state 생성
const state = generateRandomState();
sessionStorage.setItem('oauth_state', state);

const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code&state=${state}`;

// 콜백에서 state 검증
const receivedState = requestUrl.searchParams.get('state');
const savedState = sessionStorage.getItem('oauth_state');

if (receivedState !== savedState) {
  throw new Error('CSRF attack detected');
}
```

### 7.2 환경 변수 보안

- `.env.local`은 절대 Git에 커밋하지 않기
- Vercel에서는 Environment Variables에 안전하게 저장
- REST API Key는 프론트엔드에 노출되어도 됨 (Redirect URI 제한으로 보호)

---

## 8. Naver 로그인 구현

Naver도 동일한 방식으로 구현:

```typescript
// lib/services/naver-auth.ts
export function initiateNaverLogin() {
  const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/naver/callback`;
  const STATE = generateRandomState();

  sessionStorage.setItem('naver_oauth_state', STATE);

  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;

  window.location.href = naverAuthUrl;
}
```

콜백 처리는 Kakao와 거의 동일하며, API 엔드포인트만 다릅니다:

- Token: `https://nid.naver.com/oauth2.0/token`
- User Info: `https://openapi.naver.com/v1/nid/me`

---

## 9. 프로덕션 체크리스트

배포 전 확인사항:

- [ ] Kakao Developers에 프로덕션 도메인 등록
- [ ] Redirect URI에 프로덕션 URL 추가
- [ ] Vercel Environment Variables 설정
- [ ] 이메일 동의항목 필수로 설정
- [ ] HTTPS 사용 확인
- [ ] 에러 로깅 설정
- [ ] 사용자 이메일 인증 처리 (선택)

---

## 10. 참고 자료

- [Kakao Developers - 로그인](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Kakao REST API 레퍼런스](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api)
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
