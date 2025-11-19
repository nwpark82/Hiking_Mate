# 배포 가이드 (Deployment Guide)

## 🚀 배포 개요

### 배포 환경
- **Frontend**: Vercel (무료)
- **Backend**: Supabase (무료)
- **도메인**: Vercel 제공 또는 커스텀 도메인
- **CDN**: Vercel Edge Network (자동)

### 비용
```
개발 환경: $0/월
- Vercel: 무료
- Supabase: 무료
- Kakao Map: 무료 (일 30만건)

프로덕션 환경 (MAU 1,000명 이하): $0/월
프로덕션 환경 (MAU 5,000명): 약 $25/월
```

---

## 📋 배포 전 체크리스트

### 1. 코드 준비
```bash
# 1. 빌드 테스트
npm run build

# 2. 타입 체크
npm run type-check

# 3. Lint 체크
npm run lint

# 4. 테스트 (있는 경우)
npm test
```

### 2. 환경변수 확인
```bash
# .env.local 확인
NEXT_PUBLIC_SUPABASE_URL=✓
NEXT_PUBLIC_SUPABASE_ANON_KEY=✓
NEXT_PUBLIC_KAKAO_MAP_KEY=✓
```

### 3. 데이터베이스 준비
```sql
-- Supabase SQL Editor에서 확인
-- 1. 모든 테이블 생성됨
-- 2. RLS 정책 활성화됨
-- 3. Storage Buckets 생성됨
-- 4. 초기 데이터 삽입됨
```

---

## 🌐 Vercel 배포

### 1. Vercel 계정 연결
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link
```

### 2. 환경변수 설정
```bash
# Vercel Dashboard > Settings > Environment Variables

# Production 환경변수 추가
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_KAKAO_MAP_KEY=your-kakao-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Service Role Key (선택적, Edge Functions용)
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 3. Git 연동 배포
```bash
# 1. GitHub에 푸시
git add .
git commit -m "Initial deployment"
git push origin main

# 2. Vercel에서 자동 배포 시작
# https://vercel.com/dashboard

# 3. 배포 확인
# https://your-project.vercel.app
```

### 4. 수동 배포 (선택적)
```bash
# 로컬에서 배포
vercel --prod

# 빌드 로그 확인
vercel logs
```

---

## 🗄️ Supabase 프로덕션 설정

### 1. 프로젝트 설정
```bash
# Supabase Dashboard > Settings > General

# 1. 프로젝트 일시정지 방지
# Settings > General > Pause project after X days of inactivity
# → Disable

# 2. 백업 설정
# Settings > Database > Point in Time Recovery
# → Enable (Pro 플랜 필요)
```

### 2. RLS 정책 검증
```sql
-- 각 테이블의 RLS가 올바르게 작동하는지 확인

-- 테스트 사용자로 접근 시뮬레이션
SET ROLE anon;

-- 공개 데이터 조회 가능
SELECT * FROM trails; -- ✓ 작동해야 함

-- 비공개 데이터 조회 불가
SELECT * FROM users WHERE id != auth.uid(); -- ✗ 제한되어야 함

-- 원래 권한으로 복구
RESET ROLE;
```

### 3. Storage 정책 설정
```sql
-- Supabase Dashboard > Storage > Policies

-- post-images bucket
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. API Rate Limiting
```javascript
// middleware.ts (Vercel Edge Middleware)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 인증 체크
  const { data: { session } } = await supabase.auth.getSession()

  // 보호된 경로
  if (req.nextUrl.pathname.startsWith('/record') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/record/:path*', '/community/new', '/profile/:path*']
}
```

---

## 🔧 최적화 설정

### 1. Next.js 최적화
```javascript
// next.config.js
module.exports = {
  // 이미지 최적화
  images: {
    domains: ['xxx.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },

  // 압축
  compress: true,

  // Strict Mode
  reactStrictMode: true,

  // SWC Minify
  swcMinify: true,

  // 환경변수
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
}
```

### 2. PWA 캐싱 전략
```javascript
// next.config.js (withPWA 설정)
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24시간
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.kakao\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'kakao-maps-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30일
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
})
```

### 3. 성능 모니터링
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

---

## 🔍 SEO 최적화

### 1. 메타데이터 설정
```typescript
// app/layout.tsx
export const metadata = {
  title: {
    default: '하이킹메이트 - 등산로 정보와 커뮤니티',
    template: '%s | 하이킹메이트'
  },
  description: '전국 등산로 정보, GPS 산행 기록, 등산 커뮤니티',
  keywords: ['등산', '트레킹', '산', '등산로', '산행기록', '백두대간'],
  authors: [{ name: '하이킹메이트' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://your-app.vercel.app',
    siteName: '하이킹메이트',
    images: ['/og-image.png']
  },
  twitter: {
    card: 'summary_large_image',
    title: '하이킹메이트',
    description: '등산로 정보와 커뮤니티',
    images: ['/og-image.png']
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
}
```

### 2. 동적 메타데이터
```typescript
// app/trails/[id]/page.tsx
export async function generateMetadata({ params }) {
  const trail = await getTrail(params.id)
  
  return {
    title: `${trail.mountain} ${trail.name}`,
    description: trail.description,
    openGraph: {
      title: `${trail.mountain} ${trail.name}`,
      description: trail.description,
      images: [trail.thumbnail]
    }
  }
}
```

### 3. Sitemap 생성
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const trails = await getAllTrails()
  
  const trailUrls = trails.map(trail => ({
    url: `https://your-app.vercel.app/trails/${trail.id}`,
    lastModified: trail.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }))
  
  return [
    {
      url: 'https://your-app.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: 'https://your-app.vercel.app/explore',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9
    },
    ...trailUrls
  ]
}
```

### 4. robots.txt
```typescript
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/']
    },
    sitemap: 'https://your-app.vercel.app/sitemap.xml'
  }
}
```

---

## 📊 모니터링 설정

### 1. Google Analytics 4
```typescript
// lib/analytics.ts
export const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'

export const pageview = (url: string) => {
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  })
}

export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}
```

```typescript
// app/layout.tsx
import Script from 'next/script'
import { GA_MEASUREMENT_ID } from '@/lib/analytics'

<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `}
</Script>
```

### 2. Sentry (에러 추적)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
})
```

### 3. 사용자 행동 추적
```typescript
// lib/hooks/useTracking.ts
import { event } from '@/lib/analytics'

export function useTracking() {
  const trackTrailView = (trailId: string, trailName: string) => {
    event({
      action: 'view_trail',
      category: 'Engagement',
      label: trailName,
      value: 1
    })
  }

  const trackHikeStart = (trailId: string) => {
    event({
      action: 'start_hike',
      category: 'Engagement',
      label: trailId,
      value: 1
    })
  }

  const trackPostCreate = () => {
    event({
      action: 'create_post',
      category: 'Engagement',
      value: 1
    })
  }

  return {
    trackTrailView,
    trackHikeStart,
    trackPostCreate
  }
}
```

---

## 🔐 보안 설정

### 1. CORS 설정
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-app.vercel.app' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### 2. CSP (Content Security Policy)
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim())

  return NextResponse.next({ request: { headers: requestHeaders } })
}
```

### 3. 환경변수 보호
```bash
# .env.local (절대 커밋 안 함!)
SUPABASE_SERVICE_ROLE_KEY=xxx # 비밀!

# Vercel에서만 설정
# Dashboard > Settings > Environment Variables
```

---

## 🚨 장애 대응

### 1. Health Check
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Supabase 연결 확인
    const { error } = await supabase.from('trails').select('count').limit(1)
    
    if (error) throw error
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    )
  }
}
```

### 2. 롤백 계획
```bash
# Vercel에서 이전 배포로 롤백
# Dashboard > Deployments > [이전 버전] > Promote to Production

# 또는 CLI
vercel rollback
```

### 3. 데이터베이스 백업
```sql
-- Supabase SQL Editor

-- 전체 백업 (pg_dump 사용)
-- Settings > Database > Backups

-- 중요 테이블 수동 백업
COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' CSV HEADER;
COPY (SELECT * FROM trails) TO '/tmp/trails_backup.csv' CSV HEADER;
```

---

## 📈 성능 최적화 체크리스트

### Lighthouse 점수 목표
```
Performance: 90+
Accessibility: 100
Best Practices: 100
SEO: 100
PWA: 완벽
```

### 최적화 항목
```bash
# 1. 이미지 최적화
- Next.js Image 컴포넌트 사용 ✓
- WebP/AVIF 포맷 ✓
- Lazy loading ✓

# 2. 코드 스플리팅
- Dynamic imports ✓
- Route-based splitting (자동) ✓

# 3. 캐싱
- Static Generation (SSG) ✓
- Incremental Static Regeneration (ISR) ✓
- CDN 캐싱 (Vercel) ✓

# 4. 번들 최적화
- Tree shaking ✓
- Minification ✓
- Compression (gzip/brotli) ✓

# 5. 폰트 최적화
- next/font 사용 ✓
- Preload ✓
```

---

## 🎉 배포 완료 후

### 1. 배포 확인
```bash
# 1. 웹사이트 접속
https://your-app.vercel.app

# 2. 주요 기능 테스트
- 회원가입/로그인 ✓
- 등산로 검색 ✓
- GPS 기록 (HTTPS 필수) ✓
- 게시글 작성 ✓
- 이미지 업로드 ✓

# 3. 모바일 테스트
- iOS Safari ✓
- Android Chrome ✓
- PWA 설치 ✓

# 4. 성능 테스트
- Lighthouse 점수 확인 ✓
- Web Vitals 확인 ✓
```

### 2. Google Search Console 등록
```bash
# 1. https://search.google.com/search-console
# 2. 속성 추가
# 3. 소유권 확인 (DNS 또는 HTML 파일)
# 4. Sitemap 제출
https://your-app.vercel.app/sitemap.xml
```

### 3. 도메인 연결 (선택적)
```bash
# Vercel Dashboard > Settings > Domains
# 1. 커스텀 도메인 추가 (예: hiking-mate.com)
# 2. DNS 레코드 설정
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com

# 3. SSL 자동 발급 (무료)
```

---

## 📝 배포 후 모니터링

### 일일 체크
```bash
- Vercel 대시보드 확인 (에러, 트래픽)
- Supabase 사용량 확인 (DB, Storage)
- Google Analytics 방문자 확인
```

### 주간 체크
```bash
- 성능 지표 확인 (Core Web Vitals)
- 에러 로그 검토 (Sentry)
- 데이터베이스 백업
- 사용자 피드백 확인
```

### 월간 체크
```bash
- 비용 확인 (Vercel, Supabase)
- 보안 업데이트 적용
- 라이브러리 업데이트
- 사용량 증가 대비 스케일링 계획
```

---

## 🆘 문제 해결

### Vercel 배포 실패
```bash
# 로그 확인
vercel logs

# 로컬 빌드 테스트
npm run build

# 환경변수 확인
vercel env ls
```

### Supabase 연결 오류
```bash
# API URL 확인
echo $NEXT_PUBLIC_SUPABASE_URL

# CORS 설정 확인 (Supabase Dashboard)
# Settings > API > URL Configuration
```

### GPS 작동 안 함
```bash
# HTTPS 확인 (HTTP는 GPS 안 됨)
# localhost와 배포 환경(HTTPS)에서만 작동

# 위치 권한 확인
# 브라우저 설정 > 사이트 권한 > 위치
```

---

## 🎯 다음 단계

배포 완료 후:

1. **사용자 모집**
   - 베타 테스터 모집
   - 등산 커뮤니티 홍보
   - SNS 마케팅

2. **데이터 수집**
   - 공공데이터 추가 크롤링
   - 사용자 피드백 수집

3. **기능 개선**
   - Phase 2 기능 개발
   - 성능 최적화
   - UX 개선

4. **수익화**
   - Google AdSense 신청
   - 프리미엄 기능 개발
   - 제휴 협력

---

## 🔴 Phase 2: 실시간 & 안전 기능 배포

Phase 1 MVP 배포 후, 사용자가 증가하면 Phase 2로 확장합니다.

### Phase 2 배포 환경 구조

```
Phase 1 (Vercel + Supabase) +

Railway:
- Node.js WebSocket 서버
- Redis 캐싱

Firebase:
- Cloud Messaging (FCM)
- Edge Functions

총 비용: $40-50/월
```

### 배포 순서

#### 1단계: Railway WebSocket 서버
```bash
# Railway 프로젝트 생성
1. https://railway.app 접속
2. New Project
3. Deploy from GitHub
4. 저장소 연결

# 환경변수 설정
REDIS_URL=...
PORT=8080

# 배포 완료 후 URL 확인
https://your-project.railway.app
```

#### 2단계: Redis 설정
```bash
# Upstash 사용 (권장)
1. https://upstash.com 접속
2. Create Database
3. Redis 인스턴스 생성
4. Connection String 복사

# Railway에 환경변수 추가
REDIS_URL=redis://...@upstash.io:6379
```

#### 3단계: Firebase FCM
```bash
# Firebase 프로젝트 생성
1. https://console.firebase.google.com
2. Add Project
3. Cloud Messaging 활성화
4. Web Push 인증서 생성

# Next.js에 환경변수 추가
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

#### 4단계: Supabase Edge Functions
```bash
# SMS 발송 함수 배포
supabase functions deploy send-sos-sms

# 환경변수 설정
supabase secrets set SMS_API_KEY=...
```

자세한 내용은 **[08_phase2_deployment.md](./08_phase2_deployment.md)**를 참조하세요.

---

## 🤖 Phase 3: AI 기능 배포

Phase 2 안정화 후 AI 기능을 추가합니다.

### Phase 3 배포 환경 구조

```
Phase 1 + 2 인프라 +

OpenAI:
- GPT-4 Turbo API
- Embedding API

Pinecone:
- Vector Database

Redis:
- AI 응답 캐싱 (확장)

총 비용: $230-240/월
비용 절감 후: $150-180/월
```

### 배포 순서

#### 1단계: OpenAI API 설정
```bash
# OpenAI 계정 생성
1. https://platform.openai.com 접속
2. API Keys 생성

# ⚠️ 매우 중요: 비용 제한 설정
3. Settings → Usage limits
4. Hard limit: $100/month
5. Email alerts: $50, $80

# 환경변수 추가
OPENAI_API_KEY=sk-...
```

#### 2단계: Pinecone Vector DB
```bash
# Pinecone 계정 생성
1. https://app.pinecone.io 접속
2. Create Index
   - Name: hiking-mate
   - Dimensions: 1536 (text-embedding-3-small)
   - Metric: cosine

# 환경변수 추가
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
```

#### 3단계: 데이터 임베딩
```bash
# 등산로 데이터 임베딩
npm run embed:trails

# 커뮤니티 게시글 임베딩 (선택)
npm run embed:posts
```

#### 4단계: Redis 캐싱 확장
```bash
# Upstash Redis 플랜 업그레이드
1. Upstash Console
2. Upgrade Plan ($20/월로 업그레이드)
3. 용량 확인: 10GB
```

#### 5단계: 비용 모니터링 설정
```bash
# OpenAI 사용량 확인 API
GET https://api.openai.com/v1/usage

# Supabase에 로깅
CREATE TABLE ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  question text,
  tokens_used int,
  created_at timestamptz DEFAULT now()
);

# 일일 사용량 제한 (사용자당)
- 무료: 3회/일
- 프리미엄: 10회/일
- 프리미엄+: 무제한
```

자세한 내용은 **[09_phase3_ai_deployment.md](./09_phase3_ai_deployment.md)**를 참조하세요.

---

## 📋 Phase별 배포 체크리스트

### Phase 1 완료 확인
- [ ] Vercel 배포 성공
- [ ] Supabase 연결 정상
- [ ] 도메인 연결 (선택)
- [ ] SSL 인증서 활성화
- [ ] PWA 설치 가능
- [ ] Google Analytics 작동

### Phase 2 완료 확인
- [ ] Railway WebSocket 서버 운영
- [ ] Redis 연결 정상
- [ ] Firebase FCM 작동
- [ ] SOS 기능 테스트 완료
- [ ] 실시간 위치 공유 안정성 99%
- [ ] 월 비용 $50 이하 유지

### Phase 3 완료 확인
- [ ] OpenAI API 연결 정상
- [ ] Pinecone Vector DB 구축
- [ ] 데이터 임베딩 완료
- [ ] AI 챗봇 응답 시간 5초 이하
- [ ] 비용 제한 설정 확인
- [ ] 캐싱으로 비용 30% 절감
- [ ] 월 비용 $180 이하 유지

전체 체크리스트는 **[10_deployment_checklist.md](./10_deployment_checklist.md)**를 참조하세요.

---

## 📚 유용한 리소스

### Phase 1
- [Vercel 문서](https://vercel.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Next.js 문서](https://nextjs.org/docs)

### Phase 2
- [Railway 문서](https://docs.railway.app)
- [Firebase 문서](https://firebase.google.com/docs)
- [Upstash Redis](https://docs.upstash.com/redis)

### Phase 3
- [OpenAI API 문서](https://platform.openai.com/docs)
- [Pinecone 문서](https://docs.pinecone.io)
- [LangChain 문서](https://js.langchain.com/docs)

---

## 📊 자체 로그 분석 시스템 구축

> Google Analytics 4를 넘어서 - 완전한 데이터 소유권

### GA4의 한계

```bash
❌ GA4 제한사항:
- 샘플링 데이터 (월 1천만 이벤트 초과 시)
- 커스텀 분석 제한 (최대 50개 커스텀 차원)
- Raw 데이터 접근 어려움
- 데이터 보관 기간 제한 (무료: 2개월, 최대: 14개월)
- GDPR 이슈 (유럽 사용자 데이터)
- BigQuery 연동 비용 (월 $200+)
- 실시간 대시보드 제한
```

### ✅ 자체 로그 시스템의 장점

```bash
✅ 완전한 데이터 소유권
✅ 무제한 커스텀 분석
✅ Raw 데이터 직접 접근
✅ 영구 데이터 보관
✅ 비즈니스 로직과 통합
✅ 실시간 알림 가능
✅ A/B 테스트 자유롭게
```

---

## 🎯 Phase별 로그 분석 전략

### Phase 1: GA4만 사용 (권장)
```
기간: MVP ~ DAU 1,000명
비용: $0/월
이유:
- 빠른 구현
- 기본 분석 충분
- 리소스 절약

사용:
- 페이지뷰
- 사용자 플로우
- 전환율
- 기기/브라우저 분석
```

### Phase 2: GA4 + Supabase 로그
```
기간: DAU 1,000 ~ 5,000명
비용: $25/월 (Supabase Pro)
이유:
- 커스텀 이벤트 증가
- 비즈니스 로직과 연계
- 사용자별 상세 추적

추가 기능:
- 사용자 행동 로그
- API 성능 추적
- 에러 로그
- 비즈니스 지표
```

### Phase 3: 전용 로그 분석 시스템
```
기간: DAU 5,000명 이상
비용: $50-150/월
이유:
- 대용량 로그 처리
- 복잡한 분석
- 실시간 대시보드

구성:
- ClickHouse (로그 저장)
- Metabase/Grafana (시각화)
- Supabase (메타데이터)
```

---

## 📦 Phase 2: Supabase 자체 로그 구축

### 1. 로그 테이블 설계

```sql
-- 사용자 행동 로그
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  session_id text NOT NULL,
  event_name text NOT NULL, -- 'page_view', 'button_click', 'feature_used'
  event_category text, -- 'navigation', 'engagement', 'conversion'
  
  -- 이벤트 상세 정보
  properties jsonb, -- 커스텀 속성
  
  -- 페이지 정보
  page_url text,
  page_title text,
  referrer text,
  
  -- 사용자 환경
  user_agent text,
  device_type text, -- 'mobile', 'desktop', 'tablet'
  browser text,
  os text,
  screen_width int,
  screen_height int,
  
  -- 위치 정보
  country text,
  city text,
  
  -- 시간 정보
  created_at timestamptz DEFAULT now(),
  
  -- 성능 정보
  page_load_time int, -- ms
  
  -- A/B 테스트
  experiment_id text,
  variant text
);

-- 비즈니스 지표 로그
CREATE TABLE business_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name text NOT NULL, -- 'hike_completed', 'post_created', 'premium_subscribed'
  metric_value numeric,
  user_id uuid REFERENCES users(id),
  properties jsonb,
  created_at timestamptz DEFAULT now()
);

-- API 성능 로그
CREATE TABLE api_performance_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint text NOT NULL,
  method text, -- 'GET', 'POST', etc.
  status_code int,
  response_time int, -- ms
  user_id uuid,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- 에러 로그
CREATE TABLE error_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type text, -- 'client', 'server', 'network'
  error_message text,
  stack_trace text,
  user_id uuid,
  page_url text,
  user_agent text,
  severity text, -- 'low', 'medium', 'high', 'critical'
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 인덱스 (성능 최적화)
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

CREATE INDEX idx_business_metrics_metric_name ON business_metrics(metric_name);
CREATE INDEX idx_business_metrics_created_at ON business_metrics(created_at DESC);

CREATE INDEX idx_api_performance_endpoint ON api_performance_logs(endpoint);
CREATE INDEX idx_api_performance_created_at ON api_performance_logs(created_at DESC);

CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);

-- RLS 정책
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "Admin can view all analytics" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can view all business metrics" ON business_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 사용자는 본인 데이터만 입력 가능
CREATE POLICY "Users can insert their own events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

### 2. 클라이언트 로깅 SDK

```typescript
// lib/analytics/logger.ts
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

class AnalyticsLogger {
  private supabase = createClient();
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    // 세션 ID 생성 (브라우저 세션 유지)
    this.sessionId = sessionStorage.getItem('session_id') || uuidv4();
    sessionStorage.setItem('session_id', this.sessionId);
    
    // 사용자 ID 확인
    this.initUser();
  }

  private async initUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.userId = user?.id || null;
  }

  // 페이지뷰 추적
  async trackPageView(url: string, title: string) {
    await this.track('page_view', 'navigation', {
      page_url: url,
      page_title: title,
      referrer: document.referrer,
      page_load_time: performance.now()
    });
  }

  // 이벤트 추적
  async track(
    eventName: string,
    category: string,
    properties?: Record<string, any>
  ) {
    try {
      const event = {
        user_id: this.userId,
        session_id: this.sessionId,
        event_name: eventName,
        event_category: category,
        properties: properties || {},
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        device_type: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOS(),
        screen_width: window.screen.width,
        screen_height: window.screen.height
      };

      await this.supabase.from('analytics_events').insert(event);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // 비즈니스 지표 추적
  async trackMetric(
    metricName: string,
    value: number,
    properties?: Record<string, any>
  ) {
    try {
      await this.supabase.from('business_metrics').insert({
        metric_name: metricName,
        metric_value: value,
        user_id: this.userId,
        properties: properties || {}
      });
    } catch (error) {
      console.error('Metric tracking error:', error);
    }
  }

  // 에러 추적
  async trackError(
    error: Error,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    try {
      await this.supabase.from('error_logs').insert({
        error_type: 'client',
        error_message: error.message,
        stack_trace: error.stack,
        user_id: this.userId,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        severity
      });
    } catch (err) {
      console.error('Error logging failed:', err);
    }
  }

  // API 성능 추적
  async trackAPICall(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    errorMessage?: string
  ) {
    try {
      await this.supabase.from('api_performance_logs').insert({
        endpoint,
        method,
        status_code: statusCode,
        response_time: responseTime,
        user_id: this.userId,
        error_message: errorMessage
      });
    } catch (error) {
      console.error('API tracking error:', error);
    }
  }

  // 유틸리티 메서드
  private getDeviceType(): string {
    const width = window.screen.width;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Other';
  }
}

// 싱글톤 인스턴스
export const analytics = new AnalyticsLogger();
```

### 3. 사용 예시

```typescript
// app/layout.tsx - 페이지뷰 자동 추적
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/lib/analytics/logger';

export default function RootLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    // 페이지뷰 추적
    analytics.trackPageView(pathname, document.title);
  }, [pathname]);

  return <html>{children}</html>;
}

// 버튼 클릭 추적
<button
  onClick={() => {
    analytics.track('start_hike_button_clicked', 'engagement', {
      trail_id: trailId,
      trail_name: trailName
    });
    startHike();
  }}
>
  산행 시작
</button>

// 비즈니스 지표 추적
async function completeHike(hikeId: string, distance: number) {
  // 산행 완료 처리
  await updateHike(hikeId, { status: 'completed' });
  
  // 지표 추적
  await analytics.trackMetric('hike_completed', 1, {
    hike_id: hikeId,
    distance,
    duration: calculateDuration()
  });
}

// 에러 추적
try {
  await uploadImage(file);
} catch (error) {
  analytics.trackError(error, 'high');
  throw error;
}

// API 성능 추적
const startTime = Date.now();
try {
  const response = await fetch('/api/trails');
  const responseTime = Date.now() - startTime;
  
  analytics.trackAPICall(
    '/api/trails',
    'GET',
    response.status,
    responseTime
  );
} catch (error) {
  const responseTime = Date.now() - startTime;
  analytics.trackAPICall(
    '/api/trails',
    'GET',
    0,
    responseTime,
    error.message
  );
}
```

### 4. 간단한 대시보드 구현

```typescript
// app/admin/analytics/page.tsx
export default async function AnalyticsDashboard() {
  const supabase = createClient();

  // DAU (Daily Active Users)
  const { count: dau } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .eq('event_name', 'page_view');

  // 인기 페이지
  const { data: topPages } = await supabase
    .from('analytics_events')
    .select('page_url, count')
    .eq('event_name', 'page_view')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('count', { ascending: false })
    .limit(10);

  // 완료된 산행 수
  const { data: hikesCompleted } = await supabase
    .from('business_metrics')
    .select('metric_value')
    .eq('metric_name', 'hike_completed')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const totalHikes = hikesCompleted?.reduce((sum, m) => sum + m.metric_value, 0) || 0;

  // 평균 API 응답 시간
  const { data: apiPerf } = await supabase
    .from('api_performance_logs')
    .select('response_time')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const avgResponseTime = apiPerf?.reduce((sum, log) => sum + log.response_time, 0) / apiPerf?.length || 0;

  // 에러 발생 수
  const { count: errorCount } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .eq('resolved', false);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">분석 대시보드</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="DAU" value={dau} />
        <StatCard title="완료된 산행 (30일)" value={totalHikes} />
        <StatCard title="평균 API 응답시간" value={`${avgResponseTime.toFixed(0)}ms`} />
        <StatCard title="미해결 에러" value={errorCount} trend="warning" />
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">인기 페이지 (7일)</h2>
          <ul>
            {topPages?.map((page) => (
              <li key={page.page_url} className="flex justify-between py-2">
                <span>{page.page_url}</span>
                <span className="font-bold">{page.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Phase 3+: ClickHouse 전용 시스템

### 언제 도입해야 하나?

```bash
다음 신호가 보이면 ClickHouse 도입 시기:

✅ DAU 5,000명 이상
✅ 일일 이벤트 100만건 이상
✅ Supabase 로그 쿼리 느려짐 (5초+)
✅ 복잡한 분석 쿼리 필요
✅ 실시간 대시보드 필요
```

### ClickHouse 구성

```bash
# 1. Railway에 ClickHouse 배포
https://railway.app
→ New Project → Database → ClickHouse

# 2. 연결 정보
Host: xxx.railway.app
Port: 8123
Database: analytics
User: default

# 3. 월 비용
Railway: $20-50/월 (사용량 기반)
```

### 테이블 스키마 (ClickHouse)

```sql
-- ClickHouse 이벤트 테이블
CREATE TABLE analytics.events (
  event_id UUID,
  user_id UUID,
  session_id String,
  event_name String,
  event_category String,
  properties String, -- JSON
  
  page_url String,
  page_title String,
  referrer String,
  
  device_type String,
  browser String,
  os String,
  
  country String,
  city String,
  
  created_at DateTime,
  
  -- ClickHouse 엔진 설정
  INDEX idx_event_name event_name TYPE bloom_filter GRANULARITY 1,
  INDEX idx_user_id user_id TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (event_name, created_at);
```

### Supabase → ClickHouse 동기화

```typescript
// lib/analytics/clickhouse-sync.ts
import { ClickHouse } from 'clickhouse';
import { createClient } from '@/lib/supabase/client';

const clickhouse = new ClickHouse({
  url: process.env.CLICKHOUSE_URL,
  port: 8123,
  basicAuth: {
    username: 'default',
    password: process.env.CLICKHOUSE_PASSWORD
  }
});

// Supabase에서 ClickHouse로 배치 동기화
export async function syncToClickHouse() {
  const supabase = createClient();
  
  // 마지막 동기화 시간 이후 데이터 가져오기
  const lastSync = await getLastSyncTime();
  
  const { data: events } = await supabase
    .from('analytics_events')
    .select('*')
    .gt('created_at', lastSync)
    .limit(10000);

  if (!events || events.length === 0) return;

  // ClickHouse에 삽입
  const rows = events.map(event => ({
    event_id: event.id,
    user_id: event.user_id,
    session_id: event.session_id,
    event_name: event.event_name,
    event_category: event.event_category,
    properties: JSON.stringify(event.properties),
    page_url: event.page_url,
    page_title: event.page_title,
    referrer: event.referrer,
    device_type: event.device_type,
    browser: event.browser,
    os: event.os,
    country: event.country,
    city: event.city,
    created_at: event.created_at
  }));

  await clickhouse.insert('INSERT INTO analytics.events', rows).toPromise();
  
  // 동기화 시간 업데이트
  await updateLastSyncTime(new Date());
  
  console.log(`Synced ${events.length} events to ClickHouse`);
}

// Cron으로 5분마다 실행
// Vercel Cron 또는 GitHub Actions
```

### 시각화: Metabase 연동

```bash
# 1. Metabase 배포 (Railway)
https://railway.app
→ New Project → Deploy Template → Metabase

# 2. ClickHouse 연결
Admin → Databases → Add Database
→ Type: ClickHouse
→ Host: xxx.railway.app
→ Port: 8123
→ Database: analytics

# 3. 대시보드 구성
- DAU/MAU 차트
- 사용자 플로우
- Funnel 분석
- Cohort 분석
- 리텐션 차트

# 4. 월 비용
Railway Metabase: $10-20/월
```

---

## 📈 실전 분석 예시

### 1. 사용자 여정 분석

```sql
-- Supabase SQL
-- 등산로 검색 → 상세 → 산행 시작 전환율
WITH funnel AS (
  SELECT 
    session_id,
    MAX(CASE WHEN event_name = 'search_trails' THEN 1 ELSE 0 END) as searched,
    MAX(CASE WHEN event_name = 'view_trail_detail' THEN 1 ELSE 0 END) as viewed,
    MAX(CASE WHEN event_name = 'start_hike' THEN 1 ELSE 0 END) as started
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY session_id
)
SELECT 
  COUNT(*) as total_sessions,
  SUM(searched) as searched,
  SUM(viewed) as viewed,
  SUM(started) as started,
  ROUND(100.0 * SUM(viewed) / SUM(searched), 2) as search_to_view_rate,
  ROUND(100.0 * SUM(started) / SUM(viewed), 2) as view_to_start_rate
FROM funnel;
```

### 2. Cohort 분석

```sql
-- 주별 리텐션 분석
WITH first_seen AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', MIN(created_at)) as cohort_week
  FROM analytics_events
  WHERE user_id IS NOT NULL
  GROUP BY user_id
),
user_activity AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', created_at) as activity_week
  FROM analytics_events
  WHERE user_id IS NOT NULL
  GROUP BY user_id, DATE_TRUNC('week', created_at)
)
SELECT 
  fs.cohort_week,
  COUNT(DISTINCT fs.user_id) as cohort_size,
  ua.activity_week,
  COUNT(DISTINCT ua.user_id) as active_users,
  ROUND(100.0 * COUNT(DISTINCT ua.user_id) / COUNT(DISTINCT fs.user_id), 2) as retention_rate
FROM first_seen fs
LEFT JOIN user_activity ua ON fs.user_id = ua.user_id
GROUP BY fs.cohort_week, ua.activity_week
ORDER BY fs.cohort_week, ua.activity_week;
```

### 3. A/B 테스트 분석

```sql
-- 버튼 색상 A/B 테스트
SELECT 
  properties->>'variant' as variant,
  COUNT(*) as impressions,
  SUM(CASE WHEN event_name = 'start_hike_button_clicked' THEN 1 ELSE 0 END) as clicks,
  ROUND(100.0 * SUM(CASE WHEN event_name = 'start_hike_button_clicked' THEN 1 ELSE 0 END) / COUNT(*), 2) as ctr
FROM analytics_events
WHERE properties->>'experiment_id' = 'button_color_test'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY properties->>'variant';
```

---

## 💰 비용 비교

### GA4 + BigQuery
```
GA4: 무료
BigQuery: $200-500/월 (월 100GB 데이터)
총: $200-500/월
```

### 자체 시스템 (Supabase + ClickHouse)
```
Supabase Pro: $25/월
ClickHouse (Railway): $50/월
Metabase (Railway): $10/월
총: $85/월

✅ 60-80% 비용 절감
✅ 완전한 데이터 소유권
```

---

## 🚨 주의사항

### 1. 개인정보 보호
```typescript
// 민감 정보 로깅 금지
❌ 비밀번호, 신용카드, 주민번호
❌ 정확한 GPS 좌표 (일반 사용자)
❌ 개인 식별 가능 정보

✅ 익명화된 user_id
✅ 대략적인 위치 (시/도 수준)
✅ 집계된 데이터
```

### 2. 성능 영향
```typescript
// 비동기 로깅으로 성능 영향 최소화
analytics.track('event', 'category', properties);
// 즉시 반환, 백그라운드에서 처리

// 배치 처리
const events = [];
events.push(event1);
events.push(event2);
await analytics.batchInsert(events); // 한 번에 전송
```

### 3. 데이터 정합성
```typescript
// 중복 제거
CREATE UNIQUE INDEX idx_analytics_dedup 
ON analytics_events(user_id, session_id, event_name, created_at);

// 오래된 데이터 정리 (Supabase Cron)
DELETE FROM analytics_events 
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## ✅ 체크리스트

### Phase 2 (Supabase 로그)
- [ ] 로그 테이블 생성
- [ ] 인덱스 설정
- [ ] RLS 정책 적용
- [ ] 로깅 SDK 구현
- [ ] 주요 이벤트 추적 구현
- [ ] 간단한 대시보드 구현
- [ ] 개인정보 보호 확인

### Phase 3+ (ClickHouse)
- [ ] Railway ClickHouse 배포
- [ ] 테이블 스키마 생성
- [ ] Supabase → ClickHouse 동기화
- [ ] Metabase 배포 및 연결
- [ ] 대시보드 구성
- [ ] 알림 설정 (이상 감지)
- [ ] 비용 모니터링

---

## 축하합니다! 🎉

배포가 완료되었습니다. 이제 실제 사용자들이 여러분의 서비스를 사용할 수 있습니다!

### 다음 단계
- Phase 1 완료 → [Phase 2 배포 가이드](./08_phase2_deployment.md)
- Phase 2 완료 → [Phase 3 AI 배포 가이드](./09_phase3_ai_deployment.md)
- 기능 추가 전 → [배포 체크리스트](./10_deployment_checklist.md) 확인
