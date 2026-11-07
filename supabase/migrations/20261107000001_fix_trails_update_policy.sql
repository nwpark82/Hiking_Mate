-- =====================================================
-- 등산로 수정 권한 수정 (2026-11-07)
-- =====================================================
-- 사용법: Supabase Dashboard → SQL Editor에 전체 복사 후 실행
--
-- 문제: scripts/fix_trails_rls.sql 의 "Authenticated users can update stats" 정책으로
--       로그인한 모든 회원이 등산로 이름/설명/경로 등 모든 컬럼을 수정할 수 있었음
-- 조치: 해당 정책 삭제 → 등산로 수정은 관리자 정책("Admins can update trails")만 남김
--       조회수 증가는 전용 함수(increment_trail_view)로 처리
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can update stats" ON public.trails;

CREATE OR REPLACE FUNCTION public.increment_trail_view(p_trail_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.trails SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_trail_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_trail_view(UUID) TO anon, authenticated;

-- ===== 확인: trails 의 UPDATE 정책은 "Admins can update trails" 하나만 남아야 함 =====
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'trails'
ORDER BY cmd, policyname;
