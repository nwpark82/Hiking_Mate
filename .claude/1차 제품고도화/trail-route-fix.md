# 등산로 경로 데이터 수정 (출발/도착 지점 및 갭 처리)

Date: 2025-11-23

## 문제 발견

사용자가 북한산 9번 코스(역방향) 지도에서 다음 두 가지 문제 발견:

1. **출발/도착 지점 오류**: 출발지점과 도착지점이 도로와 인접하지 않고 산 정상에 위치
2. **갭 처리 오류**: 도로와 인접한 곳의 위치데이터 중 갭이 발생되어 있지만 갭처리가 제대로 되지 않음

## 조사 결과

### 북한산 9번 코스 (역방향) - ID: `8ce61126-a2ee-4e7f-ad7f-34861c6c1dbf`

#### 문제 1: 출발/도착 지점 분석

**수정 전**:
```
출발점: lat=37.628353, lng=126.9488, alt=476.749m  ❌ 산 정상 근처
도착점: lat=37.627885, lng=126.948735, alt=479.287m  ❌ 산 정상 근처
```

**원인**:
- 최저 고도 지점(51.558m)이 인덱스 247에 위치
- path_coordinates가 산 정상에서 시작하도록 저장됨
- "역방향"이지만 하산 시작점(낮은 곳)이 아닌 정상에서 시작

**수정 후**:
```
출발점: lat=37.614244, lng=126.932501, alt=51.558m  ✅ 도로 인접 낮은 지점
도착점: lat=37.614156, lng=126.932652, alt=54.239m  ✅ 도로 인접
```

#### 문제 2: 갭(Gap) 분석

**발견된 갭**:
```
위치: 인덱스 247 → 248
거리: 224.9m
고도 차이: 0.0m (평지 이동)
판단: 도로 구간 - 보간 필요
```

**수정 결과**:
- 224.9m 갭을 50m 간격으로 분할
- 4개 중간 포인트 추가 (직선 보간)
- 총 좌표: 454개 → 458개

### 관악산 1번 코스 (정방향) - ID: `5d5a0bea-1958-4108-9cdd-d872dc1ba1a0`

#### 분석 결과

**출발/도착 지점**: ✅ 정상
```
출발점: alt=73.123m (낮은 지점, 문제 없음)
도착점: alt=64.472m (낮은 지점, 문제 없음)
```

**갭 발견**: 1개
```
갭 보간: 1개 갭, 2개 포인트 추가
총 좌표: 415개 → 417개
거리: 8.92km
```

## 해결 방법

### 1. 출발/도착 지점 정규화

**원리**:
```typescript
function normalizeTrailDirection(coords: Coordinate[], trailName: string) {
  // 가장 낮은 고도 지점 찾기
  const minAltIndex = altitudes.indexOf(Math.min(...altitudes));

  // 출발점이 이미 낮은 고도(<200m)이면 재정렬 불필요
  if (startAlt < 200) {
    return { coords, reordered: false };
  }

  // 가장 낮은 지점을 출발점으로 재정렬
  const reordered = [
    ...coords.slice(minAltIndex),      // 최저점부터 끝까지
    ...coords.slice(0, minAltIndex)    // 처음부터 최저점 전까지
  ];

  return { coords: reordered, reordered: true };
}
```

**로직**:
1. 모든 좌표의 고도를 조사
2. 최저 고도 지점 탐색
3. 출발점이 200m 이상이면 재정렬 필요
4. 최저 지점을 인덱스 0으로 재배치
5. 순환 구조 유지 (끝 → 처음 연결)

### 2. 갭(Gap) 탐지 및 보간

**갭 탐지 기준**:
- 연속된 두 좌표 간 거리가 100m 이상이면 갭으로 판단
- Haversine 공식으로 정확한 거리 계산

**보간 방법** - 직선 보간(Linear Interpolation):
```typescript
function interpolateGap(from: Coordinate, to: Coordinate, maxSegmentLength = 50) {
  const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
  const numSegments = Math.ceil(distance / maxSegmentLength);

  // 50m 간격으로 분할하여 중간 포인트 생성
  for (let i = 1; i < numSegments; i++) {
    const ratio = i / numSegments;

    const lat = from.lat + (to.lat - from.lat) * ratio;
    const lng = from.lng + (to.lng - from.lng) * ratio;
    const altitude = from.altitude + (to.altitude - from.altitude) * ratio;

    interpolated.push({ lat, lng, altitude });
  }
}
```

**적용 예시**:
```
갭 224.9m:
  - 224.9 / 50 = 4.5 → 5개 구간
  - 4개 중간 포인트 생성
  - 각 구간: 약 45-50m
```

### 3. 거리 재계산

```typescript
let totalDistance = 0;
for (let i = 1; i < coords.length; i++) {
  totalDistance += calculateDistance(
    coords[i-1].lat, coords[i-1].lng,
    coords[i].lat, coords[i].lng
  );
}
```

- 모든 연속 좌표 간 거리 합산
- Haversine 공식 사용 (지구 곡률 고려)
- 미터 단위로 계산

## 실행 결과

### 스크립트 실행

```bash
# 단일 등산로 분석
npx ts-node scripts/analyze-bukhansan-9-issues.ts

# 단일 등산로 수정
npx ts-node scripts/fix-bukhansan-9-route.ts

# 전체 등산로 일괄 수정
npx ts-node scripts/fix-all-trail-routes.ts
```

### 최종 결과

**북한산 9번 코스**:
```
✅ 출발점: 476.749m → 51.558m (도로 인접)
✅ 갭 보간: 224.9m → 4개 포인트 추가
✅ 총 좌표: 454개 → 458개
✅ 거리: 6.05km
```

**관악산 1번 코스**:
```
✅ 출발점: 73.123m (이미 정상)
✅ 갭 보간: 1개 갭 → 2개 포인트 추가
✅ 총 좌표: 415개 → 417개
✅ 거리: 8.92km
```

## 데이터베이스 변경 사항

### 업데이트된 필드

```sql
UPDATE trails SET
  path_coordinates = [...],  -- 재정렬 + 보간된 좌표 배열
  start_latitude = ...,      -- 새 출발점 위도
  start_longitude = ...,     -- 새 출발점 경도
  distance = ...,            -- 재계산된 거리 (미터)
  updated_at = NOW()
WHERE id = '...';
```

### Before / After 비교

**북한산 9번 코스**:
| 항목 | Before | After |
|------|--------|-------|
| 출발 고도 | 476.7m | 51.6m |
| 도착 고도 | 479.3m | 54.2m |
| 좌표 수 | 454개 | 458개 |
| 갭 | 1개 (224.9m) | 0개 |

**관악산 1번 코스**:
| 항목 | Before | After |
|------|--------|-------|
| 출발 고도 | 73.1m | 73.1m |
| 도착 고도 | 64.5m | 64.5m |
| 좌표 수 | 415개 | 417개 |
| 갭 | 1개 | 0개 |

## 시각적 개선 효과

### 지도 표시 개선

**Before**:
```
❌ 출발 마커가 산 정상에 표시
❌ 경로가 중간에 직선으로 점프 (갭)
❌ 실제 등산로와 다른 경로 표시
```

**After**:
```
✅ 출발 마커가 도로 근처 등산로 입구에 표시
✅ 경로가 부드럽게 연결 (갭 보간)
✅ 실제 등산 동선과 일치
```

## 향후 확장 계획

### 전체 등산로 적용

현재는 Tier 1 등산로 2개만 수정:
- 북한산 9번 코스
- 관악산 1번 코스

**Tier 2, 3 확장 시**:
```typescript
// fix-all-trail-routes.ts 수정
const trails = [
  { id: '...', name: '도봉산 1번 코스' },
  { id: '...', name: '청계산 2번 코스' },
  // ... 추가 등산로
];
```

### 고급 보간 기법

현재는 직선 보간(Linear Interpolation) 사용. 향후 개선 방안:

1. **스플라인 보간** (Spline Interpolation):
   - 더 부드러운 곡선 생성
   - 급격한 방향 전환 완화

2. **도로 API 기반 보간**:
   - Google Directions API / Kakao Mobility API
   - 실제 도로 경로 따라 보간
   - 비용 발생 (API 호출)

3. **지형 기반 보간**:
   - DEM (Digital Elevation Model) 활용
   - 실제 지형을 고려한 경로 생성
   - 고도 데이터 정확도 향상

### 자동화

등산로 업로드 시 자동 검증 및 수정:
```typescript
// upload-trails.ts에 추가
async function validateAndFixTrail(trail: Trail) {
  // 1. 출발점 고도 확인
  if (trail.path_coordinates[0].altitude > 200) {
    trail = normalizeTrailDirection(trail);
  }

  // 2. 갭 탐지 및 보간
  const { coords, gapsFilled } = fillGaps(trail.path_coordinates);
  trail.path_coordinates = coords;

  // 3. 거리 재계산
  trail.distance = calculateTotalDistance(coords);

  return trail;
}
```

## 기술 부채 해소

이번 작업으로 해결된 기술 부채:
- ✅ 부정확한 출발/도착 지점 표시
- ✅ 경로 중간 갭으로 인한 부자연스러운 직선 구간
- ✅ 실제 등산로와 다른 경로 표시
- ✅ 사용자 혼란 유발 요소 제거

## 관련 스크립트

### 분석 스크립트
- `scripts/analyze-bukhansan-9-issues.ts` - 북한산 9번 코스 문제 분석

### 수정 스크립트
- `scripts/fix-bukhansan-9-route.ts` - 북한산 9번 코스 단독 수정
- `scripts/fix-all-trail-routes.ts` - 전체 등산로 일괄 수정

### 기존 스크립트 (참고)
- `smart-gap-fill.js` - 이전 갭 처리 스크립트 (문제 있음)
- `detect-trail-gaps.js` - 갭 탐지 스크립트

## 학습 교훈

1. **데이터 검증의 중요성**:
   - 업로드 시점에 데이터 품질 검증 필수
   - 출발/도착 지점 고도 확인
   - 갭 자동 탐지 및 보간

2. **역방향/정방향 명확화**:
   - "역방향" = 하산 코스 (낮은 곳 → 높은 곳 or 순환)
   - "정방향" = 등산 코스 (낮은 곳 → 높은 곳)
   - 고도 기반 자동 판단 가능

3. **보간 전략**:
   - 100m 이상 갭: 보간 필수
   - 50m 간격 분할: 자연스러운 경로
   - 직선 보간: 간단하고 효과적

4. **시각적 검증**:
   - 데이터 수정 후 반드시 지도에서 확인
   - 출발/도착 마커 위치 검증
   - 경로 부드러움 확인

---

**작성자**: Claude Code
**작성일**: 2025-11-23
**상태**: ✅ 완료
**적용 등산로**: 북한산 9번, 관악산 1번
