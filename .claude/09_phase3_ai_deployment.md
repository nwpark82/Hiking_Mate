# Phase 3 AI 배포 가이드 - AI 챗봇 & 개인화

> ⚠️ **매우 중요**: OpenAI API 비용 폭탄을 방지하기 위해 반드시 비용 제한을 먼저 설정하세요!

## 📋 Phase 3 개요

### 추가되는 기능
1. **AI 등산 가이드 챗봇** (GPT-4 Turbo)
2. **RAG 기반 지식 베이스** (Pinecone)
3. **개인화 추천 시스템**
4. **이미지 분석** (선택)

### 추가 인프라 비용
```
OpenAI API          $100/월 (하루 1,000회 대화)
Pinecone            $70/월 (Starter, 100K 벡터)
Embedding API       $20/월
Redis 확장          $20/월 (응답 캐싱)

총 추가 비용: $210/월

비용 절감 후: $120-150/월
- 캐싱으로 30% 절감
- 토큰 최적화
- 프리미엄 사용자 우선
```

---

## 🚨 1단계: OpenAI API 비용 제한 설정 (가장 중요!)

### ❌ 절대 하지 말아야 할 것
```bash
1. 비용 제한 없이 API 키 발급
2. 무제한 사용자 접근
3. 캐싱 없이 매번 API 호출
4. 컨텍스트 최적화 없음

→ 결과: 며칠 만에 $1,000+ 청구!
```

### ✅ 올바른 순서
```bash
1. OpenAI 계정 생성
2. 결제 수단 등록
3. 비용 제한 먼저 설정 ($100/월)
4. API 키 발급
5. 코드 작성
```

---

## 💳 OpenAI 계정 설정

### 1.1 계정 생성 및 결제
```bash
1. https://platform.openai.com 접속
2. Sign Up
3. Settings → Billing → Add payment method
4. 신용카드 등록
```

### 1.2 비용 제한 설정 (필수!)
```bash
1. Settings → Limits
2. Hard limit: $100/month 설정
3. Email notifications:
   - $50 도달 시 알림
   - $80 도달 시 알림
   - $100 도달 시 API 자동 중지
4. Save
```

### 1.3 API 키 발급
```bash
1. API keys → Create new secret key
2. Name: hiking-mate-production
3. 키 복사 (한 번만 표시됨!)
4. 안전한 곳에 저장
```

### 1.4 사용량 모니터링 설정
```bash
1. Settings → Usage
2. View API usage 확인
3. 일일 사용량 확인 습관화

매일 확인 권장:
- Total requests
- Total tokens
- Cost
```

---

## 📊 2단계: Pinecone Vector DB 설정

### 2.1 Pinecone 계정 생성
```bash
1. https://app.pinecone.io 접속
2. Sign Up (Google 로그인 가능)
3. Start Free → Starter Plan ($70/월)
```

### 2.2 인덱스 생성
```bash
1. Create Index 클릭
2. 설정:
   Name: hiking-mate
   Dimensions: 1536
   Metric: cosine
   Pod Type: p1.x1 (Starter)
3. Create Index
```

### 2.3 API 키 확인
```bash
1. API Keys 탭
2. Environment: us-east-1-aws (또는 선택한 리전)
3. API Key 복사
```

### 2.4 환경변수 설정
```bash
# .env.local
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=hiking-mate
```

---

## 🗄️ 3단계: 데이터 임베딩

### 3.1 임베딩 스크립트 작성
```typescript
// scripts/embed-trails.ts
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

const pinecone = new Pinecone({ 
  apiKey: process.env.PINECONE_API_KEY 
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function embedTrails() {
  const index = pinecone.index('hiking-mate');
  
  // 등산로 데이터 가져오기 (배치 처리)
  let offset = 0;
  const batchSize = 100;
  let totalEmbedded = 0;

  while (true) {
    const { data: trails, error } = await supabase
      .from('trails')
      .select('*')
      .range(offset, offset + batchSize - 1);

    if (error || !trails || trails.length === 0) break;

    // 배치 임베딩
    const embeddings = [];
    
    for (const trail of trails) {
      // 텍스트 생성
      const text = `
등산로: ${trail.name}
지역: ${trail.region}
난이도: ${trail.difficulty} (1-5)
거리: ${trail.distance}km
소요시간: ${trail.duration}시간
최고 고도: ${trail.elevation}m
설명: ${trail.description}
볼거리: ${trail.attractions || '없음'}
건강효과: ${trail.health_benefits || '일반적인 등산 효과'}
계절 추천: ${trail.best_season || '사계절'}
      `.trim();

      try {
        // 임베딩 생성
        const embedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text
        });

        embeddings.push({
          id: `trail-${trail.id}`,
          values: embedding.data[0].embedding,
          metadata: {
            trail_id: trail.id,
            name: trail.name,
            region: trail.region,
            difficulty: trail.difficulty,
            distance: trail.distance,
            duration: trail.duration,
            elevation: trail.elevation,
            description: trail.description.substring(0, 500) // 메타데이터 크기 제한
          }
        });

        console.log(`✓ ${trail.name} 임베딩 생성`);
        
        // Rate limit 방지 (초당 3건)
        await new Promise(resolve => setTimeout(resolve, 350));
        
      } catch (error) {
        console.error(`✗ ${trail.name} 임베딩 실패:`, error);
      }
    }

    // Pinecone에 업로드 (배치)
    if (embeddings.length > 0) {
      await index.upsert(embeddings);
      totalEmbedded += embeddings.length;
      console.log(`📤 ${embeddings.length}개 업로드 완료 (총 ${totalEmbedded}개)`);
    }

    offset += batchSize;
  }

  console.log(`\n✅ 총 ${totalEmbedded}개 등산로 임베딩 완료`);
  
  // 인덱스 통계 확인
  const stats = await index.describeIndexStats();
  console.log('인덱스 통계:', stats);
}

// 실행
embedTrails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('에러:', error);
    process.exit(1);
  });
```

### 3.2 package.json 스크립트 추가
```json
{
  "scripts": {
    "embed:trails": "tsx scripts/embed-trails.ts"
  },
  "devDependencies": {
    "tsx": "^4.7.0"
  }
}
```

### 3.3 임베딩 실행
```bash
# 환경변수 로드 후 실행
npm run embed:trails

# 예상 소요 시간
1,000개 등산로: 약 6-10분
비용: 약 $0.50-1.00

# 진행 상황 확인
✓ 북한산 둘레길 임베딩 생성
✓ 관악산 등산로 임베딩 생성
...
📤 100개 업로드 완료 (총 100개)
✅ 총 1,000개 등산로 임베딩 완료
```

---

## 🤖 4단계: RAG 파이프라인 구현

### 4.1 RAG 라이브러리 설정
```typescript
// lib/ai/rag.ts
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { Redis } from 'ioredis';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

const pinecone = new Pinecone({ 
  apiKey: process.env.PINECONE_API_KEY 
});

const redis = new Redis(process.env.REDIS_URL!);

export async function askAI(
  question: string, 
  userId: string
): Promise<{
  answer: string;
  sources: string[];
  tokensUsed: number;
  cached: boolean;
}> {
  // 1. 캐시 확인
  const cacheKey = `ai:${question.toLowerCase().trim()}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    const result = JSON.parse(cached);
    return { ...result, cached: true };
  }

  // 2. 질문 임베딩
  const questionEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question
  });

  // 3. Pinecone에서 유사한 문서 검색
  const index = pinecone.index('hiking-mate');
  const queryResponse = await index.query({
    vector: questionEmbedding.data[0].embedding,
    topK: 5,
    includeMetadata: true
  });

  // 4. 검색된 문서로 컨텍스트 생성
  const contexts = queryResponse.matches
    .filter((match: any) => match.score > 0.7) // 유사도 필터링
    .map((match: any, idx: number) => {
      const meta = match.metadata;
      return `
[등산로 ${idx + 1}]
이름: ${meta.name}
지역: ${meta.region}
난이도: ${'★'.repeat(meta.difficulty)}${'☆'.repeat(5 - meta.difficulty)}
거리: ${meta.distance}km (약 ${meta.duration}시간)
고도: ${meta.elevation}m
설명: ${meta.description}
      `.trim();
    })
    .join('\n\n---\n\n');

  if (!contexts) {
    return {
      answer: '죄송합니다. 질문과 관련된 등산로 정보를 찾을 수 없습니다. 다른 질문을 해주시겠어요?',
      sources: [],
      tokensUsed: 0,
      cached: false
    };
  }

  // 5. GPT-4에 질문 (RAG)
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `당신은 한국의 등산 전문가 "하이킹메이트 AI 가이드"입니다.

사용자의 질문에 친절하고 정확하게 답변하세요.

아래는 관련된 등산로 정보입니다:

${contexts}

답변 가이드라인:
1. 위 정보를 바탕으로 답변하되, 정보에 없는 내용은 일반적인 등산 상식으로 답변하세요.
2. 답변은 친근하고 격려하는 톤으로 작성하세요.
3. 난이도가 초보자에게 어려울 경우 주의사항을 알려주세요.
4. 계절별 주의사항이 있다면 언급하세요.
5. 답변은 2-3문단 이내로 간결하게 작성하세요.`
      },
      {
        role: 'user',
        content: question
      }
    ],
    max_tokens: 500,
    temperature: 0.7,
    top_p: 0.9
  });

  const answer = completion.choices[0].message.content || '답변을 생성할 수 없습니다.';
  const tokensUsed = completion.usage?.total_tokens || 0;
  const sources = queryResponse.matches.map((m: any) => m.metadata.trail_id);

  // 6. 캐시 저장 (1시간)
  const result = { answer, sources, tokensUsed, cached: false };
  await redis.setex(cacheKey, 3600, JSON.stringify(result));

  return result;
}
```

### 4.2 토큰 사용량 제한
```typescript
// lib/ai/usage-limiter.ts
import { createClient } from '@/lib/supabase/server';

export async function checkUsageLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const supabase = createClient();

  // 사용자 플랜 확인
  const { data: user } = await supabase
    .from('users')
    .select('premium_tier')
    .eq('id', userId)
    .single();

  // 플랜별 일일 제한
  const limits = {
    free: 3,
    premium: 10,
    premium_plus: 999999 // 무제한
  };

  const dailyLimit = limits[user?.premium_tier || 'free'];

  // 오늘의 사용량 확인
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${today}T23:59:59Z`);

  const used = count || 0;
  const remaining = Math.max(0, dailyLimit - used);
  const resetAt = new Date(`${today}T23:59:59Z`);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt
  };
}
```

### 4.3 API Route
```typescript
// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ai/rag';
import { checkUsageLimit } from '@/lib/ai/usage-limiter';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    
    // 인증 확인
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용량 제한 확인
    const usage = await checkUsageLimit(user.id);
    
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: '일일 사용량을 초과했습니다.',
          remaining: 0,
          resetAt: usage.resetAt,
          upgradeUrl: '/premium'
        },
        { status: 429 }
      );
    }

    // AI 응답 생성
    const result = await askAI(question, user.id);
    
    // 사용량 로깅 (캐시된 응답은 제외)
    if (!result.cached) {
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        question,
        tokens_used: result.tokensUsed,
        cached: false,
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      ...result,
      remaining: usage.remaining - 1
    });
    
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
```

---

## 🗄️ 5단계: Database 스키마 추가

```sql
-- AI 사용량 로그
CREATE TABLE ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  question text NOT NULL,
  tokens_used int DEFAULT 0,
  cached boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- AI 대화 기록 (선택적 - 품질 개선용)
CREATE TABLE ai_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sources jsonb, -- trail IDs array
  rating int, -- 1-5 (사용자 평가)
  feedback text,
  created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_ai_usage_logs_user_id_date ON ai_usage_logs(user_id, created_at);
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);

-- RLS 정책
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI logs" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);
```

---

## 💰 6단계: 비용 최적화

### 6.1 캐싱 전략
```typescript
// Redis 캐싱으로 30-40% 절감
// 동일한 질문에 대해 반복 API 호출 방지

// 자주 묻는 질문 미리 캐싱
const FAQ = [
  "초보자도 갈 수 있는 서울 근교 산은?",
  "겨울 산행 준비물은?",
  "북한산 등산 코스 추천",
  // ...
];

async function prewarmCache() {
  for (const question of FAQ) {
    await askAI(question, 'system');
  }
}
```

### 6.2 토큰 최적화
```typescript
// 컨텍스트 길이 제한
const contexts = matches
  .slice(0, 3) // 5개 → 3개로 축소
  .map(match => {
    return `${meta.name} (${meta.region}): ${meta.description.substring(0, 200)}`;
  });

// max_tokens 제한
max_tokens: 300 // 500 → 300
```

### 6.3 프리미엄 전용 제공
```typescript
// 무료 사용자: 하루 3회
// 프리미엄: 하루 10회
// 프리미엄+: 무제한

→ 대부분의 사용자가 프리미엄으로 전환
→ 비용 대비 수익 최적화
```

### 6.4 비용 모니터링 대시보드
```typescript
// app/admin/ai-cost/page.tsx
export default async function AICostDashboard() {
  // 일일 비용 계산
  const { data: logs } = await supabase
    .from('ai_usage_logs')
    .select('tokens_used, created_at')
    .gte('created_at', getStartOfMonth());

  const totalTokens = logs.reduce((sum, log) => sum + log.tokens_used, 0);
  const estimatedCost = (totalTokens / 1_000_000) * 10; // GPT-4 가격

  return (
    <div>
      <h1>AI 비용 대시보드</h1>
      <p>이번 달 총 토큰: {totalTokens.toLocaleString()}</p>
      <p>예상 비용: ${estimatedCost.toFixed(2)}</p>
      <p>캐시 히트율: {calculateCacheHitRate()}%</p>
    </div>
  );
}
```

---

## ✅ 7단계: 배포 완료 체크리스트

### OpenAI
- [ ] 계정 생성 완료
- [ ] 결제 수단 등록
- [ ] 비용 제한 $100/월 설정 ← 매우 중요!
- [ ] Email 알림 설정 ($50, $80)
- [ ] API 키 발급
- [ ] 환경변수 설정

### Pinecone
- [ ] 계정 생성 완료
- [ ] 인덱스 생성 (hiking-mate, 1536 dims)
- [ ] API 키 발급
- [ ] 환경변수 설정

### 데이터 임베딩
- [ ] 등산로 데이터 임베딩 완료 (1,000+개)
- [ ] 인덱스 통계 확인
- [ ] 테스트 검색 성공

### Redis 캐싱
- [ ] Redis 플랜 업그레이드 ($20/월)
- [ ] 캐싱 로직 구현
- [ ] 캐시 히트율 30% 이상

### Next.js
- [ ] RAG 파이프라인 구현
- [ ] 사용량 제한 구현
- [ ] API Route 생성
- [ ] AI 챗봇 UI 구현
- [ ] Vercel 재배포

### 테스트
- [ ] AI 챗봇 응답 시간 < 5초
- [ ] 답변 품질 확인
- [ ] 사용량 제한 작동 확인
- [ ] 캐싱 작동 확인
- [ ] 비용 모니터링 작동

---

## 🧪 8단계: 기능 테스트

### AI 챗봇 테스트 시나리오
```bash
1. 간단한 질문
   Q: "북한산 추천해줘"
   A: 북한산 등산로 정보 + 추천 이유

2. 구체적인 질문
   Q: "초보자도 갈 수 있는 3시간 이내 서울 근교 산은?"
   A: 난이도 낮고 3시간 이내 등산로 추천

3. 계절 관련 질문
   Q: "겨울에 가기 좋은 산은?"
   A: 겨울 등산 추천 + 주의사항

4. 일반 등산 상식
   Q: "등산할 때 준비물은?"
   A: 일반적인 등산 준비물 안내
```

### 사용량 제한 테스트
```bash
1. 무료 사용자로 4번 질문 → 3번째까지 성공, 4번째 429 에러
2. 프리미엄 사용자로 11번 질문 → 10번째까지 성공
3. 다음 날 리셋 확인
```

### 캐싱 테스트
```bash
1. 동일한 질문 2번 → 두 번째는 cached: true
2. 응답 시간 비교: 5초 → 0.5초
```

---

## 💰 비용 예상 및 모니터링

### 월별 비용 예상
```
시나리오 1: DAU 500명
- 1인당 평균 5회 대화/일
- 총 대화: 75,000회/월
- 평균 토큰: 1,000 tokens/대화
- 총 토큰: 75M tokens/월
- 비용: $75/월

캐싱 적용 후 (40% 절감):
- 실제 API 호출: 45,000회/월
- 총 토큰: 45M tokens/월
- 비용: $45/월

시나리오 2: DAU 1,500명
- 총 대화: 225,000회/월
- 비용: $225/월
- 캐싱 후: $135/월
```

### 비용 절감 체크리스트
- [ ] Redis 캐싱 활성화 (30-40% 절감)
- [ ] 컨텍스트 최적화 (20% 절감)
- [ ] 무료 사용자 제한 (3회/일)
- [ ] FAQ 미리 캐싱
- [ ] 일일 비용 모니터링
- [ ] $80 도달 시 알림 확인

---

## 🚨 주의사항

### 1. 비용 폭탄 방지
```typescript
// 월 비용이 $80 넘으면 자동으로 무료 사용자 차단
if (monthlyCost > 80) {
  // 프리미엄만 허용
  if (user.tier !== 'premium' && user.tier !== 'premium_plus') {
    return { error: '일시적으로 무료 사용이 제한되었습니다.' };
  }
}
```

### 2. 응답 품질 관리
```typescript
// 답변이 너무 짧거나 이상한 경우 재시도
if (answer.length < 50) {
  console.error('답변이 너무 짧습니다:', answer);
  return {
    answer: '죄송합니다. 답변을 생성하는 데 실패했습니다. 다시 시도해주세요.'
  };
}
```

### 3. Rate Limit 처리
```typescript
// OpenAI Rate Limit 초과 시 재시도
try {
  const completion = await openai.chat.completions.create({...});
} catch (error) {
  if (error.status === 429) {
    // 1초 대기 후 재시도
    await new Promise(resolve => setTimeout(resolve, 1000));
    return askAI(question, userId);
  }
  throw error;
}
```

---

## 📚 다음 단계

- [배포 체크리스트](./10_deployment_checklist.md)
- [퀵스타트 가이드](./11_quickstart_guide.md)

---

**Phase 3 AI 배포 완료! 🎉**

이제 AI 등산 가이드 챗봇을 사용할 수 있습니다.

### 중요 알림
매일 OpenAI 사용량을 확인하세요:
https://platform.openai.com/usage
