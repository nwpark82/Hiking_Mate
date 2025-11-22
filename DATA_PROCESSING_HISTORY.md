# 등산로 데이터 정제 작업 히스토리

## 원본 데이터
- **파일**: `data/bidirectional-trails.json`
- **등산로 수**: 1,292개
- **구조**: trackPoints (경로 좌표), waypoints (주요 지점), 메타데이터

---

## 1단계: 원본 데이터 준비 및 메타데이터 추가

### ✅ Script 01: GPX 정방향/역방향 생성
**Script 01 (`create_bidirectional_gpx.js`)**:
- **목적**: `.rawdata`의 원본 GPX를 정방향(-1), 역방향(-2)으로 복제
- **처리**:
  - 정방향: 원본 그대로 → `파일명-1.gpx`
  - 역방향: trackPoints를 reverse → `파일명-2.gpx`
- **결과**: ✅ 성공
- **출력**: `.rawdata-bidirectional` 디렉토리에 2배 파일 생성

### ✅ Script 02: 지역 정보 추가
**Script 02 (`add_region_data.js`)**:
- **목적**: GPX 시작점 좌표를 기반으로 지역(region) 정보 추가
- **로직**:
  ```javascript
  const REGION_BOUNDARIES = {
    '서울': { minLat: 37.42, maxLat: 37.70, minLon: 126.76, maxLon: 127.18 },
    '경기': { minLat: 36.89, maxLat: 38.31, minLon: 126.47, maxLon: 127.97 },
    '강원': { minLat: 37.02, maxLat: 38.61, minLon: 127.05, maxLon: 129.36 },
    // ... 전국 17개 광역시/도
  };

  function getRegionFromCoordinates(lat, lon) {
    // 좌표 범위 매칭으로 지역 판단
  }
  ```
- **결과**: ✅ 성공
- **출력**: `.rawdata-with-region` 디렉토리
- **주의**: 좌표 기반 판단이므로 경계 지역에서 부정확할 수 있음

### ✅ Script 03: JSON 데이터 생성 (난이도 포함)
**Script 03 (추정, 파일 확인 필요)**:
- **목적**: GPX → JSON 변환, 난이도(difficulty) 정보 추가
- **원본 데이터 구조**:
  ```json
  {
    "mountain": "가리산",
    "courseName": "가리산 1번 코스 (정방향)",
    "category": "mountain",
    "difficulty": "중급",      // 한글: 초급/중급/고급
    "distance": 3,
    "duration": 209,
    "elevationGain": 554,
    "region": "강원",
    "direction": "forward",    // 또는 "reverse"
    "waypoints": [...],
    "trackPoints": [...]
  }
  ```
- **결과**: ✅ 성공
- **출력**: `data/bidirectional-trails.json` (1,292개 등산로)

### ✅ Script 04: DB 업로드
**Script 04 (`upload_bidirectional_trails.ts`)**:
- **목적**: JSON 데이터를 Supabase DB에 업로드
- **처리**:
  1. 기존 trails 테이블 데이터 전체 삭제
  2. 배치 업로드 (100개씩)
  3. 이상 좌표 필터링 (lat/lon 유효성 검증)
  4. 연속 중복 좌표 제거
- **데이터 변환**:
  ```typescript
  {
    name: trail.courseName,           // "가리산 1번 코스 (정방향)"
    mountain: trail.mountain,         // "가리산"
    region: trail.region,             // "강원"
    difficulty: trail.difficulty,     // "중급" (한글 그대로)
    distance: trail.distance,
    duration: trail.duration,
    elevation_gain: trail.elevationGain,
    start_latitude: startLat,
    start_longitude: startLng,
    path_coordinates: [...],          // [{lat, lng}, ...]
    gpx_data: { waypoints, trackPoints, bounds, direction }
  }
  ```
- **결과**: ✅ 1,292개 업로드 성공
- **주의**: 이후 중복 좌표 문제가 발견됨 (Script 04의 중복 제거는 연속 중복만 처리)

---

## 2단계: 경로 갭(Gap) 수정 시도들

### ❌ Script 05-09: 갭 채우기 시도 (실패)
**문제점들**:
1. **Script 05 (`fix_trail_gaps.js`)**:
   - 등산로 유형을 잘못 분류 (편도/왕복 판단 기준 부족)
   - 단순히 시작-종료 거리만으로 판단

2. **Script 06-07 (`fix_bidirectional_gaps.js`, `smart_gap_fill.js`)**:
   - OpenRouteService API 사용 시도
   - API 레이트 리밋 문제
   - 산악 지형에서 정확도 낮음

3. **Script 08 (`fix_all_trail_gaps.js`)**:
   - 배치 처리 시도
   - 근본적인 로직 문제 해결 못함

**결론**: 갭 채우기는 부정확하고 새로운 문제 발생 → 포기

---

## 3단계: 왕복 경로 처리 시도들

### ❌ Script 10-13: 왕복 코스 병합 시도 (부분 실패)

**Script 10 (`merge_complete_outandback.js`)**:
- **시도**: 정방향/역방향 등산로 중 완전 왕복 코스를 하나로 병합
- **문제**:
  - 어떤 등산로가 실제 왕복 코스인지 판단 기준 불명확
  - 편도 등산로도 왕복으로 잘못 분류

**Script 11-13**:
- **시도**: 종료점 좌표 검증 및 부분 왕복 처리
- **문제**:
  - 시작/종료 좌표 불일치 문제 발견
  - 근본적인 데이터 구조 문제

---

## 4단계: 좌표 및 방향 수정

### ⚠️ Script 14-16: 좌표 및 종료점 검증 (부분 성공)

**Script 14 (`verify_endpoints.js`)**:
- ✅ 시작/종료 좌표 불일치 문제 발견
- ✅ 분석용 스크립트로는 유용

**Script 15 (`analyze_gari_trail.js`)**:
- ✅ 가리산 등산로 분석
- 문제점 파악에는 도움되었으나 해결책 없음

**Script 16 (`fix_start_coordinates.js`)**:
- ✅ start_latitude/longitude를 path_coordinates[0]으로 수정
- ✅ 성공적으로 적용

### ⚠️ Script 18: 역방향 등산로 reverse (부분 문제)

**Script 18 (`reverse_backward_trails.js`)**:
- **시도**: 역방향 등산로의 경로를 뒤집음
- **문제**:
  - 정방향/역방향 개념이 모호함
  - 일부 등산로는 실제로 다른 경로

---

## 5단계: 왕복 경로 자동 생성 시도

### ❌ Script 20: 왕복 경로 자동 생성 (실패)

**Script 20 (`create_roundtrip_trails.js`)**:
- **로직**: 시작-종료 거리 > 100m이면 왕복 경로 생성
- **심각한 문제**:
  ```javascript
  if (startToEnd >= 100) {
    // 무조건 왕복 경로 생성
    roundtripPath = [...originalPath, ...reversePath];
  }
  ```
- **결과**:
  - 편도 등산로도 왕복으로 변환
  - 실제 다른 지점에서 끝나는 등산로 망가짐
  - **사용하면 안 됨!**

---

## 6단계: 중복 경로 발견

### ✅ Script 21: 중복 경로 분석 (중요 발견!)

**Script 21 (`analyze_duplicate_paths.js`)**:
- **발견**: 같은 지점을 3-4회 방문하는 심각한 중복 문제
- **예시**: 가리왕산 2번 코스
  - 총 포인트: 3,435개
  - 3회 이상 방문 지점: 272개
  - 중복 구간: 9,436개

**원인 분석**:
- 원본 데이터는 단순 편도 경로
- 이전 스크립트들이 무분별하게 왕복 경로 생성
- 왕복 생성 후 다시 왕복 생성 → 4배 중복

**결론**: ⭐ **원본 데이터부터 다시 시작해야 함**

---

## 7단계: 원본 재작업 시도

### ❌ Script 22: 원본 재작업 (치명적 버그)

**Script 22 (`rebuild_from_original.js`)**:
- **시도**: 원본 JSON에서 깨끗하게 재작업
- **처리 과정**:
  1. ✅ 중복 제거
  2. ⚠️ 갭 채우기 (API 사용, 선택사항)
  3. ✅ 역방향 reverse
  4. ❌ **치명적 버그**: 무조건 왕복 생성

- **버그 코드** (Line 249):
  ```javascript
  if (startToEnd >= 100) {
    // 편도 등산로인지 확인하지 않고 무조건 왕복 생성!
    finalPath = createRoundtripPath(coords);
    isRoundtrip = true;
  }
  ```

- **문제**:
  - 종료점이 다른 도로에 있는 편도 등산로도 왕복 생성
  - Script 20과 동일한 논리적 오류
  - **절대 사용하면 안 됨!**

---

## 8단계: 스마트 왕복 판단 (성공!)

### ✅ Script 23: 웨이포인트 기반 스마트 판단 (성공)

**Script 23 (`rebuild_with_smart_roundtrip.js`)**:
- **핵심 개선**: 종료점이 도로 근처인지 확인!
- **로직**:
  ```javascript
  function shouldCreateRoundtrip(trail) {
    // 1. 시작-종료 거리 < 100m → 이미 왕복
    if (startToEnd < 100) {
      return { needsRoundtrip: false, reason: '이미 왕복 코스' };
    }

    // 2. 종료점이 도로 근처 웨이포인트와 가까운지 확인
    const endNearRoad = isNearRoadWaypoint(endPoint, trail.waypoints);

    if (endNearRoad.isNear) {
      // 종료점이 ENTRY/PARK/TRANS 500m 이내
      return { needsRoundtrip: false, reason: '편도 등산로' };
    }

    // 3. 종료점이 도로에서 멀리 → 왕복 필요
    return { needsRoundtrip: true, reason: '왕복 경로 필요' };
  }
  ```

- **웨이포인트 카테고리**:
  - `ENTRY`: 매표소/입구 (952개)
  - `PARK`: 주차장 (978개)
  - `TRANS`: 대중교통 (734개)

- **결과**:
  - ✅ 편도 등산로 정확히 구분
  - ✅ 왕복 필요 등산로만 왕복 생성
  - ✅ 가리왕산 2번 코스: 3,435 → 535 포인트

---

## 9단계: 중복 병합

### ✅ Script 24: 중복 왕복/순환 코스 병합 (성공)

**Script 24 (`merge_duplicate_roundtrip_trails.js`)**:
- **목적**: 정방향/역방향이 의미 없는 왕복/순환 코스 병합
- **로직**:
  ```javascript
  function getTrailType(trail) {
    const startToEnd = calculateDistance(...);

    if (startToEnd < 100) return 'CIRCULAR';  // 순환

    const midToStart = calculateDistance(midPoint, start);
    if (midToStart > 500) return 'ROUNDTRIP';  // 왕복

    return 'ONE_WAY';  // 편도
  }
  ```

- **처리**:
  1. CIRCULAR + ROUNDTRIP 등산로 식별
  2. 이름에서 "(정방향)", "(역방향)" 제거
  3. 정방향 우선 유지, 역방향 삭제

- **결과**:
  - ✅ 1,243개 → 650개 (593개 삭제)
  - ✅ 최종 분포:
    - CIRCULAR: 431개
    - ROUNDTRIP: 214개
    - ONE_WAY: 5개

---

## 최종 상태 (2025-01-21 기준)

### DB 상태
- **총 등산로**: 650개
- **데이터 품질**: ⚠️ Script 22 실행 결과 포함
  - Script 22의 버그로 일부 편도 등산로가 왕복으로 변환됨
  - Script 23 실행 전 상태

### 권장 다음 단계

#### ⭐ **원본부터 완전 재작업 필요**

**이유**:
1. Script 22의 버그로 데이터 손상
2. 중복 경로 문제 (Script 21 발견)
3. 이전 스크립트들의 누적 오류

**올바른 재작업 순서**:

```bash
# === 방법 1: Script 23 사용 (권장) ===
# 원본 JSON에서 직접 재작업 + 스마트 왕복 판단

# 1. Script 23으로 DB 재구축
node scripts/23_rebuild_with_smart_roundtrip.js

# 2. 중복 병합
AUTO_CONFIRM=true node scripts/24_merge_duplicate_roundtrip_trails.js
```

```bash
# === 방법 2: 완전 클린 재작업 (최고 품질) ===
# GPX부터 다시 시작 (난이도, 지역 정보 포함)

# 1. GPX 정방향/역방향 생성
node scripts/01_create_bidirectional_gpx.js

# 2. 지역 정보 추가
node scripts/02_add_region_data.js

# 3. JSON 생성 (Script 03 확인 필요)
# 주의: 난이도 정보가 이 단계에서 추가됨

# 4. Script 23으로 DB 업로드 + 스마트 왕복 판단
node scripts/23_rebuild_with_smart_roundtrip.js

# 5. 중복 병합
AUTO_CONFIRM=true node scripts/24_merge_duplicate_roundtrip_trails.js
```

**기대 결과**:
- 깨끗한 데이터 (중복 없음)
- 정확한 편도/왕복 분류
- 웨이포인트 기반 스마트 판단
- 난이도 및 지역 정보 정확
- 약 600-700개 등산로

**중요 데이터**:
- **난이도**: 원본 JSON에 한글로 저장 ("초급", "중급", "고급")
- **지역**: Script 02에서 좌표 기반 자동 판단 (전국 17개 광역시/도)

---

## 사용 가능한 스크립트 요약

### ✅ 사용 가능 (추천 순서)

**원본 데이터 준비**:
- **Script 01**: `create_bidirectional_gpx.js` (GPX 정방향/역방향 생성)
- **Script 02**: `add_region_data.js` (지역 정보 추가)
- **Script 03**: (JSON 생성, 난이도 추가 - 파일명 확인 필요)

**DB 업로드 및 정제**:
- **Script 23**: `rebuild_with_smart_roundtrip.js` ⭐ (웨이포인트 기반 스마트 왕복 판단)
- **Script 24**: `merge_duplicate_roundtrip_trails.js` ⭐ (중복 병합)

**분석 및 검증**:
- **Script 21**: `analyze_duplicate_paths.js` (중복 경로 분석)
- **Script 16**: `fix_start_coordinates.js` (좌표 수정)

### ❌ 사용 금지 (치명적 버그)
- **Script 22**: `rebuild_from_original.js` (무조건 왕복 생성 버그)
- **Script 20**: `create_roundtrip_trails.js` (무조건 왕복 생성)
- **Script 05-09**: 갭 채우기 스크립트들 (부정확, API 의존)
- **Script 10-13**: 초기 왕복 병합 시도들 (로직 문제)

### ⚠️ 주의 필요
- **Script 04**: `upload_bidirectional_trails.ts` (단순 업로드만, 왕복 판단 없음)
- **Script 18**: `reverse_backward_trails.js` (역방향 개념 모호, Script 23에 포함됨)

---

## 핵심 교훈

### 1. 편도 vs 왕복 판단 기준
- ❌ **잘못된 기준**: 시작-종료 거리만 확인
- ✅ **올바른 기준**: 종료점이 도로/주차장/대중교통 근처인지 확인

### 2. 데이터 정제 원칙
- **원본 보존**: 항상 원본 JSON 유지
- **검증 우선**: 변경 전 분석 스크립트 실행
- **단계별 처리**: 한 번에 여러 작업 금지
- **백업**: 각 단계마다 DB 백업

### 3. 실패한 접근법
- 갭 채우기: 외부 API 의존, 부정확
- 무조건적 왕복 생성: 편도 등산로 손상
- 복잡한 병합 로직: 버그 증가

### 4. 성공한 접근법
- 웨이포인트 기반 판단: 정확도 높음
- 단순한 로직: 유지보수 용이
- 타입 기반 처리: 명확한 분류

---

## 파일 구조

```
# 원본 데이터
.rawdata/                             # 최초 원본 GPX 파일들 (보존!)
.rawdata-bidirectional/               # Script 01 출력 (정방향/역방향)
.rawdata-with-region/                 # Script 02 출력 (지역 정보 추가)

data/
  bidirectional-trails.json           # ⭐ 최종 원본 JSON (1,292개)
                                      # - 난이도: "초급", "중급", "고급" (한글)
                                      # - 지역: "강원", "경기", ... (17개)
                                      # - waypoints, trackPoints 포함

# 스크립트
scripts/
  [원본 데이터 준비 - 성공]
  01_create_bidirectional_gpx.js     # ✅ GPX 정방향/역방향 생성
  02_add_region_data.js              # ✅ 지역 정보 추가
  03_*.{js,ts}                       # ✅ JSON 생성 (난이도 추가)
  04_upload_bidirectional_trails.ts  # ⚠️ 단순 업로드 (왕복 판단 없음)

  [DB 정제 - 성공]
  23_rebuild_with_smart_roundtrip.js  # ⭐ 스마트 왕복 판단
  24_merge_duplicate_roundtrip_trails.js  # ⭐ 중복 병합

  [분석/검증 - 유용]
  21_analyze_duplicate_paths.js      # 중복 경로 분석
  16_fix_start_coordinates.js        # 좌표 수정
  check_waypoints.js                 # 웨이포인트 분석
  test_kakao_road_api.js             # Kakao API 테스트

  [사용 금지 - 버그]
  22_rebuild_from_original.js        # ❌ 치명적: 무조건 왕복 생성
  20_create_roundtrip_trails.js      # ❌ 치명적: 무조건 왕복 생성
  05-13_*.js                         # ❌ 갭 채우기/병합 실패
```

**데이터 흐름**:
```
.rawdata (원본 GPX)
  ↓ Script 01
.rawdata-bidirectional (정방향/역방향)
  ↓ Script 02
.rawdata-with-region (지역 추가)
  ↓ Script 03
data/bidirectional-trails.json (난이도 추가)
  ↓ Script 23
Supabase DB (스마트 왕복 판단)
  ↓ Script 24
최종 DB (중복 병합, 약 600-700개)
  ↓ Script 26 (스키마 마이그레이션)
  ↓ Script 25
새로운 분류 시스템 (5가지 타입, 약 927개)
```

---

## 6단계: 새로운 5가지 타입 분류 시스템 (진행 중)

### 🔄 Script 25: 5가지 타입 분류 및 업로드 (진행 중)
**Script 25 (`classify_and_upload_trails.js`)**:
- **목적**: 원본 데이터(`bidirectional-trails.json`)부터 새롭게 시작, 5가지 타입 분류 시스템 적용
- **분류 기준**:
  1. **ROUNDTRIP (왕복)**: 경로 중복률 ≥80% 또는 종료점이 도로에서 멀리 떨어짐
  2. **CIRCULAR_PARTIAL (둘레길 A)**: 시작=종료, 30-80% 경로 중복
  3. **CIRCULAR_UNIQUE (둘레길 B)**: 시작=종료, <30% 경로 중복
  4. **ONEWAY_PARTIAL (편도 A)**: 시작≠종료, 종료점이 도로 근처, 30%+ 경로 중복
  5. **ONEWAY_UNIQUE (편도 B)**: 시작≠종료, 종료점이 도로 근처, <30% 경로 중복

- **중복률 계산 로직**:
  ```javascript
  function calculateOverlapRate(coords) {
    const visitCount = new Map();

    // 각 좌표를 5자리 소수점으로 반올림하여 키 생성 (~1m 정밀도)
    coords.forEach(coord => {
      const key = `${coord.lat.toFixed(5)},${coord.lng.toFixed(5)}`;
      visitCount.set(key, (visitCount.get(key) || 0) + 1);
    });

    // 2번 이상 방문한 포인트 카운트
    let duplicateCount = 0;
    for (const count of visitCount.values()) {
      if (count >= 2) duplicateCount++;
    }

    return duplicateCount / coords.length;
  }
  ```

- **종료점 도로 근접성 검증** (2단계):
  1. **Stage 1: Waypoint 검사**
     - 카테고리: ENTRY (입구), PARK (주차장), TRANS (대중교통)
     - 거리 임계값: 500m
  2. **Stage 2: Kakao Maps API**
     - 카테고리: PK6 (주차장), SW8 (대중교통)
     - 거리 임계값: 500m
     - Stage 1에서 발견되지 않은 경우에만 실행

- **정방향/역방향 처리**:
  - **ROUNDTRIP**: 정방향만 저장 (1개)
  - **나머지 4가지 타입**: 정방향 + 역방향 모두 저장 (2개)

- **분류 결과** (실행 완료, 업로드 실패):
  ```
  ROUNDTRIP (왕복):        365개 → 365개 업로드
  CIRCULAR_PARTIAL (둘레A): 0개 → 0개 업로드
  CIRCULAR_UNIQUE (둘레B):  61개 → 122개 업로드
  ONEWAY_PARTIAL (편도A):   0개 → 0개 업로드
  ONEWAY_UNIQUE (편도B):    220개 → 440개 업로드
  ─────────────────────────────────────────
  총 646개 정방향 → 927개 업로드 준비
  ```

- **흥미로운 결과**:
  - 중복률 30-80% 범위에 해당하는 등산로가 **0개**
  - 모든 순환 코스가 CIRCULAR_UNIQUE (<30% 중복)
  - 모든 편도 코스가 ONEWAY_UNIQUE (<30% 중복)
  - 이는 원본 데이터가 매우 깨끗하거나, 임계값 조정이 필요할 수 있음을 시사

- **상태**: ⚠️ **실행 완료, 업로드 실패**
- **실패 원인**: 데이터베이스 스키마에 필수 컬럼 누락
  ```
  ❌ Could not find the 'overlap_rate' column of 'trails' in the schema cache
  ❌ Could not find the 'trail_type' column of 'trails' in the schema cache
  ```

- **파일**: `scripts/25_classify_and_upload_trails.js`

### 🔧 Script 26: 스키마 마이그레이션 (대기 중)
**Script 26 (`apply_schema_migration.js`)**:
- **목적**: Supabase trails 테이블에 5가지 타입 분류 시스템에 필요한 컬럼 추가
- **추가 컬럼**:
  1. `trail_type TEXT` - 5가지 타입 분류 (ROUNDTRIP, CIRCULAR_PARTIAL, etc.)
  2. `overlap_rate FLOAT` - 경로 중복률 (0.0~1.0)
  3. `path_coordinates JSONB` - {lat, lng} 배열 형식의 경로 좌표
  4. `start_latitude FLOAT` - 시작점 위도
  5. `start_longitude FLOAT` - 시작점 경도

- **인덱스 추가**:
  - `idx_trails_trail_type` - 타입별 필터링 성능 향상
  - `idx_trails_overlap_rate` - 중복률 분석 성능 향상

- **실행 방법**:
  ```bash
  # 1. 스키마 확인 및 안내
  node scripts/26_apply_schema_migration.js

  # 2. Supabase 대시보드에서 SQL 실행
  # https://supabase.com/dashboard > SQL Editor
  # supabase-migration-add-trail-classification.sql 내용 복사/붙여넣기

  # 3. 완료 후 Script 25 재실행
  node scripts/25_classify_and_upload_trails.js
  ```

- **마이그레이션 SQL**: `supabase-migration-add-trail-classification.sql`
- **스키마 파일 업데이트**: `supabase-schema.sql` (이미 반영 완료)

- **상태**: ⏸️ **대기 중** (수동으로 Supabase 대시보드에서 SQL 실행 필요)
- **파일**: `scripts/26_apply_schema_migration.js`

### 📝 다음 단계
1. ✅ Script 26 실행 → 스키마 확인 및 마이그레이션 SQL 표시 (완료)
2. ⏳ Supabase 대시보드에서 마이그레이션 SQL 실행 (대기 중)
3. ⏳ Script 25 재실행 → 927개 등산로 업로드
4. ⏳ 분류 결과 검증 (왜 PARTIAL 타입이 0개인지 확인)

### 💡 예상 최종 결과
- **등산로 수**: 약 927개
  - ROUNDTRIP: 365개 (정방향만)
  - CIRCULAR_UNIQUE: 122개 (정방향 + 역방향)
  - ONEWAY_UNIQUE: 440개 (정방향 + 역방향)
- **데이터 품질**: 각 등산로에 `trail_type` 및 `overlap_rate` 메타데이터 포함
- **API/앱 활용**: 등산로 타입별 필터링 및 추천 기능 구현 가능
