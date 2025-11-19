-- =====================================================
-- 트리거 디버깅 및 수정
-- =====================================================

-- 1. 먼저 users 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. 기존 트리거 확인
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
ORDER BY trigger_name;

-- 3. 트리거 함수 로그 확인
-- (만약 에러가 있다면 여기서 확인 가능)

-- =====================================================
-- 해결책: 단순화된 트리거 생성
-- =====================================================

-- 4. 기존 트리거 완전 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 5. 단순한 버전의 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 최소한의 필드만으로 INSERT
  INSERT INTO public.users (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;  -- 이미 있으면 무시

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러가 발생해도 회원가입은 계속 진행
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. 트리거 재생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. 권한 부여
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- =====================================================
-- 기존 사용자 프로필 생성 (이미 가입한 사용자)
-- =====================================================

-- 8. 프로필이 없는 기존 사용자를 위한 프로필 생성
INSERT INTO public.users (id, username, created_at, updated_at)
SELECT
  a.id,
  COALESCE(
    a.raw_user_meta_data->>'username',
    split_part(a.email, '@', 1)
  ) as username,
  a.created_at,
  NOW()
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.id
WHERE u.id IS NULL  -- 프로필이 없는 사용자만
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 확인
-- =====================================================

-- 9. 트리거 생성 확인
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 10. 모든 사용자의 프로필 생성 상태 확인
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
LIMIT 10;

-- =====================================================
-- 테스트: 새로운 회원가입 시뮬레이션
-- =====================================================

-- 11. 테스트용 사용자로 확인 (실제 회원가입 대신 사용 가능)
-- 주의: 실제 운영 환경에서는 실행하지 마세요!
/*
-- 테스트 사용자 생성 예시 (주석 처리됨)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"username": "testuser"}'::jsonb,
  NOW(),
  NOW()
);
*/
