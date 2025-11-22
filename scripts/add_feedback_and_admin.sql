-- ============================================
-- Feedback System & Admin Role Migration
-- ============================================

-- 1. users 테이블에 role 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
CHECK (role IN ('user', 'admin', 'moderator'));

-- 기존 사용자는 모두 'user' role로 설정
UPDATE users SET role = 'user' WHERE role IS NULL;

-- role 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. Feedback 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,  -- 비로그인 사용자용
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'improvement', 'other')) DEFAULT 'other',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')) DEFAULT 'new',
  admin_note TEXT,  -- 관리자 메모
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Feedback updated_at 트리거
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Reports 테이블 생성 (신고 기능)
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target_type ON reports(target_type);
CREATE INDEX IF NOT EXISTS idx_reports_target_id ON reports(target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Reports updated_at 트리거
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS (Row Level Security) 정책
-- ============================================

-- Feedback RLS 활성화
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 자신의 피드백 조회 가능
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 피드백 조회 가능
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- 로그인 사용자는 피드백 생성 가능
CREATE POLICY "Authenticated users can create feedback" ON feedback
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 사용자는 자신의 피드백 수정 가능 (status는 수정 불가)
CREATE POLICY "Users can update their own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 피드백 수정 가능
CREATE POLICY "Admins can update all feedback" ON feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- Reports RLS 활성화
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신이 작성한 신고 조회 가능
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- 관리자는 모든 신고 조회 가능
CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- 로그인 사용자는 신고 생성 가능
CREATE POLICY "Authenticated users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 관리자는 모든 신고 수정 가능
CREATE POLICY "Admins can update all reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- 5. 관리자 권한 추가 (기존 테이블)
-- ============================================

-- Posts: 관리자는 모든 게시글 삭제 가능
CREATE POLICY "Admins can delete any post" ON posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- Comments: 관리자는 모든 댓글 삭제 가능
CREATE POLICY "Admins can delete any comment" ON comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- 6. 통계 뷰 (관리자용)
-- ============================================

-- 피드백 통계
CREATE OR REPLACE VIEW feedback_stats AS
SELECT
  category,
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
FROM feedback
GROUP BY category, status;

-- 신고 통계
CREATE OR REPLACE VIEW reports_stats AS
SELECT
  target_type,
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
FROM reports
GROUP BY target_type, status;

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Feedback system and admin role migration completed successfully!';
  RAISE NOTICE '📌 Next steps:';
  RAISE NOTICE '   1. Set your user as admin: UPDATE users SET role = ''admin'' WHERE email = ''your-email@example.com'';';
  RAISE NOTICE '   2. Deploy the feedback UI components';
  RAISE NOTICE '   3. Test feedback submission';
END $$;
