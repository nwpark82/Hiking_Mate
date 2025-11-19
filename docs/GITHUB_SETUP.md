# 🔧 GitHub 브랜치 보호 규칙 설정 가이드

## 📋 목차
1. [브랜치 보호 규칙 설정](#브랜치-보호-규칙-설정)
2. [main 브랜치 설정](#main-브랜치-설정)
3. [develop 브랜치 설정](#develop-브랜치-설정)
4. [자동 병합 규칙](#자동-병합-규칙)

---

## 브랜치 보호 규칙 설정

### 1. GitHub 저장소 접속
https://github.com/nwpark82/Hiking_Mate

### 2. Settings 이동
상단 메뉴에서 **Settings** 클릭

### 3. Branches 메뉴 선택
왼쪽 사이드바에서 **Branches** 클릭

---

## main 브랜치 설정

### 1. Add branch protection rule 클릭

### 2. Branch name pattern 입력
```
main
```

### 3. 보호 규칙 설정

#### ✅ Require a pull request before merging
- **설명:** 직접 푸시 금지, PR을 통해서만 병합 가능
- **체크:** ✅
- **하위 옵션:**
  - ✅ Require approvals: **1** (1인 개발 시에도 체크 권장)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (선택사항)

#### ✅ Require status checks to pass before merging
- **설명:** Vercel 빌드 성공 필수
- **체크:** ✅
- **하위 옵션:**
  - ✅ Require branches to be up to date before merging
  - **Status checks that are required:**
    - 검색창에 "vercel" 입력 후 나타나는 항목 선택
    - 또는 첫 배포 후 자동으로 나타남

#### ✅ Require conversation resolution before merging
- **설명:** PR 코멘트 모두 해결 필수
- **체크:** ✅

#### ❌ Require signed commits
- **설명:** GPG 서명 필수 (선택사항)
- **체크:** ❌ (선택)

#### ❌ Require linear history
- **설명:** Merge commit 금지, Squash/Rebase만 허용
- **체크:** ❌ (Squash merge 사용 시 불필요)

#### ✅ Require deployments to succeed before merging
- **설명:** Vercel 배포 성공 필수
- **체크:** ✅ (선택사항)

#### ❌ Lock branch
- **설명:** 완전 읽기 전용
- **체크:** ❌

#### ❌ Do not allow bypassing the above settings
- **설명:** 관리자도 규칙 우회 불가
- **체크:** ✅ (권장)

#### ✅ Allow force pushes
- **설명:** Force push 허용 여부
- **체크:** ❌ (절대 금지)

#### ✅ Allow deletions
- **설명:** 브랜치 삭제 허용 여부
- **체크:** ❌ (절대 금지)

### 4. Create 버튼 클릭

---

## develop 브랜치 설정

### 1. Add branch protection rule 클릭

### 2. Branch name pattern 입력
```
develop
```

### 3. 보호 규칙 설정

#### ✅ Require a pull request before merging
- **체크:** ✅
- **Require approvals:** 1

#### ✅ Require status checks to pass before merging
- **체크:** ✅
- **Status checks:** vercel (자동 검색)

#### ❌ Require conversation resolution before merging
- **체크:** ❌ (선택사항)

#### ❌ Do not allow bypassing the above settings
- **체크:** ❌ (개발 브랜치는 유연성 확보)

#### ⚠️ Allow force pushes
- **체크:** ✅ (필요 시 리베이스 허용)
- **하위 옵션:**
  - ⚠️ Specify who can force push:
    - 본인 계정만 추가

#### ❌ Allow deletions
- **체크:** ❌

### 4. Create 버튼 클릭

---

## 자동 병합 규칙

### 1. General Settings
Settings → General → Pull Requests 섹션으로 이동

### 2. Merge button 설정

#### ✅ Allow squash merging
- **체크:** ✅
- **Default commit message:** Pull request title

#### ❌ Allow merge commits
- **체크:** ❌ (권장)

#### ❌ Allow rebase merging
- **체크:** ❌ (선택사항)

#### ✅ Automatically delete head branches
- **체크:** ✅
- **설명:** PR 병합 후 feature 브랜치 자동 삭제

### 3. Save changes

---

## 추가 설정 (선택사항)

### 1. CODEOWNERS 파일 생성
프로젝트 루트에 `.github/CODEOWNERS` 파일 생성:

```
# 모든 파일에 대한 기본 소유자
* @nwpark82

# 특정 경로별 소유자 (팀 확장 시)
/lib/services/ @backend-team
/components/ @frontend-team
/docs/ @documentation-team
```

### 2. Issue Templates
`.github/ISSUE_TEMPLATE/` 폴더에 템플릿 추가:

#### bug_report.md
```markdown
---
name: Bug Report
about: 버그를 발견했을 때 사용하세요
title: '[BUG] '
labels: bug
assignees: ''
---

## 버그 설명
간단명료하게 버그를 설명해주세요.

## 재현 방법
1. '...' 페이지로 이동
2. '...' 클릭
3. '...' 입력
4. 에러 발생

## 예상 동작
어떻게 동작해야 하는지 설명해주세요.

## 스크린샷
가능하면 스크린샷을 첨부해주세요.

## 환경
- OS: [예: Windows 11]
- 브라우저: [예: Chrome 120]
- 모바일/데스크톱: [예: Desktop]
```

#### feature_request.md
```markdown
---
name: Feature Request
about: 새로운 기능을 제안할 때 사용하세요
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## 기능 제안 배경
왜 이 기능이 필요한가요?

## 기능 설명
어떤 기능인가요?

## 사용자 시나리오
사용자가 어떻게 사용하게 되나요?

## 추가 정보
기타 참고 자료나 스크린샷
```

---

## 브랜치 규칙 테스트

### 1. main 브랜치 직접 푸시 테스트
```bash
git checkout main
echo "test" > test.txt
git add test.txt
git commit -m "test: Direct push to main"
git push origin main
```

**예상 결과:** ❌ 거부됨
```
! [remote rejected] main -> main (protected branch hook declined)
```

### 2. PR을 통한 병합 테스트
```bash
# feature 브랜치 생성
git checkout develop
git checkout -b feature/test-branch-protection

# 변경사항 커밋
echo "test" > test.txt
git add test.txt
git commit -m "test: Test branch protection"
git push origin feature/test-branch-protection

# GitHub에서 PR 생성
# develop ← feature/test-branch-protection
# 모든 체크 통과 후 Squash and Merge
```

**예상 결과:** ✅ 성공

---

## 문제 해결

### Q1. Vercel 상태 체크가 나타나지 않아요
**A:** 첫 번째 PR 생성 후 Vercel이 빌드를 완료하면 자동으로 나타납니다. 또는 Settings → Branches → Edit rule에서 나중에 추가할 수 있습니다.

### Q2. 브랜치 보호 규칙을 우회하고 싶어요
**A:** Settings → Branches → Edit rule에서 "Do not allow bypassing" 옵션을 비활성화하면 관리자는 우회 가능합니다. 단, 권장하지 않습니다.

### Q3. Force push가 필요한 경우는?
**A:** develop 브랜치에서 히스토리 정리를 위해 rebase가 필요한 경우에만 사용합니다. main 브랜치에서는 절대 사용하지 마세요.

---

## 완료 체크리스트

- [ ] main 브랜치 보호 규칙 설정
- [ ] develop 브랜치 보호 규칙 설정
- [ ] Squash merge 활성화
- [ ] 자동 브랜치 삭제 활성화
- [ ] 브랜치 보호 테스트 완료
- [ ] 팀원에게 규칙 공유

---

**마지막 업데이트:** 2025-11-19
