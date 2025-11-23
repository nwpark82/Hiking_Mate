# 고도 데이터 시각화 문제 해결

Date: 2025-11-23

## 문제 발견

사용자가 등산로 상세 페이지에서 "고도 데이터가 없습니다" 메시지를 발견함.

## 조사 과정

### 1단계: 데이터베이스 확인
**스크립트**: `scripts/check-elevation.ts`

```
북한산 9번 코스: elevation_gain 676m, 52-520m range
관악산 1번 코스: elevation_gain 1560m, 64-644m range
```

✅ **결론**: 집계 고도 데이터(elevation_gain, min_altitude, max_altitude, avg_altitude)는 존재

### 2단계: Path Coordinates 확인
**스크립트**: `scripts/check-path-coordinates.ts`

```
북한산 9번: ✅ 405 points, ❌ altitude 데이터 없음
관악산 1번: ✅ 457 points, ❌ altitude 데이터 없음
```

❌ **문제 발견**: `path_coordinates` 배열에 `{lat, lng}` 만 있고 `altitude` 필드 누락

### 3단계: 원인 분석

**GPX 파싱 흐름 추적**:

1. **GPX 파일** (`.rawdata/*.gpx`)
   - `<ele>` 태그에 고도 데이터 포함 ✅

2. **파서** (`scripts/parse-gpx-data.ts`)
   ```typescript
   const ele = trkpt.ele ? parseFloat(trkpt.ele[0]) : 0;
   trackPoints.push({ lat, lon, ele, time });  // ✅ ele 추출됨
   ```

3. **업로드** (`scripts/upload-to-supabase.ts`)
   ```typescript
   gpx_data: {
     trackPoints: trail.trackPoints,  // ✅ {lat, lon, ele} 저장됨
   }
   ```

4. **Path Coordinates 생성** (추정: 별도 스크립트)
   - `path_coordinates`에 `{lat, lng}` 만 저장됨 ❌
   - `altitude` 필드 누락 ← **근본 원인**

## 해결 방법

### 스크립트: `scripts/fix-elevation-data.ts`

**핵심 로직**:
```typescript
// 1. gpx_data.trackPoints에서 고도 데이터 추출
const trackPoints = data.gpx_data.trackPoints as TrackPoint[];

// 2. {lat, lng, altitude} 형식으로 변환
const pathCoordinatesWithAltitude = trackPoints.map(pt => ({
  lat: pt.lat,
  lng: pt.lon,
  altitude: pt.ele  // ← 고도 데이터 추가
}));

// 3. 통계 계산
const minAlt = Math.min(...altitudes);
const maxAlt = Math.max(...altitudes);
const avgAlt = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;

// 4. 데이터베이스 업데이트
await supabase.from('trails').update({
  path_coordinates: pathCoordinatesWithAltitude,  // altitude 포함
  min_altitude: Math.round(minAlt),
  max_altitude: Math.round(maxAlt),
  avg_altitude: Math.round(avgAlt),
});
```

## 실행 결과

```bash
npx ts-node scripts/fix-elevation-data.ts
```

```
📍 북한산 9번 코스 처리 중...
  ✅ trackPoints 454개 발견
  📊 고도 범위: 52m ~ 520m
  📊 평균 고도: 282m
  ✅ path_coordinates 업데이트 완료 (altitude 포함)
  ✅ 검증 성공 - 첫 포인트 altitude: 476.749m
  ✅ 검증 성공 - 마지막 포인트 altitude: 479.287m

📍 관악산 1번 코스 처리 중...
  ✅ trackPoints 415개 발견
  📊 고도 범위: 64m ~ 644m
  📊 평균 고도: 305m
  ✅ path_coordinates 업데이트 완료 (altitude 포함)
  ✅ 검증 성공 - 첫 포인트 altitude: 73.123m
  ✅ 검증 성공 - 마지막 포인트 altitude: 64.472m

📊 작업 완료
  ✅ 성공: 2개
  ❌ 실패: 0개
```

## 검증

**검증 스크립트** 재실행: `scripts/check-path-coordinates.ts`

```
북한산 9번 코스 (역방향)
  ✅ path_coordinates 존재
  - 포인트 수: 454개
  - 첫 번째 포인트: { lat: 37.628353, lng: 126.9488, altitude: 476.749 }
  - 마지막 포인트: { lat: 37.627885, lng: 126.948735, altitude: 479.287 }
  - altitude 데이터: ✅ 있음
  - 최소 altitude: 51.558m
  - 최대 altitude: 519.74m

관악산 1번 코스 (정방향)
  ✅ path_coordinates 존재
  - 포인트 수: 415개
  - 첫 번째 포인트: { lat: 37.425484, lng: 126.989253, altitude: 73.123 }
  - 마지막 포인트: { lat: 37.428234, lng: 126.991245, altitude: 64.472 }
  - altitude 데이터: ✅ 있음
  - 최소 altitude: 64.472m
  - 최대 altitude: 643.929m
```

## 기술 확인

### ElevationChart 컴포넌트 (`components/trails/ElevationChart.tsx`)

**이미 올바르게 구현되어 있음**:

```typescript
interface ElevationChartProps {
  pathCoordinates: Array<{
    lat: number;
    lng: number;
    altitude?: number;  // ✅ altitude 필드 정의됨
  }>;
}

// 고도 데이터 필터링
const dataWithAltitude = pathCoordinates.filter(
  coord => coord.altitude !== undefined  // ✅ altitude 체크
);

if (dataWithAltitude.length === 0) {
  return <div>고도 데이터가 없습니다</div>;  // 이전에 이 메시지 표시됨
}

// 차트 데이터 생성
const chartData = dataWithAltitude.map((coord, index) => ({
  distance: ...,
  altitude: coord.altitude,  // ✅ altitude 사용
  displayDistance: ...
}));
```

### Trail Detail Page (`app/(main)/explore/[id]/page.tsx`)

**이미 올바르게 연결되어 있음**:

```typescript
// 데이터 조회 - select('*')로 모든 필드 가져옴
const data = await getTrailById(params.id as string);

// ElevationChart에 전달
<ElevationChart
  pathCoordinates={trail.path_coordinates as any}  // ✅ 이제 altitude 포함
  minAltitude={trail.min_altitude}
  maxAltitude={trail.max_altitude}
  elevationGain={trail.elevation_gain}
/>
```

## 결과

### Before
- ❌ "고도 데이터가 없습니다" 메시지 표시
- ❌ 고도 프로필 차트 표시 안 됨
- ❌ `path_coordinates` = `[{lat, lng}, {lat, lng}, ...]`

### After
- ✅ 고도 프로필 차트 정상 표시
- ✅ 거리에 따른 고도 변화 시각화
- ✅ 최저/최고/누적상승 고도 통계 표시
- ✅ `path_coordinates` = `[{lat, lng, altitude}, {lat, lng, altitude}, ...]`

## 향후 작업

### 전체 등산로로 확대
현재는 Tier 1 등산로 2개만 수정했음:
- 북한산 9번 코스
- 관악산 1번 코스

**다음 단계**:
1. Tier 2, Tier 3 등산로에 콘텐츠 추가 시 동일 스크립트 실행
2. 또는 전체 등산로에 일괄 적용 스크립트 작성

### 스크립트 재사용 방법

```typescript
// 대상 등산로 목록만 수정하여 재실행 가능
const targetTrails = [
  { id: '...', name: '...' },  // 추가 등산로
  { id: '...', name: '...' },
];
```

## 기술 부채 해소

이번 작업으로 해결된 기술 부채:
- ✅ GPX 데이터의 고도 정보 활용
- ✅ 사용자에게 가치 있는 고도 프로필 제공
- ✅ 데이터 중복 제거 (gpx_data와 path_coordinates 동기화)

## 학습 교훈

1. **데이터 파이프라인 추적**: GPX → Parser → Upload → DB → UI 전체 흐름 이해 중요
2. **기존 데이터 활용**: `gpx_data`에 이미 고도 데이터가 있었음
3. **단계적 디버깅**:
   - DB에 데이터 있는지 확인
   - path_coordinates 구조 확인
   - 원본 데이터(gpx_data) 확인
   - 변환 로직 파악

---

**작성자**: Claude Code
**작성일**: 2025-11-23
**상태**: ✅ 완료
