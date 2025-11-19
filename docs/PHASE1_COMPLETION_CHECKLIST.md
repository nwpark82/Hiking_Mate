# Phase 1 MVP 완료 체크리스트

## 📋 개요

이 문서는 Phase 1 MVP를 완료하고 배포하기 위한 최종 체크리스트입니다.

**목표**: Phase 1 MVP 100% 완료 및 배포 준비

---

## 1. Supabase Storage 버킷 설정 ⚙️

### 1.1 Supabase Dashboard 접속
1. https://app.supabase.com 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Storage** 클릭

### 1.2 버킷 생성 (3개)

#### Bucket 1: `post-images`
- **Name**: `post-images`
- **Public**: ✅ Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

#### Bucket 2: `user-avatars`
- **Name**: `user-avatars`
- **Public**: ✅ Yes
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

#### Bucket 3: `hike-photos`
- **Name**: `hike-photos`
- **Public**: ✅ Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### 1.3 RLS 정책 적용

각 버킷에 대해 다음 정책을 적용합니다.

**SQL 에디터에서 실행** (Storage > Policies > New Policy):

```sql
-- 1. post-images 정책
-- SELECT (모두 읽기 가능)
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- INSERT (로그인한 사용자만 업로드)
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- DELETE (본인 파일만 삭제)
CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. user-avatars 정책
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. hike-photos 정책
CREATE POLICY "Anyone can view hike photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hike-photos');

CREATE POLICY "Authenticated users can upload hike photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hike-photos');

CREATE POLICY "Users can delete own hike photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'hike-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 1.4 테스트
- [ ] 로그인 후 프로필 이미지 업로드 테스트
- [ ] 업로드된 이미지가 표시되는지 확인
- [ ] 이미지 삭제 테스트

---

## 2. 통합 테스트 ✅

### 2.1 인증 시스템
- [ ] **회원가입**
  - 이메일/비밀번호로 회원가입
  - users 테이블에 프로필 생성 확인
  - 자동 로그인 확인
- [ ] **로그인**
  - 올바른 자격증명으로 로그인
  - 잘못된 자격증명 거부
- [ ] **로그아웃**
  - 로그아웃 후 보호된 페이지 접근 차단
- [ ] **비밀번호 재설정**
  - 이메일로 재설정 링크 발송
  - 새 비밀번호로 로그인

### 2.2 등산로 탐색
- [ ] **목록 페이지**
  - 등산로 리스트 로딩
  - 무한 스크롤 동작
  - 검색 기능 (이름, 지역)
  - 필터링 (난이도, 지역)
- [ ] **상세 페이지**
  - 등산로 정보 표시
  - 지도에 경로 표시
  - GPX 데이터 시각화

### 2.3 GPS 산행 기록
- [ ] **산행 시작**
  - GPS 위치 추적 시작
  - 실시간 위치 지도 표시
  - 거리/시간/페이스 계산
- [ ] **산행 저장**
  - 산행 종료 후 저장
  - tracking_sessions 테이블 저장 확인
  - users 테이블 통계 업데이트 확인
- [ ] **기록 조회**
  - 나의 기록 페이지에서 목록 확인
  - 통계 정확성 확인 (총 거리, 시간, 횟수)

### 2.4 프로필 관리
- [ ] **프로필 조회**
  - 프로필 정보 표시
  - 산행 통계 표시
  - 레벨 시스템 표시
- [ ] **프로필 수정**
  - 사용자명 변경 (중복 검사)
  - 이름, 소개 변경
  - 아바타 업로드 (압축 확인)
  - 구 아바타 삭제 확인

### 2.5 커뮤니티
- [ ] **게시글 작성**
  - 텍스트 게시글 작성
  - 이미지 포함 게시글 작성
  - 이미지 업로드 및 압축 확인
- [ ] **게시글 목록**
  - 게시글 리스트 표시
  - 무한 스크롤
  - 좋아요 수 표시
- [ ] **게시글 상세**
  - 게시글 내용 표시
  - 댓글 작성/삭제
  - 좋아요 기능

### 2.6 설정 페이지
- [ ] **비밀번호 변경**
  - 새 비밀번호 입력
  - 유효성 검사 (6자 이상)
  - 변경 후 새 비밀번호로 로그인
- [ ] **알림 설정**
  - 푸시 알림 토글
  - 이메일 알림 토글
  - 설정 저장
- [ ] **계정 삭제**
  - "계정삭제" 입력 확인
  - 프로필 삭제
  - 관련 데이터 삭제 (CASCADE)

### 2.7 반응형 디자인
- [ ] **모바일** (< 768px)
  - 모든 페이지 레이아웃 확인
  - 터치 동작 확인
  - 하단 네비게이션 동작
- [ ] **태블릿** (768px ~ 1024px)
  - 레이아웃 확인
- [ ] **데스크톱** (> 1024px)
  - 최대 너비 제한 확인

### 2.8 SEO 및 PWA
- [ ] **SEO**
  - /sitemap.xml 접근 가능
  - /robots.txt 접근 가능
  - Open Graph 메타태그 확인
- [ ] **PWA**
  - /manifest.json 접근 가능
  - 홈 화면에 추가 테스트
  - Shortcuts 동작 확인

---

## 3. 성능 확인 ⚡

### 3.1 Lighthouse 점수
- [ ] Performance: > 80
- [ ] Accessibility: > 90
- [ ] Best Practices: > 90
- [ ] SEO: > 90

### 3.2 로딩 속도
- [ ] 초기 페이지 로딩: < 3초
- [ ] 이미지 lazy loading 동작
- [ ] 무한 스크롤 부드러움

---

## 4. 버그 수정 🐛

테스트 중 발견된 버그를 여기에 기록하고 수정합니다.

### 발견된 버그
- [ ] 버그 1: (설명)
- [ ] 버그 2: (설명)

### 수정 완료
- [ ] 버그 1 수정 완료
- [ ] 버그 2 수정 완료

---

## 5. 배포 전 최종 점검 🚀

### 5.1 환경 변수 확인
- [ ] Vercel 환경 변수 설정 완료
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_KAKAO_MAP_KEY`

### 5.2 Git 상태
- [ ] 모든 변경사항 커밋
- [ ] develop 브랜치 최신 상태
- [ ] main 브랜치 merge 준비

### 5.3 Vercel 배포
- [ ] develop 브랜치 배포 확인
- [ ] 프리뷰 URL 테스트
- [ ] main 브랜치 배포 (프로덕션)

### 5.4 데이터베이스
- [ ] Supabase 프로덕션 모드 확인
- [ ] RLS 정책 활성화 확인
- [ ] Storage 버킷 설정 완료

---

## 6. Phase 1 완료 선언 🎉

### 완료 조건
- [x] 모든 핵심 기능 구현 완료
- [ ] Supabase Storage 설정 완료
- [ ] 통합 테스트 통과
- [ ] 치명적 버그 없음
- [ ] Vercel 프로덕션 배포 완료

### 완료 후
- [ ] README.md 업데이트 (Phase 1 100% 완료)
- [ ] 배포 URL 기록
- [ ] 베타 테스터 모집 시작
- [ ] Phase 2 준비 시작

---

## 📝 테스트 결과 기록

### 테스트 날짜: ___________
### 테스터: ___________

**결과**:
- 통과: ___ / ___
- 실패: ___ / ___

**주요 이슈**:
1.
2.
3.

**수정 필요 사항**:
1.
2.
3.

---

**Phase 1 MVP 개발 수고하셨습니다! 🎉**
