import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 환경 변수 로드
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const kakaoApiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Haversine 공식으로 두 지점 간 거리 계산 (미터)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 경로 중복률 계산
function calculateOverlapRate(coords) {
  if (!coords || coords.length === 0) return 0;

  const visitCount = new Map();

  coords.forEach(coord => {
    // 소수점 5자리로 키 생성 (약 1m 정밀도)
    const key = `${coord.lat.toFixed(5)},${coord.lng.toFixed(5)}`;
    visitCount.set(key, (visitCount.get(key) || 0) + 1);
  });

  // 2회 이상 방문한 지점 수
  let duplicateCount = 0;
  for (const count of visitCount.values()) {
    if (count >= 2) {
      duplicateCount++;
    }
  }

  const overlapRate = duplicateCount / coords.length;

  return {
    rate: overlapRate,
    duplicatePoints: duplicateCount,
    totalPoints: coords.length,
    uniquePoints: visitCount.size
  };
}

// 중복 제거 (연속된 중복 포인트)
function removeDuplicates(coords) {
  if (coords.length === 0) return coords;

  const result = [coords[0]];

  for (let i = 1; i < coords.length; i++) {
    const prev = result[result.length - 1];
    // 이전 포인트와 10m 이상 떨어진 경우만 추가
    const dist = calculateDistance(coords[i].lat, coords[i].lng, prev.lat, prev.lng);
    if (dist >= 10) {
      result.push(coords[i]);
    }
  }

  return result;
}

// 갭 감지 및 역순 경로 추가 (왔던 길을 되돌아가는 형태)
function detectAndFillGaps(coords, gapThreshold = 100) {
  if (coords.length < 2) return { coords, hasGap: false, gapCount: 0 };

  let gapCount = 0;
  let maxGapDistance = 0;
  let gapIndex = -1;

  // 1. 갭 찾기: 연속된 두 포인트 간 거리 확인
  for (let i = 0; i < coords.length - 1; i++) {
    const dist = calculateDistance(
      coords[i].lat,
      coords[i].lng,
      coords[i + 1].lat,
      coords[i + 1].lng
    );

    if (dist > gapThreshold) {
      gapCount++;
      if (dist > maxGapDistance) {
        maxGapDistance = dist;
        gapIndex = i; // 가장 큰 갭의 위치
      }
    }
  }

  // 2. 갭이 없으면 그대로 반환
  if (gapCount === 0) {
    return { coords, hasGap: false, gapCount: 0 };
  }

  // 3. 가장 큰 갭이 발견되면, 갭 전까지의 경로를 역순으로 추가
  // 예: [A, B, C, D | 갭 | E, F] → [A, B, C, D, D, C, B, A]
  const beforeGap = coords.slice(0, gapIndex + 1); // 갭 전까지 (갭 직전 포인트 포함)
  const reversed = beforeGap.slice(0, -1).reverse(); // 마지막 포인트 제외하고 역순

  const result = [...beforeGap, ...reversed];

  return {
    coords: result,
    hasGap: true,
    gapCount,
    maxGapDistance: Math.round(maxGapDistance),
    gapIndex,
    originalLength: coords.length,
    newLength: result.length
  };
}

// 도로 근접 웨이포인트 카테고리
const ROAD_CATEGORIES = ['ENTRY', 'PARK', 'TRANS'];

// 웨이포인트 기반 도로 근접성 확인
function isNearRoadWaypoint(point, waypoints, thresholdMeters = 500) {
  if (!waypoints || waypoints.length === 0) {
    return { isNear: false };
  }

  for (const wp of waypoints) {
    if (ROAD_CATEGORIES.includes(wp.category)) {
      const dist = calculateDistance(
        point.lat,
        point.lon || point.lng,
        wp.lat,
        wp.lon
      );

      if (dist < thresholdMeters) {
        return {
          isNear: true,
          waypoint: wp,
          distance: dist
        };
      }
    }
  }

  return { isNear: false };
}

// 카카오맵 API로 도로 근접성 확인
async function isNearRoadKakao(lat, lon, thresholdMeters = 500) {
  try {
    // 주차장 검색
    const parkingUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=PK6&x=${lon}&y=${lat}&radius=${thresholdMeters}&sort=distance`;
    const parkingResponse = await fetch(parkingUrl, {
      headers: { 'Authorization': `KakaoAK ${kakaoApiKey}` }
    });

    if (parkingResponse.ok) {
      const parkingData = await parkingResponse.json();
      if (parkingData.documents && parkingData.documents.length > 0) {
        return {
          isNear: true,
          type: '주차장',
          name: parkingData.documents[0].place_name,
          distance: parseInt(parkingData.documents[0].distance)
        };
      }
    }

    // 대중교통 검색
    const transitUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=SW8&x=${lon}&y=${lat}&radius=${thresholdMeters}&sort=distance`;
    const transitResponse = await fetch(transitUrl, {
      headers: { 'Authorization': `KakaoAK ${kakaoApiKey}` }
    });

    if (transitResponse.ok) {
      const transitData = await transitResponse.json();
      if (transitData.documents && transitData.documents.length > 0) {
        return {
          isNear: true,
          type: '대중교통',
          name: transitData.documents[0].place_name,
          distance: parseInt(transitData.documents[0].distance)
        };
      }
    }

    // API 레이트 리밋 방지
    await new Promise(resolve => setTimeout(resolve, 100));

    return { isNear: false };
  } catch (error) {
    console.error(`   ⚠️  카카오맵 API 오류:`, error.message);
    return { isNear: false };
  }
}

// 등산로 유형 분류
async function classifyTrail(trail) {
  // 1. 좌표 변환 및 중복 제거
  let coords = trail.trackPoints.map(pt => ({
    lat: pt.lat,
    lng: pt.lon
  }));

  coords = removeDuplicates(coords);

  // 2. 갭 감지 및 역순 경로 추가
  const gapInfo = detectAndFillGaps(coords, 100);
  coords = gapInfo.coords;

  // 3. 시작-종료 거리 (갭 채우기 후)
  let start = coords[0];
  let end = coords[coords.length - 1];
  let startToEnd = calculateDistance(start.lat, start.lng, end.lat, end.lng);

  let isCircular = startToEnd < 100; // 시작=종료

  // 4. 경로 중복률 계산
  let overlapInfo = calculateOverlapRate(coords);
  let overlapRate = overlapInfo.rate;

  // 5. 종료점 도로 근접성 검증
  let endNearRoad = false;
  let roadInfo = null;

  // 웨이포인트 검증
  const wpCheck = isNearRoadWaypoint(end, trail.waypoints);
  if (wpCheck.isNear) {
    endNearRoad = true;
    roadInfo = {
      method: 'waypoint',
      ...wpCheck
    };
  } else {
    // 카카오맵 API 검증
    const kakaoCheck = await isNearRoadKakao(end.lat, end.lng);
    if (kakaoCheck.isNear) {
      endNearRoad = true;
      roadInfo = {
        method: 'kakao',
        ...kakaoCheck
      };
    }
  }

  // 6. 유형 분류
  let trailType;
  let typeName;
  let needsRoundtripPath = false;

  if (isCircular) {
    // 시작 = 종료
    if (overlapRate >= 0.8) {
      trailType = 'ROUNDTRIP';
      typeName = '왕복 경로 (완전 중복)';
    } else if (overlapRate >= 0.3) {
      trailType = 'CIRCULAR_PARTIAL';
      typeName = '둘레길 A (부분 중복)';
    } else {
      trailType = 'CIRCULAR_UNIQUE';
      typeName = '둘레길 B (중복 없음)';
    }
  } else {
    // 시작 ≠ 종료
    if (endNearRoad) {
      // 종료점이 도로 근처
      if (overlapRate >= 0.3) {
        trailType = 'ONEWAY_PARTIAL';
        typeName = '편도 A (부분 중복)';
      } else {
        trailType = 'ONEWAY_UNIQUE';
        typeName = '편도 B (중복 없음)';
      }
    } else {
      // 종료점이 도로에서 멀리 → 왕복 경로 생성 필요
      trailType = 'ROUNDTRIP';
      typeName = '왕복 경로 (종료점 도로 멀리)';
      needsRoundtripPath = true;
    }
  }

  // 7. ROUNDTRIP인데 아직 왕복 경로가 아니면 → 왕복 경로 생성
  if (needsRoundtripPath && !isCircular) {
    // 현재 경로를 역순으로 추가 (마지막 포인트 제외)
    const reversed = coords.slice(0, -1).reverse();
    coords = [...coords, ...reversed];

    // 재계산
    start = coords[0];
    end = coords[coords.length - 1];
    startToEnd = calculateDistance(start.lat, start.lng, end.lat, end.lng);
    isCircular = startToEnd < 100;
    overlapInfo = calculateOverlapRate(coords);
    overlapRate = overlapInfo.rate;
  }

  return {
    trailType,
    typeName,
    coords,
    startToEnd,
    overlapInfo,
    roadInfo,
    gapInfo,
    needsRoundtripPath,
    isCircular,
    endNearRoad
  };
}

// DB 초기화
async function clearDatabase() {
  console.log('\n🗑️  기존 데이터 삭제 중...');

  const { error } = await supabase
    .from('trails')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('❌ 데이터 삭제 실패:', error.message);
    return false;
  }

  console.log('✅ 기존 데이터 삭제 완료\n');
  return true;
}

// 메인 처리
async function processTrails() {
  console.log('\n🔄 등산로 분류 및 업로드 시작...\n');

  // 1. 원본 JSON 로드
  const jsonPath = path.join(process.cwd(), 'data', 'bidirectional-trails.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('❌ bidirectional-trails.json 파일이 없습니다.');
    return;
  }

  const allTrails = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`✅ 원본 데이터 로드: ${allTrails.length}개 등산로\n`);

  // 2. DB 초기화
  const cleared = await clearDatabase();
  if (!cleared) return;

  // 3. 정방향만 추출
  const forwardTrails = allTrails.filter(t => t.direction === 'forward');
  console.log(`📊 정방향 등산로: ${forwardTrails.length}개\n`);

  // 4. 통계
  const stats = {
    ROUNDTRIP: 0,
    CIRCULAR_PARTIAL: 0,
    CIRCULAR_UNIQUE: 0,
    ONEWAY_PARTIAL: 0,
    ONEWAY_UNIQUE: 0
  };

  let gapFixedCount = 0;
  let totalGapDistance = 0;

  const toUpload = [];
  let processedCount = 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 등산로 분류 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const trail of forwardTrails) {
    processedCount++;

    if (processedCount % 50 === 0) {
      console.log(`진행: ${processedCount}/${forwardTrails.length} (${Math.round(processedCount/forwardTrails.length*100)}%)`);
    }

    // 5. 분류
    const classification = await classifyTrail(trail);
    stats[classification.trailType]++;

    // 갭 통계
    if (classification.gapInfo.hasGap) {
      gapFixedCount++;
      totalGapDistance += classification.gapInfo.maxGapDistance;
    }

    // 6. 정방향 추가
    toUpload.push({
      trail,
      classification,
      direction: 'forward'
    });

    // 7. 역방향 찾기 및 추가 (왕복 제외)
    if (classification.trailType !== 'ROUNDTRIP') {
      const reverseName = trail.courseName.replace('(정방향)', '(역방향)');
      const reverseTrail = allTrails.find(t => t.courseName === reverseName);

      if (reverseTrail) {
        toUpload.push({
          trail: reverseTrail,
          classification,
          direction: 'reverse'
        });
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 분류 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`   ROUNDTRIP (왕복):        ${stats.ROUNDTRIP}개 → ${stats.ROUNDTRIP}개 업로드`);
  console.log(`   CIRCULAR_PARTIAL (둘레A): ${stats.CIRCULAR_PARTIAL}개 → ${stats.CIRCULAR_PARTIAL * 2}개 업로드`);
  console.log(`   CIRCULAR_UNIQUE (둘레B):  ${stats.CIRCULAR_UNIQUE}개 → ${stats.CIRCULAR_UNIQUE * 2}개 업로드`);
  console.log(`   ONEWAY_PARTIAL (편도A):   ${stats.ONEWAY_PARTIAL}개 → ${stats.ONEWAY_PARTIAL * 2}개 업로드`);
  console.log(`   ONEWAY_UNIQUE (편도B):    ${stats.ONEWAY_UNIQUE}개 → ${stats.ONEWAY_UNIQUE * 2}개 업로드`);
  console.log(`\n   총 업로드: ${toUpload.length}개`);
  console.log(`\n   🔧 갭 수정: ${gapFixedCount}개 (평균 갭 거리: ${gapFixedCount > 0 ? Math.round(totalGapDistance / gapFixedCount) : 0}m)\n`);

  // 8. DB 업로드
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⬆️  데이터베이스 업로드 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let successCount = 0;
  let errorCount = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < toUpload.length; i += BATCH_SIZE) {
    const batch = toUpload.slice(i, Math.min(i + BATCH_SIZE, toUpload.length));

    const trailsToInsert = batch.map(({ trail, classification }) => {
      const coords = classification.coords;

      return {
        name: trail.courseName,
        mountain: trail.mountain,
        region: trail.region,
        difficulty: trail.difficulty,
        distance: trail.distance,
        duration: trail.duration,
        elevation_gain: trail.elevationGain,
        start_latitude: coords[0].lat,
        start_longitude: coords[0].lng,
        path_coordinates: coords,
        trail_type: classification.trailType,
        overlap_rate: classification.overlapInfo.rate,
        gpx_data: {
          waypoints: trail.waypoints,
          trackPoints: trail.trackPoints,
          bounds: trail.bounds,
          direction: trail.direction,
          classification: {
            typeName: classification.typeName,
            startToEnd: classification.startToEnd,
            overlapInfo: classification.overlapInfo,
            roadInfo: classification.roadInfo,
            gapInfo: classification.gapInfo
          }
        },
        coordinates: {
          lat: (trail.bounds.maxLat + trail.bounds.minLat) / 2,
          lng: (trail.bounds.maxLon + trail.bounds.minLon) / 2
        },
        description: null,
        images: [],
        features: ['등산로', trail.category === 'mountain' ? '100대명산' : '숲길']
      };
    });

    const { error } = await supabase
      .from('trails')
      .insert(trailsToInsert);

    if (error) {
      console.error(`❌ 배치 ${Math.floor(i / BATCH_SIZE) + 1} 실패:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`✓ 배치 ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length}개 업로드 (${successCount}/${toUpload.length})`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 9. 최종 결과
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 최종 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`   ✅ 업로드 성공: ${successCount}개`);
  console.log(`   ❌ 업로드 실패: ${errorCount}개`);
  console.log(`   📈 총 등산로: ${successCount}개\n`);

  // 검증
  const { count } = await supabase
    .from('trails')
    .select('*', { count: 'exact', head: true });

  console.log(`   🔍 DB 검증: ${count}개 레코드 확인\n`);

  console.log('✅ 등산로 분류 및 업로드 완료!\n');
}

// 실행
processTrails().catch(console.error);
