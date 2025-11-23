-- ============================================
-- Supabase Storage RLS 정책 설정
-- ============================================
-- 목적: 3개 버킷(community-images, user-avatars, hike-photos)에 대한 RLS 정책 생성
-- 날짜: 2025-01-23
-- 주의: 정책 이름은 버킷별로 고유해야 함 (PostgreSQL 제약사항)

-- ============================================
-- 1. 기존 정책 삭제 (있다면)
-- ============================================

-- community-images 기존 정책 삭제
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- user-avatars 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- hike-photos 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can upload hike photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own hike photos" ON storage.objects;

-- ============================================
-- 2. community-images 버킷 정책
-- ============================================

-- 2-1. SELECT (읽기) - 모든 사용자 허용
CREATE POLICY "community-images: Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-images');

-- 2-2. INSERT (업로드) - 인증된 사용자만 허용
CREATE POLICY "community-images: Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-images');

-- 2-3. DELETE (삭제) - 본인이 업로드한 이미지만 삭제
-- 경로 구조: category/user_id/filename
-- (storage.foldername(name))[2] = user_id
CREATE POLICY "community-images: Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[2]);

-- ============================================
-- 3. user-avatars 버킷 정책
-- ============================================

-- 3-1. SELECT (읽기) - 모든 사용자 허용
CREATE POLICY "user-avatars: Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- 3-2. INSERT (업로드) - 인증된 사용자만 허용
CREATE POLICY "user-avatars: Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars');

-- 3-3. UPDATE (수정) - 본인 아바타만 수정
-- 경로 구조: user_id/avatar.jpg
-- (storage.foldername(name))[1] = user_id
CREATE POLICY "user-avatars: Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3-4. DELETE (삭제) - 본인 아바타만 삭제
CREATE POLICY "user-avatars: Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- 4. hike-photos 버킷 정책
-- ============================================

-- 4-1. SELECT (읽기) - 모든 사용자 허용
CREATE POLICY "hike-photos: Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hike-photos');

-- 4-2. INSERT (업로드) - 인증된 사용자만 허용
CREATE POLICY "hike-photos: Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hike-photos');

-- 4-3. DELETE (삭제) - 본인이 업로드한 사진만 삭제
-- 경로 구조: user_id/tracking_session_id/photo_*.jpg
-- (storage.foldername(name))[1] = user_id
CREATE POLICY "hike-photos: Users can delete own hike photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hike-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- 5. 정책 확인
-- ============================================

-- 모든 storage 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- ============================================
-- 완료 체크리스트
-- ============================================
-- □ community-images 버킷의 3개 정책이 생성되었는지 확인
-- □ user-avatars 버킷의 4개 정책이 생성되었는지 확인
-- □ hike-photos 버킷의 3개 정책이 생성되었는지 확인
-- □ 정책 이름이 모두 고유한지 확인 (버킷 이름 접두사 포함)
-- □ 앱에서 이미지 업로드/삭제 테스트 수행
