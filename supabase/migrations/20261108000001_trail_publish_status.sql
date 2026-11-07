-- =====================================================
-- 등산로 공개 여부 / 신뢰도 (2026-11-08)
-- =====================================================
-- 사용법: Supabase Dashboard → SQL Editor에 전체 복사 후 실행
--
-- 신뢰할 수 있는 등산로만 사용자에게 공개하기 위한 구조
-- - is_published: 공개 여부 (false면 탐색/검색/사이트맵/상세에서 보이지 않음, 관리자는 보임)
-- - quality_status: reliable / unreliable (scripts/trail-review/publish.js 가 판정 결과로 채움)
-- - quality_note: 비신뢰 사유
-- 실행 직후에는 모두 공개 상태(기존과 동일). publish.js 실행 시 비신뢰 등산로가 비공개로 바뀜
-- =====================================================

ALTER TABLE public.trails ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.trails ADD COLUMN IF NOT EXISTS quality_status TEXT;
ALTER TABLE public.trails ADD COLUMN IF NOT EXISTS quality_note TEXT;
ALTER TABLE public.trails ADD COLUMN IF NOT EXISTS quality_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_trails_is_published ON public.trails(is_published);

-- 공개 조회 정책 교체: 공개된 등산로만, 관리자는 전체
DROP POLICY IF EXISTS "Anyone can view trails" ON public.trails;
DROP POLICY IF EXISTS "Trails are viewable by everyone" ON public.trails;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.trails;
DROP POLICY IF EXISTS "Public trails are viewable by everyone" ON public.trails;
DROP POLICY IF EXISTS "Published trails are viewable" ON public.trails;

CREATE POLICY "Published trails are viewable"
  ON public.trails FOR SELECT
  USING (is_published OR public.is_admin());

-- ===== 확인: trails 의 SELECT 정책은 "Published trails are viewable" 하나만 남아야 함 =====
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'trails'
ORDER BY cmd, policyname;
