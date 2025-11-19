# API 명세서 (API Specification)

## 📡 API 개요

### 기본 정보
- **Backend**: Supabase (PostgreSQL + REST API 자동 생성)
- **인증**: JWT (Supabase Auth)
- **프로토콜**: HTTPS
- **데이터 포맷**: JSON

### Base URL
```
Production: https://[PROJECT_ID].supabase.co
Local Dev: http://localhost:54321
```

### 인증 헤더
```typescript
// Supabase 클라이언트가 자동으로 처리
headers: {
  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${session.access_token}` // 로그인 시
}
```

---

## 🔐 인증 (Authentication)

### 1. 회원가입
```typescript
// POST /auth/v1/signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123!',
  options: {
    data: {
      username: '등산왕김등산'
    }
  }
})

// Response
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-11-17T00:00:00Z"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  }
}
```

### 2. 로그인
```typescript
// POST /auth/v1/token?grant_type=password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123!'
})

// Response: 동일
```

### 3. 로그아웃
```typescript
// POST /auth/v1/logout
const { error } = await supabase.auth.signOut()
```

### 4. 세션 확인
```typescript
// GET /auth/v1/user
const { data: { user } } = await supabase.auth.getUser()
```

---

## 👤 사용자 (Users)

### 1. 프로필 조회
```typescript
// GET /rest/v1/users?id=eq.{userId}
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// Response
{
  "id": "uuid",
  "username": "등산왕김등산",
  "email": "user@example.com",
  "profile_image": "https://...",
  "bio": "주말마다 산에 갑니다",
  "total_distance": 145.3,
  "total_duration": 2340,
  "total_mountains": 23,
  "level": 3,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 2. 프로필 수정
```typescript
// PATCH /rest/v1/users?id=eq.{userId}
const { data, error } = await supabase
  .from('users')
  .update({
    username: '새이름',
    bio: '새로운 소개',
    profile_image: 'new-url'
  })
  .eq('id', userId)
  .select()

// Response: 수정된 데이터
```

### 3. 사용자 검색
```typescript
// GET /rest/v1/users?username=ilike.%{query}%
const { data, error } = await supabase
  .from('users')
  .select('id, username, profile_image')
  .ilike('username', `%${query}%`)
  .limit(10)

// Response: 사용자 배열
```

---

## ⛰️ 등산로 (Trails)

### 1. 등산로 목록 조회
```typescript
// GET /rest/v1/trails
const { data, error } = await supabase
  .from('trails')
  .select('*')
  .order('view_count', { ascending: false })
  .range(0, 19) // 페이지네이션: 0-19 (20개)

// Query Parameters
interface TrailsQuery {
  region?: string           // 지역 필터
  difficulty?: string       // 난이도 필터
  min_distance?: number     // 최소 거리
  max_distance?: number     // 최대 거리
  search?: string          // 검색어
  sort?: 'popular' | 'distance' | 'difficulty'
  page?: number
  limit?: number
}

// 예: 서울 지역, 초급 난이도, 5km 이하
const { data } = await supabase
  .from('trails')
  .select('*')
  .eq('region', '서울')
  .eq('difficulty', '초급')
  .lte('distance', 5)
  .limit(20)

// Response
[
  {
    "id": "uuid",
    "name": "백운대 정상 코스",
    "mountain": "북한산",
    "region": "서울",
    "difficulty": "중급",
    "distance": 5.8,
    "duration": 180,
    "elevation_gain": 550,
    "features": ["단풍명소", "조망좋음"],
    "health_benefits": ["심폐지구력"],
    "view_count": 1234,
    "like_count": 56
  }
]
```

### 2. 등산로 상세 조회
```typescript
// GET /rest/v1/trails?id=eq.{trailId}
const { data, error } = await supabase
  .from('trails')
  .select(`
    *,
    favorites:favorites(count)
  `)
  .eq('id', trailId)
  .single()

// 조회수 증가 (별도 호출)
await supabase.rpc('increment_view_count', { 
  trail_id: trailId 
})

// Response: 상세 정보 + 즐겨찾기 수
```

### 3. 등산로 검색
```typescript
// Full Text Search
const { data, error } = await supabase
  .from('trails')
  .select('*')
  .textSearch('search_vector', query, {
    type: 'websearch',
    config: 'simple'
  })
  .limit(20)

// 예: "북한산 단풍" 검색
// Response: 관련 등산로 배열
```

### 4. 지도 범위 내 등산로
```typescript
// 위도/경도 범위로 조회
const { data, error } = await supabase
  .from('trails')
  .select('id, name, mountain, start_latitude, start_longitude')
  .gte('start_latitude', minLat)
  .lte('start_latitude', maxLat)
  .gte('start_longitude', minLng)
  .lte('start_longitude', maxLng)
```

---

## 📝 산행 기록 (Hikes)

### 1. 산행 시작
```typescript
// POST /rest/v1/hikes
const { data, error } = await supabase
  .from('hikes')
  .insert({
    user_id: userId,
    trail_id: trailId,
    started_at: new Date().toISOString(),
    is_completed: false
  })
  .select()
  .single()

// Response: 생성된 산행 기록
{
  "id": "uuid",
  "user_id": "uuid",
  "trail_id": "uuid",
  "started_at": "2024-11-17T09:00:00Z",
  "is_completed": false
}
```

### 2. GPS 데이터 저장 (로컬)
```typescript
// IndexedDB에 먼저 저장 (네트워크 부하 최소화)
const db = await openDB('hiking-mate', 1)
await db.add('gps-points', {
  hikeId: 'uuid',
  latitude: 37.6599,
  longitude: 126.9783,
  altitude: 120,
  timestamp: Date.now(),
  accuracy: 10
})
```

### 3. 산행 완료
```typescript
// PATCH /rest/v1/hikes?id=eq.{hikeId}
const { data, error } = await supabase
  .from('hikes')
  .update({
    is_completed: true,
    completed_at: new Date().toISOString(),
    distance: calculatedDistance,
    duration: calculatedDuration,
    gpx_data: gpsPoints, // IndexedDB → Supabase
    photos: photoUrls,
    notes: userNotes
  })
  .eq('id', hikeId)
  .select()

// 사용자 통계 업데이트 (RPC 호출)
await supabase.rpc('update_user_stats', { 
  p_user_id: userId 
})
```

### 4. 내 산행 기록 조회
```typescript
// GET /rest/v1/hikes?user_id=eq.{userId}
const { data, error } = await supabase
  .from('hikes')
  .select(`
    *,
    trail:trails(name, mountain)
  `)
  .eq('user_id', userId)
  .order('completed_at', { ascending: false })
  .limit(20)

// Response
[
  {
    "id": "uuid",
    "distance": 5.8,
    "duration": 180,
    "completed_at": "2024-11-16T14:30:00Z",
    "photos": ["url1", "url2"],
    "trail": {
      "name": "백운대 정상 코스",
      "mountain": "북한산"
    }
  }
]
```

### 5. 산행 기록 삭제
```typescript
// DELETE /rest/v1/hikes?id=eq.{hikeId}
const { error } = await supabase
  .from('hikes')
  .delete()
  .eq('id', hikeId)
  .eq('user_id', userId) // 본인 확인
```

---

## 💬 커뮤니티 (Posts & Comments)

### 1. 게시글 목록 조회
```typescript
// GET /rest/v1/posts
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    user:users(username, profile_image),
    trail:trails(name, mountain),
    is_liked:likes!inner(user_id)
  `)
  .order('created_at', { ascending: false })
  .range(0, 19)

// 카테고리 필터
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('category', '후기')
  .limit(20)

// Response
[
  {
    "id": "uuid",
    "title": "북한산 단풍 미쳤습니다",
    "content": "어제 다녀왔는데...",
    "images": ["url1", "url2"],
    "like_count": 23,
    "comment_count": 5,
    "created_at": "2024-11-16T20:00:00Z",
    "user": {
      "username": "등산왕김등산",
      "profile_image": "url"
    },
    "trail": {
      "name": "백운대 정상 코스",
      "mountain": "북한산"
    }
  }
]
```

### 2. 게시글 작성
```typescript
// POST /rest/v1/posts
const { data, error } = await supabase
  .from('posts')
  .insert({
    user_id: userId,
    trail_id: trailId, // 선택적
    category: '후기',
    title: '제목',
    content: '내용',
    images: ['url1', 'url2']
  })
  .select()
  .single()

// Response: 생성된 게시글
```

### 3. 게시글 수정
```typescript
// PATCH /rest/v1/posts?id=eq.{postId}
const { data, error } = await supabase
  .from('posts')
  .update({
    title: '수정된 제목',
    content: '수정된 내용'
  })
  .eq('id', postId)
  .eq('user_id', userId) // 본인 확인
  .select()
```

### 4. 게시글 삭제
```typescript
// DELETE /rest/v1/posts?id=eq.{postId}
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
  .eq('user_id', userId)
```

### 5. 좋아요 토글
```typescript
// RPC: toggle_like
const { data, error } = await supabase.rpc('toggle_like', {
  p_post_id: postId
})

// Response
true  // 좋아요 추가됨
false // 좋아요 취소됨
```

### 6. 댓글 조회
```typescript
// GET /rest/v1/comments?post_id=eq.{postId}
const { data, error } = await supabase
  .from('comments')
  .select(`
    *,
    user:users(username, profile_image)
  `)
  .eq('post_id', postId)
  .order('created_at', { ascending: true })

// Response
[
  {
    "id": "uuid",
    "content": "저도 갔었는데 정말 좋았어요!",
    "created_at": "2024-11-16T21:00:00Z",
    "user": {
      "username": "산악인",
      "profile_image": "url"
    }
  }
]
```

### 7. 댓글 작성
```typescript
// POST /rest/v1/comments
const { data, error } = await supabase
  .from('comments')
  .insert({
    post_id: postId,
    user_id: userId,
    content: '댓글 내용'
  })
  .select(`
    *,
    user:users(username, profile_image)
  `)
  .single()

// 트리거가 자동으로 post.comment_count 증가
```

---

## 🤝 모임 (Meetups)

### 1. 모임 목록 조회
```typescript
// GET /rest/v1/meetups
const { data, error } = await supabase
  .from('meetups')
  .select(`
    *,
    user:users(username, profile_image),
    trail:trails(name, mountain, difficulty)
  `)
  .eq('status', 'recruiting')
  .gte('meet_date', new Date().toISOString().split('T')[0])
  .order('meet_date', { ascending: true })

// Response
[
  {
    "id": "uuid",
    "title": "이번 주 토요일 북한산 같이 가실 분",
    "meet_date": "2024-11-23",
    "meet_time": "07:00:00",
    "max_participants": 6,
    "contact_info": "https://open.kakao.com/...",
    "user": {
      "username": "등산모임장"
    },
    "trail": {
      "name": "백운대 정상 코스",
      "mountain": "북한산"
    }
  }
]
```

### 2. 모임 생성
```typescript
// POST /rest/v1/meetups
const { data, error } = await supabase
  .from('meetups')
  .insert({
    user_id: userId,
    trail_id: trailId,
    title: '모임 제목',
    description: '상세 설명',
    meet_date: '2024-11-23',
    meet_time: '07:00:00',
    max_participants: 6,
    contact_method: 'openchat',
    contact_info: 'https://open.kakao.com/...'
  })
  .select()
```

---

## 🖼️ 파일 업로드 (Storage)

### Bucket 구조
```
storage/
├─ profiles/        # 프로필 이미지
├─ hike-photos/     # 산행 사진
└─ post-images/     # 게시글 이미지
```

### 1. 이미지 업로드
```typescript
// POST /storage/v1/object/{bucket}/{path}
const file = event.target.files[0]
const fileExt = file.name.split('.').pop()
const fileName = `${userId}/${Date.now()}.${fileExt}`

const { data, error } = await supabase.storage
  .from('post-images')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  })

// Response
{
  "path": "uuid/1234567890.jpg"
}

// 공개 URL 생성
const { data: { publicUrl } } = supabase.storage
  .from('post-images')
  .getPublicUrl(fileName)
```

### 2. 이미지 리사이징 (Edge Function - 선택적)
```typescript
// Supabase Edge Function으로 자동 리사이징
// 업로드 시 thumbnail, medium, large 생성

// 업로드 시 transform 옵션 사용
const { data } = await supabase.storage
  .from('post-images')
  .upload(fileName, file, {
    transform: {
      width: 800,
      height: 600,
      resize: 'contain'
    }
  })
```

### 3. 이미지 삭제
```typescript
// DELETE /storage/v1/object/{bucket}/{path}
const { error } = await supabase.storage
  .from('post-images')
  .remove([fileName])
```

---

## 🔔 실시간 구독 (Realtime)

### 1. 새 댓글 실시간 구독
```typescript
// WebSocket 연결
const channel = supabase
  .channel('comments')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'comments',
      filter: `post_id=eq.${postId}`
    },
    (payload) => {
      console.log('새 댓글:', payload.new)
      // UI 업데이트
    }
  )
  .subscribe()

// 구독 해제
channel.unsubscribe()
```

### 2. 좋아요 실시간 업데이트
```typescript
const channel = supabase
  .channel('likes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, DELETE
      schema: 'public',
      table: 'likes',
      filter: `post_id=eq.${postId}`
    },
    (payload) => {
      // 좋아요 수 업데이트
    }
  )
  .subscribe()
```

---

## 🔧 RPC (Remote Procedure Call)

### 1. 조회수 증가
```typescript
// SQL Function
CREATE OR REPLACE FUNCTION increment_view_count(trail_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE trails SET view_count = view_count + 1 WHERE id = trail_id;
END;
$$ LANGUAGE plpgsql;

// 클라이언트 호출
await supabase.rpc('increment_view_count', { 
  trail_id: 'uuid' 
})
```

### 2. 사용자 통계 업데이트
```typescript
// update_user_stats 함수 (DB 스키마 참조)
await supabase.rpc('update_user_stats', {
  p_user_id: userId
})
```

### 3. 거리 계산
```typescript
// 두 지점 간 거리 계산 (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION, 
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, 
  lng2 DOUBLE PRECISION
)
RETURNS FLOAT AS $$
-- Haversine formula
$$ LANGUAGE plpgsql;

// 호출
const { data } = await supabase.rpc('calculate_distance', {
  lat1: 37.6599,
  lng1: 126.9783,
  lat2: 37.6700,
  lng2: 126.9800
})
```

---

## 🚦 에러 처리

### 공통 에러 코드
```typescript
interface SupabaseError {
  message: string
  code: string
  details?: string
  hint?: string
}

// 주요 에러 코드
const ERROR_CODES = {
  '23505': 'Unique violation (중복)',
  '23503': 'Foreign key violation',
  '42501': 'Insufficient privilege (권한 없음)',
  '42P01': 'Undefined table',
  'PGRST116': 'Row not found'
}

// 에러 처리 예제
const { data, error } = await supabase
  .from('posts')
  .insert(newPost)

if (error) {
  if (error.code === '23505') {
    console.error('이미 존재하는 데이터입니다')
  } else if (error.code === '42501') {
    console.error('권한이 없습니다')
  } else {
    console.error('알 수 없는 오류:', error.message)
  }
}
```

---

## 📊 페이지네이션

### Offset 방식
```typescript
const page = 0
const limit = 20

const { data, error, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range(page * limit, (page + 1) * limit - 1)

// count: 전체 게시글 수
// 총 페이지: Math.ceil(count / limit)
```

### Cursor 방식 (무한 스크롤)
```typescript
const { data } = await supabase
  .from('posts')
  .select('*')
  .lt('created_at', lastPostCreatedAt) // 마지막 게시글 시간보다 이전
  .order('created_at', { ascending: false })
  .limit(20)
```

---

## 🔍 검색 최적화

### 1. 단순 필터링
```typescript
// LIKE 검색 (느림)
const { data } = await supabase
  .from('trails')
  .select('*')
  .ilike('name', `%${query}%`)
```

### 2. Full Text Search (권장)
```typescript
// 빠른 검색 (GIN 인덱스)
const { data } = await supabase
  .from('trails')
  .select('*')
  .textSearch('search_vector', query)
```

---

## 🛡️ 보안 정책

### API Key 종류
```typescript
// 1. Anon Key (공개 가능)
// - 클라이언트에서 사용
// - RLS 정책 적용됨

// 2. Service Role Key (비밀)
// - 서버 사이드만 사용
// - RLS 우회 가능
// - 절대 클라이언트에 노출 금지!
```

### RLS 정책 확인
```sql
-- 현재 사용자로 접근 테스트
SELECT * FROM posts WHERE auth.uid() = user_id;

-- 익명 사용자로 접근 테스트
SET ROLE anon;
SELECT * FROM posts; -- 공개 게시글만 조회됨
```

---

## 다음 문서
- [화면 설계서](./05_screen_design.md)
- [개발 가이드](./06_development_guide.md)
