-- Trails 테이블 성능 개선을 위한 인덱스 추가

-- 정렬에 자주 사용되는 컬럼 인덱스
CREATE INDEX IF NOT EXISTS idx_trails_view_count ON trails(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_trails_created_at ON trails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trails_distance ON trails(distance ASC);

-- 필터링에 자주 사용되는 컬럼 인덱스
CREATE INDEX IF NOT EXISTS idx_trails_difficulty ON trails(difficulty);
CREATE INDEX IF NOT EXISTS idx_trails_region ON trails(region);

-- 복합 인덱스: 지역 + 난이도 조합 필터링
CREATE INDEX IF NOT EXISTS idx_trails_region_difficulty ON trails(region, difficulty);

-- 검색을 위한 텍스트 검색 인덱스 (이미 있을 수 있음)
CREATE INDEX IF NOT EXISTS idx_trails_name ON trails USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_trails_mountain ON trails USING gin(to_tsvector('simple', mountain));

-- 통계 확인
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'trails'
ORDER BY indexname;
