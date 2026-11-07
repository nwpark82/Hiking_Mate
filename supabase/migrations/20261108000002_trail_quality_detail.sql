-- =====================================================
-- 등산로 판정 상세 저장 (2026-11-08)
-- =====================================================
-- 사용법: Supabase Dashboard → SQL Editor에 전체 복사 후 실행
--
-- 관리자 화면에서 등산로 분석 결과(사용 판정, 시작/끝 분류, 끊김 원인, 보정 방법 등)를
-- 볼 수 있도록 판정 상세를 JSON으로 저장. scripts/trail-review/sync_quality.js 가 채움.
-- 일반 사용자 화면에서는 사용하지 않음.
-- =====================================================

ALTER TABLE public.trails ADD COLUMN IF NOT EXISTS quality_detail JSONB;

-- 판정별 필터용
CREATE INDEX IF NOT EXISTS idx_trails_quality_verdict ON public.trails ((quality_detail ->> 'verdict'));

-- 관리자 대시보드 요약
CREATE OR REPLACE FUNCTION public.admin_trail_quality_summary()
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
    'total', (SELECT count(*) FROM public.trails),
    'published', (SELECT count(*) FROM public.trails WHERE is_published),
    'reliable', (SELECT count(*) FROM public.trails WHERE quality_status = 'reliable'),
    'unreliable', (SELECT count(*) FROM public.trails WHERE quality_status = 'unreliable'),
    'verdicts', (
      SELECT COALESCE(jsonb_object_agg(v, c), '{}'::jsonb)
      FROM (
        SELECT COALESCE(quality_detail ->> 'verdict', 'UNKNOWN') AS v, count(*) AS c
        FROM public.trails GROUP BY 1
      ) s
    ),
    'checked_at', (SELECT max(quality_checked_at) FROM public.trails)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_trail_quality_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_trail_quality_summary() TO authenticated;
