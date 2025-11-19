-- ============================================
-- Row Level Security (RLS) 정책 및 함수
-- ============================================

-- 1. users 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone"
  ON users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. trails 테이블 RLS
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view trails" ON trails;
CREATE POLICY "Anyone can view trails"
  ON trails FOR SELECT
  USING (true);

-- 3. hikes 테이블 RLS
ALTER TABLE hikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own hikes" ON hikes;
CREATE POLICY "Users can manage own hikes"
  ON hikes
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public hikes are viewable" ON hikes;
CREATE POLICY "Public hikes are viewable"
  ON hikes FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- 4. posts 테이블 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- 5. comments 테이블 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- 6. likes 테이블 RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON likes;
CREATE POLICY "Users can like posts"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON likes;
CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- 7. meetups 테이블 RLS
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active meetups" ON meetups;
CREATE POLICY "Anyone can view active meetups"
  ON meetups FOR SELECT
  USING (status = 'recruiting' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create meetups" ON meetups;
CREATE POLICY "Users can create meetups"
  ON meetups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meetups" ON meetups;
CREATE POLICY "Users can update own meetups"
  ON meetups FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. favorites 테이블 RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
CREATE POLICY "Users can manage own favorites"
  ON favorites
  USING (auth.uid() = user_id);

-- ============================================
-- 데이터베이스 함수
-- ============================================

-- 1. 좋아요 토글 함수
CREATE OR REPLACE FUNCTION toggle_like(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_liked BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM likes
    WHERE user_id = v_user_id AND post_id = p_post_id
  ) INTO v_liked;

  IF v_liked THEN
    DELETE FROM likes
    WHERE user_id = v_user_id AND post_id = p_post_id;

    UPDATE posts
    SET like_count = like_count - 1
    WHERE id = p_post_id;

    RETURN FALSE;
  ELSE
    INSERT INTO likes (user_id, post_id)
    VALUES (v_user_id, p_post_id);

    UPDATE posts
    SET like_count = like_count + 1
    WHERE id = p_post_id;

    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_view_count(p_trail_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE trails
  SET view_count = view_count + 1
  WHERE id = p_trail_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 사용자 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET
    total_distance = (
      SELECT COALESCE(SUM(distance), 0)
      FROM hikes
      WHERE user_id = p_user_id AND is_completed = true
    ),
    total_duration = (
      SELECT COALESCE(SUM(duration), 0)
      FROM hikes
      WHERE user_id = p_user_id AND is_completed = true
    ),
    total_mountains = (
      SELECT COUNT(DISTINCT trail_id)
      FROM hikes
      WHERE user_id = p_user_id AND is_completed = true AND trail_id IS NOT NULL
    )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거
-- ============================================

-- 1. 댓글 수 자동 업데이트
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;
CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_count();

-- 2. updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_posts_modtime ON posts;
CREATE TRIGGER update_posts_modtime
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_comments_modtime ON comments;
CREATE TRIGGER update_comments_modtime
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_meetups_modtime ON meetups;
CREATE TRIGGER update_meetups_modtime
BEFORE UPDATE ON meetups
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ RLS 정책 및 함수/트리거 설정 완료!';
END $$;
