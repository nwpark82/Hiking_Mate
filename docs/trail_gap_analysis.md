# 등산로 GPS 갭 분석 및 해결 방법

## 1. 등산로 유형 분류

### Type 1: 선형 등산로 (Linear Trail)
**특징:**
- 시작점 ≠ 종료점
- 경로 재방문 없음
- 한 방향으로만 진행
- 예: A지점 → B지점 직선 코스

**GPS 데이터 특성:**
- 순차적으로 거리가 증가
- 뒤돌아가는 구간 없음
- 같은 좌표를 두 번 지나지 않음

**갭 발생 원인:**
- GPS 신호 두절 (터널, 협곡, 울창한 숲)
- 기록 장치 배터리 소진
- 데이터 손실

**갭 탐지 방법:**
```javascript
// 평균 간격의 5배 이상인 구간 탐지
const avgDistance = calculateAverageDistance(points);
const threshold = avgDistance * 5;
const gaps = findSegmentsExceedingThreshold(points, threshold);
```

**갭 해결 방법:**
1. **선형 보간 (Linear Interpolation)**
   - 갭의 시작점과 종료점을 직선으로 연결
   - 적절한 간격(50m)으로 포인트 생성
   - 실제 경로와 다를 수 있지만, 다른 방법이 없음

```javascript
function linearInterpolate(startPoint, endPoint, gapDistance) {
  const targetSpacing = 50; // 50m 간격
  const numPoints = Math.ceil(gapDistance / targetSpacing);

  const interpolated = [];
  for (let i = 1; i < numPoints; i++) {
    const ratio = i / numPoints;
    interpolated.push({
      lat: startPoint.lat + (endPoint.lat - startPoint.lat) * ratio,
      lng: startPoint.lng + (endPoint.lng - startPoint.lng) * ratio
    });
  }
  return interpolated;
}
```

**장점:** 간단하고 빠름
**단점:** 실제 등산로 굴곡을 반영하지 못함

---

### Type 2: 부분 왕복 등산로 (Partial Out-and-Back)
**특징:**
- 시작점 ≠ 종료점
- **일부 구간에서 경로 재방문**
- A → B → C → B → D (B 구간 왕복)
- **가리왕산 2번 코스가 이 유형**

**GPS 데이터 특성:**
- 전반부와 중간/후반부에 유사한 좌표 존재
- 특정 구간을 두 번 통과
- 왔던 길을 일부 되돌아감

**갭 발생 패턴:**
- 왕복 구간의 한쪽에만 갭이 있을 수 있음
- 갈 때는 기록되었지만 올 때 기록 안됨 (또는 반대)

**갭 탐지 방법:**
```javascript
// 1. 기본 갭 탐지
const gaps = detectAnomalies(points, threshold);

// 2. 왕복 구간 탐지
function detectRetracedSegments(points) {
  const retraced = [];
  const midpoint = Math.floor(points.length / 2);

  // 전반부와 후반부 비교
  for (let i = 0; i < midpoint; i++) {
    for (let j = midpoint; j < points.length; j++) {
      const distance = calculateDistance(points[i], points[j]);
      if (distance < 50) { // 50m 이내
        retraced.push({ early: i, late: j });
      }
    }
  }
  return retraced;
}
```

**갭 해결 방법:**
1. **왕복 구간 매칭 (Retracing Segment Matching)**
   - 갭 시작/종료 지점과 유사한 위치를 다른 구간에서 찾기
   - 갭 이전 구간에서 찾기
   - **갭 이후 구간에서 찾기 (왕복의 경우)**

```javascript
function findMatchingSegment(pathCoords, gapStart, gapEnd, gapStartIdx, gapEndIdx) {
  const proximityThreshold = 100; // 100m 이내
  let bestMatch = null;
  let bestScore = Infinity;

  // 1. 갭 이전 구간 검색 (갈 때 지나간 경로)
  for (let i = 0; i < gapStartIdx - 5; i++) {
    const distToStart = calculateDistance(pathCoords[i], gapStart);
    if (distToStart < proximityThreshold) {
      for (let j = i + 1; j < gapStartIdx - 1; j++) {
        const distToEnd = calculateDistance(pathCoords[j], gapEnd);
        if (distToEnd < proximityThreshold) {
          const score = distToStart + distToEnd;
          if (score < bestScore) {
            bestScore = score;
            bestMatch = { startIdx: i, endIdx: j, reverse: false };
          }
        }
      }
    }
  }

  // 2. 갭 이후 구간 검색 (올 때 지나갈 경로)
  for (let i = gapEndIdx + 5; i < pathCoords.length; i++) {
    const distToEnd = calculateDistance(pathCoords[i], gapEnd);
    if (distToEnd < proximityThreshold) {
      for (let j = i + 1; j < pathCoords.length; j++) {
        const distToStart = calculateDistance(pathCoords[j], gapStart);
        if (distToStart < proximityThreshold) {
          const score = distToEnd + distToStart;
          if (score < bestScore) {
            bestScore = score;
            bestMatch = { startIdx: i, endIdx: j, reverse: true };
          }
        }
      }
    }
  }

  if (bestMatch) {
    let segment = pathCoords.slice(bestMatch.startIdx, bestMatch.endIdx + 1);
    if (bestMatch.reverse) {
      segment = segment.reverse(); // 반대 방향이면 역순
    }
    return segment;
  }

  return null; // 매칭 실패 시 선형 보간 사용
}
```

**장점:** 실제 GPS 데이터 사용, 높은 정확도
**단점:** 왕복 구간이 아니면 작동 안함

2. **대체 방법: 선형 보간**
   - 매칭 실패 시 Type 1 방법 사용

---

### Type 3: 순환 등산로 (Loop Trail)
**특징:**
- 시작점 = 종료점
- 경로 재방문 없음
- 원형 또는 8자 형태
- 한 바퀴 돌아서 시작점으로 복귀

**GPS 데이터 특성:**
- 첫 좌표와 마지막 좌표가 동일 (±10m)
- 중간에 같은 지점을 두 번 지나지 않음
- 연속적인 루프 형성

**갭 발생 원인:**
- Type 1과 동일

**갭 탐지 방법:**
```javascript
// Type 1과 동일한 방법
const avgDistance = calculateAverageDistance(points);
const threshold = avgDistance * 5;
const gaps = findSegmentsExceedingThreshold(points, threshold);
```

**갭 해결 방법:**
1. **선형 보간**
   - Type 1과 동일
   - 시작점과 종료점이 연결되어야 함 확인

```javascript
// 마지막 구간이 갭인 경우 특별 처리
if (isLastSegmentGap && isLoopTrail) {
  // 마지막 포인트가 첫 포인트와 가까운지 확인
  const distToStart = calculateDistance(lastPoint, firstPoint);
  if (distToStart > threshold) {
    // 루프를 닫기 위한 보간
    interpolateToCloseLoop(lastPoint, firstPoint);
  }
}
```

**장점:** 간단한 구조, 명확한 시작/종료
**단점:** 실제 경로 굴곡 반영 안됨

---

### Type 4: 완전 왕복 등산로 (Complete Out-and-Back Loop)
**특징:**
- 시작점 = 종료점
- **전체 경로를 왕복**
- A → B → C → B → A
- 갔던 길을 그대로 되돌아옴

**GPS 데이터 특성:**
- 전반부와 후반부가 거의 대칭 (역순)
- 중간 지점까지 갔다가 같은 길로 복귀
- 후반부 ≈ 전반부의 역순

**갭 발생 패턴:**
- 갈 때 갭 발생 → 올 때는 기록됨
- 올 때 갭 발생 → 갈 때는 기록됨
- **대칭 구간 활용 가능**

**갭 탐지 방법:**
```javascript
// 1. 기본 갭 탐지
const gaps = detectAnomalies(points);

// 2. 대칭점 찾기
function findSymmetricPoint(points, gapIndex) {
  const totalLength = points.length;
  const midpoint = Math.floor(totalLength / 2);

  if (gapIndex < midpoint) {
    // 전반부 갭 → 후반부 대응점
    const symmetricIndex = totalLength - 1 - gapIndex;
    return symmetricIndex;
  } else {
    // 후반부 갭 → 전반부 대응점
    const symmetricIndex = totalLength - 1 - gapIndex;
    return symmetricIndex;
  }
}
```

**갭 해결 방법:**
1. **대칭 구간 복사 (Symmetric Segment Copy)**
   - 전반부 갭 → 후반부의 대응 구간을 역순으로 복사
   - 후반부 갭 → 전반부의 대응 구간을 역순으로 복사

```javascript
function fillGapWithSymmetricSegment(points, gapStartIdx, gapEndIdx) {
  const totalLength = points.length;
  const midpoint = Math.floor(totalLength / 2);

  if (gapStartIdx < midpoint) {
    // 전반부 갭 → 후반부에서 찾기
    const symmetricEnd = totalLength - 1 - gapStartIdx;
    const symmetricStart = totalLength - 1 - gapEndIdx;

    // 후반부 대응 구간 추출 (역순)
    const segment = [];
    for (let i = symmetricEnd; i >= symmetricStart; i--) {
      segment.push(points[i]);
    }
    return segment;
  } else {
    // 후반부 갭 → 전반부에서 찾기
    const symmetricEnd = totalLength - 1 - gapStartIdx;
    const symmetricStart = totalLength - 1 - gapEndIdx;

    // 전반부 대응 구간 추출 (역순)
    const segment = [];
    for (let i = symmetricStart; i <= symmetricEnd; i++) {
      segment.push(points[i]);
    }
    segment.reverse();
    return segment;
  }
}
```

**장점:** 실제 GPS 데이터, 완벽한 대칭성
**단점:** 완전 왕복이 아니면 실패

2. **대체 방법: 선형 보간**
   - 대칭 구간 매칭 실패 시 사용

---

## 2. 종합 해결 전략

### 우선순위
1. **실제 GPS 데이터 사용** (Type 2, 4)
2. **선형 보간** (Type 1, 3 또는 실패 시)

### 알고리즘 순서
```javascript
function fillGap(trail, gap) {
  // 1. 등산로 유형 파악
  const trailType = classifyTrail(trail);

  // 2. 유형별 전략 적용
  switch(trailType) {
    case 1: // Linear
      return linearInterpolate(gap.start, gap.end);

    case 2: // Partial Out-and-Back
      const matchedSegment = findMatchingSegment(trail, gap);
      return matchedSegment || linearInterpolate(gap.start, gap.end);

    case 3: // Loop
      return linearInterpolate(gap.start, gap.end);

    case 4: // Complete Out-and-Back
      const symmetricSegment = fillGapWithSymmetricSegment(trail, gap);
      return symmetricSegment || linearInterpolate(gap.start, gap.end);
  }
}
```

### 검증 방법
```javascript
function validateFix(originalPoints, fixedPoints) {
  // 1. 포인트 수 증가 확인
  const increase = fixedPoints.length - originalPoints.length;
  console.log('Added points:', increase);

  // 2. 갭 제거 확인
  const remainingGaps = detectAnomalies(fixedPoints);
  console.log('Remaining gaps:', remainingGaps.length);

  // 3. 평균 간격 확인
  const avgDistance = calculateAverageDistance(fixedPoints);
  console.log('Average spacing:', avgDistance, 'm');

  // 4. 최대 간격 확인
  const maxDistance = calculateMaxDistance(fixedPoints);
  console.log('Max spacing:', maxDistance, 'm');

  // 5. 중복 확인
  const duplicates = countConsecutiveDuplicates(fixedPoints);
  console.log('Duplicates:', duplicates);

  return remainingGaps.length === 0 && duplicates === 0;
}
```

---

## 3. 가리왕산 2번 코스 분석

### 현재 상태
- 유형: **Type 2 (부분 왕복)**
- 원본: 272 포인트
- 수정 후: 1,718 포인트 (역방향), 1,552 포인트 (정방향)
- 갭: 완전히 제거됨

### 사용된 방법
1. Type 2 전략 (왕복 구간 매칭)
2. 갭 이전/이후 구간에서 실제 GPS 데이터 찾기
3. 매칭 성공 시 실제 경로 사용
4. 매칭 실패 시 선형 보간

### 결과
- ✅ 최대 간격: 45-49m (정상)
- ✅ 이상 구간: 0개
- ✅ 평활도: 양호
- ✅ 중복: 제거 완료

---

## 4. 권장 사항

### Type 2 등산로 (부분 왕복) 처리
1. **먼저 왕복 구간 식별**
   - 전체 경로에서 유사한 좌표를 가진 구간 찾기
   - 50-100m 이내 근접 구간 매핑

2. **갭 위치 확인**
   - 왕복 구간 내부인지 확인
   - 왕복 구간 외부인지 확인

3. **적절한 방법 선택**
   - 왕복 구간 내: 대응 구간 사용
   - 왕복 구간 외: 선형 보간

### 포인트 수 증가에 대하여
- 원본 갭이 4km 이상 → 50m 간격으로 채우면 80+ 포인트 필요
- 여러 갭 존재 시 포인트 수 크게 증가는 정상
- **중요한 것은 갭이 제거되고 경로가 자연스러운가**

### 검증 기준
- [ ] 이상 구간 0개
- [ ] 최대 간격 < 100m
- [ ] 평균 간격 20-30m
- [ ] 중복 포인트 없음
- [ ] 경로가 실제 등산로를 따라감
