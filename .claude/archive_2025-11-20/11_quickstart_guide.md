# Phase별 퀵스타트 가이드

> 🚀 각 Phase를 빠르게 시작하는 방법

## 📋 이 문서의 사용법

각 Phase마다:
1. **예상 소요 시간** - 환경 설정 + 기본 구현
2. **체크포인트** - 단계별 확인사항
3. **빠른 시작 명령어** - Copy & Paste

---

## 🚀 Phase 1: MVP 퀵스타트

### ⏱️ 예상 소요 시간
- 환경 설정: 2시간
- 기본 구현: 4-6주

### 📝 1단계: 계정 생성 (30분)

```bash
# 1. Supabase
https://supabase.com → Sign Up
→ New Project
→ Project URL & Keys 복사

# 2. Vercel
https://vercel.com → Sign Up
→ GitHub 연동

# 3. Kakao Developers
https://developers.kakao.com → 로그인
→ 내 애플리케이션 추가
→ JavaScript 키 복사
```

### 📝 2단계: 프로젝트 생성 (30분)

```bash
# Next.js 프로젝트 생성
npx create-next-app@latest hiking-mate
cd hiking-mate

# 필수 패키지 설치
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @tanstack/react-query zustand
npm install react-kakao-maps-sdk
npm install lucide-react

# Tailwind & shadcn/ui
npx shadcn-ui@latest init
```

### 📝 3단계: 환경변수 설정 (10분)

```bash
# .env.local 생성
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_KAKAO_MAP_KEY=your-kakao-key
EOF
```

### 📝 4단계: Supabase 스키마 생성 (30분)

```bash
# Supabase Dashboard → SQL Editor

# 03_database_schema.md의 SQL 복사 후 실행
→ users, trails, hikes, posts, comments, likes, meetups, favorites

# RLS 정책 적용
→ 03_database_schema.md의 RLS 정책 실행

# Storage Buckets 생성
→ hike-photos (Public)
→ post-images (Public)
```

### ✅ 체크포인트 1
- [ ] `npm run dev` 실행 성공
- [ ] Supabase 연결 테스트 성공
- [ ] Kakao Map 렌더링 테스트

### 📝 5단계: 배포 (10분)

```bash
# GitHub에 Push
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/hiking-mate.git
git push -u origin main

# Vercel 배포
1. Vercel Dashboard → New Project
2. GitHub 저장소 선택
3. 환경변수 입력
4. Deploy
```

### ✅ 체크포인트 2 (Phase 1 완료)
- [ ] 등산로 리스트 페이지 작동
- [ ] 검색/필터 기능 작동
- [ ] GPS 트래킹 작동
- [ ] 커뮤니티 게시판 작동
- [ ] PWA 설치 가능
- [ ] Vercel 배포 성공

---

## 🔴 Phase 2: 실시간 & 안전 기능 퀵스타트

### ⏱️ 예상 소요 시간
- 환경 설정: 3시간
- 기본 구현: 3-4개월

### 🚨 시작 전 필수
```bash
⚠️ Phase 1 완료 확인
⚠️ 배포 체크리스트 확인: 10_deployment_checklist.md
⚠️ 상세 가이드: 08_phase2_deployment.md
```

### 📝 1단계: Railway WebSocket 서버 (1시간)

```bash
# 1. Railway 계정 생성
https://railway.app → Sign Up → GitHub 연동

# 2. 새 프로젝트 생성
New Project → Empty Project

# 3. WebSocket 서버 코드 작성
# server/ 폴더 생성
mkdir server
cd server

# package.json 생성
cat > package.json << EOF
{
  "name": "hiking-mate-ws",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "ioredis": "^5.3.0"
  }
}
EOF

# server.js 작성
# → 08_phase2_deployment.md의 코드 복사

# 4. Railway 배포
railway login
railway link
railway up

# 5. 환경변수 설정
railway variables set PORT=8080
railway variables set REDIS_URL=<Redis URL>

# 6. 도메인 확인
railway domain
# → wss://xxx.railway.app 복사
```

### 📝 2단계: Redis (Upstash) (30분)

```bash
# 1. Upstash 계정 생성
https://upstash.com → Sign Up

# 2. Database 생성
Create Database
→ Name: hiking-mate-redis
→ Region: Asia Pacific (Seoul)
→ Type: Regional

# 3. Connection String 복사
→ ioredis URL 복사
→ Railway에 환경변수 추가
```

### 📝 3단계: Firebase FCM (1시간)

```bash
# 1. Firebase 프로젝트 생성
https://console.firebase.google.com
→ Add Project
→ Name: hiking-mate

# 2. Web App 추가
Project Overview → Add app → Web
→ App nickname: hiking-mate-web
→ SDK 설정 복사

# 3. Cloud Messaging 설정
Project Settings → Cloud Messaging
→ Web Push certificates → Generate key pair
→ VAPID Key 복사

# 4. Next.js에 환경변수 추가
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...

# 5. Service Worker 생성
# public/firebase-messaging-sw.js
# → 08_phase2_deployment.md의 코드 복사
```

### 📝 4단계: Supabase Edge Functions (30분)

```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. 프로젝트 연결
supabase login
supabase link --project-ref <project-ref>

# 3. SMS 함수 작성
mkdir -p supabase/functions/send-sos-sms
# → 08_phase2_deployment.md의 코드 복사

# 4. 함수 배포
supabase functions deploy send-sos-sms

# 5. 환경변수 설정
supabase secrets set SMS_API_KEY=your-api-key
```

### 📝 5단계: Database 테이블 추가 (10분)

```sql
-- Supabase Dashboard → SQL Editor

-- 08_phase2_deployment.md의 SQL 실행:
-- emergency_contacts
-- sos_logs
-- fcm_tokens
-- notification_logs
```

### ✅ 체크포인트 (Phase 2 완료)
- [ ] Railway WebSocket 서버 운영 중
- [ ] Health Check 성공: https://xxx.railway.app/health
- [ ] Redis 연결 성공
- [ ] Firebase FCM 테스트 메시지 수신 성공
- [ ] 실시간 위치 공유 테스트 성공
- [ ] SOS 버튼 테스트 성공
- [ ] 월 비용 $40-50 확인

---

## 🤖 Phase 3: AI 기능 퀵스타트

### ⏱️ 예상 소요 시간
- 환경 설정: 2시간
- 데이터 임베딩: 1시간
- 기본 구현: 2-3개월

### 🚨 시작 전 필수
```bash
⚠️ Phase 2 완료 확인
⚠️ 배포 체크리스트 확인: 10_deployment_checklist.md
⚠️ 상세 가이드: 09_phase3_ai_deployment.md
⚠️⚠️ OpenAI 비용 제한 필수 설정!
```

### 📝 1단계: OpenAI API 설정 (30분)

```bash
# 1. OpenAI 계정 생성
https://platform.openai.com → Sign Up

# 2. 결제 수단 등록
Billing → Add payment method

# 3. ⚠️ 비용 제한 설정 (매우 중요!)
Settings → Limits
→ Hard limit: $100/month
→ Email notifications: $50, $80

# 4. API 키 발급
API keys → Create new secret key
→ Name: hiking-mate-production
→ 키 복사 (한 번만 표시!)

# 5. 환경변수 추가
OPENAI_API_KEY=sk-proj-...
```

### 📝 2단계: Pinecone 설정 (30분)

```bash
# 1. Pinecone 계정 생성
https://app.pinecone.io → Sign Up

# 2. Starter Plan 선택
→ $70/month

# 3. 인덱스 생성
Create Index
→ Name: hiking-mate
→ Dimensions: 1536
→ Metric: cosine
→ Pod Type: p1.x1

# 4. API 키 확인
API Keys → Copy

# 5. 환경변수 추가
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=hiking-mate
```

### 📝 3단계: 패키지 설치 (5분)

```bash
npm install openai
npm install @pinecone-database/pinecone
npm install ioredis # Redis 캐싱용 (이미 설치되어 있을 수 있음)
```

### 📝 4단계: 데이터 임베딩 (1시간)

```bash
# 1. 임베딩 스크립트 작성
# scripts/embed-trails.ts
# → 09_phase3_ai_deployment.md의 코드 복사

# 2. package.json에 스크립트 추가
"scripts": {
  "embed:trails": "tsx scripts/embed-trails.ts"
}

# 3. tsx 설치
npm install -D tsx

# 4. 임베딩 실행
npm run embed:trails

# 예상 소요 시간: 1,000개 등산로 → 6-10분
# 예상 비용: $0.50-1.00

# 5. 인덱스 확인
Pinecone Console → hiking-mate
→ Vector count 확인
```

### 📝 5단계: RAG 파이프라인 구현 (30분)

```bash
# 1. lib/ai/rag.ts 작성
# → 09_phase3_ai_deployment.md의 코드 복사

# 2. lib/ai/usage-limiter.ts 작성
# → 사용량 제한 로직 복사

# 3. API Route 생성
# app/api/ai/chat/route.ts
# → AI 챗봇 API 복사

# 4. UI 컴포넌트 작성
# app/ai-guide/page.tsx
# → 챗봇 UI 복사
```

### 📝 6단계: Database 테이블 추가 (10분)

```sql
-- Supabase Dashboard → SQL Editor

-- 09_phase3_ai_deployment.md의 SQL 실행:
-- ai_usage_logs
-- ai_conversations
```

### 📝 7단계: Redis 플랜 업그레이드 (5분)

```bash
# Upstash Console
→ Database → Upgrade Plan
→ $20/month (10GB)
```

### ✅ 체크포인트 (Phase 3 완료)
- [ ] OpenAI 비용 제한 $100/월 설정 확인
- [ ] Pinecone 인덱스 생성 완료
- [ ] 데이터 임베딩 1,000+개 완료
- [ ] AI 챗봇 응답 시간 < 5초
- [ ] 캐시 히트율 30% 이상
- [ ] 사용량 제한 작동 (무료: 3회/일)
- [ ] 월 비용 $150-180 확인

---

## 📊 Phase별 타임라인

### Phase 1: 6-8주
```
Week 1-2: 환경 설정 & 데이터 (2주)
Week 3-4: 등산로 기능 (2주)
Week 5: GPS 기록 (1주)
Week 6: 커뮤니티 (1주)
Week 7: 통합 & 테스트 (1주)
Week 8: 배포 & 최적화 (1주)
```

### Phase 2: 3-4개월
```
Month 1: WebSocket 서버 & 실시간 위치 공유
Month 2: SOS 기능 & 푸시 알림
Month 3: 오프라인 지도
Month 4: 테스트 & 안정화
```

### Phase 3: 2-3개월
```
Month 1: RAG 시스템 구축 & 데이터 임베딩
Month 2: AI 챗봇 & 사용량 제한
Month 3: 개인화 추천 & A/B 테스트
```

---

## 🎯 각 Phase 완료 조건

### Phase 1 완료
```bash
✅ 등산로 1,000개 등록
✅ 회원 200명
✅ 산행 기록 100건
✅ 커뮤니티 게시글 50개
✅ DAU 50명
✅ PWA 설치 가능
✅ Vercel 배포 완료
```

### Phase 2 완료
```bash
✅ Railway WebSocket 서버 안정성 99%
✅ 실시간 위치 공유 월 200건
✅ SOS 기능 오발송율 5% 이하
✅ 푸시 알림 도달률 95%
✅ 프리미엄 구독자 50명
✅ DAU 500명
✅ 월 비용 $50 이하
```

### Phase 3 완료
```bash
✅ AI 챗봇 만족도 4.0/5.0
✅ 추천 정확도 70%
✅ 프리미엄+ 구독자 50명
✅ DAU 1,500명
✅ AI 챗봇 사용 월 10,000회
✅ 월 비용 $180 이하
✅ 월 순이익 100만원 달성
```

---

## 🚨 중요 알림

### Phase 2 시작 전
```bash
⚠️ Railway 없이 WebSocket 코드 작성하지 마세요!
⚠️ Redis 설정 먼저 완료하세요!
⚠️ Firebase FCM Service Worker 필수!
```

### Phase 3 시작 전
```bash
⚠️⚠️ OpenAI 비용 제한 $100/월 필수 설정!
⚠️ Pinecone 인덱스 생성 먼저!
⚠️ 데이터 임베딩 완료 후 코드 작성!
⚠️ 매일 OpenAI 사용량 확인 습관화!
```

---

## 📚 도움이 되는 명령어

### 개발 중
```bash
# 로컬 개발 서버
npm run dev

# 타입 체크
npm run type-check

# Lint
npm run lint

# 빌드 (배포 전)
npm run build
```

### 배포
```bash
# Vercel 배포
vercel

# Railway 로그 확인
railway logs

# Supabase Functions 로그
supabase functions logs
```

### 모니터링
```bash
# OpenAI 사용량 확인
https://platform.openai.com/usage

# Railway 사용량
https://railway.app/dashboard

# Upstash Redis
https://console.upstash.com

# Pinecone 인덱스 통계
https://app.pinecone.io
```

---

## 📞 문제 해결

### 자주 발생하는 문제

**1. WebSocket 연결 실패**
```bash
→ Railway URL 확인 (wss://)
→ CORS 설정 확인
→ Railway 서버 Health Check
```

**2. Firebase FCM 작동 안 함**
```bash
→ Service Worker 경로 확인 (/firebase-messaging-sw.js)
→ HTTPS 사용 확인
→ VAPID Key 확인
```

**3. OpenAI API 429 에러**
```bash
→ 비용 제한 초과 확인
→ Rate Limit 확인 (분당 3,500 tokens)
→ 재시도 로직 구현
```

**4. Pinecone 검색 결과 없음**
```bash
→ 인덱스 통계 확인 (Vector count)
→ 질문 임베딩 확인
→ 유사도 임계값 확인 (0.7)
```

---

## 📚 관련 문서

- [Phase 2 배포 가이드](./08_phase2_deployment.md)
- [Phase 3 AI 배포 가이드](./09_phase3_ai_deployment.md)
- [배포 체크리스트](./10_deployment_checklist.md)

---

**빠른 시작으로 성공적인 배포를 진행하세요! 🚀**
