# 🤝 하이킹메이트 기여 가이드

하이킹메이트 프로젝트에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 📋 목차
1. [개발 환경 설정](#개발-환경-설정)
2. [브랜치 전략](#브랜치-전략)
3. [개발 워크플로우](#개발-워크플로우)
4. [코딩 컨벤션](#코딩-컨벤션)
5. [커밋 메시지 컨벤션](#커밋-메시지-컨벤션)
6. [Pull Request 가이드](#pull-request-가이드)

---

## 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/nwpark82/Hiking_Mate.git
cd Hiking_Mate
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수를 설정하세요:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_map_key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 5. 빌드 테스트
```bash
npm run build
npm run type-check
```

---

## 브랜치 전략

자세한 내용은 [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md)를 참고하세요.

### 간단 요약
- `main`: 프로덕션 배포
- `develop`: 개발 통합
- `feature/*`: 기능 개발
- `hotfix/*`: 긴급 수정

---

## 개발 워크플로우

### 1. 이슈 확인 또는 생성
- [GitHub Issues](https://github.com/nwpark82/Hiking_Mate/issues)에서 작업할 이슈를 확인하거나 새로 생성합니다.

### 2. Feature 브랜치 생성
```bash
# develop 브랜치에서 분기
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 3. 코드 작성 및 테스트
```bash
# 파일 수정
# 로컬에서 테스트

npm run dev           # 개발 서버
npm run build         # 프로덕션 빌드
npm run type-check    # 타입 체크
```

### 4. 커밋
```bash
git add .
git commit -m "feat: Add new feature description"
```

### 5. 원격 저장소에 푸시
```bash
git push origin feature/your-feature-name
```

### 6. Pull Request 생성
- GitHub에서 PR 생성
- PR 템플릿에 따라 작성
- Vercel 프리뷰 링크 확인

### 7. 코드 리뷰 & 병합
- 리뷰 의견 반영
- 승인 후 Squash and Merge

---

## 코딩 컨벤션

### TypeScript
- **타입 안정성**: `any` 사용 최소화, 명시적 타입 선언
- **Interface vs Type**: 확장 가능성이 있으면 `interface`, 그 외는 `type`
- **Null Safety**: 옵셔널 체이닝 (`?.`) 적극 활용

```typescript
// 좋은 예
interface User {
  id: string;
  username: string;
  email: string;
}

export async function getUser(userId: string): Promise<User | null> {
  // ...
}

// 나쁜 예
export async function getUser(userId: any): Promise<any> {
  // ...
}
```

### React
- **함수형 컴포넌트**: 클래스 컴포넌트 사용 금지
- **Hooks**: 커스텀 훅은 `use-` prefix 사용
- **Props**: 명시적 타입 정의

```typescript
// 좋은 예
interface TrailCardProps {
  trail: Trail;
  onClick?: () => void;
}

export function TrailCard({ trail, onClick }: TrailCardProps) {
  return <div onClick={onClick}>{trail.name}</div>;
}

// 나쁜 예
export function TrailCard(props: any) {
  return <div>{props.trail.name}</div>;
}
```

### 파일 네이밍
- **컴포넌트**: PascalCase (`TrailCard.tsx`)
- **유틸리티**: camelCase (`formatDistance.ts`)
- **페이지**: kebab-case (`explore/[id]/page.tsx`)
- **상수**: UPPER_SNAKE_CASE (`DIFFICULTY_LEVELS`)

### 폴더 구조
```
app/                  # Next.js 앱 디렉토리
  (main)/            # 메인 레이아웃 그룹
  auth/              # 인증 페이지
components/          # 재사용 가능한 컴포넌트
  layout/            # 레이아웃 컴포넌트
  trails/            # 등산로 관련 컴포넌트
lib/                 # 유틸리티 및 서비스
  services/          # API 서비스
  hooks/             # 커스텀 훅
  utils/             # 헬퍼 함수
types/               # TypeScript 타입 정의
```

### CSS (Tailwind)
- **유틸리티 우선**: Tailwind 클래스 사용
- **컴포넌트 스타일**: `cn()` 유틸리티로 조건부 클래스
- **반응형**: 모바일 우선 (`sm:`, `md:`, `lg:`)

```typescript
import { cn } from '@/lib/utils/helpers';

<button
  className={cn(
    'px-4 py-2 rounded-lg transition-colors',
    isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
  )}
>
  Button
</button>
```

---

## 커밋 메시지 컨벤션

### 형식
```
<type>(<scope>): <subject>
```

### Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가
- `chore`: 빌드/설정 변경
- `perf`: 성능 개선

### Scope (선택사항)
- `tracking`: GPS 트래킹
- `auth`: 인증
- `ui`: UI 컴포넌트
- `api`: API 서비스
- `db`: 데이터베이스

### 예시
```bash
feat: Add tracking session save service
fix: Fix GPS accuracy calculation bug
docs: Update README with setup instructions
refactor(ui): Simplify TrailCard component
chore: Update dependencies
```

---

## Pull Request 가이드

### PR 생성 전 체크리스트
- [ ] 로컬에서 빌드 성공 (`npm run build`)
- [ ] 타입 체크 통과 (`npm run type-check`)
- [ ] 기본 기능 테스트 완료
- [ ] 커밋 메시지 컨벤션 준수
- [ ] 불필요한 파일 제외 (.env, node_modules)

### PR 제목
```
[Type] 작업 요약

예시:
[Feature] GPS 트래킹 저장 기능 구현
[Fix] 로그인 리다이렉트 버그 수정
[Refactor] 등산로 필터링 로직 개선
```

### PR 설명
PR 템플릿을 참고하여 다음 내용을 포함하세요:
1. 작업 내용
2. 작업 목적
3. 변경 사항 체크리스트
4. 테스트 완료 항목
5. Vercel 프리뷰 링크
6. 스크린샷 (UI 변경 시)
7. 관련 이슈 링크

### 코드 리뷰
- 모든 PR은 최소 1명의 리뷰 필요 (1인 개발 시 셀프 리뷰)
- 리뷰 의견은 48시간 내 반영
- 빌드 성공 확인 후 병합

---

## 데이터베이스 마이그레이션

### Supabase 스키마 변경 시
1. `supabase-schema.sql` 파일 수정
2. Supabase 대시보드에서 SQL 실행
3. PR에 마이그레이션 SQL 첨부
4. `types/index.ts`에서 타입 업데이트

### 예시
```sql
-- Add new column to trails table
ALTER TABLE trails ADD COLUMN rating DECIMAL(2,1) DEFAULT 0;
CREATE INDEX idx_trails_rating ON trails(rating DESC);
```

---

## 테스트

현재 프로젝트는 자동화된 테스트가 없습니다. 다음 체크리스트를 수동으로 확인하세요:

### 기본 테스트
- [ ] 페이지 로딩 확인
- [ ] 네비게이션 동작
- [ ] 폼 제출 및 검증
- [ ] API 호출 성공/실패
- [ ] 모바일 반응형

### 브라우저 호환성
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

---

## 버그 리포트

### 버그 발견 시
1. [GitHub Issues](https://github.com/nwpark82/Hiking_Mate/issues/new)에서 이슈 생성
2. 템플릿에 따라 다음 정보 제공:
   - 버그 설명
   - 재현 방법
   - 예상 동작
   - 실제 동작
   - 스크린샷
   - 환경 정보 (브라우저, OS)

---

## 기능 제안

### 새로운 기능 제안 시
1. [GitHub Issues](https://github.com/nwpark82/Hiking_Mate/issues/new)에서 이슈 생성
2. 다음 내용 포함:
   - 제안 배경 및 목적
   - 기능 상세 설명
   - 사용자 시나리오
   - UI/UX 디자인 (선택)
   - 기술적 고려사항

---

## 질문 및 지원

- **일반 질문**: GitHub Discussions
- **버그 리포트**: GitHub Issues
- **긴급 문의**: nwpark82@github.com

---

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

**마지막 업데이트:** 2025-11-19

감사합니다! 🎉
