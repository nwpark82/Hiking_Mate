# Supabase Storage 설정 가이드

하이킹메이트 앱에서 이미지 업로드 기능을 사용하려면 Supabase Storage에 필요한 버킷을 생성해야 합니다.

## 📦 필요한 Storage Buckets (3개)

### 1. community-images (커뮤니티 게시글 이미지)
커뮤니티 게시글에 첨부되는 이미지를 카테고리별로 분류하여 저장합니다.

**폴더 구조:**
```
community-images/
  ├── review/{user_id}/       # 후기 이미지 (최대 5장)
  ├── question/{user_id}/     # 질문 이미지 (최대 3장)
  ├── info/{user_id}/         # 정보 이미지 (최대 3장)
  └── companion/{user_id}/    # 동행찾기 이미지 (최대 3장)
```

### 2. user-avatars (프로필 아바타)
사용자 프로필 사진을 저장합니다.

**폴더 구조:**
```
user-avatars/
  └── {user_id}/avatar.jpg
```

### 3. hike-photos (산행 사진)
GPS 산행 기록 시 촬영한 사진을 저장합니다.

**폴더 구조:**
```
hike-photos/
  └── {user_id}/{tracking_session_id}/photo_*.jpg
```

---

## 🛠️ Bucket 생성 방법

### 1. Supabase Dashboard 접속
1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택 (chnqwgyiaagqxtvwueux)
3. 왼쪽 메뉴에서 **Storage** 클릭

### 2. 각 Bucket 생성

#### A. community-images 버킷
```
1. "New bucket" 버튼 클릭
2. 설정:
   - Name: community-images
   - Public bucket: ✅ 체크 (공개 접근 허용)
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
3. "Create bucket" 클릭
```

#### B. user-avatars 버킷
```
1. "New bucket" 버튼 클릭
2. 설정:
   - Name: user-avatars
   - Public bucket: ✅ 체크
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
3. "Create bucket" 클릭
```

#### C. hike-photos 버킷
```
1. "New bucket" 버튼 클릭
2. 설정:
   - Name: hike-photos
   - Public bucket: ✅ 체크
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
3. "Create bucket" 클릭
```

---

## 🔒 Storage RLS (Row Level Security) 정책 설정

각 버킷에 대해 다음 정책을 설정합니다:

### community-images 정책

#### 1. SELECT (읽기) - 모든 사용자 허용
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-images');
```

#### 2. INSERT (업로드) - 인증된 사용자만 허용
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-images');
```

#### 3. DELETE (삭제) - 본인이 업로드한 이미지만 삭제
```sql
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[2]);
```
> 주의: `(storage.foldername(name))[2]`는 경로 구조가 `category/user_id/filename`이므로 2번째 요소가 user_id입니다.

### user-avatars 정책

#### 1. SELECT (읽기) - 모든 사용자 허용
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');
```

#### 2. INSERT (업로드) - 인증된 사용자만 허용
```sql
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars');
```

#### 3. UPDATE (수정) - 본인 아바타만 수정
```sql
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### 4. DELETE (삭제) - 본인 아바타만 삭제
```sql
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### hike-photos 정책

#### 1. SELECT (읽기) - 모든 사용자 허용
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hike-photos');
```

#### 2. INSERT (업로드) - 인증된 사용자만 허용
```sql
CREATE POLICY "Authenticated users can upload hike photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hike-photos');
```

#### 3. DELETE (삭제) - 본인이 업로드한 사진만 삭제
```sql
CREATE POLICY "Users can delete own hike photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hike-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🔧 RLS 정책 설정 방법

1. Supabase Dashboard → **SQL Editor** 이동
2. 위의 SQL 정책 코드를 복사하여 실행
3. 각 버킷별로 정책을 차례대로 생성

---

## ✅ 설정 확인

### 1. 버킷 확인
```
Storage → Buckets에서 3개 버킷이 모두 생성되었는지 확인:
- community-images ✅
- user-avatars ✅
- hike-photos ✅
```

### 2. 정책 확인
```
Storage → Policies에서 각 버킷의 정책이 설정되었는지 확인
```

### 3. 테스트 업로드
```
앱에서 이미지 업로드 기능을 테스트하여 정상 작동하는지 확인
```

---

## 📋 카테고리별 이미지 제한

| 카테고리 | 최대 이미지 수 | 설명 |
|---------|--------------|------|
| **후기** (review) | 5장 | 사진 중심 콘텐츠 |
| **질문** (question) | 3장 | 문제 설명용 |
| **정보** (info) | 3장 | 정보 공유용 |
| **동행찾기** (companion) | 3장 | 모임 안내용 |

---

## ⚠️ 주의사항

### 파일 크기 제한
- **community-images**: 최대 10MB
- **user-avatars**: 최대 5MB
- **hike-photos**: 최대 10MB

### 허용 파일 형식
- JPEG/JPG
- PNG
- WebP

### 보안
- 모든 버킷은 **Public**으로 설정 (누구나 읽기 가능)
- 업로드/삭제는 **인증된 사용자만** 가능
- 삭제는 **본인이 업로드한 파일만** 가능

### 비용
- Supabase Free Tier: 1GB Storage 무료
- 초과 시: $0.021/GB/월

---

## 🐛 문제 해결

### 이미지 업로드 실패
1. Bucket이 Public으로 설정되었는지 확인
2. RLS 정책이 올바르게 설정되었는지 확인
3. 파일 크기가 제한을 초과하지 않는지 확인
4. 파일 형식이 허용된 형식인지 확인

### 이미지가 표시되지 않음
1. Bucket이 Public인지 확인
2. 브라우저 콘솔에서 URL 오류 확인
3. CORS 설정 확인

### 삭제 권한 오류
1. RLS DELETE 정책이 설정되었는지 확인
2. 본인이 업로드한 이미지인지 확인
3. 인증 상태 확인

### 카테고리별 제한 작동 안 함
1. UI 코드에서 CATEGORIES 배열에 imageLimit 속성이 있는지 확인
2. uploadMultipleImages 함수에 category 파라미터가 전달되는지 확인

---

## 📝 완료 체크리스트

### 버킷 생성
- [ ] community-images 버킷 생성
- [ ] user-avatars 버킷 생성
- [ ] hike-photos 버킷 생성

### RLS 정책 설정
- [ ] community-images RLS 정책 설정
- [ ] user-avatars RLS 정책 설정
- [ ] hike-photos RLS 정책 설정

### Database 마이그레이션
- [ ] [scripts/update_community_categories.sql](../scripts/update_community_categories.sql) 실행
- [ ] 카테고리가 (review, question, info, companion)으로 변경되었는지 확인

### 테스트
- [ ] 후기 카테고리 이미지 5장 업로드 테스트
- [ ] 질문 카테고리 이미지 3장 제한 테스트
- [ ] 정보 카테고리 이미지 3장 제한 테스트
- [ ] 동행찾기 카테고리 이미지 3장 제한 테스트
- [ ] 이미지 삭제 테스트

모든 항목이 완료되면 이미지 업로드 기능을 사용할 수 있습니다!
