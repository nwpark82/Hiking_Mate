# 🎯 Google AdSense 연결 가이드

## ✅ 현재 완료된 사항

- ✅ 개인정보 보호정책 페이지 생성 (`/privacy`)
- ✅ 이용약관 페이지 생성 (`/terms`)
- ✅ Footer에 법적 고지 링크 추가
- ✅ Sitemap에 새 페이지 추가
- ✅ 663개 등산로 콘텐츠 (충분한 콘텐츠)

---

## ⚠️ AdSense 승인 전 필수 작업

### 1. 커스텀 도메인 구매 및 연결 (필수!)

**현재 문제:**
- `hiking-mate.vercel.app`은 Vercel 서브도메인
- AdSense는 커스텀 도메인 필요 (예: `hikingmate.com`)

**도메인 구매 추천:**
- **추천 도메인:** `hikingmate.com`, `hikingmate.kr`
- **구매처:** 가비아, 호스팅KR, Namecheap 등
- **연간 비용:** 약 15,000원~30,000원

**Vercel 연결 방법:**
```bash
1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Domains
3. 도메인 입력 (예: hikingmate.com)
4. DNS 설정 (A 레코드 또는 CNAME)
   - 가비아/호스팅KR: DNS 관리 페이지에서 설정
   - Vercel이 제공하는 값 입력
5. 24시간 이내 적용 완료
```

---

### 2. 콘텐츠 강화 (권장)

**현재 상태:**
- ✅ 663개 등산로 페이지 (충분)
- ⚠️ 각 페이지 콘텐츠 부족 (간단한 정보만)

**개선 방법:**
1. **등산로 상세 설명 추가** (인기 등산로 20개부터)
   - 코스 특징 300단어 이상
   - 계절별 추천
   - 주차 정보, 대중교통

2. **블로그 섹션 추가**
   - "서울 근교 등산 BEST 10"
   - "초보자를 위한 등산 가이드"
   - 매주 1-2개 포스트 작성

3. **사용자 리뷰 활성화**
   - 리뷰 시스템 구현
   - 사용자 콘텐츠로 페이지 풍부화

---

## 📋 Google AdSense 신청 절차

### Step 1: AdSense 계정 생성

1. https://www.google.com/adsense 접속
2. **시작하기** 클릭
3. 정보 입력:
   - 웹사이트 URL: `https://hikingmate.com` (커스텀 도메인 필수!)
   - 이메일 주소
   - 국가: 대한민국
4. 전화번호 인증
5. 결제 정보 입력 (수익 수령용)

---

### Step 2: AdSense 코드 삽입

**1. AdSense에서 코드 받기:**
```html
<!-- Google AdSense 코드 예시 -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

**2. Next.js에 코드 추가:**

파일: `app/layout.tsx`

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="ko">
      <head>
        {/* 기존 메타 태그들... */}

        {/* Google AdSense */}
        {ADSENSE_CLIENT_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

**3. 환경 변수 설정:**

`.env.local` 파일:
```bash
# Google AdSense Client ID
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

**Vercel 환경 변수:**
```bash
1. Vercel Dashboard → Settings → Environment Variables
2. 추가:
   - Key: NEXT_PUBLIC_ADSENSE_CLIENT_ID
   - Value: ca-pub-XXXXXXXXXXXXXXXX
   - Environment: Production, Preview, Development
3. 재배포
```

---

### Step 3: 광고 단위 생성 및 배치

**1. 자동 광고 (추천 - 가장 간단)**

AdSense 계정에서 자동 광고 활성화만 하면 끝!
- Google이 자동으로 최적 위치에 광고 배치
- 승인 후 즉시 수익 발생 가능

**2. 수동 광고 배치 (고급)**

AdSense에서 광고 단위 생성 후 코드 삽입:

```typescript
// components/ads/AdBanner.tsx (예시)
'use client';

import { useEffect } from 'react';

interface AdBannerProps {
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
}

export function AdBanner({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
}: AdBannerProps) {
  useEffect(() => {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive}
    />
  );
}
```

**사용 예시:**
```typescript
// 등산로 상세 페이지에서
import { AdBanner } from '@/components/ads/AdBanner';

export default function TrailDetailPage() {
  return (
    <div>
      {/* 콘텐츠 위 광고 */}
      <AdBanner adSlot="1234567890" />

      {/* 등산로 정보 */}
      <div>...</div>

      {/* 콘텐츠 아래 광고 */}
      <AdBanner adSlot="0987654321" />
    </div>
  );
}
```

---

## 💰 광고 배치 전략

### 권장 광고 위치:

1. **홈페이지**
   - 메인 히어로 섹션 하단
   - 인기 등산로 목록 사이

2. **등산로 상세 페이지** (트래픽 많음!)
   - 페이지 상단 (헤더 바로 아래)
   - 등산로 설명 중간
   - 지도 하단
   - 사이드바 (데스크톱)

3. **커뮤니티 페이지**
   - 게시글 목록 사이
   - 게시글 하단

4. **블로그/가이드 페이지**
   - 목차 아래
   - 본문 중간
   - 본문 하단

### ⚠️ 피해야 할 광고 배치:

- ❌ 헤더/네비게이션 위
- ❌ 콘텐츠보다 광고가 많은 페이지
- ❌ 사용자 경험을 해치는 팝업
- ❌ 클릭 유도성 문구 주변

---

## 📊 예상 수익

**트래픽 기준 예상 수익:**

| 일 방문자 | 월 방문자 | 예상 월 수익 (RPM $1-3 기준) |
|-----------|-----------|------------------------------|
| 100명     | 3,000명   | $3~$9 (4,000원~12,000원)     |
| 500명     | 15,000명  | $15~$45 (20,000원~60,000원)  |
| 1,000명   | 30,000명  | $30~$90 (40,000원~120,000원) |
| 5,000명   | 150,000명 | $150~$450 (200,000원~600,000원) |

**참고:**
- RPM (Revenue Per Mille): 1,000회 노출당 수익
- 한국 시장 평균 RPM: $1~$3
- 등산/아웃도어 카테고리는 RPM이 비교적 높음

---

## ⏱️ 승인 타임라인

```markdown
Day 1: AdSense 신청
  ↓
Day 1-3: Google 크롤링 (사이트 확인)
  ↓
Day 3-7: 1차 검토
  ↓ (통과)
Week 1-2: 2차 검토 (콘텐츠 품질)
  ↓ (통과)
Week 2-4: 승인 완료 🎉
  ↓
즉시: 광고 게재 시작
  ↓
Month 1: 첫 수익 발생
```

---

## ✅ 승인 확률 높이는 팁

### 필수 체크리스트:

- [ ] 커스텀 도메인 연결
- [ ] 개인정보 보호정책 페이지
- [ ] 이용약관 페이지
- [ ] 연락처/문의 페이지 (✅ /feedback)
- [ ] 최소 20개 페이지, 각 300단어 이상
- [ ] 독창적인 콘텐츠 (복사 금지)
- [ ] 6개월 이상 운영 (권장)
- [ ] 정기적인 업데이트
- [ ] 저작권 위반 콘텐츠 없음
- [ ] 성인 콘텐츠 없음

### 거절 사유 & 대처:

**1. "콘텐츠가 부족합니다"**
- 해결: 블로그 포스트 20개 이상 작성
- 각 포스트 1,000단어 이상

**2. "사이트가 너무 최신입니다"**
- 해결: 2-3개월 후 재신청
- 그동안 콘텐츠 지속 업데이트

**3. "정책 위반"**
- 해결: 모든 콘텐츠 검토
- 저작권 문제 해결
- 금지 콘텐츠 제거

---

## 🚀 다음 단계

### 즉시 실행:

1. **커스텀 도메인 구매**
   - hikingmate.com 또는 hikingmate.kr
   - Vercel에 연결

2. **콘텐츠 강화 (2주 계획)**
   - 주요 등산로 20개 상세 설명 작성
   - 블로그 포스트 10개 작성
   - 사용자 리뷰 기능 구현

3. **AdSense 신청**
   - 도메인 연결 후 신청
   - 코드 삽입

4. **승인 대기 중 할 일**
   - 콘텐츠 지속 업데이트
   - SEO 최적화
   - 사용자 유입 증가

---

## 📞 다음 구현할 기능

AdSense 승인 후 함께 구현할 기능들:

1. **블로그 섹션** - 검색 유입 + 콘텐츠 풍부화
2. **리뷰 시스템** - 사용자 참여 + 독창적 콘텐츠
3. **구조화된 데이터** - 검색 노출 개선
4. **지역별 페이지** - 지역 SEO
5. **소셜 공유** - 바이럴 효과

**준비되면 말씀해주세요! 함께 구현하겠습니다.** 🚀

---

## 💡 중요 알림

**AdSense 승인은 시간이 걸립니다:**
- 빠르면 1주, 보통 2-4주
- 거절되어도 다시 신청 가능
- 콘텐츠 품질이 가장 중요!

**먼저 콘텐츠를 만들고, 수익은 자연스럽게 따라옵니다!** ✨
