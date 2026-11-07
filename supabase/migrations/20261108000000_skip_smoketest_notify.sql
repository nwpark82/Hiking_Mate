-- =====================================================
-- 자동 점검(스모크 테스트) 계정 알림 제외 (2026-11-08)
-- =====================================================
-- 사용법: Supabase Dashboard → SQL Editor에 전체 복사 후 실행
--
-- 주간 자동 점검(.github/workflows/smoke-test.yml)은 'smoketest_' 로 시작하는
-- 임시 계정으로 가입/글쓰기/신고를 테스트한 뒤 탈퇴함.
-- 이 계정들의 활동은 Discord 알림을 보내지 않도록 notify_admin 을 수정.
-- =====================================================

CREATE OR REPLACE FUNCTION private.notify_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url TEXT;
  v_msg TEXT;
  v_actor UUID;
BEGIN
  -- 자동 점검 계정은 알림 제외
  IF TG_TABLE_NAME = 'users' THEN
    IF NEW.username LIKE 'smoketest\_%' THEN
      RETURN NEW;
    END IF;
  ELSE
    v_actor := COALESCE(
      (to_jsonb(NEW) ->> 'user_id')::UUID,
      (to_jsonb(NEW) ->> 'reporter_id')::UUID
    );
    IF v_actor IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.users WHERE id = v_actor AND username LIKE 'smoketest\_%'
    ) THEN
      RETURN NEW;
    END IF;
  END IF;

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
