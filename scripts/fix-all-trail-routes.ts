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
 */
function interpolateGap(
  from: Coordinate,
  to: Coordinate,
  maxSegmentLength: number = 50
): Coordinate[] {
  const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
  const numSegments = Math.ceil(distance / maxSegmentLength);

  if (numSegments <= 1) {
    return [];
  }

  const interpolated: Coordinate[] = [];

  for (let i = 1; i < numSegments; i++) {
    const ratio = i / numSegments;
    const lat = from.lat + (to.lat - from.lat) * ratio;
    const lng = from.lng + (to.lng - from.lng) * ratio;

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
function fillGaps(coords: Coordinate[], gapThreshold: number = 100): {
  coords: Coordinate[];
  gapsFilled: number;
} {
  const result: Coordinate[] = [];
  let gapsFilled = 0;

  for (let i = 0; i < coords.length; i++) {
    result.push(coords[i]);

    if (i < coords.length - 1) {
      const dist = calculateDistance(
        coords[i].lat,
        coords[i].lng,
        coords[i + 1].lat,
        coords[i + 1].lng
      );

      if (dist > gapThreshold) {
        const interpolated = interpolateGap(coords[i], coords[i + 1]);
        result.push(...interpolated);
        gapsFilled++;
      }
    }
  }

  return { coords: result, gapsFilled };
}

/**
 * 등산로 방향 판단 및 재정렬
 * - "역방향": 하산 코스 → 낮은 곳에서 시작
 * - "정방향": 등산 코스 → 낮은 곳에서 시작하여 높은 곳으로
 */
function normalizeTrailDirection(
  coords: Coordinate[],
  trailName: string
): { coords: Coordinate[]; reordered: boolean } {
  const altitudes = coords.map(c => c.altitude || 999999);
  const minAltIndex = altitudes.indexOf(Math.min(...altitudes));
  const maxAltIndex = altitudes.indexOf(Math.max(...altitudes));

  const startAlt = coords[0].altitude || 0;
  const endAlt = coords[coords.length - 1].altitude || 0;

  // 출발점이 이미 낮은 고도(<200m)이면 재정렬 불필요
  if (startAlt < 200) {
    return { coords, reordered: false };
  }

  // 가장 낮은 지점을 출발점으로 재정렬
  const reordered = [
    ...coords.slice(minAltIndex),
    ...coords.slice(0, minAltIndex)
  ];

  return { coords: reordered, reordered: true };
}

/**
 * 특정 등산로 수정
 */
async function fixTrailRoute(trailId: string, trailName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏔️  ${trailName}`);
  console.log('='.repeat(60));

  // 1. 데이터 조회
  const { data, error } = await supabase
    .from('trails')
    .select('id, name, path_coordinates')
    .eq('id', trailId)
    .single();

  if (error || !data) {
    console.error('❌ 데이터 조회 실패:', error?.message);
    return { success: false };
  }

  const originalCoords = data.path_coordinates as Coordinate[];
  console.log(`\n📍 원본 좌표: ${originalCoords.length}개`);
  console.log(`   출발 고도: ${originalCoords[0].altitude}m`);
  console.log(`   도착 고도: ${originalCoords[originalCoords.length - 1].altitude}m`);

  // 2. 방향 정규화
  const { coords: normalizedCoords, reordered } = normalizeTrailDirection(
    originalCoords,
    trailName
  );

  if (reordered) {
    console.log(`\n✅ 출발점 재정렬 완료`);
    console.log(`   새 출발 고도: ${normalizedCoords[0].altitude}m`);
    console.log(`   새 도착 고도: ${normalizedCoords[normalizedCoords.length - 1].altitude}m`);
  } else {
    console.log(`\n✓  출발점 정상 (재정렬 불필요)`);
  }

  // 3. 갭 보간
  const { coords: filledCoords, gapsFilled } = fillGaps(normalizedCoords, 100);

  if (gapsFilled > 0) {
    console.log(`\n✅ 갭 보간 완료: ${gapsFilled}개 갭, ${filledCoords.length - normalizedCoords.length}개 포인트 추가`);
  } else {
    console.log(`\n✓  갭 없음`);
  }

  // 4. 거리 재계산
  let totalDistance = 0;
  for (let i = 1; i < filledCoords.length; i++) {
    totalDistance += calculateDistance(
      filledCoords[i - 1].lat,
      filledCoords[i - 1].lng,
      filledCoords[i].lat,
      filledCoords[i].lng
    );
  }

  // 5. 업데이트 필요 여부 확인
  const needsUpdate = reordered || gapsFilled > 0;

  if (!needsUpdate) {
    console.log('\n✓  수정 불필요 - 데이터가 이미 정상입니다');
    return { success: true, updated: false };
  }

  // 6. 데이터베이스 업데이트
  console.log(`\n📤 데이터베이스 업데이트 중...`);

  const { error: updateError } = await supabase
    .from('trails')
    .update({
      path_coordinates: filledCoords,
      start_latitude: filledCoords[0].lat,
      start_longitude: filledCoords[0].lng,
      distance: Math.round(totalDistance),
      updated_at: new Date().toISOString()
    })
    .eq('id', trailId);

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError.message);
    return { success: false };
  }

  console.log('✅ 업데이트 완료\n');
  console.log(`   최종 좌표 수: ${filledCoords.length}개`);
  console.log(`   최종 거리: ${(totalDistance / 1000).toFixed(2)}km`);
  console.log(`   출발점: lat=${filledCoords[0].lat}, lng=${filledCoords[0].lng}, alt=${filledCoords[0].altitude}m`);

  return { success: true, updated: true };
}

async function fixAllTrailRoutes() {
  console.log('🚀 등산로 경로 일괄 수정 시작\n');

  // Tier 1 등산로 목록
  const trails = [
    { id: '8ce61126-a2ee-4e7f-ad7f-34861c6c1dbf', name: '북한산 9번 코스 (역방향)' },
    { id: '5d5a0bea-1958-4108-9cdd-d872dc1ba1a0', name: '관악산 1번 코스 (정방향)' }
  ];

  let successCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const trail of trails) {
    const result = await fixTrailRoute(trail.id, trail.name);

    if (result.success) {
      successCount++;
      if (result.updated) {
        updatedCount++;
      }
    } else {
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 최종 결과');
  console.log('='.repeat(60));
  console.log(`\n  ✅ 성공: ${successCount}개`);
  console.log(`  📝 업데이트: ${updatedCount}개`);
  console.log(`  ❌ 실패: ${errorCount}개`);
  console.log(`  📈 전체: ${trails.length}개\n`);

  console.log('✨ 모든 등산로 경로 수정 완료!');
}

fixAllTrailRoutes().then(() => process.exit(0));
