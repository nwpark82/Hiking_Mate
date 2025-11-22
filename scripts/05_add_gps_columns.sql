-- ============================================
-- GPS 좌표 컬럼 추가
-- ============================================

-- trails 테이블에 GPS 좌표 관련 컬럼 추가
ALTER TABLE trails
ADD COLUMN IF NOT EXISTS start_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS start_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS path_coordinates JSONB;

-- 추가 확인 쿼리
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'trails'
  AND column_name IN ('start_latitude', 'start_longitude', 'path_coordinates')
ORDER BY column_name;
