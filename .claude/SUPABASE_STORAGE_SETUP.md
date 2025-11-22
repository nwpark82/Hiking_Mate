# Supabase Storage 설정 가이드

## 📋 개요
이미지 업로드 기능을 활성화하기 위한 Supabase Storage 버킷 생성 및 RLS 정책 설정 가이드입니다.

**소요 시간**: 약 30분
**난이도**: 쉬움 ⭐⭐☆☆☆

---

## 🎯 설정할 버킷 목록

| 버킷 이름 | 용도 | 공개 여부 | 최대 파일 크기 |
|---------|------|---------|-------------|
| `avatars` | 사용자 프로필 이미지 | Public | 2MB |
| `posts` | 커뮤니티 게시글 이미지 | Public | 5MB |
| `hikes` | 등산 기록 사진 | Public | 5MB |

---

## 📝 Step 1: Supabase Dashboard 접속

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) 접속
2. HikingMate 프로젝트 선택
3. 왼쪽 사이드바에서 **Storage** 클릭

---

## 📝 Step 2: Storage 버킷 생성

### 2-1. Avatars 버킷 생성

1. **"New bucket"** 버튼 클릭
2. 다음 정보 입력:
   - **Name**: `avatars`
   - **Public bucket**: ✅ 체크
   - **File size limit**: `2097152` (2MB in bytes)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
3. **"Create bucket"** 클릭

### 2-2. Posts 버킷 생성

1. **"New bucket"** 버튼 클릭
2. 다음 정보 입력:
   - **Name**: `posts`
   - **Public bucket**: ✅ 체크
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
3. **"Create bucket"** 클릭

### 2-3. Hikes 버킷 생성

1. **"New bucket"** 버튼 클릭
2. 다음 정보 입력:
   - **Name**: `hikes`
   - **Public bucket**: ✅ 체크
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
3. **"Create bucket"** 클릭

---

## 📝 Step 3: RLS (Row Level Security) 정책 설정

### SQL Editor 접속
1. 왼쪽 사이드바에서 **SQL Editor** 클릭
2. **"New query"** 클릭
3. 아래 SQL 스크립트를 복사하여 붙여넣기

### 전체 RLS 정책 SQL

```sql
-- ============================================
-- Supabase Storage RLS Policies
-- HikingMate Project
-- ============================================

-- 1. Avatars 버킷 RLS 정책
-- ============================================

-- 누구나 아바타 이미지 조회 가능
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 인증된 사용자만 자신의 아바타 업로드 가능
CREATE POLICY "Authenticated users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 인증된 사용자만 자신의 아바타 업데이트 가능
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 인증된 사용자만 자신의 아바타 삭제 가능
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- 2. Posts 버킷 RLS 정책
-- ============================================

-- 누구나 게시글 이미지 조회 가능
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- 인증된 사용자만 게시글 이미지 업로드 가능
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts'
  AND auth.role() = 'authenticated'
);

-- 게시글 작성자만 이미지 업데이트 가능
CREATE POLICY "Post authors can update their images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'posts'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'posts'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 게시글 작성자만 이미지 삭제 가능
CREATE POLICY "Post authors can delete their images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- 3. Hikes 버킷 RLS 정책
-- ============================================

-- 누구나 등산 기록 이미지 조회 가능
CREATE POLICY "Anyone can view hike images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hikes');

-- 인증된 사용자만 등산 기록 이미지 업로드 가능
CREATE POLICY "Authenticated users can upload hike images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hikes'
  AND auth.role() = 'authenticated'
);

-- 등산 기록 작성자만 이미지 업데이트 가능
CREATE POLICY "Hike authors can update their images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hikes'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'hikes'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 등산 기록 작성자만 이미지 삭제 가능
CREATE POLICY "Hike authors can delete their images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hikes'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================
-- 정책 적용 완료
-- ============================================
```

### SQL 실행
1. 위 SQL을 SQL Editor에 붙여넣기
2. **"Run"** 버튼 클릭 (또는 Ctrl/Cmd + Enter)
3. 성공 메시지 확인

---

## 📝 Step 4: 설정 확인

### 4-1. 버킷 확인
1. Storage 메뉴로 돌아가기
2. 3개 버킷이 생성되었는지 확인:
   - ✅ avatars
   - ✅ posts
   - ✅ hikes

### 4-2. RLS 정책 확인
각 버킷을 클릭하여 **Policies** 탭에서 다음 정책들이 적용되었는지 확인:

**Avatars 버킷 (4개 정책)**
- ✅ Anyone can view avatars
- ✅ Authenticated users can upload their own avatar
- ✅ Users can update their own avatar
- ✅ Users can delete their own avatar

**Posts 버킷 (4개 정책)**
- ✅ Anyone can view post images
- ✅ Authenticated users can upload post images
- ✅ Post authors can update their images
- ✅ Post authors can delete their images

**Hikes 버킷 (4개 정책)**
- ✅ Anyone can view hike images
- ✅ Authenticated users can upload hike images
- ✅ Hike authors can update their images
- ✅ Hike authors can delete their images

---

## 📝 Step 5: 테스트

### 애플리케이션에서 테스트
1. 개발 서버 실행: `npm run dev`
2. 로그인 후 다음 기능 테스트:
   - **프로필 이미지 업로드** (Settings 페이지)
   - **커뮤니티 게시글 이미지 업로드** (Community 페이지)
   - **등산 기록 사진 업로드** (Record 페이지)

### 예상 동작
- ✅ 이미지 업로드 성공
- ✅ 업로드된 이미지 즉시 표시
- ✅ 이미지 URL이 Supabase Storage를 가리킴
  - 예: `https://[project-id].supabase.co/storage/v1/object/public/avatars/[user-id]/avatar.jpg`

---

## ⚠️ 문제 해결

### 문제 1: "Policy not found" 에러
**원인**: RLS 정책이 제대로 적용되지 않음
**해결**: SQL Editor에서 정책 SQL을 다시 실행

### 문제 2: "Bucket not found" 에러
**원인**: 버킷 이름이 잘못됨
**해결**: 버킷 이름이 정확히 `avatars`, `posts`, `hikes`인지 확인 (소문자)

### 문제 3: 이미지 업로드는 되지만 조회 안 됨
**원인**: Public bucket 설정이 안 됨
**해결**: Storage 메뉴에서 각 버킷의 설정을 확인하고 "Make public" 클릭

### 문제 4: 파일 크기 제한 에러
**원인**: 설정한 최대 파일 크기 초과
**해결**:
- 버킷 설정에서 File size limit 확인
- 클라이언트에서 이미지 압축 (이미 구현됨: [compressImage.ts](../lib/utils/compressImage.ts))

---

## ✅ 완료 체크리스트

설정이 완료되면 다음 항목을 확인하세요:

- [ ] Supabase Storage 메뉴에서 3개 버킷 확인
- [ ] 각 버킷에 4개씩 총 12개 RLS 정책 확인
- [ ] 모든 버킷이 Public으로 설정됨
- [ ] 프로필 이미지 업로드 테스트 성공
- [ ] 커뮤니티 게시글 이미지 업로드 테스트 성공
- [ ] 등산 기록 사진 업로드 테스트 성공

---

## 📚 참고 자료

- [Supabase Storage 공식 문서](https://supabase.com/docs/guides/storage)
- [RLS Policies 가이드](https://supabase.com/docs/guides/storage/security/access-control)
- [이미지 압축 유틸 코드](../lib/utils/compressImage.ts)
- [프로필 서비스 코드](../app/services/profileService.ts)
- [커뮤니티 서비스 코드](../app/services/communityService.ts)

---

## 🎉 다음 단계

Storage 설정이 완료되면:
1. ✅ **P0 완료**: Supabase Storage 설정
2. ➡️ **P1 진행**: 통합 테스트 시작
3. ➡️ **P1 진행**: 베타 테스터 모집

**Phase 1 MVP 완료율: 95% → 100%** 🎊
