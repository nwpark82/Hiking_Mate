# 개발 가이드 (Development Guide)

## 🚀 시작하기

### 사전 요구사항
```bash
Node.js: v18 이상
npm: v9 이상
Git
Supabase 계정
Kakao Developers 계정
```

---

## 📦 프로젝트 초기 설정

### 1. Next.js 프로젝트 생성
```bash
# 프로젝트 생성
npx create-next-app@latest hiking-mate

# 선택사항
✔ TypeScript? Yes
✔ ESLint? Yes
✔ Tailwind CSS? Yes
✔ src/ directory? No
✔ App Router? Yes
✔ Import alias? Yes (@/*)

cd hiking-mate
```

### 2. 필수 패키지 설치
```bash
# Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# UI 라이브러리
npm install lucide-react clsx tailwind-merge class-variance-authority

# 폼 관리
npm install react-hook-form zod @hookform/resolvers

# 상태 관리
npm install @tanstack/react-query zustand

# 지도
npm install react-kakao-maps-sdk

# 유틸리티
npm install date-fns nanoid

# PWA
npm install next-pwa

# 개발 도구
npm install -D @types/node
```

### 3. 프로젝트 구조 생성
```bash
mkdir -p app/{(auth),(main)}/
mkdir -p components/{ui,trails,community,record}
mkdir -p lib/{supabase,hooks,utils}
mkdir -p types
mkdir -p public/{images,icons}
```

최종 구조:
```
hiking-mate/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/
│   │   ├── page.tsx              # 홈
│   │   ├── explore/
│   │   ├── record/
│   │   ├── community/
│   │   ├── trails/[id]/
│   │   ├── posts/[id]/
│   │   └── profile/[id]/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui 컴포넌트
│   ├── trails/
│   ├── community/
│   ├── record/
│   └── layout/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useGPS.ts
│   │   └── useTrails.ts
│   └── utils/
│       ├── helpers.ts
│       └── constants.ts
├── types/
│   └── index.ts
├── public/
│   ├── manifest.json
│   └── sw.js
└── ...config files
```

---

## 🔧 환경 설정

### 1. Supabase 프로젝트 생성
```bash
# https://supabase.com 접속
# New Project 생성
# Project URL과 API Keys 복사
```

### 2. 환경변수 설정
```bash
# .env.local 파일 생성
cp .env.example .env.local
```

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

NEXT_PUBLIC_KAKAO_MAP_KEY=your-kakao-map-key

# 개발 환경
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase 클라이언트 설정
```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export const supabase = createClientComponentClient<Database>()
```

```typescript
// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({ cookies })
}
```

### 4. TypeScript 타입 생성
```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 타입 생성
supabase gen types typescript --project-id "your-project-id" > types/supabase.ts
```

---

## 🗄️ 데이터베이스 초기화

### 1. Supabase SQL Editor에서 스키마 생성
```sql
-- 03_database_schema.md의 SQL 복사 후 실행
-- users, trails, hikes, posts, comments 등
```

### 2. RLS (Row Level Security) 활성화
```sql
-- 각 테이블에 대해 RLS 정책 설정
-- 03_database_schema.md 참조
```

### 3. Storage Bucket 생성
```sql
-- Supabase Dashboard > Storage
-- Buckets 생성: profiles, hike-photos, post-images
-- Public access 설정
```

---

## 🎨 UI 컴포넌트 설치

### shadcn/ui 초기화
```bash
npx shadcn-ui@latest init

# 선택사항
✔ TypeScript? Yes
✔ Style: Default
✔ Base color: Slate
✔ CSS variables? Yes
```

### 필요한 컴포넌트 설치
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
```

---

## 🔐 인증 구현

### 1. 인증 Context
```typescript
// lib/hooks/useAuth.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, username: string) => {
    // 1. 회원가입
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })
    if (error) throw error

    // 2. users 테이블에 프로필 생성
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          username,
          email
        })
      if (profileError) throw profileError
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

### 2. 로그인 페이지
```typescript
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      router.push('/')
      toast({ title: '로그인 성공!' })
    } catch (error: any) {
      toast({
        title: '로그인 실패',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-3xl font-bold text-center">하이킹메이트</h1>
        
        <Input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </Button>
        
        <p className="text-center text-sm">
          계정이 없으신가요?{' '}
          <a href="/signup" className="text-primary">회원가입</a>
        </p>
      </form>
    </div>
  )
}
```

---

## 🗺️ 등산로 기능 구현

### 1. 등산로 데이터 훅
```typescript
// lib/hooks/useTrails.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Trail } from '@/types'

interface TrailFilters {
  region?: string
  difficulty?: string[]
  minDistance?: number
  maxDistance?: number
  search?: string
}

export function useTrails(filters: TrailFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['trails', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('trails')
        .select('*')
        .range(pageParam * 20, (pageParam + 1) * 20 - 1)

      // 필터 적용
      if (filters.region) {
        query = query.eq('region', filters.region)
      }
      if (filters.difficulty?.length) {
        query = query.in('difficulty', filters.difficulty)
      }
      if (filters.minDistance) {
        query = query.gte('distance', filters.minDistance)
      }
      if (filters.maxDistance) {
        query = query.lte('distance', filters.maxDistance)
      }
      if (filters.search) {
        query = query.textSearch('search_vector', filters.search)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Trail[]
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 20 ? pages.length : undefined
  })
}

export function useTrail(id: string) {
  return useQuery({
    queryKey: ['trail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trails')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      // 조회수 증가
      await supabase.rpc('increment_view_count', { trail_id: id })
      
      return data as Trail
    }
  })
}

export function useNearbyTrails(location: { lat: number; lng: number } | null) {
  return useQuery({
    queryKey: ['nearby-trails', location],
    queryFn: async () => {
      if (!location) return []
      
      const { data, error } = await supabase
        .from('trails')
        .select('*')
        .gte('start_latitude', location.lat - 0.1)
        .lte('start_latitude', location.lat + 0.1)
        .gte('start_longitude', location.lng - 0.1)
        .lte('start_longitude', location.lng + 0.1)
        .limit(10)
      
      if (error) throw error
      return data as Trail[]
    },
    enabled: !!location
  })
}
```

### 2. 등산로 카드 컴포넌트
```typescript
// components/trails/TrailCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { Trail } from '@/types'

interface TrailCardProps {
  trail: Trail
}

export function TrailCard({ trail }: TrailCardProps) {
  return (
    <Link href={`/trails/${trail.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4">
        <div className="flex gap-4">
          <Image
            src={trail.thumbnail || '/images/default-mountain.jpg'}
            alt={trail.name}
            width={80}
            height={80}
            className="rounded-lg object-cover"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{trail.name}</h3>
            <p className="text-gray-600 text-sm">{trail.mountain}</p>
            
            <div className="flex gap-3 mt-2 text-sm text-gray-500">
              <span>📏 {trail.distance}km</span>
              <span>⏱️ {Math.floor(trail.duration / 60)}시간</span>
              <span>📈 {trail.elevation_gain}m</span>
            </div>
            
            <div className="flex gap-1 mt-2 flex-wrap">
              <Badge variant="secondary">{trail.difficulty}</Badge>
              {trail.features?.slice(0, 2).map(feature => (
                <Badge key={feature} variant="outline">{feature}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

---

## 📍 GPS 트래킹 구현

### 1. GPS 훅
```typescript
// lib/hooks/useGPS.ts
import { useState, useEffect, useCallback } from 'react'

interface GPSPoint {
  latitude: number
  longitude: number
  altitude: number | null
  accuracy: number
  timestamp: number
}

export function useGPSTracking() {
  const [isTracking, setIsTracking] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<GPSPoint | null>(null)
  const [path, setPath] = useState<GPSPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isTracking) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point: GPSPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        }

        // 정확도 필터 (30m 이하만)
        if (point.accuracy <= 30) {
          setCurrentPosition(point)
          setPath(prev => [...prev, point])
        }
      },
      (err) => {
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [isTracking])

  const startTracking = useCallback(() => {
    setIsTracking(true)
    setPath([])
    setError(null)
  }, [])

  const pauseTracking = useCallback(() => {
    setIsTracking(false)
  }, [])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
    return { path, stats: calculateStats(path) }
  }, [path])

  return {
    isTracking,
    currentPosition,
    path,
    error,
    startTracking,
    pauseTracking,
    stopTracking
  }
}

function calculateStats(path: GPSPoint[]) {
  if (path.length < 2) return null

  const distance = calculateTotalDistance(path)
  const duration = path[path.length - 1].timestamp - path[0].timestamp
  
  return {
    distance,
    duration,
    avgSpeed: distance / (duration / 3600000), // km/h
    maxAltitude: Math.max(...path.map(p => p.altitude || 0))
  }
}

function calculateTotalDistance(path: GPSPoint[]): number {
  let total = 0
  for (let i = 1; i < path.length; i++) {
    total += haversineDistance(
      path[i - 1].latitude,
      path[i - 1].longitude,
      path[i].latitude,
      path[i].longitude
    )
  }
  return total
}

// Haversine formula
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
```

### 2. IndexedDB 저장
```typescript
// lib/utils/indexedDB.ts
import { openDB, DBSchema } from 'idb'

interface HikingMateDB extends DBSchema {
  'gps-points': {
    key: string
    value: {
      hikeId: string
      latitude: number
      longitude: number
      altitude: number | null
      accuracy: number
      timestamp: number
    }
  }
  hikes: {
    key: string
    value: {
      id: string
      trailId: string
      startedAt: string
      path: any[]
      photos: string[]
    }
  }
}

export async function getDB() {
  return openDB<HikingMateDB>('hiking-mate', 1, {
    upgrade(db) {
      db.createObjectStore('gps-points', { keyPath: 'timestamp' })
      db.createObjectStore('hikes', { keyPath: 'id' })
    }
  })
}

export async function saveGPSPoint(hikeId: string, point: any) {
  const db = await getDB()
  await db.add('gps-points', { hikeId, ...point })
}

export async function getHikeGPSPoints(hikeId: string) {
  const db = await getDB()
  const allPoints = await db.getAll('gps-points')
  return allPoints.filter(p => p.hikeId === hikeId)
}
```

---

## 💬 커뮤니티 기능 구현

### 1. 게시글 훅
```typescript
// lib/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Post } from '@/types'

export function usePosts(category?: string) {
  return useInfiniteQuery({
    queryKey: ['posts', category],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(username, profile_image),
          trail:trails(name, mountain)
        `)
        .order('created_at', { ascending: false })
        .range(pageParam * 20, (pageParam + 1) * 20 - 1)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Post[]
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 20 ? pages.length : undefined
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (post: Partial<Post>) => {
      const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts'])
    }
  })
}

export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.rpc('toggle_like', {
        p_post_id: postId
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts'])
    }
  })
}
```

---

## 📸 이미지 업로드 구현

```typescript
// lib/utils/uploadImage.ts
import { supabase } from '@/lib/supabase/client'
import { nanoid } from 'nanoid'

export async function uploadImage(
  file: File,
  bucket: 'profiles' | 'hike-photos' | 'post-images'
): Promise<string> {
  // 1. 파일 압축 (선택적)
  const compressed = await compressImage(file)
  
  // 2. 고유 파일명 생성
  const ext = file.name.split('.').pop()
  const fileName = `${nanoid()}.${ext}`
  
  // 3. 업로드
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, compressed, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  // 4. 공개 URL 반환
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)
  
  return publicUrl
}

async function compressImage(file: File): Promise<Blob> {
  // Canvas API로 이미지 압축
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // 최대 크기 제한
        const maxSize = 1200
        let width = img.width
        let height = img.height
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          resolve(blob!)
        }, 'image/jpeg', 0.8)
      }
    }
  })
}
```

---

## 🗺️ Kakao Map 통합

### 1. Map 컴포넌트
```typescript
// components/KakaoMap.tsx
'use client'

import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk'

interface KakaoMapProps {
  center: { lat: number; lng: number }
  trails?: Trail[]
  path?: { lat: number; lng: number }[]
  currentPosition?: { lat: number; lng: number }
}

export function KakaoMap({ center, trails, path, currentPosition }: KakaoMapProps) {
  return (
    <Map
      center={center}
      style={{ width: '100%', height: '100%' }}
      level={5}
    >
      {/* 등산로 마커 */}
      {trails?.map(trail => (
        <MapMarker
          key={trail.id}
          position={{
            lat: trail.start_latitude,
            lng: trail.start_longitude
          }}
          onClick={() => window.location.href = `/trails/${trail.id}`}
        />
      ))}
      
      {/* 경로 라인 */}
      {path && (
        <Polyline
          path={path}
          strokeWeight={5}
          strokeColor="#22c55e"
          strokeOpacity={0.8}
        />
      )}
      
      {/* 현재 위치 */}
      {currentPosition && (
        <MapMarker
          position={currentPosition}
          image={{
            src: '/icons/current-location.png',
            size: { width: 30, height: 30 }
          }}
        />
      )}
    </Map>
  )
}
```

---

## 📱 PWA 설정

### 1. next.config.js
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['xxx.supabase.co']
  }
})
```

### 2. manifest.json
```json
{
  "name": "하이킹메이트",
  "short_name": "하이킹메이트",
  "description": "등산로 정보와 커뮤니티",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🧪 개발 팁

### 1. React Query DevTools
```typescript
// app/layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

### 2. 에러 바운더리
```typescript
// components/ErrorBoundary.tsx
'use client'

import { useEffect } from 'react'

export function ErrorBoundary({ error, reset }: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">문제가 발생했습니다</h2>
      <button onClick={reset} className="btn-primary">
        다시 시도
      </button>
    </div>
  )
}
```

---

## 🐛 디버깅

### 자주 발생하는 오류

#### 1. Supabase 연결 오류
```bash
# 환경변수 확인
echo $NEXT_PUBLIC_SUPABASE_URL

# .env.local 재시작
npm run dev
```

#### 2. GPS 권한 오류
```typescript
// HTTPS 필수 (localhost 제외)
// Vercel 배포 후 테스트
```

#### 3. hydration 에러
```typescript
// 클라이언트 전용 컴포넌트는 'use client' 명시
// dynamic import 사용

import dynamic from 'next/dynamic'
const Map = dynamic(() => import('./Map'), { ssr: false })
```

---

## 🔴 Phase 2: 실시간 & 안전 기능 개발

> ⚠️ **중요**: Phase 2 코드 작성 전 [08_phase2_deployment.md](./08_phase2_deployment.md)를 먼저 읽고 배포 환경을 구축하세요!

### 배포 환경 준비 필수

```bash
Phase 2 개발 시작 전 체크리스트:

□ Railway 프로젝트 생성 및 WebSocket 서버 배포
□ Redis (Upstash) 인스턴스 생성
□ Firebase 프로젝트 생성 및 FCM 설정
□ Supabase Edge Functions 설정
□ 환경변수 모두 설정 완료

→ 08_phase2_deployment.md 참조
→ 10_deployment_checklist.md 확인
```

### Phase 2 주요 기능
1. WebSocket 실시간 위치 공유 (Railway)
2. SOS 긴급 연락 시스템
3. Firebase FCM 푸시 알림
4. 오프라인 지도 다운로드

자세한 구현 방법은 **08_phase2_deployment.md**를 참조하세요.

---

## 🤖 Phase 3: AI 기능 개발

> ⚠️ **매우 중요**: Phase 3 코드 작성 전 [09_phase3_ai_deployment.md](./09_phase3_ai_deployment.md)를 먼저 읽고 비용 제한을 설정하세요!

### 배포 환경 준비 필수

```bash
Phase 3 개발 시작 전 체크리스트:

□ OpenAI API 키 발급
□ OpenAI 비용 제한 설정 ($100/월) ← 매우 중요!
□ Pinecone 계정 생성 및 인덱스 생성
□ Embedding API 설정
□ Redis 캐싱 설정 (응답 캐싱)
□ 환경변수 모두 설정 완료

→ 09_phase3_ai_deployment.md 참조
→ 10_deployment_checklist.md 확인
```

### Phase 3 주요 기능
1. Pinecone Vector DB 구축 (RAG)
2. AI 등산 가이드 챗봇 (GPT-4)
3. 개인화 추천 시스템
4. 토큰 사용량 모니터링

자세한 구현 방법은 **09_phase3_ai_deployment.md**를 참조하세요.

---

## 다음 문서
- [배포 가이드](./07_deployment_guide.md)
- [Phase 2 배포 가이드](./08_phase2_deployment.md)
- [Phase 3 AI 배포 가이드](./09_phase3_ai_deployment.md)
- [배포 체크리스트](./10_deployment_checklist.md)
