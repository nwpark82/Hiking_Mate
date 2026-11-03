-- =====================================================
-- 보안 강화 (2026-11-03)
-- =====================================================
-- 사용법: Supabase Dashboard → SQL Editor에 전체 복사 후 실행
-- 여러 번 실행해도 안전하도록 작성됨
--
-- 1. 일반 회원이 자신의 role을 admin으로 바꾸는 권한 상승 차단
-- 2. 블로그(blogs) 작성/수정/삭제를 관리자 전용으로 제한
-- 3. 게시글/댓글/피드백/신고 작성 시 다른 사람 명의 사용 차단
-- =====================================================

-- ===== 0. 관리자 여부 확인 함수 =====
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ===== 1. users.role 변경 보호 =====
-- SECURITY DEFINER가 아니므로 current_user는 요청한 DB 역할
-- (API 요청: anon/authenticated, 서비스 키: service_role, SQL Editor: postgres)
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'user';
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'role 변경 권한이 없습니다'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_role ON public.users;
CREATE TRIGGER protect_user_role
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_role();

-- ===== 2. blogs: 관리자 전용 =====
DROP POLICY IF EXISTS "Authenticated users can create blogs" ON public.blogs;
DROP POLICY IF EXISTS "Users can update own blogs" ON public.blogs;
DROP POLICY IF EXISTS "Users can delete own blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can read all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can create blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can update blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can delete blogs" ON public.blogs;

CREATE POLICY "Admins can read all blogs"
  ON public.blogs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can create blogs"
  ON public.blogs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND auth.uid() = author_id);

CREATE POLICY "Admins can update blogs"
  ON public.blogs FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete blogs"
  ON public.blogs FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ===== 3. 작성자 명의 위조 차단 =====
-- 초기 스키마의 "auth.role() = 'authenticated'" 정책은 user_id를 검사하지 않음
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create feedback" ON public.feedback;
CREATE POLICY "Authenticated users can create feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'new' AND admin_note IS NULL);

DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND status = 'pending' AND admin_note IS NULL);

-- ===== 확인 =====
SELECT tgname AS trigger_name
FROM pg_trigger
WHERE tgrelid = 'public.users'::regclass AND NOT tgisinternal;

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('blogs', 'posts', 'comments', 'feedback', 'reports', 'users')
ORDER BY tablename, cmd, policyname;
