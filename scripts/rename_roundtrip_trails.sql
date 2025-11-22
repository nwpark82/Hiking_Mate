-- 등산로 명 변경: ROUNDTRIP 유형의 (정방향) → (왕복코스)
-- 주의: trail_type = 'ROUNDTRIP'인 경우만 변경

-- 1단계: 변경 대상 확인 (ROUNDTRIP만)
SELECT id, name, mountain, region, trail_type
FROM trails
WHERE name LIKE '%(정방향)%'
  AND trail_type = 'ROUNDTRIP'
ORDER BY name;

-- 2단계: 변경 실행 (ROUNDTRIP만)
UPDATE trails
SET name = REPLACE(name, '(정방향)', '(왕복코스)')
WHERE name LIKE '%(정방향)%'
  AND trail_type = 'ROUNDTRIP';

-- 3단계: 변경 결과 확인
SELECT id, name, mountain, region, trail_type
FROM trails
WHERE name LIKE '%(왕복코스)%'
ORDER BY name;

-- 4단계: 변경되지 않은 (정방향) 확인 (다른 유형)
SELECT trail_type, COUNT(*) as count
FROM trails
WHERE name LIKE '%(정방향)%'
GROUP BY trail_type
ORDER BY trail_type;
