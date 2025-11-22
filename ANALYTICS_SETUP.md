# 📊 Analytics 설정 가이드

하이킹메이트 사이트의 방문자와 가입자 추적 방법

---

## 🎯 방문자 추적 방법

### 방법 1: Vercel Analytics (추천 - 가장 간단)

**무료로 바로 사용 가능!**

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. `Hiking_Mate` 프로젝트 클릭
3. 상단 메뉴에서 **Analytics** 클릭
4. 실시간 방문자 및 페이지뷰 확인

**제공 정보:**
- 📈 페이지뷰 (Page Views)
- 👥 고유 방문자 (Unique Visitors)
- 🌍 국가별 분포
- 📱 디바이스 타입
- ⚡ 성능 지표

**무료 플랜:** 월 10,000 페이지뷰까지

---

### 방법 2: Google Analytics 4 (무료 - 가장 상세)

**이미 코드에 추가되어 있습니다!** 환경 변수만 설정하면 됩니다.

#### Step 1: Google Analytics 계정 생성

1. https://analytics.google.com/ 접속
2. "측정 시작" 클릭
3. 계정 이름 입력: `하이킹메이트`
4. 속성 이름 입력: `Hiking Mate`
5. 비즈니스 정보 입력
6. **측정 ID (G-XXXXXXXXXX)** 복사

#### Step 2: Vercel 환경 변수 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) → Hiking_Mate
2. **Settings** → **Environment Variables**
3. 새 변수 추가:
   - **Name:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - **Value:** `G-XXXXXXXXXX` (Step 1에서 받은 ID)
   - **Environments:** Production, Preview, Development 모두 체크
4. **Save** 클릭

#### Step 3: 재배포

환경 변수를 추가한 후 자동으로 재배포되거나, 수동으로 재배포:
1. **Deployments** 탭
2. 최신 배포 옆 "..." 클릭
3. **Redeploy** 선택

#### Step 4: 확인

배포 완료 후 30분~1시간 내에 Google Analytics에서 실시간 데이터 확인 가능:
1. Google Analytics → 보고서 → 실시간
2. 사이트 방문하여 실시간 방문자 확인

**제공 정보:**
- 📊 실시간 방문자
- 🌐 페이지별 조회수
- 🕒 평균 체류 시간
- 🔄 이탈률
- 📱 디바이스, 브라우저, OS
- 🌍 지역, 국가, 도시
- 🎯 사용자 흐름 (User Flow)
- 📈 맞춤 리포트 생성

---

## 👤 가입자 수 확인

### Supabase Dashboard

#### 방법 1: UI에서 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. Hiking Mate 프로젝트 선택
3. **Authentication** → **Users** 클릭
4. 상단에 총 사용자 수 표시

#### 방법 2: SQL로 통계 확인

**SQL Editor**에서 실행:

```sql
-- 전체 가입자 수
SELECT COUNT(*) as total_users FROM auth.users;

-- 오늘 가입한 사용자
SELECT COUNT(*) as today_signups
FROM auth.users
WHERE created_at >= CURRENT_DATE;

-- 최근 7일간 가입자 추이
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as new_users
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- 월별 가입자 수
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_users
FROM auth.users
GROUP BY month
ORDER BY month DESC;

-- 이메일 vs 소셜 로그인 비율
SELECT
  CASE
    WHEN email LIKE '%@%' THEN 'Email'
    ELSE 'Social'
  END as login_method,
  COUNT(*) as count
FROM auth.users
GROUP BY login_method;
```

---

## 🔥 커스텀 이벤트 추적

이미 구현된 이벤트 추적 함수들:

### 사용 예시

```typescript
import { trackSignup, trackLogin, trackTrailView, trackHikeStart, trackHikeComplete } from '@/lib/analytics/gtag';

// 회원가입 추적
trackSignup('email');  // 또는 'google', 'kakao'

// 로그인 추적
trackLogin('email');

// 등산로 조회 추적
trackTrailView(trail.id, trail.name);

// 산행 시작 추적
trackHikeStart(trail.id);

// 산행 완료 추적 (duration은 초 단위)
trackHikeComplete(trail.id, duration);
```

---

## 📈 대시보드 예시

### Google Analytics 주요 지표

```
실시간 사용자: 5명
오늘 페이지뷰: 234
이번 주 방문자: 1,234명
이번 달 신규 방문자: 4,567명

인기 페이지:
1. /explore - 45%
2. / - 25%
3. /explore/[id] - 20%
4. /community - 10%

사용자 흐름:
홈 → 탐색 → 등산로 상세 → 산행 시작
```

### Supabase 가입자 통계

```
총 가입자: 1,234명
오늘 가입: 12명
이번 주 가입: 67명
이번 달 가입: 234명

로그인 방식:
- 이메일: 60%
- Google: 25%
- Kakao: 15%
```

---

## ⚙️ 환경 변수 정리

`.env.local` 파일에 추가:
```env
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**주의:**
- `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트에서 접근 가능
- Vercel 환경 변수에도 동일하게 설정 필요

---

## 📚 추가 리소스

- [Vercel Analytics 문서](https://vercel.com/docs/analytics)
- [Google Analytics 4 가이드](https://support.google.com/analytics/answer/9304153)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)

---

## 🎉 완료!

이제 사이트 방문자와 가입자를 실시간으로 추적할 수 있습니다!
