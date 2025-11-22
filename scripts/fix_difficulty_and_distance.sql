-- ============================================
-- 난이도 및 거리 데이터 수정
-- ============================================

-- 0. 불완전한 데이터 삭제
-- (너무 짧은 거리, 너무 짧은 시간, elevation_gain이 0인 등산로)
DELETE FROM trails
WHERE distance < 100  -- 100m 미만
   OR duration < 10   -- 10분 미만
   OR elevation_gain IS NULL
   OR elevation_gain = 0;

-- 1. 체크 제약 조건 임시 제거
ALTER TABLE trails DROP CONSTRAINT IF EXISTS valid_difficulty;
ALTER TABLE trails DROP CONSTRAINT IF EXISTS trails_difficulty_check;

-- 2. 난이도 값을 영어에서 한글로 변경
UPDATE trails SET difficulty = '초급' WHERE difficulty = 'easy';
UPDATE trails SET difficulty = '중급' WHERE difficulty = 'normal';
UPDATE trails SET difficulty = '고급' WHERE difficulty = 'hard';
UPDATE trails SET difficulty = '전문가' WHERE difficulty = 'expert';

-- 3. 거리를 미터에서 킬로미터로 변환 (÷ 1000)
UPDATE trails SET distance = distance / 1000;

-- 4. 체크 제약 조건 다시 추가 (한글 값으로)
ALTER TABLE trails ADD CONSTRAINT valid_difficulty
  CHECK (difficulty IN ('초급', '중급', '고급', '전문가'));

-- 5. 검증 쿼리
SELECT
  difficulty,
  COUNT(*) as count,
  ROUND(AVG(distance)::numeric, 2) as avg_distance_km,
  ROUND(MIN(distance)::numeric, 2) as min_distance_km,
  ROUND(MAX(distance)::numeric, 2) as max_distance_km
FROM trails
GROUP BY difficulty
ORDER BY
  CASE difficulty
    WHEN '초급' THEN 1
    WHEN '중급' THEN 2
    WHEN '고급' THEN 3
    WHEN '전문가' THEN 4
  END;

-- 6. 거리 분포 확인
SELECT
  CASE
    WHEN distance <= 5 THEN '5km 이하'
    WHEN distance > 5 AND distance <= 10 THEN '5-10km'
    WHEN distance > 10 AND distance <= 15 THEN '10-15km'
    ELSE '15km 이상'
  END as distance_range,
  COUNT(*) as count
FROM trails
GROUP BY 1
ORDER BY 1;
