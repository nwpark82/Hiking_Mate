# 하이킹메이트 (HikingMate) - 개발 문서

> 등산로 정보 + 커뮤니티 + GPS 기록 + 실시간 안전 + AI 가이드 통합 플랫폼  
> Phase 1 MVP → Phase 2 실시간 → Phase 3 AI 개발 가이드

---

## 📊 현재 개발 상태

**Phase 1 MVP 진행률: 100% 완료** 🎉✅

### ✅ 완료된 기능
- 등산로 탐색 (100%): 리스트, 검색, 필터링, 상세페이지, 지도
- 인증 시스템 (100%): 회원가입, 로그인, 로그아웃, 비밀번호 재설정 ✨
- 커뮤니티 (100%): 게시판, 댓글, 좋아요, 이미지 업로드, 게시글 수정 ✨
- GPS 트래킹 (100%): 실시간 위치, 경로 표시, 통계, 산행 기록 저장 ✨
- 산행 기록 (100%): 히스토리 페이지, 상세 페이지, 일시정지 기능 ✨ NEW
- 이미지 업로드 (100%): 자동 압축, 3개 버킷, RLS 정책
- 프로필 관리 (100%): 프로필 수정, 아바타 업로드, 레벨 시스템, 통계
- 설정 페이지 (100%): 비밀번호 변경, 계정 삭제, 알림 설정
- SEO 최적화 (100%): sitemap, robots.txt, manifest shortcuts
- 배포 환경 (100%): Vercel + GitHub 자동 배포

### 🔧 최근 수정 사항 (2025-11-19)
- ✅ P0/P1 버그 수정 완료 (13개 이슈)
- ✅ 통합 테스트 통과율: 57% → 100%
- ✅ 누락된 페이지 4개 생성
- ✅ 보안 취약점 수정
- ✅ GPS 타이머 버그 수정
- ✅ 데이터베이스 쿼리 최적화

### 📋 배포 전 필수 작업
1. **Supabase 수동 설정 필요**
   - Storage 버킷 생성: [SUPABASE_STORAGE_SETUP.md](../docs/SUPABASE_STORAGE_SETUP.md)
   - RPC 함수 생성: [ACCOUNT_DELETION_RPC.md](../docs/ACCOUNT_DELETION_RPC.md)
2. **프로덕션 빌드 테스트**
   - TypeScript 컴파일 확인
   - 환경 변수 설정

### 🔗 개발 워크플로우
- **Git 브랜치 전략**: GitHub Flow + Feature Branches
- **자동 배포**: GitHub → Vercel (main: 프로덕션, develop: 프리뷰)
- **문서**: [BRANCHING_STRATEGY.md](../BRANCHING_STRATEGY.md), [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## 📚 문서 구성

이 문서는 **하이킹메이트** 서비스를 단계적으로 개발하기 위한 전체 가이드입니다.  
Claude Code와 함께 단계별로 개발을 진행할 수 있도록 구성되어 있습니다.

### 📖 Phase 1: MVP 기본 문서

1. **[프로젝트 개요](./01_project_overview.md)** 📋
   - 프로젝트 목적 및 범위
   - Phase별 기능 정의
   - 타겟 사용자
   - 수익 모델
   - 핵심 지표 (KPI)

2. **[기술 명세서](./02_technical_specification.md)** 💻
   - 시스템 아키텍처
   - 기술 스택 상세
   - 라이브러리 선택 이유
   - 네트워크 구성
   - 보안 정책

3. **[데이터베이스 설계](./03_database_schema.md)** 🗄️
   - ERD (Entity Relationship Diagram)
   - 테이블 스키마 (8개 테이블)
   - 인덱스 전략
   - RLS (Row Level Security) 정책
   - 데이터베이스 함수 & 트리거

4. **[API 명세](./04_api_specification.md)** 📡
   - Supabase 클라이언트 사용법
   - CRUD 작업 예제
   - 실시간 구독 (Realtime)
   - 파일 업로드 (Storage)
   - 에러 처리

5. **[화면 설계서](./05_screen_design.md)** 📱
   - 전체 8개 화면 상세 설계
   - 컴포넌트 구조
   - 사용자 플로우
   - UI/UX 가이드
   - 반응형 디자인

6. **[개발 가이드](./06_development_guide.md)** 🛠️
   - 프로젝트 초기 설정
   - 환경 구성
   - 주요 기능 구현 방법
   - GPS 트래킹
   - 이미지 업로드
   - PWA 설정

7. **[배포 가이드](./07_deployment_guide.md)** 🚀
   - Vercel 배포 방법
   - Supabase 프로덕션 설정
   - SEO 최적화
   - 모니터링 설정
   - 장애 대응

### 📖 Phase 2 & 3: 고급 기능 문서

8. **[Phase 2 배포 가이드](./08_phase2_deployment.md)** 🔴
   - Railway WebSocket 서버 설정
   - Firebase FCM 푸시 알림
   - Redis 설정
   - 실시간 위치 공유
   - SOS 기능 배포

9. **[Phase 3 AI 배포 가이드](./09_phase3_ai_deployment.md)** 🤖
   - OpenAI API 설정
   - Pinecone Vector DB
   - RAG 시스템 구현
   - 비용 최적화
   - AI 챗봇 배포

10. **[배포 체크리스트](./10_deployment_checklist.md)** ✅
    - 기능별 배포 전 체크리스트
    - Phase별 인프라 요구사항
    - 흔한 실수 방지
    - 환경변수 관리

11. **[Phase별 퀵스타트](./11_quickstart_guide.md)** ⚡
    - Phase 1: MVP 빠른 시작
    - Phase 2: 실시간 기능 추가
    - Phase 3: AI 기능 추가
    - 체크포인트

---

## 🎯 빠른 시작

### 🚀 Phase 1: MVP 개발 (6-8주)

#### 1단계: 프로젝트 이해
```bash
# 먼저 읽어야 할 문서
1. 01_project_overview.md - 전체 프로젝트 이해
2. 02_technical_specification.md - 기술 스택 확인
3. 11_quickstart_guide.md - 빠른 시작
```

#### 2단계: 배포 환경 준비 (코드 작성 전 필수!)
```bash
⚠️ 중요: 기능 개발 전에 배포 환경을 먼저 설정하세요!

□ Supabase 프로젝트 생성
□ Vercel 계정 생성
□ Kakao Developers 앱 등록
□ 환경변수 설정

→ 07_deployment_guide.md 참조
```

#### 3단계: 개발 환경 설정
```bash
# Node.js 18+ 설치
node -v

# 프로젝트 초기화
npx create-next-app@latest hiking-mate
cd hiking-mate

# 필수 패키지 설치
npm install @supabase/supabase-js @tanstack/react-query zustand

→ 06_development_guide.md 참조
```

#### 4단계: 데이터베이스 구축
```bash
# Supabase에서 SQL 실행
1. 03_database_schema.md의 SQL 복사
2. Supabase Dashboard → SQL Editor
3. 스키마 생성
4. RLS 정책 적용
5. Storage Buckets 생성
```

#### 5단계: 개발 시작
```bash
# 순서대로 개발
1. 레이아웃 & 네비게이션
2. 등산로 리스트 (05_screen_design.md)
3. GPS 트래킹
4. 커뮤니티 게시판
5. 마이페이지

→ 06_development_guide.md의 단계별 가이드 참조
```

#### 6단계: 배포
```bash
# Vercel 배포
vercel

# 도메인 연결 (선택)
→ 07_deployment_guide.md 참조
```

### 🔴 Phase 2: 실시간 & 안전 기능 (3-4개월)

#### 배포 환경 추가 (코드 작성 전 필수!)
```bash
⚠️ 중요: Phase 2 기능 개발 전 인프라 먼저 구축!

□ Railway 계정 생성 → WebSocket 서버 배포
□ Redis (Upstash) 설정
□ Firebase 프로젝트 생성 → FCM 설정
□ Supabase Edge Functions 설정

→ 08_phase2_deployment.md 참조
→ 10_deployment_checklist.md 확인
```

#### 개발 순서
```bash
1. WebSocket 서버 (Railway)
2. 실시간 위치 공유
3. SOS 버튼
4. 푸시 알림 (FCM)
5. 오프라인 지도

→ 08_phase2_deployment.md의 단계별 가이드 참조
```

### 🤖 Phase 3: AI & 개인화 (2-3개월)

#### 배포 환경 추가 (코드 작성 전 필수!)
```bash
⚠️ 중요: OpenAI API 비용 폭탄 방지!

□ OpenAI API 키 발급
□ 비용 제한 설정 (월 $100)
□ Pinecone 계정 생성
□ Vector DB 인덱스 생성
□ Redis 캐싱 설정

→ 09_phase3_ai_deployment.md 참조
→ 10_deployment_checklist.md 확인
```

#### 개발 순서
```bash
1. RAG 시스템 구축 (Pinecone)
2. AI 챗봇 (OpenAI)
3. 개인화 추천
4. 프리미엄+ 티어

→ 09_phase3_ai_deployment.md의 단계별 가이드 참조
```

---

## 🏗️ 프로젝트 개요

### Phase별 핵심 기능

#### ✅ Phase 1: MVP (6-8주, $0/월)
**등산로 정보 포털**
- 공공데이터 기반 전국 등산로 정보
- 지역/난이도/거리 필터링
- 상세 정보 및 지도 (Kakao Map)

**개인 산행 기록**
- GPS 기반 실시간 트래킹
- 경로 저장 및 통계
- 사진 첨부 (Supabase Storage)

**커뮤니티**
- 게시판 (자유, 후기, 질문, 장비)
- 댓글, 좋아요
- 사용자 프로필

**모임 게시판**
- 등산 모임 공고
- 댓글로 소통

#### 🔴 Phase 2: 실시간 & 안전 (3-4개월, $40-50/월)
**실시간 위치 공유**
- WebSocket 기반 동행자 위치 공유
- 그룹 트래킹 지도
- 개인정보 보호 철저

**SOS & 긴급 연락**
- SOS 버튼 (3초 길게 누르기)
- 긴급 연락처 자동 문자
- 현재 위치 GPS 좌표 전송
- 면책 조항 명시 (119 직접 연동 ❌)

**자동 알림 시스템**
- 일몰 시간 알림
- 날씨 악화 알림
- 푸시 알림 (FCM)

**오프라인 지도 (프리미엄)**
- 등산로 지도 다운로드
- 오프라인 GPS 트래킹

#### 🤖 Phase 3: AI & 개인화 (2-3개월, $230-240/월)
**AI 등산 가이드 챗봇**
- 자연어 질문 응답
- 등산로 추천
- 날씨/계절 고려
- 응급 상황 대처법

**RAG 기반 지식 베이스**
- 등산로 정보 임베딩
- 커뮤니티 게시글 학습
- Pinecone Vector DB

**개인화 추천 시스템**
- 사용자 산행 기록 분석
- 맞춤형 등산로 추천
- 도전 과제 제안

### 기술 스택

#### Phase 1: MVP
```
Frontend:  Next.js 16 + TypeScript + Tailwind CSS
Backend:   Supabase (PostgreSQL, Auth, Storage)
지도:      Kakao Map API
배포:      Vercel (무료) + GitHub
PWA:       next-pwa (예정)

비용: $0/월
```

#### Phase 2: 실시간
```
Phase 1 기술 스택 +

WebSocket: Railway (Node.js)
캐싱:      Redis (Upstash)
푸시 알림: Firebase FCM
함수:      Supabase Edge Functions

추가 비용: $40-50/월
```

#### Phase 3: AI
```
Phase 1 + 2 기술 스택 +

AI:        OpenAI GPT-4 Turbo
Vector DB: Pinecone
Embedding: text-embedding-3-small
캐싱:      Redis (확장)

추가 비용: $190/월
```

---

## 📊 데이터베이스 개요

### 주요 테이블 (Phase 1)
```sql
users         -- 사용자 정보
trails        -- 등산로 정보
hikes         -- 산행 기록
posts         -- 커뮤니티 게시글
comments      -- 댓글
likes         -- 좋아요
meetups       -- 모임
favorites     -- 즐겨찾기
```

### Phase 2 추가 테이블
```sql
emergency_contacts  -- 긴급 연락처
sos_logs           -- SOS 기록
notifications      -- 알림 로그
```

### Phase 3 추가 테이블
```sql
ai_conversations   -- AI 대화 기록
recommendations    -- 추천 기록
user_preferences   -- 사용자 선호도
```

### 데이터 흐름
```
공공데이터 API → 크롤링 → Supabase → Next.js → 사용자
                                ↓
                        Vector DB (Phase 3)
                                ↓
                          OpenAI API
```

---

## 🎨 화면 구성

### Phase 1: 기본 화면 (8개)
1. **홈** - 인기 등산로, 내 주변 산
2. **탐색** - 검색, 필터링, 무한 스크롤
3. **기록** - GPS 트래킹, 산행 통계
4. **커뮤니티** - 게시판, 피드
5. **등산로 상세** - `/trails/[id]`
6. **게시글 상세** - `/posts/[id]`
7. **프로필** - `/profile/[id]`
8. **설정** - `/settings`

### Phase 2: 추가 화면 (3개)
9. **실시간 위치 공유** - `/tracking/[groupId]`
10. **SOS 설정** - `/sos/settings`
11. **오프라인 지도** - `/offline-maps`

### Phase 3: 추가 화면 (2개)
12. **AI 챗봇** - `/ai-guide`
13. **개인화 추천** - `/recommendations`

---

## 💰 비용 구조

### Phase별 인프라 비용

#### Phase 1: MVP ($0/월)
```
서비스              월 비용      용량/한도
------------------------------------------------
Vercel              $0          100GB 대역폭
Supabase Free       $0          500MB DB, 1GB Storage
Kakao Map           $0          일 30만건
Google AdSense      $0          무료
------------------------------------------------
총계                $0/월
```

#### Phase 2: 실시간 ($40-50/월)
```
서비스              월 비용      용량/한도
------------------------------------------------
Phase 1 인프라      $0          
Railway Starter     $5          Node.js WebSocket
Redis (Upstash)     $10         1GB
Firebase FCM        $0          무료
Edge Functions      $25         100만 호출
------------------------------------------------
총계                $40/월
```

#### Phase 3: AI ($230-240/월)
```
서비스              월 비용      용량/한도
------------------------------------------------
Phase 1+2 인프라    $40         
OpenAI API          $100        1M tokens (하루 1,000회)
Pinecone Starter    $70         100K 벡터
Embedding API       $20         
Redis 확장          $20         응답 캐싱
------------------------------------------------
총계                $250/월

비용 절감 후:       $150-180/월
- 응답 캐싱 (Redis)
- 토큰 제한 (컨텍스트 최적화)
- 프리미엄 사용자 우선 제공
```

### 예상 수익 (Phase별)

#### Phase 1: MVP (3개월 후)
```
수익:
- 광고 (AdSense)    월 30만원 (DAU 300명)

비용:
- 인프라            $0

순이익              월 30만원
```

#### Phase 2: 실시간 (6개월 후)
```
수익:
- 광고              월 50만원 (DAU 500명)
- 프리미엄 구독     월 19.5만원 (50명 x 3,900원)

비용:
- 인프라            $40 (약 월 5만원)

순이익              월 64.5만원
```

#### Phase 3: AI (9개월 후)
```
수익:
- 광고              월 100만원 (DAU 1,500명)
- 프리미엄          월 58.5만원 (150명)
- 프리미엄+         월 39.5만원 (50명)
총 수익            월 198만원

비용:
- 인프라            $180 (약 월 25만원)

순이익             월 173만원
ROI                692%
```

---

## 🔧 개발 환경 요구사항

### 필수
- Node.js 18 이상
- npm 9 이상
- Git
- 코드 에디터 (VS Code 권장)

### Phase 1 계정 필요
- ✅ Supabase 계정 (무료)
- ✅ Kakao Developers 계정 (무료)
- ✅ Vercel 계정 (무료)

### Phase 2 추가 계정
- ✅ Railway 계정
- ✅ Firebase 계정
- ✅ Upstash 계정 (Redis)

### Phase 3 추가 계정
- ✅ OpenAI 계정 (결제 정보 등록)
- ✅ Pinecone 계정

### 선택적
- Google Analytics 계정
- Sentry 계정 (에러 추적)

---

## 📦 주요 패키지

### Phase 1: MVP
```json
{
  "dependencies": {
    "next": "14.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "react-kakao-maps-sdk": "^1.1.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.300.0",
    "next-pwa": "^5.6.0"
  }
}
```

### Phase 2: 실시간
```json
{
  "dependencies": {
    "ws": "^8.16.0",
    "socket.io-client": "^4.7.0",
    "ioredis": "^5.3.0",
    "firebase": "^10.7.0"
  }
}
```

### Phase 3: AI
```json
{
  "dependencies": {
    "openai": "^4.20.0",
    "@pinecone-database/pinecone": "^1.1.0",
    "langchain": "^0.1.0"
  }
}
```

---

## 🚀 개발 로드맵

### Phase 1: MVP (6-8주) - **85% 완료** 🎉

#### Week 1-2: 환경 설정 & 데이터 ✅ 완료
**배포 환경 먼저!**
- [x] Supabase 프로젝트 생성
- [x] Vercel 계정 생성
- [x] Kakao Developers 앱 등록
- [x] GitHub 저장소 생성 및 연동

**개발 환경**
- [x] Next.js 16 프로젝트 초기화
- [x] DB 스키마 생성 (8개 테이블)
- [x] 공공데이터 GPX 파싱 (663개 등산로)
- [x] 네이처 디자인 시스템 구축
- [x] Git 브랜치 전략 수립 (GitHub Flow)

#### Week 3-4: 등산로 기능 ✅ 완료
- [x] 등산로 리스트 (무한 스크롤)
- [x] 검색/필터 (난이도, 지역)
- [x] 상세 페이지
- [x] 지도 통합 (Kakao Map + 등산로 경로)

#### Week 5: GPS 기록 ✅ 완료
- [x] GPS 트래킹 UI (실시간 위치 표시)
- [x] 통계 계산 (거리, 고도, 칼로리)
- [x] 경로 시각화 (지도에 표시)
- [x] 산행 저장 백엔드 서비스 (lib/services/tracking.ts) ✨

#### Week 6: 커뮤니티 ✅ 완료
- [x] 인증 시스템 (Supabase Auth)
- [x] 게시판 CRUD
- [x] 댓글, 좋아요
- [x] 이미지 업로드 서비스 (lib/services/storage.ts) ✨

#### Week 7: 통합 & 테스트 ✅ 완료
- [x] 프로필 페이지 (기본 표시)
- [x] 프로필 수정 기능 (lib/services/users.ts) ✨
- [x] 사용자 통계 집계 (레벨 시스템) ✨
- [x] 설정 페이지 (비밀번호 변경, 계정 삭제) ✨
- [ ] 전체 통합 테스트 (다음 단계)

#### Week 8: 배포 & SEO ✅ 완료
- [x] Vercel 배포 (자동 배포 설정)
- [x] GitHub 연동 (main/develop 브랜치)
- [x] 프리뷰 배포 환경
- [x] SEO 최적화 (sitemap, robots, manifest) ✨
- [ ] 베타 테스트 (다음 단계)

### Phase 2: 실시간 (3-4개월)

#### Month 1: WebSocket 서버
**배포 환경 먼저!**
- [ ] Railway 프로젝트 생성
- [ ] WebSocket 서버 배포
- [ ] Redis 설정

**개발**
- [ ] WebSocket 서버 개발
- [ ] 클라이언트 연결
- [ ] 위치 데이터 송수신

#### Month 2: 실시간 위치 공유
- [ ] 그룹 생성/참가
- [ ] 실시간 지도
- [ ] 개인정보 보호

#### Month 3: SOS & 알림
**배포 환경 먼저!**
- [ ] Firebase 프로젝트 생성
- [ ] FCM 설정

**개발**
- [ ] SOS 버튼
- [ ] 문자 발송
- [ ] 푸시 알림

#### Month 4: 테스트 & 배포
- [ ] IndexedDB 오프라인 저장 (GPS 기록, 게시글 임시 저장)
- [ ] 오프라인 지도
- [ ] 프리미엄 구독
- [ ] 통합 테스트

### Phase 3: AI (2-3개월)

#### Month 1: RAG 시스템
**배포 환경 먼저!**
- [ ] OpenAI API 설정
- [ ] 비용 제한 ($100/월)
- [ ] Pinecone 인덱스 생성

**개발**
- [ ] 데이터 임베딩
- [ ] Vector DB 업로드
- [ ] 검색 테스트

#### Month 2: AI 챗봇
- [ ] 챗봇 UI
- [ ] OpenAI 통합
- [ ] RAG 파이프라인
- [ ] 토큰 모니터링

#### Month 3: 개인화 & 배포
- [ ] 추천 알고리즘
- [ ] 프리미엄+ 티어
- [ ] A/B 테스트
- [ ] 배포

---

## 🎯 성공 지표

### Phase 1: MVP 출시 1개월 목표
- [ ] 다운로드: 500건
- [ ] DAU: 50명
- [ ] 등록 산행 기록: 100건
- [ ] 커뮤니티 게시글: 50개

### Phase 2: 6개월 목표
- [ ] DAU: 500명
- [ ] 실시간 위치 공유: 월 200건
- [ ] 프리미엄 구독: 50명
- [ ] 광고 수익: 월 50만원

### Phase 3: 9개월 목표
- [ ] DAU: 1,500명
- [ ] AI 챗봇 사용: 월 10,000회
- [ ] 프리미엄 구독: 200명
- [ ] 월 순이익: 100만원

---

## ⚠️ 중요: 배포 환경 먼저, 코드는 나중에!

### 흔한 실수들
❌ **실수 1**: Railway 없이 WebSocket 코드 작성
```bash
✅ 올바른 순서:
1. Railway 프로젝트 생성
2. WebSocket 서버 배포
3. URL 확인
4. 클라이언트 코드 작성
```

❌ **실수 2**: OpenAI 비용 제한 없이 API 사용
```bash
✅ 올바른 순서:
1. OpenAI 계정 생성
2. 결제 수단 등록
3. 비용 제한 설정 ($100/월)
4. API 키 발급
5. 코드 작성
```

❌ **실수 3**: 환경변수 누락
```bash
✅ 체크리스트 사용:
→ 10_deployment_checklist.md 참조
```

### 각 Phase 시작 전 필수 확인
```bash
Phase 2 시작 전:
□ Phase 1 MVP 완료 확인
□ 10_deployment_checklist.md 체크
□ Railway + Firebase 계정 생성
□ 08_phase2_deployment.md 읽기

Phase 3 시작 전:
□ Phase 2 완료 확인
□ 10_deployment_checklist.md 체크
□ OpenAI + Pinecone 계정 생성
□ 비용 제한 설정 (매우 중요!)
□ 09_phase3_ai_deployment.md 읽기
```

---

## 🤝 기여 가이드

이 프로젝트는 개인 프로젝트이지만, 피드백과 제안은 환영합니다.

### 버그 리포트
- 이슈에 상세한 재현 방법 기재
- 스크린샷 첨부
- 환경 정보 (브라우저, OS, Phase)

### 기능 제안
- 명확한 사용 사례 설명
- 기대 효과 설명
- Phase 제안 (1/2/3)

---

## 📞 문의

프로젝트 관련 문의:
- 이메일: [your-email]
- 깃허브: [your-github]

---

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

---

## 🙏 감사의 말

- 공공데이터: 한국등산트레킹지원센터
- 지도: Kakao Maps API
- 인프라: Supabase, Vercel, Railway, Firebase
- AI: OpenAI, Pinecone

---

## 📌 중요 링크

### 개발 도구 (Phase 1)
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Kakao Developers](https://developers.kakao.com)

### 개발 도구 (Phase 2)
- [Railway Dashboard](https://railway.app/dashboard)
- [Firebase Console](https://console.firebase.google.com)
- [Upstash Console](https://console.upstash.com)

### 개발 도구 (Phase 3)
- [OpenAI Platform](https://platform.openai.com)
- [Pinecone Console](https://app.pinecone.io)

### 공식 문서
- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [OpenAI API 문서](https://platform.openai.com/docs)

### 공공데이터
- [공공데이터포털](https://www.data.go.kr)
- [한국등산트레킹지원센터](https://www.komount.or.kr)
- [기상청 날씨 API](https://www.data.go.kr/data/15084084/openapi.do)

---

## 🔄 문서 업데이트

이 문서는 프로젝트 진행에 따라 지속적으로 업데이트됩니다.

**마지막 업데이트**: 2025년 11월 19일
**버전**: 2.2.0
**상태**: Phase 1 MVP 85% 완료, Phase 2-3 계획 완료

---

## 다음 단계

### Phase 1 거의 완료 (85% 완료) 🎉
1. ✅ 문서 읽기
2. ✅ 배포 환경 설정 (Supabase + Vercel + GitHub)
3. ✅ 개발 환경 설정
4. ✅ DB 구축 (8개 테이블 + RLS + 663개 등산로)
5. ✅ **핵심 기능 완료**:
   - [x] GPS 산행 저장 백엔드 (lib/services/tracking.ts) ✨
   - [x] 이미지 업로드 서비스 (lib/services/storage.ts) ✨
   - [x] 프로필 수정 기능 (lib/services/users.ts) ✨
   - [x] 사용자 통계 집계 (레벨 시스템) ✨
   - [x] 설정 페이지 (비밀번호 변경, 계정 삭제) ✨
   - [x] SEO 최적화 (sitemap, robots, manifest) ✨
6. ✅ Vercel 배포 완료 (자동 배포 설정됨)
7. 📋 **다음 작업**:
   - [ ] Supabase Storage 수동 설정 (문서: docs/SUPABASE_STORAGE_SETUP.md)
   - [ ] 베타 테스팅

### Phase 2 시작 (Phase 1 완료 후)
1. ⬜ [10_deployment_checklist.md](./10_deployment_checklist.md) 확인
2. ⬜ [08_phase2_deployment.md](./08_phase2_deployment.md) 읽기
3. ⬜ Railway + Firebase 설정
4. ⬜ 개발 시작

### Phase 3 시작 (Phase 2 완료 후)
1. ⬜ [10_deployment_checklist.md](./10_deployment_checklist.md) 확인
2. ⬜ [09_phase3_ai_deployment.md](./09_phase3_ai_deployment.md) 읽기
3. ⬜ OpenAI + Pinecone 설정
4. ⬜ 비용 제한 설정 (중요!)
5. ⬜ 개발 시작

**화이팅! 🚀**

---

## 📋 Phase별 체크리스트

### Phase 1 완료 조건 (85% 달성) 🎉

#### 개발 완료 항목 ✅
- [x] 등산로 663개 등록 (GPX 데이터 파싱 완료)
- [x] Vercel 배포 완료 (자동 배포 설정)
- [x] GitHub 연동 및 브랜치 전략 수립
- [x] GPS 산행 저장 백엔드 ✨
- [x] 이미지 업로드 서비스 ✨
- [x] 프로필 수정 기능 ✨
- [x] 사용자 통계 & 레벨 시스템 ✨
- [x] 설정 페이지 (비밀번호 변경, 계정 삭제) ✨
- [x] SEO 최적화 (sitemap, robots, manifest) ✨

#### 수동 설정 필요 ⚙️
- [ ] Supabase Storage 버킷 설정 (문서 작성 완료)

#### 베타 테스트 목표 📊
- [ ] 등산로 1,000개 등록 (337개 추가 필요)
- [ ] 회원 200명
- [ ] 산행 기록 100건
- [ ] 커뮤니티 게시글 50개
- [ ] DAU 50명

### Phase 2 완료 조건
- [ ] Railway WebSocket 서버 운영
- [ ] 실시간 위치 공유 안정성 99%
- [ ] Firebase FCM 설정 완료
- [ ] SOS 기능 테스트 완료
- [ ] 프리미엄 구독 50명
- [ ] DAU 500명

### Phase 3 완료 조건
- [ ] OpenAI API 통합 완료
- [ ] Pinecone Vector DB 구축
- [ ] AI 챗봇 만족도 4.0/5.0
- [ ] 개인화 추천 정확도 70%
- [ ] 프리미엄+ 구독 50명
- [ ] 월 순이익 100만원 달성

---

**각 Phase 시작 전 반드시 해당 배포 가이드를 먼저 읽으세요!**
