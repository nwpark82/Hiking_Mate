-- Trails 테이블 RLS 정책 수정
-- 모든 사용자가 trails를 조회할 수 있도록 설정

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Anyone can view trails" ON trails;
DROP POLICY IF EXISTS "Public trails are viewable by everyone" ON trails;
DROP POLICY IF EXISTS "Enable read access for all users" ON trails;

-- RLS 활성화 확인
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 생성 (모든 사용자가 trails 조회 가능)
CREATE POLICY "Enable read access for all users"
  ON trails
  FOR SELECT
  USING (true);

-- 인증된 사용자는 view_count, like_count, hike_count 업데이트 가능
CREATE POLICY "Authenticated users can update stats"
  ON trails
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 확인: RLS 상태 및 정책 조회
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'trails';
