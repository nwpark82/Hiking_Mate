-- =====================================================
-- 운영 기능 (2026-11-03)
-- =====================================================
-- 사용법: Supabase Dashboard → SQL Editor에 전체 복사 후 실행
-- 여러 번 실행해도 안전하도록 작성됨
--
-- 1. 회원 탈퇴 함수 (delete_user) - 기존에 없어서 탈퇴가 실제로 되지 않았음
-- 2. 댓글 수정 정책 정리
-- 3. 관리자 알림 (신규 가입/피드백/신고/게시글 → Discord)
-- 4. 관리자 대시보드용 함수 (회원 목록, 회원 정지)
--
-- ※ Discord 웹훅 URL은 이 파일에 넣지 않음. 실행 후 아래 명령을 따로 실행:
--   INSERT INTO private.app_settings (key, value)
--   VALUES ('discord_webhook_url', 'https://discord.com/api/webhooks/...')
--   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
-- =====================================================

-- ===== 1. 회원 탈퇴 =====
-- auth.users 삭제 시 CASCADE로 public.users와 관련 데이터가 함께 삭제됨
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- ===== 2. 댓글 수정 정책 =====
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== 3. 관리자 알림 (Discord) =====
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- API로 노출되지 않는 설정 저장소
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE OR REPLACE FUNCTION private.notify_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url TEXT;
  v_msg TEXT;
BEGIN
  SELECT value INTO v_url FROM private.app_settings WHERE key = 'discord_webhook_url';
  IF v_url IS NULL OR v_url = '' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'users' THEN
    v_msg := format(E'🆕 **신규 가입** — %s\n총 회원 %s명',
      NEW.username, (SELECT count(*) FROM public.users));
  ELSIF TG_TABLE_NAME = 'feedback' THEN
    v_msg := format(E'💬 **피드백** [%s] %s\n%s\n→ https://www.hikingmate.co.kr/admin/feedback',
      NEW.category, NEW.title, left(NEW.message, 500));
  ELSIF TG_TABLE_NAME = 'reports' THEN
    v_msg := format(E'🚨 **신고** %s — %s\n%s\n→ https://www.hikingmate.co.kr/admin/reports',
      NEW.target_type, NEW.reason, coalesce(left(NEW.description, 300), ''));
  ELSIF TG_TABLE_NAME = 'posts' THEN
    v_msg := format(E'📝 **새 게시글** [%s] %s\n→ https://www.hikingmate.co.kr/community/%s',
      NEW.category, NEW.title, NEW.id);
  ELSE
    RETURN NEW;
  END IF;

  -- allowed_mentions: 사용자 입력에 @everyone 등이 있어도 멘션되지 않게 함
  PERFORM net.http_post(
    url := v_url,
    body := jsonb_build_object(
      'content', left(v_msg, 1900),
      'allowed_mentions', jsonb_build_object('parse', jsonb_build_array())
    ),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 알림 실패가 가입/작성을 막지 않도록 함
    RAISE WARNING 'notify_admin failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admin ON public.users;
CREATE TRIGGER notify_admin AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION private.notify_admin();

DROP TRIGGER IF EXISTS notify_admin ON public.feedback;
CREATE TRIGGER notify_admin AFTER INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION private.notify_admin();

DROP TRIGGER IF EXISTS notify_admin ON public.reports;
CREATE TRIGGER notify_admin AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION private.notify_admin();

DROP TRIGGER IF EXISTS notify_admin ON public.posts;
CREATE TRIGGER notify_admin AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION private.notify_admin();

-- ===== 4. 관리자 대시보드용 함수 =====
-- 회원 목록 (이메일은 auth.users에만 있으므로 관리자 전용 함수로 제공)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  banned_until TIMESTAMPTZ,
  posts_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '관리자만 접근할 수 있습니다' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    a.email::TEXT,
    u.username::TEXT,
    u.role::TEXT,
    a.created_at,
    a.last_sign_in_at,
    a.email_confirmed_at,
    a.banned_until,
    (SELECT count(*) FROM public.posts p WHERE p.user_id = u.id)
  FROM public.users u
  JOIN auth.users a ON a.id = u.id
  ORDER BY a.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- 회원 정지/해제 (정지 시 로그인 세션도 종료)
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
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_ban(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_ban(UUID, BOOLEAN) TO authenticated;

-- ===== 확인 =====
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema IN ('public', 'private')
  AND routine_name IN ('delete_user', 'notify_admin', 'admin_list_users', 'admin_set_user_ban')
ORDER BY routine_name;
