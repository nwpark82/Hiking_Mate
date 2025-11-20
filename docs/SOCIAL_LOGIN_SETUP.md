# 소셜 로그인 및 2FA 설정 가이드

## 📋 목차

1. [Google 로그인 설정](#google-로그인-설정)
2. [Kakao 로그인 설정](#kakao-로그인-설정)
3. [Naver 로그인 설정](#naver-로그인-설정)
4. [2FA 설정](#2fa-설정)
5. [환경 변수 설정](#환경-변수-설정)
6. [테스트](#테스트)

---

## Google 로그인 설정

### 1. Google Cloud Console 설정

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - 프로젝트 생성 또는 선택

2. **OAuth 동의 화면 설정**
   - 사이드바 > API 및 서비스 > OAuth 동의 화면
   - 사용자 유형: 외부
   - 앱 이름: 하이킹메이트
   - 사용자 지원 이메일: 본인 이메일
   - 승인된 도메인: `hiking-mate.vercel.app`

3. **OAuth 2.0 클라이언트 ID 생성**
   - 사이드바 > API 및 서비스 > 사용자 인증 정보
   - + 사용자 인증 정보 만들기 > OAuth 클라이언트 ID
   - 애플리케이션 유형: 웹 애플리케이션
   - 이름: 하이킹메이트
   - 승인된 리디렉션 URI:
     ```
     https://<your-supabase-project-id>.supabase.co/auth/v1/callback
     ```

4. **Client ID와 Client Secret 복사**

### 2. Supabase 설정

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Google Provider 활성화**
   - Authentication > Providers > Google
   - Enable 토글
   - Client ID 입력 (Google Cloud에서 복사)
   - Client Secret 입력 (Google Cloud에서 복사)
   - Save 클릭

### 3. 완료!

Google 로그인은 별도의 환경 변수 설정이 필요 없습니다.
Supabase가 모든 OAuth 플로우를 자동으로 처리합니다.

---

## Kakao 로그인 설정

### 1. Kakao Developers 설정

1. **Kakao Developers 접속**
   - https://developers.kakao.com/
   - 로그인 후 내 애플리케이션 > 애플리케이션 추가하기

2. **앱 키 확인**
   - 앱 설정 > 요약 정보
   - **REST API 키** 복사 (나중에 환경 변수로 사용)

3. **플랫폼 추가**
   - 앱 설정 > 플랫폼 > Web 플랫폼 등록
   - 사이트 도메인:
     - 개발: `http://localhost:3000`
     - 프로덕션: `https://hiking-mate.vercel.app`

4. **카카오 로그인 활성화**
   - 제품 설정 > 카카오 로그인 > 활성화 ON

5. **Redirect URI 등록**
   - 제품 설정 > 카카오 로그인 > Redirect URI
   - Redirect URI 등록:
     ```
     http://localhost:3000/auth/kakao/callback          (개발)
     https://hiking-mate.vercel.app/auth/kakao/callback (프로덕션)
     ```

6. **동의항목 설정** ⭐ 중요!
   - 제품 설정 > 카카오 로그인 > 동의항목
   - **이메일** 항목:
     - 수집: ON
     - **필수 동의**: ON ⭐
   - 닉네임, 프로필 사진: 선택 동의

### 2. 환경 변수 설정

`.env.local` 파일 수정:

```env
# Kakao OAuth
NEXT_PUBLIC_KAKAO_REST_API_KEY=1234567890abcdef1234567890abcdef
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. 프로덕션 배포 시

Vercel Environment Variables에 추가:
```
NEXT_PUBLIC_KAKAO_REST_API_KEY = [REST API 키]
NEXT_PUBLIC_SITE_URL = https://hiking-mate.vercel.app
```

---

## Naver 로그인 설정

### 1. Naver Developers 설정

1. **Naver Developers 접속**
   - https://developers.naver.com/apps/
   - 로그인 후 애플리케이션 등록

2. **애플리케이션 정보**
   - 애플리케이션 이름: 하이킹메이트
   - 사용 API: 네이버 로그인

3. **제공 정보 선택** ⭐ 중요!
   - **이메일 주소**: 필수 ⭐
   - 닉네임: 선택
   - 이름: 선택
   - 프로필 사진: 선택

4. **서비스 URL 설정**
   - 서비스 URL: `https://hiking-mate.vercel.app`

5. **Callback URL 설정**
   - Callback URL:
     ```
     http://localhost:3000/auth/naver/callback          (개발)
     https://hiking-mate.vercel.app/auth/naver/callback (프로덕션)
     ```

6. **Client ID와 Client Secret 복사**

### 2. 환경 변수 설정

`.env.local` 파일 수정:

```env
# Naver OAuth
NEXT_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id
NEXT_PUBLIC_NAVER_CLIENT_SECRET=your_naver_client_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. 프로덕션 배포 시

Vercel Environment Variables에 추가:
```
NEXT_PUBLIC_NAVER_CLIENT_ID = [Client ID]
NEXT_PUBLIC_NAVER_CLIENT_SECRET = [Client Secret]
NEXT_PUBLIC_SITE_URL = https://hiking-mate.vercel.app
```

---

## 2FA 설정

### 1. Supabase MFA 활성화

1. **Supabase Dashboard**
   - Authentication > Settings

2. **Multi-Factor Authentication 활성화**
   - Enable Multi-Factor Authentication: ON
   - TOTP (Time-based One-Time Password) 체크

### 2. 앱에서 사용법

```typescript
import { enrollMFA, verifyAndEnableMFA } from '@/lib/services/mfa';

// 1. MFA 등록 시작
const { data, error } = await enrollMFA();
if (data) {
  // data.totp.qr_code: QR 코드 이미지 (사용자에게 표시)
  // data.totp.secret: 수동 입력용 시크릿
  // data.id: Factor ID (다음 단계에 필요)
}

// 2. 사용자가 Google Authenticator로 QR 코드 스캔

// 3. 사용자가 입력한 6자리 코드로 검증 및 활성화
const { error: verifyError } = await verifyAndEnableMFA(factorId, code);
```

### 3. 권장 사용자 플로우

1. **설정 페이지에서 2FA 활성화 버튼**
2. **QR 코드 표시** (또는 수동 입력용 시크릿)
3. **사용자가 Google Authenticator/Authy 앱으로 스캔**
4. **앱에서 생성된 6자리 코드 입력**
5. **검증 성공 시 2FA 활성화 완료**

---

## 환경 변수 설정

### 개발 환경 (.env.local)

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URL (필수)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Kakao OAuth (선택)
NEXT_PUBLIC_KAKAO_REST_API_KEY=your_kakao_api_key

# Naver OAuth (선택)
NEXT_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id
NEXT_PUBLIC_NAVER_CLIENT_SECRET=your_naver_client_secret
```

### 프로덕션 환경 (Vercel)

Vercel Dashboard > Settings > Environment Variables에 추가:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://your-project.supabase.co | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your-anon-key | Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | https://hiking-mate.vercel.app | Production |
| `NEXT_PUBLIC_KAKAO_REST_API_KEY` | your_key | Production, Preview |
| `NEXT_PUBLIC_NAVER_CLIENT_ID` | your_id | Production, Preview |
| `NEXT_PUBLIC_NAVER_CLIENT_SECRET` | your_secret | Production, Preview |

---

## 테스트

### 로컬 테스트

1. **개발 서버 시작**
   ```bash
   npm run dev
   ```

2. **로그인 페이지 접속**
   ```
   http://localhost:3000/auth/login
   ```

3. **소셜 로그인 버튼 확인**
   - Google로 시작하기 (흰색 버튼)
   - 카카오로 시작하기 (노란색 버튼)
   - 네이버로 시작하기 (초록색 버튼)

4. **각 버튼 클릭하여 테스트**
   - Google: Supabase가 처리하므로 바로 작동
   - Kakao: REST API 키가 설정되어 있으면 작동
   - Naver: Client ID/Secret이 설정되어 있으면 작동

### 프로덕션 테스트

1. **Vercel 배포**
   ```bash
   git add .
   git commit -m "feat: 소셜 로그인 및 2FA 구현"
   git push
   ```

2. **Vercel에서 자동 빌드 및 배포**

3. **프로덕션 URL에서 테스트**
   ```
   https://hiking-mate.vercel.app/auth/login
   ```

---

## 문제 해결

### Google 로그인이 작동하지 않음

1. Supabase Dashboard에서 Google Provider가 활성화되어 있는지 확인
2. Google Cloud Console에서 Redirect URI가 정확한지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### Kakao 로그인이 작동하지 않음

1. `NEXT_PUBLIC_KAKAO_REST_API_KEY`가 설정되어 있는지 확인
2. Kakao Developers에서:
   - 카카오 로그인이 활성화되어 있는지
   - Redirect URI가 정확한지
   - **이메일 동의항목이 필수로 설정**되어 있는지 ⭐
3. 브라우저 콘솔에서 에러 확인

### Naver 로그인이 작동하지 않음

1. `NEXT_PUBLIC_NAVER_CLIENT_ID`, `NEXT_PUBLIC_NAVER_CLIENT_SECRET` 확인
2. Naver Developers에서:
   - 이메일 제공 정보가 필수로 선택되어 있는지
   - Callback URL이 정확한지
3. State 파라미터 검증 에러: 브라우저 쿠키 및 세션 스토리지 확인

### 2FA가 작동하지 않음

1. Supabase Dashboard > Authentication > Settings에서 MFA가 활성화되어 있는지 확인
2. 사용자가 Google Authenticator 같은 TOTP 앱을 사용하는지 확인
3. 시간 동기화: 서버와 사용자 기기의 시간이 정확한지 확인

---

## 보안 권장사항

1. **환경 변수 보호**
   - `.env`, `.env.local` 파일은 절대 Git에 커밋하지 않기
   - `.gitignore`에 포함되어 있는지 확인

2. **HTTPS 사용**
   - 프로덕션에서는 반드시 HTTPS 사용
   - HTTP에서는 소셜 로그인이 작동하지 않을 수 있음

3. **Redirect URI 검증**
   - 각 플랫폼에서 Redirect URI를 정확히 등록
   - 와일드카드 사용 금지

4. **CSRF 방지**
   - 소셜 로그인 코드에 state 파라미터 검증 포함됨
   - `sessionStorage`를 사용하여 state 저장 및 확인

5. **Rate Limiting**
   - Supabase에서 자동으로 Rate Limiting 적용
   - 추가 보호가 필요하면 Cloudflare 같은 CDN 사용

---

## 참고 자료

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase MFA Guide](https://supabase.com/docs/guides/auth/auth-mfa)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Kakao Login API](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Naver Login API](https://developers.naver.com/docs/login/overview/)
