-- =====================================================
-- 회원가입 Database Trigger 설정
-- =====================================================
-- 이 방법이 가장 안정적이고 Supabase 공식 권장 방법입니다
-- =====================================================

-- 1. 기존 트리거 및 함수 삭제 (있다면)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. 새 사용자 생성 시 자동으로 프로필 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- users 테이블에 자동으로 프로필 생성
  INSERT INTO public.users (
    id,
    username,
    level,
    total_distance,
    total_hikes,
    total_likes,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    -- metadata에서 username 가져오기, 없으면 이메일 앞부분 사용
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    1,    -- 초기 레벨
    0,    -- 초기 거리
    0,    -- 초기 산행 횟수
    0,    -- 초기 좋아요 수
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 3. Auth 사용자 생성 시 트리거 실행
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. 함수 실행 권한 부여
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- =====================================================
-- 확인 쿼리
-- =====================================================

-- 트리거가 제대로 생성되었는지 확인
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

-- Auth 사용자와 프로필 매핑 확인 (최근 5명)
SELECT
  a.id,
  a.email,
  a.created_at as auth_created,
  u.username,
  u.created_at as profile_created,
  CASE
    WHEN u.id IS NULL THEN '❌ 프로필 없음'
    ELSE '✅ 프로필 생성됨'
  END as status
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.id
ORDER BY a.created_at DESC
LIMIT 5;
