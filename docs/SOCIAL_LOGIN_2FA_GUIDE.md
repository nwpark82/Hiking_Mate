# 소셜 로그인 및 2FA 구현 가이드

## 📋 목차

1. [소셜 로그인 구현](#소셜-로그인-구현)
   - [Google 로그인](#google-로그인)
   - [Kakao 로그인](#kakao-로그인)
   - [Naver 로그인](#naver-로그인)
2. [2단계 인증 (2FA) 구현](#2단계-인증-2fa-구현)
3. [구현 우선순위](#구현-우선순위)

---

## 소셜 로그인 구현

### Google 로그인

#### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스 > OAuth 동의 화면** 설정
   - 사용자 유형: 외부
   - 앱 이름: 하이킹메이트
   - 사용자 지원 이메일: 본인 이메일
   - 승인된 도메인: `hiking-mate.vercel.app`

4. **사용자 인증 정보 > OAuth 2.0 클라이언트 ID** 생성
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI:
     ```
     https://<your-supabase-project>.supabase.co/auth/v1/callback
     ```

#### 2. Supabase 설정

1. Supabase Dashboard > Authentication > Providers
2. Google 활성화
3. Client ID와 Client Secret 입력 (Google Cloud Console에서 복사)
4. Redirect URL 확인: `https://<project-id>.supabase.co/auth/v1/callback`

#### 3. 코드 구현

**lib/services/auth.ts에 추가:**

```typescript
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
    return { data: null, error: error.message };
  }
}
```

**app/auth/login/page.tsx에 버튼 추가:**

```tsx
<button
  onClick={() => signInWithGoogle()}
  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    {/* Google 아이콘 SVG */}
  </svg>
  Google로 로그인
</button>
```

**app/auth/callback/route.ts 생성:**

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/', request.url));
}
```

---

### Kakao 로그인

#### 1. Kakao Developers 설정

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 애플리케이션 추가하기
3. **앱 키** 확인: REST API 키 사용
4. **플랫폼** 설정
   - Web: `https://hiking-mate.vercel.app`
5. **카카오 로그인** 활성화
6. **Redirect URI** 등록:
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
7. **동의항목** 설정
   - 이메일 (필수)
   - 프로필 정보 (선택)

#### 2. Supabase 설정

현재 Supabase는 Kakao를 직접 지원하지 않으므로, **Custom OAuth Provider**로 설정해야 합니다.

**대안 방법:**

1. Kakao REST API를 직접 사용
2. 백엔드에서 Kakao 토큰 검증 후 Supabase 세션 생성

**lib/services/kakao-auth.ts:**

```typescript
export async function signInWithKakao() {
  const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`;

  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  window.location.href = kakaoAuthUrl;
}
```

**app/auth/kakao/callback/route.ts:**

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=kakao_failed', request.url));
  }

  try {
    // 1. Kakao 토큰 발급
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/kakao/callback`,
        code,
      }),
    });

    const { access_token } = await tokenResponse.json();

    // 2. Kakao 사용자 정보 가져오기
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const kakaoUser = await userResponse.json();

    // 3. Supabase 사용자 생성 또는 로그인
    const email = kakaoUser.kakao_account.email;
    const username = kakaoUser.properties.nickname;

    // Supabase에 사용자 등록/로그인 로직 구현 필요

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Kakao login error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=kakao_failed', request.url));
  }
}
```

---

### Naver 로그인

#### 1. Naver Developers 설정

1. [Naver Developers](https://developers.naver.com/apps/) 접속
2. 애플리케이션 등록
3. **API 설정**
   - 사용 API: 네이버 로그인
   - 제공 정보: 이메일, 이름 (필수)
4. **서비스 URL**: `https://hiking-mate.vercel.app`
5. **Callback URL**: `https://<your-supabase-project>.supabase.co/auth/v1/callback`

#### 2. 구현 (Kakao와 유사)

Naver도 Supabase에서 직접 지원하지 않으므로, Kakao와 동일한 방식으로 구현합니다.

---

## 2단계 인증 (2FA) 구현

### Supabase MFA (Multi-Factor Authentication)

Supabase는 TOTP (Time-based One-Time Password) 기반 MFA를 지원합니다.

#### 1. Supabase 설정

1. Supabase Dashboard > Authentication > Settings
2. **Multi-Factor Authentication** 활성화

#### 2. 코드 구현

**lib/services/mfa.ts 생성:**

```typescript
import { supabase } from '@/lib/supabase/client';

/**
 * MFA 등록 시작
 */
export async function enrollMFA() {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) throw error;

    // data.qr_code: QR 코드 이미지 URL
    // data.secret: 수동 입력용 시크릿 키
    // data.id: Factor ID

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * MFA 검증 및 활성화
 */
export async function verifyMFA(factorId: string, code: string) {
  try {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * 로그인 시 MFA 챌린지
 */
export async function createMFAChallenge(factorId: string) {
  try {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * MFA 코드 검증 (로그인 시)
 */
export async function verifyMFACode(factorId: string, challengeId: string, code: string) {
  try {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data, null, error: error.message };
  }
}

/**
 * MFA 해제
 */
export async function unenrollMFA(factorId: string) {
  try {
    const { data, error } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
```

**app/settings/security/page.tsx 생성 (2FA 설정 페이지):**

```tsx
'use client';

import { useState } from 'react';
import { enrollMFA, verifyMFA } from '@/lib/services/mfa';
import { QRCodeSVG } from 'qrcode.react';

export default function SecuritySettingsPage() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleEnrollMFA = async () => {
    const { data, error } = await enrollMFA();

    if (error) {
      alert(error);
      return;
    }

    if (data) {
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    }
  };

  const handleVerifyMFA = async () => {
    const { error } = await verifyMFA(factorId, verificationCode);

    if (error) {
      alert(error);
      return;
    }

    alert('2단계 인증이 활성화되었습니다!');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">보안 설정</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">2단계 인증 (2FA)</h2>

        {!qrCode ? (
          <button
            onClick={handleEnrollMFA}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
          >
            2단계 인증 활성화
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 font-medium">
                Google Authenticator 또는 Authy 앱으로 QR 코드를 스캔하세요:
              </p>
              <QRCodeSVG value={qrCode} size={200} />
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                또는 수동으로 입력:
              </p>
              <code className="bg-gray-100 px-3 py-2 rounded">{secret}</code>
            </div>

            <div>
              <label className="block mb-2 font-medium">인증 코드 입력:</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleVerifyMFA}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              인증 완료
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**app/auth/login/page.tsx에 MFA 확인 추가:**

```tsx
// 로그인 후 MFA 확인
const { user, error: signInError } = await signIn(email, password);

if (user && !signInError) {
  // MFA가 활성화되어 있는지 확인
  const { data: factors } = await supabase.auth.mfa.listFactors();

  if (factors && factors.totp.length > 0) {
    // MFA 챌린지 페이지로 리디렉션
    router.push('/auth/mfa');
  } else {
    // 홈으로 이동
    router.push('/');
  }
}
```

---

## 구현 우선순위

### 1. 즉시 구현 가능 (Supabase 기본 지원)
- ✅ **Google 로그인** - Supabase에서 바로 지원
- ✅ **2FA (TOTP)** - Supabase MFA 기능 사용

### 2. 추가 개발 필요
- ⚠️ **Kakao 로그인** - Custom OAuth 구현 필요
- ⚠️ **Naver 로그인** - Custom OAuth 구현 필요

### 3. 권장 구현 순서

1. **Google 로그인** (1-2시간)
   - 가장 간단하고 많이 사용됨
   - Supabase 직접 지원

2. **2FA (TOTP)** (2-3시간)
   - 보안 강화에 중요
   - Supabase MFA 기능 사용

3. **Kakao/Naver 로그인** (각 4-6시간)
   - 한국 사용자를 위해 필요
   - Custom 구현 필요

---

## 필요한 패키지

```bash
npm install qrcode.react
```

---

## 환경 변수 (.env.local)

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Kakao OAuth
NEXT_PUBLIC_KAKAO_REST_API_KEY=your_kakao_rest_api_key

# Naver OAuth
NEXT_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id
NEXT_PUBLIC_NAVER_CLIENT_SECRET=your_naver_client_secret

# Site URL
NEXT_PUBLIC_SITE_URL=https://hiking-mate.vercel.app
```

---

## 보안 고려사항

1. **OAuth State 파라미터** 사용으로 CSRF 방지
2. **토큰 안전한 저장** - HttpOnly 쿠키 사용
3. **MFA 백업 코드** 생성 및 안전한 저장
4. **Session 만료 시간** 적절히 설정
5. **로그아웃 시 모든 세션 무효화**

---

## 참고 자료

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase MFA Guide](https://supabase.com/docs/guides/auth/auth-mfa)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Kakao Login](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Naver Login](https://developers.naver.com/docs/login/overview/)
