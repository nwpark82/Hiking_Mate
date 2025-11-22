-- 고도 관련 컬럼 추가
ALTER TABLE trails ADD COLUMN IF NOT EXISTS min_altitude INTEGER;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS avg_altitude INTEGER;

-- 인덱스 추가 (쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_trails_min_altitude ON trails(min_altitude);
CREATE INDEX IF NOT EXISTS idx_trails_avg_altitude ON trails(avg_altitude);

-- 확인
SELECT
  COUNT(*) as total_trails,
  COUNT(min_altitude) as has_min_altitude,
  COUNT(max_altitude) as has_max_altitude,
  COUNT(avg_altitude) as has_avg_altitude,
  COUNT(elevation_gain) as has_elevation_gain
FROM trails;
