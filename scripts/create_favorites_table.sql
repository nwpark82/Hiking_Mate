-- Favorites 테이블 생성
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trail_id UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 사용자당 트레일당 하나의 즐겨찾기만 허용
  UNIQUE(user_id, trail_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_trail_id ON favorites(trail_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_trail ON favorites(user_id, trail_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 즐겨찾기만 볼 수 있음
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 즐겨찾기를 추가할 수 있음
CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 즐겨찾기를 삭제할 수 있음
CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
