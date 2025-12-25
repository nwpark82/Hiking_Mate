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
 * 왕복 경로 방식으로 갭 채우기
 */
function fillGapWithRoundtrip(coords: Coordinate[], gapStart: number, gapEnd: number): Coordinate[] {
  console.log(`\n🔧 갭 처리 시작: 인덱스 ${gapStart} → ${gapEnd}`);

  const gapDistance = calculateDistance(
    coords[gapStart].lat,
    coords[gapStart].lng,
    coords[gapEnd].lat,
    coords[gapEnd].lng
  );

  console.log(`   거리: ${gapDistance.toFixed(1)}m`);

  // 갭 끝점과 가장 가까운 이전 포인트 찾기
  let closestIndex = -1;
  let closestDistance = Infinity;

  for (let i = 0; i < gapStart; i++) {
    const dist = calculateDistance(
      coords[i].lat,
      coords[i].lng,
      coords[gapEnd].lat,
      coords[gapEnd].lng
    );

    if (dist < closestDistance) {
      closestDistance = dist;
      closestIndex = i;
    }
  }

  if (closestIndex === -1) {
    console.log(`   ⚠️  가까운 지점을 찾지 못함 - 직선 보간 사용`);

    // 직선 보간
    const numSegments = Math.ceil(gapDistance / 50);
    const interpolated: Coordinate[] = [];

    for (let i = 1; i < numSegments; i++) {
      const ratio = i / numSegments;
      const lat = coords[gapStart].lat + (coords[gapEnd].lat - coords[gapStart].lat) * ratio;
      const lng = coords[gapStart].lng + (coords[gapEnd].lng - coords[gapStart].lng) * ratio;

      let altitude: number | undefined;
      if (coords[gapStart].altitude !== undefined && coords[gapEnd].altitude !== undefined) {
        altitude = coords[gapStart].altitude + (coords[gapEnd].altitude - coords[gapStart].altitude) * ratio;
      }

      interpolated.push({ lat, lng, altitude });
    }

    console.log(`   ✅ 직선 보간: ${interpolated.length}개 포인트 추가\n`);
    return interpolated;
  }

  console.log(`   📍 가장 가까운 지점: 인덱스 ${closestIndex} (거리 ${closestDistance.toFixed(1)}m)`);

  // 왕복 경로 생성 (역순)
  const roundtripSegment: Coordinate[] = [];
  for (let i = gapStart; i >= closestIndex; i--) {
    roundtripSegment.push(coords[i]);
  }

  console.log(`   ✅ 왕복 경로: ${roundtripSegment.length}개 포인트 추가 (인덱스 ${gapStart} → ${closestIndex} 역순)\n`);

  return roundtripSegment;
}

async function fixGyeryongsan5Course() {
  console.log('🚀 계룡산 5번 코스 수정 시작\n');
  console.log('='.repeat(80));
  console.log('작업 내용:');
  console.log('  1. 도착지점을 출발지점으로 변경 (순환 경로)');
  console.log('  2. 기존 도착지점과 신규 도착지점 사이를 갭으로 간주');
  console.log('  3. 왕복 경로 방식으로 갭 채우기');
  console.log('='.repeat(80));
  console.log('');

  // 계룡산 5번 코스 조회
  const { data: trail, error } = await supabase
    .from('trails')
    .select('id, name, mountain, path_coordinates')
    .eq('mountain', '계룡산')
    .ilike('name', '%5번%')
    .ilike('name', '%왕복%')
    .single();

  if (error || !trail) {
    console.error('❌ 계룡산 5번 코스를 찾을 수 없습니다:', error?.message);
    return;
  }

  console.log(`📋 등산로: ${trail.name}`);
  console.log(`🆔 ID: ${trail.id}\n`);

  const coords = trail.path_coordinates as Coordinate[];

  console.log('📊 현재 상태:');
  console.log(`   총 좌표 수: ${coords.length}개`);
  console.log(`   출발점: lat=${coords[0].lat.toFixed(6)}, lng=${coords[0].lng.toFixed(6)}, alt=${coords[0].altitude}m`);
  console.log(`   도착점: lat=${coords[coords.length - 1].lat.toFixed(6)}, lng=${coords[coords.length - 1].lng.toFixed(6)}, alt=${coords[coords.length - 1].altitude}m`);

  const distanceToStart = calculateDistance(
    coords[coords.length - 1].lat,
    coords[coords.length - 1].lng,
    coords[0].lat,
    coords[0].lng
  );

  console.log(`   현재 도착점 → 출발점 거리: ${distanceToStart.toFixed(1)}m\n`);

  // 갭 채우기
  const gapFillSegment = fillGapWithRoundtrip(coords, coords.length - 1, 0);

  // 새로운 경로 생성: 기존 경로 + 갭 채우기 세그먼트
  const newCoords = [...coords, ...gapFillSegment];

  console.log('📊 수정 결과:');
  console.log(`   총 좌표 수: ${coords.length}개 → ${newCoords.length}개 (+${gapFillSegment.length}개)`);
  console.log(`   출발점: lat=${newCoords[0].lat.toFixed(6)}, lng=${newCoords[0].lng.toFixed(6)}, alt=${newCoords[0].altitude}m`);
  console.log(`   도착점: lat=${newCoords[newCoords.length - 1].lat.toFixed(6)}, lng=${newCoords[newCoords.length - 1].lng.toFixed(6)}, alt=${newCoords[newCoords.length - 1].altitude}m`);

  // 거리 재계산
  let totalDistance = 0;
  for (let i = 1; i < newCoords.length; i++) {
    totalDistance += calculateDistance(
      newCoords[i - 1].lat,
      newCoords[i - 1].lng,
      newCoords[i].lat,
      newCoords[i].lng
    );
  }

  console.log(`   총 거리: ${(totalDistance / 1000).toFixed(2)}km\n`);

  // 고도 통계
  const altitudes = newCoords.map(c => c.altitude || 0);
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const avgAlt = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;

  console.log('📊 고도 통계:');
  console.log(`   최저 고도: ${Math.round(minAlt)}m`);
  console.log(`   최고 고도: ${Math.round(maxAlt)}m`);
  console.log(`   평균 고도: ${Math.round(avgAlt)}m\n`);

  // 데이터베이스 업데이트
  console.log('📤 데이터베이스 업데이트 중...');

  const { error: updateError } = await supabase
    .from('trails')
    .update({
      path_coordinates: newCoords,
      start_latitude: newCoords[0].lat,
      start_longitude: newCoords[0].lng,
      distance: Math.round(totalDistance),
      min_altitude: Math.round(minAlt),
      max_altitude: Math.round(maxAlt),
      avg_altitude: Math.round(avgAlt),
      updated_at: new Date().toISOString()
    })
    .eq('id', trail.id);

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError.message);
    return;
  }

  console.log('✅ 업데이트 완료!\n');
  console.log('='.repeat(80));
  console.log('✨ 계룡산 5번 코스 수정 완료!');
  console.log('='.repeat(80));
}

fixGyeryongsan5Course().then(() => process.exit(0));
