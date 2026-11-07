-- =====================================================
-- 관리자 운영 인프라 (2026-11-07)
-- =====================================================
-- 사용법: Supabase Dashboard → SQL Editor에 전체 복사 후 실행
-- 여러 번 실행해도 안전하도록 작성됨
--
-- 1. 관리자 작업 기록 (admin_logs)
-- 2. 회원 정지/권한 변경 함수 (작업 기록 포함)
-- 3. 공지사항 (posts.category = 'notice', 관리자만 작성)
-- 4. 게시글 조회수 증가 함수 (작성자 외 조회수가 오르지 않던 문제)
-- 5. 등산로 정보 관리자 수정 권한
-- 6. 비로그인 문의 접수 허용 (이메일 필수)
-- 7. 사용량 조회 함수 (DB/파일 저장소 용량)
-- =====================================================

-- ===== 1. 관리자 작업 기록 =====
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_name TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 조회만 관리자에게 허용, 기록은 아래 함수/트리거로만 생성
DROP POLICY IF EXISTS "Admins can view logs" ON public.admin_logs;
CREATE POLICY "Admins can view logs"
  ON public.admin_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION private.log_admin_action(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_detail JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.admin_logs (admin_id, admin_name, action, target_type, target_id, detail)
  VALUES (
    auth.uid(),
    (SELECT username FROM public.users WHERE id = auth.uid()),
    p_action, p_target_type, p_target_id, p_detail
  );
$$;

-- 관리자가 다른 사람의 게시글/댓글을 삭제하면 기록
CREATE OR REPLACE FUNCTION private.log_content_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.user_id AND public.is_admin() THEN
    IF TG_TABLE_NAME = 'posts' THEN
      PERFORM private.log_admin_action('delete_post', 'post', OLD.id::text,
        jsonb_build_object('title', OLD.title, 'author_id', OLD.user_id));
    ELSE
      PERFORM private.log_admin_action('delete_comment', 'comment', OLD.id::text,
        jsonb_build_object('content', left(OLD.content, 200), 'author_id', OLD.user_id));
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS log_content_delete ON public.posts;
CREATE TRIGGER log_content_delete AFTER DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION private.log_content_delete();

DROP TRIGGER IF EXISTS log_content_delete ON public.comments;
CREATE TRIGGER log_content_delete AFTER DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION private.log_content_delete();

-- ===== 2. 회원 정지 / 권한 변경 =====
CREATE OR REPLACE FUNCTION public.admin_set_user_ban(p_user_id UUID, p_banned BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '관리자만 접근할 수 있습니다' USING ERRCODE = '42501';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION '자기 자신은 정지할 수 없습니다';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND role IN ('admin', 'moderator')) THEN
    RAISE EXCEPTION '관리자 계정은 정지할 수 없습니다';
  END IF;

  UPDATE auth.users
  SET banned_until = CASE WHEN p_banned THEN now() + INTERVAL '100 years' ELSE NULL END
  WHERE id = p_user_id;

  IF p_banned THEN
    DELETE FROM auth.sessions WHERE user_id = p_user_id;
  END IF;

  PERFORM private.log_admin_action(
    CASE WHEN p_banned THEN 'ban_user' ELSE 'unban_user' END,
    'user', p_user_id::text,
    jsonb_build_object('username', (SELECT username FROM public.users WHERE id = p_user_id))
  );
END;
$$;

-- 권한 변경은 admin만 가능 (moderator 불가)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_id UUID, p_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_role TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION '최고 관리자(admin)만 권한을 변경할 수 있습니다' USING ERRCODE = '42501';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION '자신의 권한은 변경할 수 없습니다';
  END IF;

  IF p_role NOT IN ('user', 'moderator', 'admin') THEN
    RAISE EXCEPTION '잘못된 권한입니다: %', p_role;
  END IF;

  SELECT role INTO v_old_role FROM public.users WHERE id = p_user_id;

  -- SECURITY DEFINER(postgres)로 실행되므로 protect_user_role 트리거를 통과함
  UPDATE public.users SET role = p_role WHERE id = p_user_id;

  PERFORM private.log_admin_action('change_role', 'user', p_user_id::text,
    jsonb_build_object(
      'username', (SELECT username FROM public.users WHERE id = p_user_id),
      'from', v_old_role, 'to', p_role
    ));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;

-- ===== 3. 공지사항 =====
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_category_check
  CHECK (category IN ('review', 'question', 'info', 'companion', 'notice'));

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND (category <> 'notice' OR public.is_admin()));

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (category <> 'notice' OR public.is_admin()));

-- ===== 4. 게시글 조회수 =====
CREATE OR REPLACE FUNCTION public.increment_post_view(p_post_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_post_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_post_view(UUID) TO anon, authenticated;

-- ===== 5. 등산로 정보 관리 =====
DROP POLICY IF EXISTS "Admins can update trails" ON public.trails;
CREATE POLICY "Admins can update trails"
  ON public.trails FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION private.log_trail_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND public.is_admin() THEN
    PERFORM private.log_admin_action('update_trail', 'trail', NEW.id::text,
      jsonb_build_object('name', NEW.name));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_trail_update ON public.trails;
CREATE TRIGGER log_trail_update AFTER UPDATE ON public.trails
  FOR EACH ROW EXECUTE FUNCTION private.log_trail_update();

-- ===== 6. 비로그인 문의 =====
DROP POLICY IF EXISTS "Anonymous users can create feedback" ON public.feedback;
CREATE POLICY "Anonymous users can create feedback"
  ON public.feedback FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND email IS NOT NULL AND status = 'new' AND admin_note IS NULL);

-- ===== 7. 사용량 조회 =====
CREATE OR REPLACE FUNCTION public.admin_usage()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '관리자만 접근할 수 있습니다' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'db_bytes', pg_database_size(current_database()),
    'storage_bytes', (
      SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0) FROM storage.objects
    ),
    'storage_files', (SELECT count(*) FROM storage.objects),
    'trails', (SELECT count(*) FROM public.trails),
    'comments', (SELECT count(*) FROM public.comments),
    'tracking_sessions', (SELECT count(*) FROM public.tracking_sessions)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_usage() TO authenticated;

-- ===== 확인 =====
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema IN ('public', 'private')
  AND routine_name IN (
    'admin_set_user_role', 'admin_usage', 'increment_post_view',
    'log_admin_action', 'log_content_delete', 'log_trail_update'
  )
ORDER BY routine_name;
