import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Coordinate {
  lat: number;
  lng: number;
  altitude?: number;
}

// Haversine 거리 계산 (미터)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

/**
 * 직선 보간으로 갭 채우기
 * 두 지점 사이를 일정 간격으로 분할하여 중간 포인트 생성
 */
function interpolateGap(
  from: Coordinate,
  to: Coordinate,
  maxSegmentLength: number = 50 // 50m 간격
): Coordinate[] {
  const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
  const numSegments = Math.ceil(distance / maxSegmentLength);

  if (numSegments <= 1) {
    return []; // 갭이 작으면 보간 불필요
  }

  const interpolated: Coordinate[] = [];

  for (let i = 1; i < numSegments; i++) {
    const ratio = i / numSegments;

    const lat = from.lat + (to.lat - from.lat) * ratio;
    const lng = from.lng + (to.lng - from.lng) * ratio;

    // 고도도 선형 보간
    let altitude: number | undefined;
    if (from.altitude !== undefined && to.altitude !== undefined) {
      altitude = from.altitude + (to.altitude - from.altitude) * ratio;
    }

    interpolated.push({ lat, lng, altitude });
  }

  return interpolated;
}

/**
 * 갭 탐지 및 보간 처리
 */
function fillGaps(coords: Coordinate[], gapThreshold: number = 100): Coordinate[] {
  const result: Coordinate[] = [];

  for (let i = 0; i < coords.length; i++) {
    result.push(coords[i]);

    if (i < coords.length - 1) {
      const dist = calculateDistance(
        coords[i].lat,
        coords[i].lng,
        coords[i + 1].lat,
        coords[i + 1].lng
      );

      // 갭 발견 시 보간
      if (dist > gapThreshold) {
        const interpolated = interpolateGap(coords[i], coords[i + 1]);
        result.push(...interpolated);

        console.log(`  ✅ 갭 보간: ${dist.toFixed(1)}m → ${interpolated.length}개 포인트 추가`);
      }
    }
  }

  return result;
}

/**
 * 출발점을 가장 낮은 고도로 재정렬
 * "역방향" = 일반적인 등산과 반대 방향 (하산 코스)
 * 따라서 가장 낮은 지점에서 시작하여 올라가야 함
 */
function reorderFromLowestPoint(coords: Coordinate[]): Coordinate[] {
  // 가장 낮은 고도 찾기
  const altitudes = coords.map(c => c.altitude || 999999);
  const minAltIndex = altitudes.indexOf(Math.min(...altitudes));

  console.log(`\n  📍 가장 낮은 지점: 인덱스 ${minAltIndex}, 고도 ${coords[minAltIndex].altitude}m`);

  // 재정렬: minAltIndex부터 시작하여 끝까지, 그 다음 처음부터 minAltIndex 전까지
  const reordered = [
    ...coords.slice(minAltIndex),
    ...coords.slice(0, minAltIndex)
  ];

  console.log(`  ✅ 출발점 재설정: 인덱스 ${minAltIndex} → 0`);
  console.log(`  📊 새 출발점: 고도 ${reordered[0].altitude}m`);
  console.log(`  📊 새 도착점: 고도 ${reordered[reordered.length - 1].altitude}m`);

  return reordered;
}

async function fixBukhansan9Route() {
  console.log('🔧 북한산 9번 코스 경로 수정 시작\n');

  const trailId = '8ce61126-a2ee-4e7f-ad7f-34861c6c1dbf';

  // 1. 현재 데이터 조회
  const { data, error } = await supabase
    .from('trails')
    .select('id, name, path_coordinates')
    .eq('id', trailId)
    .single();

  if (error || !data) {
    console.error('❌ 데이터 조회 실패:', error?.message);
    return;
  }

  const originalCoords = data.path_coordinates as Coordinate[];
  console.log(`📍 원본 좌표: ${originalCoords.length}개`);
  console.log(`   출발: 고도 ${originalCoords[0].altitude}m`);
  console.log(`   도착: 고도 ${originalCoords[originalCoords.length - 1].altitude}m\n`);

  // 2. 출발점 재정렬
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('단계 1: 출발점 재정렬');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const reordered = reorderFromLowestPoint(originalCoords);

  // 3. 갭 보간 처리
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('단계 2: 갭 보간 처리');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const filled = fillGaps(reordered, 100);

  console.log(`\n  📊 보간 후 좌표: ${filled.length}개 (${filled.length - reordered.length}개 추가)`);

  // 4. 새 출발/도착 좌표 계산
  const newStartLat = filled[0].lat;
  const newStartLng = filled[0].lng;

  // 5. 거리 재계산
  let totalDistance = 0;
  for (let i = 1; i < filled.length; i++) {
    totalDistance += calculateDistance(
      filled[i - 1].lat,
      filled[i - 1].lng,
      filled[i].lat,
      filled[i].lng
    );
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('단계 3: 최종 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`  📍 새 출발점: lat=${newStartLat}, lng=${newStartLng}, alt=${filled[0].altitude}m`);
  console.log(`  📍 새 도착점: lat=${filled[filled.length - 1].lat}, lng=${filled[filled.length - 1].lng}, alt=${filled[filled.length - 1].altitude}m`);
  console.log(`  📏 총 거리: ${(totalDistance / 1000).toFixed(2)}km`);
  console.log(`  📊 총 좌표: ${filled.length}개\n`);

  // 6. 데이터베이스 업데이트
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('단계 4: 데이터베이스 업데이트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { error: updateError } = await supabase
    .from('trails')
    .update({
      path_coordinates: filled,
      start_latitude: newStartLat,
      start_longitude: newStartLng,
      distance: Math.round(totalDistance),
      updated_at: new Date().toISOString()
    })
    .eq('id', trailId);

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError.message);
    return;
  }

  console.log('✅ 데이터베이스 업데이트 완료\n');

  // 7. 검증
  const { data: verifyData } = await supabase
    .from('trails')
    .select('path_coordinates, start_latitude, start_longitude')
    .eq('id', trailId)
    .single();

  if (verifyData) {
    const verifyCoords = verifyData.path_coordinates as Coordinate[];
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('검증 결과');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`  ✅ 좌표 수: ${verifyCoords.length}개`);
    console.log(`  ✅ 출발 좌표: ${verifyData.start_latitude}, ${verifyData.start_longitude}`);
    console.log(`  ✅ 출발 고도: ${verifyCoords[0].altitude}m`);
    console.log(`  ✅ 도착 고도: ${verifyCoords[verifyCoords.length - 1].altitude}m`);

    // 출발점이 낮은 고도인지 확인
    if (verifyCoords[0].altitude! < 100) {
      console.log(`  ✅ 출발점 검증 성공 - 낮은 고도(${verifyCoords[0].altitude}m)에서 시작`);
    } else {
      console.log(`  ⚠️  출발점 고도가 여전히 높음: ${verifyCoords[0].altitude}m`);
    }
  }

  console.log('\n✨ 북한산 9번 코스 경로 수정 완료!');
}

fixBukhansan9Route().then(() => process.exit(0));
