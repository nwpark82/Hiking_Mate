# 배포 체크리스트 - 기능 개발 전 필수 확인

> 💡 **핵심 원칙**: 배포 환경 먼저, 코드는 나중에!

## 📋 이 문서의 목적

### 문제 상황
```bash
❌ 잘못된 순서:
1. WebSocket 코드 작성
2. Railway 없음
3. 배포 실패
4. 시간 낭비

✅ 올바른 순서:
1. 체크리스트 확인
2. 필요한 인프라 구축
3. 코드 작성
4. 성공적인 배포
```

---

## 🎯 Phase 1: MVP 기본 기능

### 1.1 등산로 정보 포털

#### 배포 환경 체크리스트
- [ ] **Supabase 프로젝트 생성**
  - [ ] 프로젝트 생성 완료
  - [ ] Project URL 확인
  - [ ] anon key 확인
  - [ ] service_role key 확인

- [ ] **Vercel 프로젝트 생성**
  - [ ] GitHub 저장소 연결
  - [ ] 프로젝트 import 완료
  - [ ] 자동 배포 활성화

- [ ] **Kakao Developers**
  - [ ] 앱 생성
  - [ ] JavaScript 키 발급
  - [ ] 플랫폼 등록 (Web)

#### 환경변수
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (서버 전용)
NEXT_PUBLIC_KAKAO_MAP_KEY=1234567890abcdef
```

#### 개발 시작 전 확인
- [ ] 모든 환경변수 설정 완료
- [ ] Supabase 연결 테스트 성공
- [ ] Kakao Map 렌더링 테스트 성공

---

### 1.2 GPS 기록 기능

#### 배포 환경 체크리스트
- [ ] **Supabase Storage**
  - [ ] `hike-photos` 버킷 생성
  - [ ] Public 접근 설정
  - [ ] RLS 정책 적용

- [ ] **IndexedDB** (클라이언트)
  - [ ] 브라우저 지원 확인
  - [ ] 저장 용량 확인 (최소 50MB)

#### 환경변수
```bash
# 추가 환경변수 없음 (Phase 1 환경변수 재사용)
```

#### 개발 시작 전 확인
- [ ] GPS 권한 테스트
- [ ] IndexedDB 저장/불러오기 테스트
- [ ] Supabase Storage 업로드 테스트

---

### 1.3 커뮤니티 기능

#### 배포 환경 체크리스트
- [ ] **Supabase Auth**
  - [ ] Email 인증 활성화
  - [ ] OAuth 설정 (선택: Google, Kakao)
  - [ ] Redirect URL 설정

- [ ] **Supabase Storage**
  - [ ] `post-images` 버킷 생성
  - [ ] 이미지 최대 크기 설정 (5MB)
  - [ ] RLS 정책 적용

#### 환경변수
```bash
# 추가 환경변수 없음
# OAuth 사용 시:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_KAKAO_CLIENT_ID=...
```

#### 개발 시작 전 확인
- [ ] 회원가입/로그인 테스트
- [ ] 이미지 업로드 테스트 (4장)
- [ ] RLS 정책 작동 확인

---

## 🔴 Phase 2: 실시간 & 안전 기능

### 2.1 실시간 위치 공유 (WebSocket)

#### 배포 환경 체크리스트 ⚠️ 필수!
- [ ] **Railway 프로젝트**
  - [ ] 계정 생성
  - [ ] GitHub 연동
  - [ ] 새 프로젝트 생성
  - [ ] WebSocket 서버 배포
  - [ ] 도메인 확인 (예: xxx.railway.app)

- [ ] **Redis (Upstash)**
  - [ ] 계정 생성
  - [ ] Database 생성
  - [ ] Region 선택: Asia Pacific (Seoul)
  - [ ] Connection String 복사

#### 환경변수
```bash
# Railway (WebSocket 서버)
REDIS_URL=redis://default:****@****.upstash.io:6379
PORT=8080

# Next.js
NEXT_PUBLIC_WS_URL=wss://xxx.railway.app
```

#### 개발 시작 전 확인
- [ ] Railway 서버 Health Check 성공
- [ ] Redis 연결 테스트 성공
- [ ] WebSocket 연결 테스트 (2개 클라이언트)
- [ ] 비용 모니터링 설정 ($5/월)

#### 흔한 실수
❌ Railway 없이 WebSocket 코드 작성
❌ Redis URL 미설정
❌ CORS 설정 누락
❌ 재연결 로직 없음

---

### 2.2 SOS 긴급 연락 시스템

#### 배포 환경 체크리스트 ⚠️ 필수!
- [ ] **Supabase Edge Functions**
  - [ ] Supabase CLI 설치
  - [ ] 프로젝트 연결
  - [ ] `send-sos-sms` 함수 배포
  - [ ] 함수 URL 확인

- [ ] **SMS API 서비스 (선택)**
  - [ ] Twilio / CoolSMS 계정
  - [ ] API 키 발급
  - [ ] 테스트 발송 성공

#### 환경변수
```bash
# Supabase Edge Functions (Secrets)
SMS_API_KEY=...
SMS_SENDER=+821012345678

# Next.js (추가 없음)
```

#### 개발 시작 전 확인
- [ ] Edge Function 배포 성공
- [ ] SMS 테스트 발송 성공
- [ ] SOS 로그 테이블 생성 완료
- [ ] 긴급 연락처 테이블 생성 완료

#### 흔한 실수
❌ Edge Function 미배포
❌ SMS API 키 미설정
❌ 테이블 생성 누락
❌ 면책 조항 미표시

---

### 2.3 푸시 알림 (Firebase FCM)

#### 배포 환경 체크리스트 ⚠️ 필수!
- [ ] **Firebase 프로젝트**
  - [ ] 계정 생성
  - [ ] 새 프로젝트 생성
  - [ ] Web App 추가
  - [ ] SDK 설정 복사

- [ ] **Cloud Messaging**
  - [ ] FCM 활성화
  - [ ] VAPID Key 생성
  - [ ] Service Worker 파일 생성

#### 환경변수
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hiking-mate.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hiking-mate
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hiking-mate.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNdG...
```

#### 개발 시작 전 확인
- [ ] Firebase SDK 설치
- [ ] Service Worker 등록 성공
- [ ] 알림 권한 요청 작동
- [ ] FCM 토큰 생성 성공
- [ ] 테스트 메시지 발송 성공

#### 흔한 실수
❌ Service Worker 경로 오류 (/firebase-messaging-sw.js)
❌ VAPID Key 미설정
❌ 알림 권한 미요청
❌ HTTPS 미사용 (로컬에서만 작동)

---

## 🤖 Phase 3: AI 기능

### 3.1 AI 챗봇 (OpenAI + Pinecone)

#### 배포 환경 체크리스트 ⚠️ 매우 중요!
- [ ] **OpenAI API**
  - [ ] 계정 생성
  - [ ] 결제 수단 등록
  - [ ] **비용 제한 $100/월 설정** ← 가장 중요!
  - [ ] Email 알림 설정 ($50, $80)
  - [ ] API 키 발급

- [ ] **Pinecone**
  - [ ] 계정 생성
  - [ ] Starter Plan 선택 ($70/월)
  - [ ] 인덱스 생성 (hiking-mate, 1536 dims)
  - [ ] API 키 확인

- [ ] **Redis 확장**
  - [ ] Upstash 플랜 업그레이드 ($20/월)
  - [ ] 캐싱 용량 확인 (10GB)

#### 환경변수
```bash
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=hiking-mate
REDIS_URL=redis://... (Phase 2와 동일)
```

#### 개발 시작 전 확인
- [ ] OpenAI 비용 제한 설정 확인 (필수!)
- [ ] Pinecone 인덱스 생성 완료
- [ ] 데이터 임베딩 완료 (1,000+개)
- [ ] 인덱스 통계 확인
- [ ] Redis 캐싱 테스트
- [ ] 비용 모니터링 대시보드 설정

#### 개발 중 체크
- [ ] 매일 OpenAI 사용량 확인
- [ ] 캐시 히트율 30% 이상
- [ ] 응답 시간 5초 이하
- [ ] 토큰 사용량 모니터링
- [ ] 월 비용 $150 이하 유지

#### 흔한 실수 (⚠️ 매우 위험!)
❌ **비용 제한 미설정** → 며칠 만에 $1,000+ 청구!
❌ OpenAI API 무제한 노출
❌ 캐싱 없이 매번 API 호출
❌ 컨텍스트 최적화 안 함
❌ 무료 사용자 무제한 허용

---

## 📊 Phase별 인프라 요약

### Phase 1: MVP ($0/월)
```
✅ Vercel (무료)
✅ Supabase Free (500MB DB, 1GB Storage)
✅ Kakao Map (무료, 일 30만건)

총 비용: $0/월
```

### Phase 2: 실시간 ($40/월)
```
Phase 1 인프라 +

✅ Railway WebSocket ($5/월)
✅ Redis Upstash ($10/월)
✅ Firebase FCM (무료)
✅ Supabase Edge Functions ($25/월)

총 추가 비용: $40/월
총 비용: $40/월
```

### Phase 3: AI ($230/월 → $150/월)
```
Phase 1 + 2 인프라 +

✅ OpenAI API ($100/월)
✅ Pinecone ($70/월)
✅ Embedding ($20/월)
✅ Redis 확장 ($20/월)

총 추가 비용: $210/월
총 비용: $250/월

비용 절감 후:
- 캐싱: -30%
- 토큰 최적화: -20%
실제 비용: $150-180/월
```

---

## ✅ 전체 체크리스트 (시작 전)

### Phase 1 시작 전
- [ ] Supabase 프로젝트 생성
- [ ] Vercel 계정 생성
- [ ] Kakao Developers 앱 등록
- [ ] 모든 환경변수 설정
- [ ] DB 스키마 생성
- [ ] 테이블 생성 완료

### Phase 2 시작 전
- [ ] Phase 1 완료 확인
- [ ] Railway 계정 생성
- [ ] Redis (Upstash) 생성
- [ ] Firebase 프로젝트 생성
- [ ] WebSocket 서버 배포
- [ ] 모든 환경변수 추가
- [ ] Phase 2 테이블 생성

### Phase 3 시작 전
- [ ] Phase 2 완료 확인
- [ ] OpenAI 계정 생성
- [ ] **비용 제한 $100/월 설정** (필수!)
- [ ] Pinecone 계정 생성
- [ ] 인덱스 생성
- [ ] 데이터 임베딩 완료
- [ ] Redis 플랜 업그레이드
- [ ] 모든 환경변수 추가
- [ ] Phase 3 테이블 생성

---

## 🚨 실수 방지 가이드

### 1. 환경변수 누락
```bash
# .env.local 템플릿 사용
cp .env.example .env.local

# 체크리스트로 확인
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] NEXT_PUBLIC_KAKAO_MAP_KEY
- [ ] NEXT_PUBLIC_WS_URL (Phase 2)
- [ ] OPENAI_API_KEY (Phase 3)
```

### 2. 인프라 구축 순서
```bash
❌ 잘못된 순서:
코드 작성 → 배포 → 에러 → 인프라 구축

✅ 올바른 순서:
체크리스트 확인 → 인프라 구축 → 코드 작성 → 배포
```

### 3. 비용 모니터링
```bash
Phase 2 시작 후:
- [ ] Railway 사용량 매주 확인
- [ ] Upstash 사용량 매주 확인
- [ ] 월 비용 $50 이하 유지

Phase 3 시작 후:
- [ ] OpenAI 사용량 매일 확인 (필수!)
- [ ] Pinecone 사용량 매주 확인
- [ ] 월 비용 $180 이하 유지
```

---

## 📋 배포 전 최종 체크

### Vercel 배포 전
- [ ] 모든 환경변수 설정 완료
- [ ] 로컬 빌드 성공 (`npm run build`)
- [ ] 타입 에러 없음
- [ ] ESLint 에러 없음
- [ ] 테스트 성공

### 기능 배포 전
- [ ] 해당 Phase 체크리스트 100% 완료
- [ ] 로컬 환경에서 기능 테스트 성공
- [ ] 인프라 연결 테스트 성공
- [ ] 비용 모니터링 설정 완료

---

## 📚 관련 문서

- [Phase 2 배포 가이드](./08_phase2_deployment.md)
- [Phase 3 AI 배포 가이드](./09_phase3_ai_deployment.md)
- [퀵스타트 가이드](./11_quickstart_guide.md)

---

**체크리스트를 사용하여 안전한 배포를 진행하세요! ✅**
