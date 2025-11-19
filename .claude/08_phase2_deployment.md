# Phase 2 배포 가이드 - 실시간 & 안전 기능

> ⚠️ **중요**: 이 문서는 Phase 1 MVP 완료 후 진행하세요!

## 📋 Phase 2 개요

### 추가되는 기능
1. **실시간 위치 공유** (WebSocket)
2. **SOS 긴급 연락 시스템**
3. **푸시 알림** (Firebase FCM)
4. **오프라인 지도** (프리미엄)

### 추가 인프라 비용
```
Railway (WebSocket)      $5/월
Redis (Upstash)         $10/월
Firebase FCM            $0 (무료)
Edge Functions          $25/월

총 추가 비용: $40/월
총 비용: $40/월 (Phase 1은 $0)
```

---

## 🚨 배포 환경 먼저 구축! (코드 작성 전 필수)

### ❌ 잘못된 순서
```bash
1. WebSocket 코드 작성
2. Railway 없음
3. 에러 발생
4. Railway 생성 (뒤늦게)
```

### ✅ 올바른 순서
```bash
1. Railway 프로젝트 생성
2. WebSocket 서버 배포
3. URL 확인
4. 클라이언트 코드 작성
```

---

## 🛠️ 1단계: Railway WebSocket 서버

### 1.1 Railway 계정 생성
```bash
1. https://railway.app 접속
2. GitHub 연동
3. New Project
```

### 1.2 WebSocket 서버 코드 작성

```javascript
// server.js
const WebSocket = require('ws');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);
const wss = new WebSocket.Server({ 
  port: process.env.PORT || 8080 
});

const groups = new Map(); // 그룹별 연결 관리

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  let currentGroupId = null;
  let userId = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'join':
          // 그룹 참가
          currentGroupId = data.groupId;
          userId = data.userId;
          
          if (!groups.has(currentGroupId)) {
            groups.set(currentGroupId, new Set());
          }
          groups.get(currentGroupId).add(ws);
          
          // Redis에 저장 (1시간 TTL)
          await redis.setex(
            `group:${currentGroupId}:${userId}`,
            3600,
            JSON.stringify({ 
              userId, 
              joinedAt: Date.now() 
            })
          );
          
          ws.send(JSON.stringify({
            type: 'joined',
            groupId: currentGroupId,
            memberCount: groups.get(currentGroupId).size
          }));
          break;

        case 'location':
          // 위치 업데이트
          if (!currentGroupId || !userId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not joined to any group'
            }));
            return;
          }

          const location = {
            userId,
            lat: data.lat,
            lng: data.lng,
            timestamp: Date.now()
          };
          
          // Redis에 최신 위치 저장 (5분 TTL)
          await redis.setex(
            `location:${currentGroupId}:${userId}`,
            300,
            JSON.stringify(location)
          );
          
          // 같은 그룹에 브로드캐스트
          if (groups.has(currentGroupId)) {
            groups.get(currentGroupId).forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'location',
                  data: location
                }));
              }
            });
          }
          break;

        case 'leave':
          // 그룹 나가기
          if (currentGroupId && groups.has(currentGroupId)) {
            groups.get(currentGroupId).delete(ws);
            await redis.del(`location:${currentGroupId}:${userId}`);
            
            ws.send(JSON.stringify({
              type: 'left',
              groupId: currentGroupId
            }));
          }
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('Message handling error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Internal server error'
      }));
    }
  });

  ws.on('close', async () => {
    console.log('Client disconnected');
    
    // 연결 종료 시 정리
    if (currentGroupId && groups.has(currentGroupId)) {
      groups.get(currentGroupId).delete(ws);
      
      if (userId) {
        await redis.del(`location:${currentGroupId}:${userId}`);
      }
      
      // 그룹이 비었으면 삭제
      if (groups.get(currentGroupId).size === 0) {
        groups.delete(currentGroupId);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Health check endpoint
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  }
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
```

### 1.3 package.json
```json
{
  "name": "hiking-mate-ws",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "ioredis": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 1.4 Railway 배포
```bash
# Railway CLI 설치
npm install -g railway

# 로그인
railway login

# 프로젝트 연결
railway link

# 환경변수 설정
railway variables set PORT=8080
railway variables set REDIS_URL=<Redis URL>

# 배포
railway up

# 배포 후 URL 확인
railway domain
# 예: hiking-mate-ws.railway.app
```

### 1.5 환경변수 설정 (Next.js)
```bash
# .env.local
NEXT_PUBLIC_WS_URL=wss://hiking-mate-ws.railway.app
```

---

## 🔴 2단계: Redis 설정 (Upstash)

### 2.1 Upstash 계정 생성
```bash
1. https://upstash.com 접속
2. GitHub 로그인
3. Create Database
```

### 2.2 Redis 인스턴스 생성
```
Name: hiking-mate-redis
Region: Asia Pacific (Seoul) - 선택!
Type: Regional (권장)
```

### 2.3 Connection String 복사
```bash
# Upstash Console → Database → Connect

Connection String (ioredis):
redis://default:****@*******.upstash.io:6379

# Railway에 환경변수 추가
railway variables set REDIS_URL="redis://..."
```

### 2.4 Redis 연결 테스트
```bash
# Railway Logs 확인
railway logs

# 연결 성공 메시지 확인:
"Redis connected successfully"
```

---

## 🔥 3단계: Firebase FCM 설정

### 3.1 Firebase 프로젝트 생성
```bash
1. https://console.firebase.google.com 접속
2. Add Project
3. 프로젝트 이름: hiking-mate
4. Google Analytics: 활성화 (권장)
5. Create Project
```

### 3.2 Web App 추가
```bash
1. Project Overview → Add app → Web
2. App nickname: hiking-mate-web
3. Firebase SDK snippet 복사
```

### 3.3 Cloud Messaging 설정
```bash
1. Project Settings → Cloud Messaging
2. Web Push certificates → Generate key pair
3. VAPID Key 복사
```

### 3.4 환경변수 설정 (Next.js)
```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hiking-mate.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hiking-mate
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hiking-mate.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNdG...
```

### 3.5 Service Worker 설정
```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSy...",
  authDomain: "hiking-mate.firebaseapp.com",
  projectId: "hiking-mate",
  storageBucket: "hiking-mate.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

### 3.6 FCM 토큰 저장
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    
    // Supabase에 토큰 저장
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && token) {
      await supabase.from('fcm_tokens').upsert({
        user_id: user.id,
        token,
        updated_at: new Date().toISOString()
      });
    }
    
    return token;
  }
  
  return null;
}
```

---

## 📧 4단계: Supabase Edge Functions (SMS)

### 4.1 Supabase CLI 설치
```bash
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref <project-ref>
```

### 4.2 SOS SMS 함수 작성
```typescript
// supabase/functions/send-sos-sms/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { contacts, userName, location, sosLogId } = await req.json();

    // SMS 발송 (예: Twilio, CoolSMS 등)
    // 여기서는 예제로 작성
    const message = `
[하이킹메이트 SOS]
${userName}님이 긴급 상황을 알렸습니다.

위치: ${location.googleMapsUrl}
좌표: ${location.lat}, ${location.lng}
시간: ${new Date().toLocaleString('ko-KR')}

즉시 확인해주세요.
    `.trim();

    // SMS API 호출 (실제 구현 필요)
    for (const phone of contacts) {
      // await sendSMS(phone, message);
      console.log(`SMS sent to ${phone}`);
    }

    return new Response(
      JSON.stringify({ success: true, sentTo: contacts.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4.3 함수 배포
```bash
# 함수 배포
supabase functions deploy send-sos-sms

# 환경변수 설정 (SMS API 키 등)
supabase secrets set SMS_API_KEY=your-api-key

# 함수 로그 확인
supabase functions logs send-sos-sms
```

---

## 🗄️ 5단계: Database 스키마 추가

### 5.1 Phase 2 테이블 생성
```sql
-- 긴급 연락처
CREATE TABLE emergency_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_number text NOT NULL,
  relationship text, -- '가족', '친구', '동료' 등
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- SOS 로그
CREATE TABLE sos_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  location geography(POINT, 4326) NOT NULL,
  status text DEFAULT 'sent', -- 'sent', 'acknowledged', 'resolved'
  created_at timestamptz DEFAULT now()
);

-- FCM 토큰
CREATE TABLE fcm_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- 알림 로그
CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'weather', 'sunset', 'checkin'
  title text,
  body text,
  sent_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX idx_sos_logs_user_id ON sos_logs(user_id);
CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);

-- RLS 정책
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회/수정 가능
CREATE POLICY "Users can manage their own emergency contacts" ON emergency_contacts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own SOS logs" ON sos_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create SOS logs" ON sos_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own FCM tokens" ON fcm_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);
```

---

## ✅ 6단계: 배포 완료 체크리스트

### Railway WebSocket
- [ ] Railway 프로젝트 생성 완료
- [ ] WebSocket 서버 배포 완료
- [ ] 서버 URL 확인: `wss://your-project.railway.app`
- [ ] Health check 정상: `https://your-project.railway.app/health`
- [ ] 로그 확인: `railway logs`

### Redis
- [ ] Upstash Redis 인스턴스 생성
- [ ] Connection String 복사
- [ ] Railway 환경변수 설정
- [ ] Redis 연결 테스트 성공

### Firebase FCM
- [ ] Firebase 프로젝트 생성
- [ ] Web App 추가
- [ ] VAPID Key 생성
- [ ] Next.js 환경변수 설정
- [ ] Service Worker 파일 생성

### Supabase
- [ ] Edge Functions 배포
- [ ] 환경변수 설정 (SMS API)
- [ ] Phase 2 테이블 생성
- [ ] RLS 정책 적용

### Next.js
- [ ] 모든 환경변수 설정
- [ ] Vercel 재배포
- [ ] 빌드 에러 없음
- [ ] 실시간 위치 공유 테스트 성공
- [ ] SOS 버튼 테스트 성공

---

## 🧪 7단계: 기능 테스트

### 실시간 위치 공유 테스트
```bash
1. 두 개의 브라우저/디바이스 준비
2. 같은 그룹 코드로 접속
3. 한 쪽에서 위치 이동
4. 다른 쪽에서 실시간 업데이트 확인
5. 연결 종료 후 재연결 테스트
```

### SOS 기능 테스트
```bash
1. 긴급 연락처 등록
2. SOS 버튼 3초간 누르기
3. 확인 팝업 확인
4. SMS 발송 확인 (연락처에 도착)
5. Supabase sos_logs 테이블 확인
```

### 푸시 알림 테스트
```bash
1. 알림 권한 허용
2. Supabase fcm_tokens 테이블에 토큰 저장 확인
3. Firebase Console에서 테스트 메시지 발송
4. 브라우저에서 알림 수신 확인
```

---

## 💰 비용 모니터링

### Railway
```bash
# 사용량 확인
railway status

# 예상 비용
Hobby Plan: $5/월 (500시간 실행)
```

### Upstash Redis
```bash
# Dashboard에서 확인
https://console.upstash.com

# 사용량
데이터: < 100MB
요청: < 10,000/일
비용: $10/월
```

### Firebase
```bash
# 무료 할당량
FCM 메시지: 무제한
Cloud Functions: 125K 호출/월

# 초과 시 비용 예상
Functions: $0.40/1M 호출
→ 월 1M 호출 시 약 $0.40
```

### 총 비용
```
Railway:         $5/월
Redis:          $10/월
Edge Functions: $25/월
Firebase FCM:    $0/월

합계: $40/월
```

---

## 🚨 주의사항

### 1. WebSocket 연결 안정성
```typescript
// 재연결 로직 구현 필수
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function connect() {
  const ws = new WebSocket(WS_URL);
  
  ws.onclose = () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => {
        reconnectAttempts++;
        connect();
      }, 1000 * reconnectAttempts);
    }
  };
  
  ws.onopen = () => {
    reconnectAttempts = 0;
  };
}
```

### 2. Redis 메모리 관리
```typescript
// TTL 필수 설정
await redis.setex(key, 300, value); // 5분 후 자동 삭제

// 정기적인 정리
setInterval(async () => {
  const keys = await redis.keys('location:*');
  for (const key of keys) {
    const ttl = await redis.ttl(key);
    if (ttl < 0) {
      await redis.del(key);
    }
  }
}, 3600000); // 1시간마다
```

### 3. SOS 오발송 방지
```typescript
// 3초 홀드 + 확인 팝업 필수
const confirmed = window.confirm(
  'SOS 신호를 보내시겠습니까?\n긴급 연락처에 현재 위치가 전송됩니다.'
);

if (!confirmed) {
  return;
}

// 쿨다운 (5분간 재발송 금지)
const lastSOS = localStorage.getItem('last_sos');
if (lastSOS && Date.now() - parseInt(lastSOS) < 300000) {
  alert('잠시 후 다시 시도해주세요.');
  return;
}
```

---

## 📚 다음 단계

- [Phase 3 AI 배포 가이드](./09_phase3_ai_deployment.md)
- [배포 체크리스트](./10_deployment_checklist.md)
- [퀵스타트 가이드](./11_quickstart_guide.md)

---

**Phase 2 배포 완료! 🎉**

이제 실시간 위치 공유와 SOS 기능을 사용할 수 있습니다.
