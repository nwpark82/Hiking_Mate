# 🚀 Vercel 브랜치 배포 설정 가이드

## 📋 목차
1. [Vercel 프로젝트 설정](#vercel-프로젝트-설정)
2. [브랜치별 배포 설정](#브랜치별-배포-설정)
3. [환경 변수 설정](#환경-변수-설정)
4. [배포 확인 및 테스트](#배포-확인-및-테스트)
5. [문제 해결](#문제-해결)

---

## Vercel 프로젝트 설정

### 1. Vercel 대시보드 접속
https://vercel.com/dashboard

### 2. 프로젝트 선택
`hiking-mate` 프로젝트 클릭

---

## 브랜치별 배포 설정

### 1. Settings 메뉴 이동
프로젝트 → Settings → Git

### 2. Production Branch 설정

#### Production Branch
```
main
```

- **설명:** main 브랜치에 push 또는 PR 병합 시 프로덕션 배포
- **URL:** https://hiking-mate.vercel.app
- **자동 배포:** ✅

### 3. Preview Deployments 설정

#### ✅ Enable Automatic Deployments for All Branches
- **체크:** ✅
- **설명:** 모든 브랜치(develop, feature/*)에서 자동 프리뷰 배포

#### Branch Protection
- **설명:** 특정 브랜치만 프리뷰 배포
- **사용:** ❌ (모든 브랜치 허용)

### 4. develop 브랜치 설정

현재 Vercel은 develop 브랜치를 자동으로 인식하고 프리뷰 배포합니다.

- **브랜치:** develop
- **환경:** Preview
- **URL:** 자동 생성
  - 예: `hiking-mate-git-develop-nwpark82.vercel.app`
- **트리거:** develop 브랜치 push 또는 PR 병합

### 5. feature/* 브랜치 설정

모든 feature 브랜치도 자동으로 프리뷰 배포됩니다.

- **브랜치:** feature/tracking-save
- **환경:** Preview
- **URL:** 자동 생성
  - 예: `hiking-mate-git-feature-tracking-save-xxx.vercel.app`
- **트리거:** feature 브랜치 push

---

## 환경 변수 설정

### 1. Settings → Environment Variables 이동

### 2. 환경별 변수 추가

#### Production (main 브랜치)
```
NEXT_PUBLIC_SUPABASE_URL = https://chnqwgyiaagqxtvwueux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [프로덕션 Supabase Anon Key]
NEXT_PUBLIC_KAKAO_MAP_KEY = [Kakao Map API Key]
```

**Environment 선택:**
- ✅ Production
- ❌ Preview
- ❌ Development

#### Preview (develop, feature/*)
```
NEXT_PUBLIC_SUPABASE_URL = https://chnqwgyiaagqxtvwueux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [프로덕션 또는 개발용 Anon Key]
NEXT_PUBLIC_KAKAO_MAP_KEY = [Kakao Map API Key]
```

**Environment 선택:**
- ❌ Production
- ✅ Preview
- ❌ Development

**참고:** Preview 환경에서도 프로덕션 Supabase를 사용하거나, 별도의 개발용 Supabase 프로젝트를 만들 수 있습니다.

#### Development (로컬)
로컬 개발은 `.env.local` 파일 사용

### 3. 환경 변수 추가 방법

#### 개별 추가
1. "Add New" 클릭
2. Name: `NEXT_PUBLIC_SUPABASE_URL`
3. Value: `https://chnqwgyiaagqxtvwueux.supabase.co`
4. Environment 선택: Production, Preview
5. "Save" 클릭

#### 일괄 추가 (권장)
1. "Add New" → "Plaintext"
2. 다음 형식으로 입력:
```
NEXT_PUBLIC_SUPABASE_URL=https://chnqwgyiaagqxtvwueux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_key
```
3. Environment 선택
4. "Save" 클릭

---

## 배포 확인 및 테스트

### 1. main 브랜치 배포 (Production)

#### 배포 트리거
```bash
git checkout main
git merge develop  # 또는 GitHub PR 병합
git push origin main
```

#### 배포 확인
1. Vercel 대시보드 → Deployments 탭
2. main 브랜치 배포 확인
3. Status: "Ready" 확인
4. Visit 버튼 클릭 → https://hiking-mate.vercel.app

### 2. develop 브랜치 배포 (Preview)

#### 배포 트리거
```bash
git checkout develop
git merge feature/some-feature
git push origin develop
```

#### 배포 확인
1. Vercel 대시보드 → Deployments 탭
2. develop 브랜치 배포 확인
3. URL: `hiking-mate-git-develop-xxx.vercel.app`
4. Visit 버튼 클릭 → 프리뷰 확인

### 3. feature 브랜치 배포 (Preview)

#### 배포 트리거
```bash
git checkout -b feature/new-feature
# 코드 작성
git push origin feature/new-feature
```

#### 배포 확인
1. Vercel 대시보드 → Deployments 탭
2. feature 브랜치 배포 확인
3. URL 자동 생성
4. GitHub PR에서도 Vercel 봇이 URL 코멘트 자동 추가

### 4. GitHub PR에서 Vercel 프리뷰 확인

PR을 생성하면 Vercel 봇이 자동으로 코멘트를 추가합니다:

```
✅ Preview deployment succeeded!

🔍 Preview:
https://hiking-mate-git-feature-new-feature-xxx.vercel.app

📝 Latest commit:
abc1234

Built with Vercel
```

---

## 배포 워크플로우

### 시나리오 1: 새 기능 개발

```
1. feature/tracking-save 브랜치 생성
   → Vercel 자동 프리뷰 배포 (URL-A)

2. 코드 수정 & push
   → Vercel 자동 재배포 (URL-A 업데이트)

3. PR 생성: develop ← feature/tracking-save
   → Vercel 프리뷰 URL GitHub 코멘트

4. PR 병합
   → develop 브랜치 자동 배포 (URL-B)
   → feature 브랜치 배포 삭제

5. Phase 완료 후 PR: main ← develop
   → main 브랜치 프로덕션 배포
   → https://hiking-mate.vercel.app 업데이트
```

### 시나리오 2: 긴급 버그 수정

```
1. hotfix/critical-bug 브랜치 생성 (from main)
   → Vercel 자동 프리뷰 배포

2. 버그 수정 & push
   → Vercel 자동 재배포

3. PR 생성: main ← hotfix/critical-bug
   → 즉시 병합 (긴급)

4. main 브랜치 프로덕션 배포
   → https://hiking-mate.vercel.app 즉시 업데이트

5. develop에도 병합
   → develop 브랜치 배포 업데이트
```

---

## Vercel CLI를 통한 배포 (선택사항)

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. 로그인
```bash
vercel login
```

### 3. 로컬에서 프로덕션 배포
```bash
# main 브랜치에서
vercel --prod
```

### 4. 프리뷰 배포
```bash
# feature 브랜치에서
vercel
```

---

## 배포 설정 최적화

### 1. Build & Development Settings

#### Framework Preset
```
Next.js
```

#### Build Command
```
npm run build
```

#### Output Directory
```
.next
```

#### Install Command
```
npm install
```

### 2. Performance 설정

#### ✅ Enable Speed Insights
- **체크:** ✅ (권장)
- **설명:** 성능 모니터링

#### ✅ Enable Analytics
- **체크:** ✅ (권장)
- **설명:** 방문자 통계

### 3. Functions 설정

#### Function Region
```
Seoul (icn1)
```
- **설명:** 한국 사용자를 위한 최적화

#### Serverless Function Timeout
```
10s (기본값)
```

---

## 배포 알림 설정

### 1. Settings → Notifications

#### Slack 알림 (선택사항)
- Production 배포 성공/실패
- Preview 배포 실패만

#### Email 알림
- ✅ Deployment Failed
- ✅ Deployment Ready (Production only)
- ❌ Deployment Ready (Preview) - 너무 많음

---

## 문제 해결

### Q1. 배포가 실패해요 (Build Error)
**A:** Deployments → 실패한 배포 클릭 → Build Logs 확인

**일반적인 원인:**
- 환경 변수 누락
- TypeScript 타입 에러
- 빌드 명령어 오류
- 의존성 설치 실패

**해결 방법:**
```bash
# 로컬에서 빌드 테스트
npm run build
npm run type-check

# 성공하면 push
git push origin your-branch
```

### Q2. 환경 변수가 적용되지 않아요
**A:** 환경 변수 추가 후 재배포 필요

```bash
# Settings → Environment Variables에서 변경 후
# Deployments → 최신 배포 → Redeploy 클릭
```

또는:
```bash
git commit --allow-empty -m "chore: Trigger redeploy"
git push
```

### Q3. develop 브랜치 프리뷰 URL이 변경돼요
**A:** 매 배포마다 새로운 URL이 생성됩니다. 고정 URL을 원하면:

1. Settings → Domains
2. "Add" 클릭
3. `dev.hiking-mate.com` 같은 커스텀 도메인 추가
4. Git Branch: `develop` 선택

### Q4. feature 브랜치 배포가 너무 많아요
**A:** Settings → Git → Ignored Build Step에서 특정 패턴 제외

```javascript
// vercel.json에 추가
{
  "git": {
    "deploymentEnabled": {
      "feature/*": false  // feature 브랜치 자동 배포 비활성화
    }
  }
}
```

### Q5. 배포 속도가 느려요
**A:** 캐싱 최적화

```javascript
// next.config.js
module.exports = {
  // 이미지 최적화
  images: {
    domains: ['chnqwgyiaagqxtvwueux.supabase.co'],
  },

  // 정적 파일 캐싱
  headers: async () => [
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

---

## 배포 체크리스트

### 첫 배포
- [ ] Vercel 프로젝트 생성
- [ ] GitHub 저장소 연동
- [ ] Production Branch = main 설정
- [ ] 환경 변수 설정 (Production, Preview)
- [ ] main 브랜치 배포 테스트
- [ ] develop 브랜치 배포 테스트
- [ ] 커스텀 도메인 연결 (선택)

### 배포 전 체크
- [ ] 로컬 빌드 성공 (`npm run build`)
- [ ] 타입 체크 통과 (`npm run type-check`)
- [ ] 환경 변수 확인
- [ ] 데이터베이스 마이그레이션 완료 (필요 시)

### 배포 후 체크
- [ ] 배포 상태 "Ready" 확인
- [ ] URL 접속 확인
- [ ] 주요 기능 동작 확인
- [ ] 모바일 환경 확인
- [ ] 성능 모니터링 확인

---

## 유용한 명령어

### Vercel CLI
```bash
# 로그인
vercel login

# 프로젝트 정보
vercel ls

# 환경 변수 확인
vercel env ls

# 환경 변수 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# 로그 확인
vercel logs [deployment-url]

# 배포 롤백
vercel rollback [deployment-url]
```

---

## 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel Git Integration](https://vercel.com/docs/git)

---

**마지막 업데이트:** 2025-11-19
