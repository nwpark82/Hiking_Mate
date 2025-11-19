# 기술 명세서 (Technical Specification)

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   사용자 (Browser)                   │
│              iOS Safari / Chrome / Samsung          │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│              Next.js 14 (PWA)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │Pages/App │  │Components│  │   Hooks  │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────────────────────────────────┐          │
│  │        Service Worker (PWA)          │          │
│  │  - 오프라인 캐싱                       │          │
│  │  - 백그라운드 동기화                   │          │
│  └──────────────────────────────────────┘          │
└──────────────────────┬──────────────────────────────┘
                       │ REST API / Realtime
┌──────────────────────▼──────────────────────────────┐
│                   Supabase                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐     │
│  │ PostgreSQL │  │    Auth    │  │ Storage  │     │
│  └────────────┘  └────────────┘  └──────────┘     │
│  ┌────────────────────────────────────────────┐    │
│  │           Realtime (WebSocket)             │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘

         ┌──────────────┐          ┌──────────────┐
         │  Kakao Map   │          │   공공데이터  │
         │     API      │          │     API      │
         └──────────────┘          └──────────────┘
```

---

## 💻 기술 스택

### Frontend

#### Core Framework
```json
{
  "framework": "Next.js 14.2",
  "runtime": "React 18",
  "language": "TypeScript 5.3",
  "styling": "Tailwind CSS 3.4"
}
```

**선택 이유:**
- ✅ **Next.js 14**: 
  - App Router (최신 아키텍처)
  - Server Components (성능 최적화)
  - 빌트인 SEO 최적화
  - Vercel 무료 배포
  
- ✅ **TypeScript**: 
  - 타입 안정성
  - Claude Code 코드 생성 품질 향상
  - 리팩토링 용이
  
- ✅ **Tailwind CSS**: 
  - 빠른 스타일링
  - 모바일 반응형 쉬움
  - 파일 크기 최소화

#### 주요 라이브러리
```json
{
  "dependencies": {
    // 상태 관리
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    
    // UI 컴포넌트
    "shadcn/ui": "latest",
    "lucide-react": "^0.300.0",
    
    // 폼 관리
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    
    // 지도
    "react-kakao-maps-sdk": "^1.1.0",
    
    // Supabase
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    
    // PWA
    "next-pwa": "^5.6.0",
    
    // 유틸리티
    "date-fns": "^3.0.0",
    "clsx": "^2.1.0",
    "nanoid": "^5.0.0"
  }
}
```

#### PWA 설정
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.kakao\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'kakao-maps-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30일
        }
      }
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        networkTimeoutSeconds: 10
      }
    }
  ]
})
```

---

### Backend

#### Supabase (BaaS)
```yaml
서비스:
  - Database: PostgreSQL 15
  - Authentication: JWT 기반
  - Storage: S3 호환
  - Realtime: WebSocket
  - Edge Functions: Deno (선택적)

무료 플랜 제한:
  - Database: 500MB
  - Storage: 1GB
  - API Requests: 무제한
  - Realtime: 동시 연결 200개
  - Bandwidth: 5GB/월
```

**선택 이유:**
- ✅ 완전 무료 (MVP 충분)
- ✅ 설정 5분 (백엔드 개발 시간 제로)
- ✅ 자동 API 생성
- ✅ 실시간 구독 (커뮤니티 실시간 업데이트)
- ✅ Row Level Security (보안)

#### 대안 스택 (필요시 전환)
```
FastAPI + MongoDB + Redis
- 장점: 완전한 커스터마이징
- 단점: 개발 시간 3배, 비용 발생
- 전환 시점: MAU 10,000명 이상
```

---

### 외부 API

#### 1. 공공데이터포털 API
```yaml
한국등산트레킹지원센터:
  - 9정맥 코스 정보
  - 100대명산 정보
  - 숲길 POI
  - 건강효과 POI
  - 자연경관 POI
  
호출 제한:
  - 개발계정: 10,000회/일
  - 크롤링 전략: 매일 새벽 1회 배치 수집
```

#### 2. Kakao Map API
```yaml
사용 서비스:
  - 지도 (Web)
  - 장소 검색
  - 좌표-주소 변환
  
무료 제한:
  - 300,000회/일
  - 충분 (DAU 5,000명까지)
```

#### 3. 기상청 API (Phase 2)
```yaml
날씨 정보:
  - 단기 예보
  - 강수 확률
  - 일출/일몰 시간
```

---

## 🗄️ 데이터베이스 전략

### 데이터 저장 구조
```
Supabase PostgreSQL (서버)
├─ 등산로 정보 (공공데이터)
├─ 사용자 정보
├─ 커뮤니티 게시글
├─ 댓글
└─ 모임 정보

IndexedDB (클라이언트)
├─ 산행 기록 (GPS 데이터)
├─ 오프라인 지도 타일
└─ 즐겨찾기 캐시

LocalStorage
└─ 사용자 설정 (테마, 알림 등)
```

### 동기화 전략
```javascript
// 산행 종료 후 서버 업로드
1. 산행 중: IndexedDB에만 저장
2. 산행 종료: Supabase에 백업
3. 네트워크 오류: 백그라운드 동기화 큐

// 오프라인 우선 전략
function saveHike(hikeData) {
  // 1. 로컬에 즉시 저장
  await saveToIndexedDB(hikeData)
  
  // 2. 네트워크 있으면 서버 전송
  if (navigator.onLine) {
    try {
      await uploadToSupabase(hikeData)
    } catch (error) {
      // 실패 시 백그라운드 동기화 큐에 추가
      await addToSyncQueue(hikeData)
    }
  }
}
```

---

## 🔐 인증 & 보안

### 인증 방식
```typescript
// Supabase Auth 사용
인증 방법:
  1. 이메일/비밀번호
  2. 소셜 로그인 (Google, Kakao) - Phase 2
  3. 매직 링크 (선택적)

토큰 관리:
  - Access Token: 1시간 유효
  - Refresh Token: 30일 유효
  - Next.js Middleware로 자동 갱신
```

### 보안 정책
```sql
-- Row Level Security (RLS)
-- 예: 본인의 산행 기록만 수정 가능
CREATE POLICY "Users can update own hikes"
ON hikes FOR UPDATE
USING (auth.uid() = user_id);

-- 예: 모든 사용자가 등산로 정보 읽기 가능
CREATE POLICY "Anyone can read trails"
ON trails FOR SELECT
USING (true);
```

### 데이터 보호
```typescript
// 민감 정보 처리
const protectedFields = {
  location: 'GPS 좌표는 본인만 조회',
  email: '이메일은 해시 처리 후 저장',
  phone: '전화번호 수집 안 함'
}

// 이미지 업로드 제한
const imagePolicy = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  autoCompress: true
}
```

---

## 📱 모바일 최적화

### 반응형 Breakpoints
```typescript
// Tailwind 기본 설정 사용
const breakpoints = {
  sm: '640px',  // 작은 폰
  md: '768px',  // 태블릿
  lg: '1024px', // 데스크톱 (거의 안 씀)
}

// 모바일 우선 설계
// 기본: 모바일 스타일
// sm: 이상: 태블릿 조정
```

### 터치 최적화
```typescript
// 최소 터치 타겟
const touchTarget = {
  minHeight: '44px', // iOS 권장
  minWidth: '44px',
  padding: '12px'
}

// 제스처
const gestures = {
  swipe: '게시글 삭제',
  pullToRefresh: '피드 새로고침',
  longPress: '이미지 저장'
}
```

### 성능 최적화
```typescript
// 이미지 최적화
import Image from 'next/image'

<Image 
  src={url}
  alt="등산로"
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
/>

// 코드 스플리팅
const MapComponent = dynamic(() => import('./Map'), {
  loading: () => <Skeleton />,
  ssr: false // 지도는 클라이언트만
})

// Virtual Scrolling (긴 리스트)
import { useVirtualizer } from '@tanstack/react-virtual'
```

---

## 🌍 GPS & 위치 서비스

### Geolocation API
```typescript
// 위치 권한 요청
async function requestLocationPermission() {
  const permission = await navigator.permissions.query({
    name: 'geolocation'
  })
  
  if (permission.state === 'granted') {
    startTracking()
  } else if (permission.state === 'prompt') {
    // 사용자에게 설명 후 요청
    showPermissionExplanation()
  }
}

// GPS 추적 설정
const trackingOptions = {
  enableHighAccuracy: true,  // 정확도 우선
  timeout: 10000,            // 10초 타임아웃
  maximumAge: 0              // 캐시 안 씀
}

// 배터리 절약 모드
const lowPowerOptions = {
  enableHighAccuracy: false, // 정확도 낮춤
  timeout: 30000,
  maximumAge: 60000          // 1분 캐시
}
```

### 위치 데이터 처리
```typescript
interface GPSPoint {
  latitude: number
  longitude: number
  altitude: number | null
  accuracy: number
  timestamp: number
}

// 노이즈 필터링
function filterGPSNoise(points: GPSPoint[]) {
  return points.filter(point => {
    // 정확도 30m 이하만 사용
    return point.accuracy <= 30
  })
}

// 거리 계산 (Haversine)
function calculateDistance(p1: GPSPoint, p2: GPSPoint) {
  // 지구 곡률 고려한 정확한 거리
}
```

---

## 🎨 UI/UX 라이브러리

### shadcn/ui 컴포넌트
```typescript
사용 컴포넌트:
  - Button
  - Card
  - Dialog (모달)
  - DropdownMenu
  - Input
  - Textarea
  - Select
  - Tabs
  - Toast (알림)
  - Avatar
  - Badge
  - Skeleton (로딩)

장점:
  - 복사/붙여넣기 (의존성 최소화)
  - Tailwind 기반 (커스터마이징 쉬움)
  - 접근성 내장 (a11y)
```

### 아이콘: Lucide React
```typescript
import { 
  Mountain, 
  Map, 
  Heart, 
  MessageCircle,
  User,
  TrendingUp
} from 'lucide-react'

// 가볍고 일관된 디자인
// SVG 기반 (크기 자유)
```

---

## 📊 상태 관리 전략

### React Query (서버 상태)
```typescript
// 등산로 목록 가져오기
const { data: trails, isLoading } = useQuery({
  queryKey: ['trails', filters],
  queryFn: () => fetchTrails(filters),
  staleTime: 1000 * 60 * 5, // 5분 캐시
})

// 게시글 작성 (Mutation)
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    queryClient.invalidateQueries(['posts'])
  }
})
```

### Zustand (클라이언트 상태)
```typescript
// 간단하고 직관적
const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  tracking: false,
  startTracking: () => set({ tracking: true }),
  stopTracking: () => set({ tracking: false }),
  
  filters: {},
  setFilters: (filters) => set({ filters })
}))
```

---

## 🚀 배포 & 호스팅

### Vercel (Frontend)
```yaml
무료 플랜:
  - 대역폭: 100GB/월
  - 빌드: 6,000분/월
  - 서버리스 함수: 100GB-시간
  - 도메인: 무료 SSL

설정:
  - Git 연동: main 브랜치 푸시 시 자동 배포
  - 프리뷰: PR마다 미리보기 URL
  - 환경변수: Vercel 대시보드에서 설정
```

### Supabase (Backend)
```yaml
무료 플랜:
  - 프로젝트: 2개
  - 일시정지: 7일 미활동 시
  - 복구: 즉시 가능

프로덕션 권장:
  - 활동 유지 (cron job)
  - 백업 (pg_dump)
```

### 도메인
```
무료 옵션:
  - Vercel 제공: xxx.vercel.app
  - Freenom: 무료 도메인 (.tk, .ml 등)
  
유료 권장:
  - .com: 약 $12/년
  - .co.kr: 약 $20/년
```

---

## 📈 모니터링 & 분석

### Google Analytics 4
```typescript
// 이벤트 추적
gtag('event', 'trail_view', {
  trail_name: '북한산 백운대',
  category: 'engagement'
})

gtag('event', 'hike_start', {
  trail_id: 'trail_123',
  value: 1
})
```

### Vercel Analytics (무료)
```typescript
// 페이지 성능
- Web Vitals 자동 추적
- Core Web Vitals 리포트
- 실시간 방문자
```

### Sentry (에러 추적) - 선택적
```typescript
// 무료: 5,000 이벤트/월
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1
})
```

---

## 🧪 테스트 전략

### MVP 단계 (최소)
```bash
# 수동 테스트
- Chrome DevTools 모바일 시뮬레이터
- 실제 기기 테스트 (iOS Safari, Chrome)
- Lighthouse 성능 체크

# 자동 테스트는 Phase 2로 이연
```

### Phase 2 (자동화)
```typescript
// Jest + React Testing Library
describe('TrailCard', () => {
  it('displays trail information', () => {
    render(<TrailCard trail={mockTrail} />)
    expect(screen.getByText('북한산')).toBeInTheDocument()
  })
})

// Playwright (E2E)
test('user can create a post', async ({ page }) => {
  await page.goto('/community')
  await page.click('text=글쓰기')
  // ...
})
```

---

## 🔄 버전 관리

### Git 전략
```bash
main       # 프로덕션
└─ develop # 개발 메인
   └─ feature/xxx # 기능별 브랜치

커밋 컨벤션:
  feat: 새 기능
  fix: 버그 수정
  docs: 문서
  style: 코드 포맷
  refactor: 리팩토링
  test: 테스트
  chore: 기타
```

### 릴리스 프로세스
```
1. feature 브랜치 작업
2. develop에 PR
3. 리뷰 후 머지
4. main에 머지 → 자동 배포 (Vercel)
```

---

## 💾 백업 전략

### 데이터베이스
```bash
# Supabase 자동 백업 (일일)
# 추가 수동 백업 (주간)
pg_dump > backup_$(date +%Y%m%d).sql

# 중요: Git에 커밋 안 함 (.gitignore)
```

### 이미지/파일
```
Supabase Storage는 자동 복제
추가 백업 불필요 (무료 플랜도 안전)
```

---

## 📞 기술 지원

### 공식 문서
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tailwind: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com

### 커뮤니티
- Next.js Discord
- Supabase Discord
- Stack Overflow

---

## 다음 문서
- [데이터베이스 설계](./03_database_schema.md)
- [API 명세](./04_api_specification.md)
