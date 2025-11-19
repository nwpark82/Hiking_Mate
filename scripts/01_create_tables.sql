-- ============================================
-- 하이킹메이트 Phase 1 데이터베이스 스키마
-- ============================================

-- 1. users 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  profile_image TEXT,
  bio TEXT,
  total_distance FLOAT DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  total_mountains INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 2),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 2. trails 테이블
CREATE TABLE IF NOT EXISTS trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  mountain VARCHAR(100) NOT NULL,
  region VARCHAR(50),
  difficulty VARCHAR(20) NOT NULL,
  distance FLOAT NOT NULL,
  duration INTEGER NOT NULL,
  elevation_gain INTEGER,
  max_altitude INTEGER,
  start_latitude DOUBLE PRECISION,
  start_longitude DOUBLE PRECISION,
  path_coordinates JSONB,
  features JSONB DEFAULT '[]',
  health_benefits JSONB DEFAULT '[]',
  attractions JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  description TEXT,
  access_info TEXT,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  hike_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('초급', '중급', '고급', '전문가')),
  CONSTRAINT positive_distance CHECK (distance > 0),
  CONSTRAINT positive_duration CHECK (duration > 0)
);

CREATE INDEX IF NOT EXISTS idx_trails_mountain ON trails(mountain);
CREATE INDEX IF NOT EXISTS idx_trails_region ON trails(region);
CREATE INDEX IF NOT EXISTS idx_trails_difficulty ON trails(difficulty);
CREATE INDEX IF NOT EXISTS idx_trails_distance ON trails(distance);
CREATE INDEX IF NOT EXISTS idx_trails_view_count ON trails(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_trails_features ON trails USING GIN(features);
CREATE INDEX IF NOT EXISTS idx_trails_health_benefits ON trails USING GIN(health_benefits);

-- 전문 검색 (Full Text Search)
ALTER TABLE trails ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(mountain, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_trails_search ON trails USING GIN(search_vector);

-- 3. hikes 테이블
CREATE TABLE IF NOT EXISTS hikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES trails(id) ON DELETE SET NULL,
  gpx_data JSONB,
  distance FLOAT,
  duration INTEGER,
  avg_pace FLOAT,
  calories INTEGER,
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  rating INTEGER,
  weather VARCHAR(50),
  is_completed BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT completed_after_start CHECK (completed_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_hikes_user_id ON hikes(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_hikes_trail_id ON hikes(trail_id);
CREATE INDEX IF NOT EXISTS idx_hikes_completed_at ON hikes(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_hikes_public ON hikes(is_public) WHERE is_public = true;

-- 4. posts 테이블
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES trails(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL DEFAULT '자유',
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_category CHECK (category IN ('자유', '후기', '질문', '장비', '정보')),
  CONSTRAINT title_length CHECK (char_length(title) >= 2),
  CONSTRAINT content_length CHECK (char_length(content) >= 10),
  CONSTRAINT max_images CHECK (array_length(images, 1) <= 4)
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_trail_id ON posts(trail_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hot ON posts(like_count DESC, created_at DESC);

-- 전문 검색
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_vector);

-- 5. comments 테이블
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT content_length CHECK (char_length(content) >= 1)
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- 6. likes 테이블
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- 7. meetups 테이블
CREATE TABLE IF NOT EXISTS meetups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES trails(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  meet_date DATE NOT NULL,
  meet_time TIME,
  max_participants INTEGER,
  difficulty_level VARCHAR(20),
  contact_method VARCHAR(50),
  contact_info TEXT,
  status VARCHAR(20) DEFAULT 'recruiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT future_date CHECK (meet_date >= CURRENT_DATE),
  CONSTRAINT valid_status CHECK (status IN ('recruiting', 'closed', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_meetups_trail_id ON meetups(trail_id);
CREATE INDEX IF NOT EXISTS idx_meetups_meet_date ON meetups(meet_date);
CREATE INDEX IF NOT EXISTS idx_meetups_status ON meetups(status);
CREATE INDEX IF NOT EXISTS idx_meetups_created_at ON meetups(created_at DESC);

-- 8. favorites 테이블
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trail_id UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trail_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1 테이블 생성 완료!';
END $$;
