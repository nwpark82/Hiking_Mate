# Supabase RLS 정책 설정 가이드

## 문제 해결: "new row violates row-level security policy"

회원가입 시 발생하는 RLS 정책 위반 오류를 해결하기 위한 SQL 스크립트입니다.

---

## 🔧 해결 방법

Supabase Dashboard → SQL Editor에서 아래 SQL을 순서대로 실행하세요.

---

## 1. Users 테이블 RLS 정책

```sql
-- 1-1. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON users;

-- 1-2. RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1-3. 신규 회원가입 시 본인 프로필 생성 허용
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 1-4. 본인 프로필 조회 허용
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 1-5. 본인 프로필 수정 허용
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 1-6. 다른 사용자 프로필 조회 허용 (공개 정보)
CREATE POLICY "Public users are viewable by everyone"
  ON users
  FOR SELECT
  USING (true);
```

---

## 2. Posts 테이블 RLS 정책

```sql
-- 2-1. 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- 2-2. RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 2-3. 모든 사용자가 게시글 조회 가능
CREATE POLICY "Anyone can view posts"
  ON posts
  FOR SELECT
  USING (true);

-- 2-4. 로그인한 사용자만 게시글 작성 가능
CREATE POLICY "Users can create posts"
  ON posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2-5. 본인 게시글만 수정 가능
CREATE POLICY "Users can update own posts"
  ON posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2-6. 본인 게시글만 삭제 가능
CREATE POLICY "Users can delete own posts"
  ON posts
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 3. Comments 테이블 RLS 정책

```sql
-- 3-1. 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- 3-2. RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 3-3. 모든 사용자가 댓글 조회 가능
CREATE POLICY "Anyone can view comments"
  ON comments
  FOR SELECT
  USING (true);

-- 3-4. 로그인한 사용자만 댓글 작성 가능
CREATE POLICY "Users can create comments"
  ON comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3-5. 본인 댓글만 삭제 가능
CREATE POLICY "Users can delete own comments"
  ON comments
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 4. Likes 테이블 RLS 정책

```sql
-- 4-1. 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

-- 4-2. RLS 활성화
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 4-3. 모든 사용자가 좋아요 조회 가능
CREATE POLICY "Anyone can view likes"
  ON likes
  FOR SELECT
  USING (true);

-- 4-4. 로그인한 사용자만 좋아요 추가 가능
CREATE POLICY "Users can create likes"
  ON likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4-5. 본인 좋아요만 삭제 가능
CREATE POLICY "Users can delete own likes"
  ON likes
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 5. Tracking Sessions 테이블 RLS 정책

```sql
-- 5-1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own sessions" ON tracking_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON tracking_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON tracking_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON tracking_sessions;

-- 5-2. RLS 활성화
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;

-- 5-3. 본인 세션만 조회 가능
CREATE POLICY "Users can view own sessions"
  ON tracking_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5-4. 본인 세션만 생성 가능
CREATE POLICY "Users can create own sessions"
  ON tracking_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5-5. 본인 세션만 수정 가능
CREATE POLICY "Users can update own sessions"
  ON tracking_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5-6. 본인 세션만 삭제 가능
CREATE POLICY "Users can delete own sessions"
  ON tracking_sessions
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 6. Trails 테이블 RLS 정책 (읽기 전용)

```sql
-- 6-1. 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can view trails" ON trails;

-- 6-2. RLS 활성화
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;

-- 6-3. 모든 사용자가 등산로 조회 가능
CREATE POLICY "Anyone can view trails"
  ON trails
  FOR SELECT
  USING (true);

-- 참고: trails 테이블은 관리자만 수정 가능하도록 설정
-- INSERT, UPDATE, DELETE 정책은 생성하지 않음
```

---

## ✅ 확인 방법

위 SQL을 모두 실행한 후, 다음 쿼리로 정책이 올바르게 설정되었는지 확인하세요:

```sql
-- 모든 테이블의 RLS 정책 확인
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🔍 트러블슈팅

### 여전히 회원가입이 실패하는 경우:

1. **Supabase Dashboard → Authentication → Policies**에서 이메일 확인 설정 확인
   - "Enable email confirmations" 옵션이 꺼져있는지 확인 (개발 중에는 OFF 권장)

2. **users 테이블 구조 확인**
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'users';
   ```

3. **RLS 정책 적용 여부 확인**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('users', 'posts', 'comments', 'likes', 'tracking_sessions', 'trails');
   ```

---

## 📝 참고 사항

- **auth.uid()**: 현재 로그인한 사용자의 ID (Supabase Auth에서 제공)
- **WITH CHECK**: INSERT/UPDATE 시 검증 조건
- **USING**: SELECT/UPDATE/DELETE 시 필터링 조건
- **FOR INSERT/SELECT/UPDATE/DELETE**: 각 작업에 대한 별도 정책 설정 가능

---

## 🚀 다음 단계

RLS 정책 설정 완료 후:
1. 회원가입 다시 시도
2. 로그인 후 게시글 작성 테스트
3. 프로필 수정 테스트
4. GPS 산행 기록 저장 테스트

모든 테스트가 성공하면 배포 준비 완료!
