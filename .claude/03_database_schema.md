# 데이터베이스 스키마 (Database Schema)

## 📊 ERD (Entity Relationship Diagram)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │───┐   │    trails    │       │    posts     │
│              │   │   │              │       │              │
│ id (PK)      │   │   │ id (PK)      │       │ id (PK)      │
│ username     │   │   │ name         │   ┌───│ user_id (FK) │
│ email        │   │   │ mountain     │   │   │ trail_id (FK)│
│ profile_img  │   │   │ difficulty   │   │   │ title        │
└──────┬───────┘   │   │ distance     │   │   │ content      │
       │           │   │ duration     │   │   │ images       │
       │           │   └──────┬───────┘   │   └──────┬───────┘
       │           │          │           │          │
       │      ┌────▼─────┐    │      ┌────▼─────┐   │
       │      │  hikes   │────┘      │ comments │───┘
       │      │          │           │          │
       │      │ id (PK)  │           │ id (PK)  │
       └──────│ user_id  │       ┌───│ post_id  │
              │ trail_id │       │   │ user_id  │
              │ gpx_data │       │   │ content  │
              │ photos   │       │   └──────────┘
              └──────────┘       │
                                 │
              ┌──────────────┐   │   ┌──────────────┐
              │   meetups    │───┘   │    likes     │
              │              │       │              │
              │ id (PK)      │       │ id (PK)      │
              │ user_id (FK) │       │ user_id (FK) │
              │ trail_id (FK)│       │ post_id (FK) │
              │ title        │       │ created_at   │
              └──────────────┘       └──────────────┘
```

---

## 🗃️ 테이블 상세 설계

### 1. users (사용자)

```sql
CREATE TABLE users (
  -- 기본키 (Supabase Auth UUID와 동일)
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  
  -- 프로필 정보
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  profile_image TEXT,
  bio TEXT,
  
  -- 통계 (캐싱용)
  total_distance FLOAT DEFAULT 0,           -- 총 산행 거리 (km)
  total_duration INTEGER DEFAULT 0,         -- 총 산행 시간 (분)
  total_mountains INTEGER DEFAULT 0,        -- 완등한 산 개수
  level INTEGER DEFAULT 1,                  -- 사용자 레벨
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약 조건
  CONSTRAINT username_length CHECK (char_length(username) >= 2),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

-- 인덱스
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사람이 프로필 조회 가능
CREATE POLICY "Public profiles are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- 정책: 본인만 프로필 수정 가능
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

**샘플 데이터:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "등산왕김등산",
  "email": "hiker@example.com",
  "profile_image": "https://xxx.supabase.co/storage/v1/profiles/avatar.jpg",
  "bio": "주말마다 산에 갑니다 🏔️",
  "total_distance": 145.3,
  "total_duration": 2340,
  "total_mountains": 23,
  "level": 3,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 2. trails (등산로)

```sql
CREATE TABLE trails (
  -- 기본키
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  name VARCHAR(200) NOT NULL,                -- 코스명
  mountain VARCHAR(100) NOT NULL,            -- 산 이름
  region VARCHAR(50),                        -- 지역 (서울, 경기, 강원 등)
  difficulty VARCHAR(20) NOT NULL,           -- 난이도 (초급/중급/고급)
  
  -- 상세 정보
  distance FLOAT NOT NULL,                   -- 거리 (km)
  duration INTEGER NOT NULL,                 -- 예상 소요시간 (분)
  elevation_gain INTEGER,                    -- 고도차 (m)
  max_altitude INTEGER,                      -- 최고 고도 (m)
  
  -- 위치 (Point)
  start_latitude DOUBLE PRECISION,
  start_longitude DOUBLE PRECISION,
  
  -- 경로 데이터 (GeoJSON)
  path_coordinates JSONB,                    -- [{lat, lng, alt}]
  
  -- 특성 (JSONB 배열)
  features JSONB DEFAULT '[]',               -- ["단풍명소", "일출명소", "야생화"]
  health_benefits JSONB DEFAULT '[]',        -- ["심혈관", "스트레스해소"]
  attractions JSONB DEFAULT '[]',            -- ["폭포", "계곡", "바위"]
  warnings JSONB DEFAULT '[]',               -- ["낙석주의", "급경사"]
  
  -- 설명
  description TEXT,
  access_info TEXT,                          -- 교통/주차 정보
  
  -- 통계 (캐싱)
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  hike_count INTEGER DEFAULT 0,              -- 완주 횟수
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약
  CONSTRAINT valid_difficulty CHECK (
    difficulty IN ('초급', '중급', '고급', '전문가')
  ),
  CONSTRAINT positive_distance CHECK (distance > 0),
  CONSTRAINT positive_duration CHECK (duration > 0)
);

-- 인덱스
CREATE INDEX idx_trails_mountain ON trails(mountain);
CREATE INDEX idx_trails_region ON trails(region);
CREATE INDEX idx_trails_difficulty ON trails(difficulty);
CREATE INDEX idx_trails_distance ON trails(distance);
CREATE INDEX idx_trails_view_count ON trails(view_count DESC);

-- GIN 인덱스 (JSONB 검색용)
CREATE INDEX idx_trails_features ON trails USING GIN(features);
CREATE INDEX idx_trails_health_benefits ON trails USING GIN(health_benefits);

-- 전문 검색 (Full Text Search)
ALTER TABLE trails ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(mountain, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX idx_trails_search ON trails USING GIN(search_vector);

-- RLS
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trails"
  ON trails FOR SELECT
  USING (true);
```

**샘플 데이터:**
```json
{
  "id": "trail-001",
  "name": "백운대 정상 코스",
  "mountain": "북한산",
  "region": "서울",
  "difficulty": "중급",
  "distance": 5.8,
  "duration": 180,
  "elevation_gain": 550,
  "max_altitude": 836,
  "start_latitude": 37.6599,
  "start_longitude": 126.9783,
  "features": ["단풍명소", "암릉구간", "조망좋음"],
  "health_benefits": ["심폐지구력", "하체근력"],
  "attractions": ["인수봉", "백운대", "만경대"],
  "warnings": ["낙석주의", "우천시위험"],
  "description": "북한산의 대표 코스로...",
  "access_info": "우이동역 2번 출구에서..."
}
```

---

### 3. hikes (산행 기록)

```sql
CREATE TABLE hikes (
  -- 기본키
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 외래키
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES trails(id) ON DELETE SET NULL,
  
  -- 기록 데이터
  gpx_data JSONB,                           -- GPS 좌표 배열
  distance FLOAT,                           -- 실제 거리 (km)
  duration INTEGER,                         -- 실제 시간 (분)
  avg_pace FLOAT,                           -- 평균 페이스 (min/km)
  calories INTEGER,                         -- 소모 칼로리 (선택)
  
  -- 추가 정보
  photos TEXT[] DEFAULT '{}',               -- Storage URL 배열
  notes TEXT,                               -- 메모
  rating INTEGER,                           -- 별점 (1-5)
  weather VARCHAR(50),                      -- 날씨
  
  -- 상태
  is_completed BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,           -- 공개 여부
  
  -- 메타데이터
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT completed_after_start CHECK (completed_at >= started_at)
);

-- 인덱스
CREATE INDEX idx_hikes_user_id ON hikes(user_id, completed_at DESC);
CREATE INDEX idx_hikes_trail_id ON hikes(trail_id);
CREATE INDEX idx_hikes_completed_at ON hikes(completed_at DESC);
CREATE INDEX idx_hikes_public ON hikes(is_public) WHERE is_public = true;

-- RLS
ALTER TABLE hikes ENABLE ROW LEVEL SECURITY;

-- 본인의 모든 기록 조회/수정 가능
CREATE POLICY "Users can manage own hikes"
  ON hikes
  USING (auth.uid() = user_id);

-- 공개된 기록은 모두 조회 가능
CREATE POLICY "Public hikes are viewable"
  ON hikes FOR SELECT
  USING (is_public = true);
```

**GPX 데이터 구조:**
```json
{
  "points": [
    {
      "latitude": 37.6599,
      "longitude": 126.9783,
      "altitude": 120,
      "timestamp": "2024-11-17T09:00:00Z",
      "accuracy": 10
    }
  ],
  "stats": {
    "maxAltitude": 836,
    "minAltitude": 120,
    "totalAscent": 716,
    "totalDescent": 716
  }
}
```

---

### 4. posts (커뮤니티 게시글)

```sql
CREATE TABLE posts (
  -- 기본키
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 외래키
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES trails(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL DEFAULT '자유',
  
  -- 내용
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',               -- 최대 4장
  
  -- 통계 (캐싱)
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약
  CONSTRAINT valid_category CHECK (
    category IN ('자유', '후기', '질문', '장비', '정보')
  ),
  CONSTRAINT title_length CHECK (char_length(title) >= 2),
  CONSTRAINT content_length CHECK (char_length(content) >= 10),
  CONSTRAINT max_images CHECK (array_length(images, 1) <= 4)
);

-- 인덱스
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_trail_id ON posts(trail_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_hot ON posts(like_count DESC, created_at DESC);

-- 전문 검색
ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 5. comments (댓글)

```sql
CREATE TABLE comments (
  -- 기본키
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 외래키
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 대댓글
  
  -- 내용
  content TEXT NOT NULL,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약
  CONSTRAINT content_length CHECK (char_length(content) >= 1)
);

-- 인덱스
CREATE INDEX idx_comments_post_id ON comments(post_id, created_at);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 6. likes (좋아요)

```sql
CREATE TABLE likes (
  -- 기본키 (복합)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 유니크 제약 (중복 좋아요 방지)
  UNIQUE(user_id, post_id)
);

-- 인덱스
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 7. meetups (모임)

```sql
CREATE TABLE meetups (
  -- 기본키
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 외래키
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES trails(id) ON DELETE SET NULL,
  
  -- 모임 정보
  title VARCHAR(200) NOT NULL,
  description TEXT,
  meet_date DATE NOT NULL,
  meet_time TIME,
  max_participants INTEGER,
  difficulty_level VARCHAR(20),
  
  -- 연락 정보
  contact_method VARCHAR(50),               -- 'openchat', 'email', etc.
  contact_info TEXT,                        -- 오픈카톡 링크 등
  
  -- 상태
  status VARCHAR(20) DEFAULT 'recruiting',   -- recruiting, closed, completed
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약
  CONSTRAINT future_date CHECK (meet_date >= CURRENT_DATE),
  CONSTRAINT valid_status CHECK (
    status IN ('recruiting', 'closed', 'completed', 'cancelled')
  )
);

-- 인덱스
CREATE INDEX idx_meetups_trail_id ON meetups(trail_id);
CREATE INDEX idx_meetups_meet_date ON meetups(meet_date);
CREATE INDEX idx_meetups_status ON meetups(status);
CREATE INDEX idx_meetups_created_at ON meetups(created_at DESC);

-- RLS
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active meetups"
  ON meetups FOR SELECT
  USING (status = 'recruiting');

CREATE POLICY "Users can create meetups"
  ON meetups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetups"
  ON meetups FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### 8. favorites (즐겨찾기)

```sql
CREATE TABLE favorites (
  -- 기본키
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trail_id UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 유니크 제약
  UNIQUE(user_id, trail_id)
);

-- 인덱스
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON favorites
  USING (auth.uid() = user_id);
```

---

## 🔧 데이터베이스 함수

### 1. 게시글 좋아요 토글
```sql
CREATE OR REPLACE FUNCTION toggle_like(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_liked BOOLEAN;
BEGIN
  -- 이미 좋아요 했는지 확인
  SELECT EXISTS(
    SELECT 1 FROM likes 
    WHERE user_id = v_user_id AND post_id = p_post_id
  ) INTO v_liked;
  
  IF v_liked THEN
    -- 좋아요 취소
    DELETE FROM likes 
    WHERE user_id = v_user_id AND post_id = p_post_id;
    
    -- 카운트 감소
    UPDATE posts 
    SET like_count = like_count - 1 
    WHERE id = p_post_id;
    
    RETURN FALSE;
  ELSE
    -- 좋아요 추가
    INSERT INTO likes (user_id, post_id) 
    VALUES (v_user_id, p_post_id);
    
    -- 카운트 증가
    UPDATE posts 
    SET like_count = like_count + 1 
    WHERE id = p_post_id;
    
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. 사용자 통계 업데이트
```sql
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
      WHERE user_id = p_user_id AND is_completed = true
    )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔔 트리거

### 1. 댓글 수 자동 업데이트
```sql
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

CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_count();
```

### 2. updated_at 자동 갱신
```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 적용
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_posts_modtime
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
```

---

## 📈 인덱스 전략

### 자주 사용하는 쿼리 패턴
```sql
-- 1. 지역별 등산로 검색
-- 인덱스: idx_trails_region

-- 2. 난이도별 필터링
-- 인덱스: idx_trails_difficulty

-- 3. 최신 게시글
-- 인덱스: idx_posts_created_at

-- 4. 인기 게시글
-- 인덱스: idx_posts_hot (복합)

-- 5. 사용자의 산행 기록
-- 인덱스: idx_hikes_user_id (복합)
```

### 복합 인덱스 추가 (필요시)
```sql
-- 지역 + 난이도 필터링
CREATE INDEX idx_trails_region_difficulty 
ON trails(region, difficulty);

-- 카테고리별 최신 게시글
CREATE INDEX idx_posts_category_created 
ON posts(category, created_at DESC);
```

---

## 💾 초기 데이터 삽입

### 공공데이터 임포트 스크립트
```sql
-- trails 테이블에 공공데이터 삽입
INSERT INTO trails (
  name, mountain, region, difficulty, 
  distance, duration, elevation_gain
) VALUES
  ('백운대 정상 코스', '북한산', '서울', '중급', 5.8, 180, 550),
  ('대청봉 오색 코스', '설악산', '강원', '고급', 8.4, 300, 1200),
  ('비로봉 북쪽 코스', '지리산', '전북', '고급', 12.5, 420, 1400);

-- 배치 삽입은 Python 스크립트로 처리
-- (개발 가이드 참조)
```

---

## 다음 문서
- [API 명세](./04_api_specification.md)
- [화면 설계서](./05_screen_design.md)
