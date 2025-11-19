# 🌿 하이킹메이트 Git 브랜치 전략

## 📋 목차
1. [브랜치 전략 개요](#브랜치-전략-개요)
2. [브랜치 구조](#브랜치-구조)
3. [개발 워크플로우](#개발-워크플로우)
4. [배포 프로세스](#배포-프로세스)
5. [브랜치 네이밍 컨벤션](#브랜치-네이밍-컨벤션)
6. [커밋 메시지 컨벤션](#커밋-메시지-컨벤션)

---

## 브랜치 전략 개요

**하이킹메이트**는 **GitHub Flow 변형 + Feature Branch** 전략을 사용합니다.

### 선택 이유
- ✅ 소규모 팀에 최적화
- ✅ CI/CD (Vercel) 자동 배포와 완벽 호환
- ✅ 단순하고 명확한 워크플로우
- ✅ 빠른 릴리스 사이클 지원

---

## 브랜치 구조

```
main (프로덕션)
  ↑
  └─ develop (통합 개발)
       ↑
       ├─ feature/tracking-save (기능 개발)
       ├─ feature/user-profile (기능 개발)
       ├─ feature/image-upload (기능 개발)
       └─ hotfix/fix-auth-bug (긴급 수정)
```

### 1. `main` 브랜치 (프로덕션)
- **목적:** 실제 사용자에게 배포되는 안정적인 코드
- **보호:** 직접 푸시 금지, PR을 통해서만 병합
- **배포:** Vercel 프로덕션 환경 자동 배포
- **URL:** https://hiking-mate.vercel.app

### 2. `develop` 브랜치 (개발 통합)
- **목적:** 개발 중인 기능들을 통합하는 브랜치
- **보호:** 직접 푸시 금지, PR을 통해서만 병합
- **배포:** Vercel 프리뷰 환경 자동 배포
- **URL:** https://hiking-mate-dev.vercel.app (또는 자동 생성된 URL)
- **병합 조건:**
  - 빌드 성공
  - 기본 기능 테스트 통과
  - 코드 리뷰 완료 (1인 개발 시 셀프 리뷰)

### 3. `feature/*` 브랜치 (기능 개발)
- **목적:** 새로운 기능 개발
- **생성 위치:** `develop` 브랜치에서 분기
- **병합 대상:** `develop` 브랜치로 병합
- **배포:** Vercel 자동 프리뷰 배포
- **삭제:** 병합 후 자동 삭제

### 4. `hotfix/*` 브랜치 (긴급 수정)
- **목적:** 프로덕션 긴급 버그 수정
- **생성 위치:** `main` 브랜치에서 분기
- **병합 대상:** `main` + `develop` 양쪽 모두에 병합
- **배포:** 즉시 프로덕션 배포
- **삭제:** 병합 후 삭제

---

## 개발 워크플로우

### Phase 1: GPS 트래킹 저장 기능 개발 예시

#### Step 1: Feature 브랜치 생성
```bash
# develop 브랜치에서 최신 코드 받기
git checkout develop
git pull origin develop

# feature 브랜치 생성
git checkout -b feature/tracking-save
```

#### Step 2: 개발 작업
```bash
# 파일 수정 및 커밋
git add lib/services/tracking.ts
git commit -m "feat: Add tracking session save service"

git add app/(main)/record/save/page.tsx
git commit -m "feat: Implement hike save page with Supabase integration"

# 원격 저장소에 푸시 (Vercel 자동 프리뷰 배포)
git push origin feature/tracking-save
```

#### Step 3: Pull Request 생성
1. GitHub 웹사이트에서 PR 생성
2. **Base:** `develop` ← **Compare:** `feature/tracking-save`
3. PR 템플릿에 따라 작성:
   ```markdown
   ## 작업 내용
   - GPS 트래킹 저장 서비스 구현
   - 산행 저장 페이지 완성
   - 사용자 통계 업데이트 로직 추가

   ## 테스트 완료 항목
   - [x] 산행 데이터 저장 확인
   - [x] GPS 포인트 JSON 저장 확인
   - [x] 사용자 total_distance 업데이트 확인

   ## Vercel 프리뷰
   [배포 링크](https://hiking-mate-xxx.vercel.app)

   ## 스크린샷
   (선택사항)
   ```

#### Step 4: 코드 리뷰 & 병합
```bash
# PR 승인 후 Squash and Merge
# GitHub UI에서 "Squash and merge" 클릭
# 브랜치 자동 삭제 옵션 활성화
```

#### Step 5: develop → main 배포 (Phase 완료 시)
```bash
# Phase 1 모든 기능 완료 후
# GitHub에서 PR 생성: develop → main
# 제목: "Release: Phase 1 - GPS Tracking & User Profile"
# 승인 후 병합 → Vercel 프로덕션 자동 배포
```

---

## 배포 프로세스

### Vercel 자동 배포 설정

#### 1. Production (main)
```
브랜치: main
환경: Production
URL: https://hiking-mate.vercel.app
트리거: main 브랜치에 push 또는 PR 병합
```

#### 2. Preview (develop)
```
브랜치: develop
환경: Preview
URL: 자동 생성 (hiking-mate-git-develop-xxx.vercel.app)
트리거: develop 브랜치에 push 또는 PR 병합
```

#### 3. Preview (feature/*)
```
브랜치: feature/*
환경: Preview
URL: 자동 생성 (hiking-mate-git-feature-xxx.vercel.app)
트리거: feature 브랜치에 push
```

### 배포 단계별 프로세스

```
feature/tracking-save (개발)
  ↓ (PR + Merge)
develop (통합 테스트)
  ↓ (Phase 완료 후 PR + Merge)
main (프로덕션 배포)
```

---

## 브랜치 네이밍 컨벤션

### Feature 브랜치
```
feature/기능명

예시:
- feature/tracking-save
- feature/user-profile
- feature/image-upload
- feature/hike-history
- feature/trail-completion
```

### Hotfix 브랜치
```
hotfix/버그-설명

예시:
- hotfix/auth-redirect-bug
- hotfix/map-crash
- hotfix/data-loss
```

### 브랜치명 규칙
- ✅ 소문자 사용
- ✅ 단어 구분은 하이픈(-)
- ✅ 간결하고 명확하게
- ❌ 한글 사용 금지
- ❌ 띄어쓰기 금지

---

## 커밋 메시지 컨벤션

### Conventional Commits 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 종류
```
feat:     새로운 기능 추가
fix:      버그 수정
docs:     문서 수정
style:    코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test:     테스트 코드 추가
chore:    빌드 설정, 패키지 매니저 등
perf:     성능 개선
```

### 예시
```bash
# 좋은 예시
git commit -m "feat: Add tracking session save API"
git commit -m "fix: Fix GPS accuracy calculation bug"
git commit -m "docs: Update BRANCHING_STRATEGY.md"
git commit -m "refactor: Simplify trail filtering logic"

# 나쁜 예시
git commit -m "update"
git commit -m "fix bug"
git commit -m "작업 완료"
```

### Scope 예시 (선택사항)
```bash
git commit -m "feat(tracking): Add session save service"
git commit -m "fix(auth): Fix login redirect issue"
git commit -m "style(ui): Update button hover effects"
```

---

## Phase별 개발 계획

### Phase 1: 핵심 기능 완성 (Week 1-3)
```
feature/tracking-save       → GPS 트래킹 저장
feature/user-profile        → 사용자 프로필
feature/hike-save-page      → 산행 저장 페이지
```
**배포 시점:** Phase 1 모든 기능 완료 후 develop → main

### Phase 2: 부가 기능 (Week 4-6)
```
feature/trail-completion    → 등산 완료 기록
feature/hike-history       → 산행 히스토리
feature/image-upload       → 이미지 업로드
```
**배포 시점:** Phase 2 모든 기능 완료 후 develop → main

### Phase 3: 고급 기능 (Week 7+)
```
feature/social-follow      → 팔로우 시스템
feature/realtime-notify    → 실시간 알림
feature/analytics          → 통계 분석
```
**배포 시점:** 기능별 개별 배포 또는 묶음 배포

---

## 브랜치 보호 규칙 (GitHub Settings)

### main 브랜치
- ✅ Require pull request before merging
- ✅ Require status checks to pass (Vercel 빌드)
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

### develop 브랜치
- ✅ Require pull request before merging
- ✅ Require status checks to pass (Vercel 빌드)
- ⚠️ Allow force pushes (필요시)

---

## 긴급 상황 대응

### 프로덕션 긴급 버그 발생 시
```bash
# 1. main에서 hotfix 브랜치 생성
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-description

# 2. 버그 수정
git add .
git commit -m "hotfix: Fix critical authentication bug"
git push origin hotfix/critical-bug-description

# 3. main으로 PR 생성 및 즉시 병합
# (Vercel 프로덕션 즉시 배포)

# 4. develop에도 동일하게 병합
git checkout develop
git pull origin develop
git merge hotfix/critical-bug-description
git push origin develop

# 5. hotfix 브랜치 삭제
git branch -d hotfix/critical-bug-description
git push origin --delete hotfix/critical-bug-description
```

---

## 체크리스트

### PR 생성 전
- [ ] 로컬에서 빌드 성공 확인 (`npm run build`)
- [ ] 타입 체크 통과 (`npm run type-check`)
- [ ] 기본 기능 테스트 완료
- [ ] 커밋 메시지 컨벤션 준수
- [ ] 불필요한 파일 제외 (.env, node_modules 등)

### PR 병합 전
- [ ] Vercel 프리뷰 배포 확인
- [ ] 변경 사항 리뷰 완료
- [ ] 빌드 성공 확인
- [ ] 충돌(conflict) 해결 완료

### main 배포 전
- [ ] develop 브랜치 충분히 테스트
- [ ] Phase 단위 기능 모두 완성
- [ ] 릴리스 노트 작성
- [ ] 데이터베이스 마이그레이션 필요 시 사전 실행

---

## 유용한 Git 명령어

```bash
# 브랜치 목록 확인
git branch -a

# 브랜치 전환
git checkout develop
git checkout -b feature/new-feature

# 최신 코드 받기
git pull origin develop

# 변경사항 확인
git status
git diff

# 브랜치 삭제
git branch -d feature/old-feature
git push origin --delete feature/old-feature

# 커밋 되돌리기 (로컬)
git reset --soft HEAD~1

# develop 최신 변경사항 가져오기 (feature 브랜치에서)
git checkout feature/my-feature
git merge develop
# 또는
git rebase develop
```

---

## 문의 및 문제 해결

Git 브랜치 전략이나 워크플로우에 대한 질문이 있다면:
- GitHub Issues에 질문 등록
- 팀 리더에게 문의

**마지막 업데이트:** 2025-11-19
