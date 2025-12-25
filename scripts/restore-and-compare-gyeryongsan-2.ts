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

async function restoreTrailFromGPX(trailId: string, trailName: string) {
  console.log(`\n📋 ${trailName}`);
  console.log('─'.repeat(80));

  const { data: trail, error } = await supabase
    .from('trails')
    .select('id, name, path_coordinates, gpx_data')
    .eq('id', trailId)
    .single();

  if (error || !trail) {
    console.error(`❌ ${trailName}을 찾을 수 없습니다:`, error?.message);
    return null;
  }

  const currentCoords = trail.path_coordinates as Coordinate[];
  const gpxData = trail.gpx_data as any;

  if (!gpxData?.trackPoints) {
    console.error(`❌ GPX trackPoints 데이터가 없습니다.`);
    return null;
  }

  // 원본 좌표 생성
  const originalCoords: Coordinate[] = gpxData.trackPoints.map((pt: any) => ({
    lat: pt.lat,
    lng: pt.lon,
    altitude: pt.ele
  }));

  console.log(`현재 상태: ${currentCoords.length}개 좌표`);
  console.log(`원본 데이터: ${originalCoords.length}개 좌표\n`);

  // 거리 계산
  let totalDistance = 0;
  for (let i = 1; i < originalCoords.length; i++) {
    totalDistance += calculateDistance(
      originalCoords[i - 1].lat,
      originalCoords[i - 1].lng,
      originalCoords[i].lat,
      originalCoords[i].lng
    );
  }

  // 고도 통계
  const altitudes = originalCoords.map(c => c.altitude || 0);
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const avgAlt = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;

  console.log('📍 출발점:');
  console.log(`   위치: lat=${originalCoords[0].lat.toFixed(6)}, lng=${originalCoords[0].lng.toFixed(6)}`);
  console.log(`   고도: ${originalCoords[0].altitude?.toFixed(1)}m\n`);

  console.log('📍 도착점:');
  console.log(`   위치: lat=${originalCoords[originalCoords.length - 1].lat.toFixed(6)}, lng=${originalCoords[originalCoords.length - 1].lng.toFixed(6)}`);
  console.log(`   고도: ${originalCoords[originalCoords.length - 1].altitude?.toFixed(1)}m\n`);

  console.log('📊 경로 정보:');
  console.log(`   총 거리: ${(totalDistance / 1000).toFixed(2)}km`);
  console.log(`   최저 고도: ${Math.round(minAlt)}m`);
  console.log(`   최고 고도: ${Math.round(maxAlt)}m`);
  console.log(`   평균 고도: ${Math.round(avgAlt)}m`);
  console.log(`   출발-도착 고도차: ${Math.abs(originalCoords[0].altitude! - originalCoords[originalCoords.length - 1].altitude!).toFixed(1)}m\n`);

  // 데이터베이스 업데이트
  const { error: updateError } = await supabase
    .from('trails')
    .update({
      path_coordinates: originalCoords,
      start_latitude: originalCoords[0].lat,
      start_longitude: originalCoords[0].lng,
      distance: Math.round(totalDistance),
      min_altitude: Math.round(minAlt),
      max_altitude: Math.round(maxAlt),
      avg_altitude: Math.round(avgAlt),
      updated_at: new Date().toISOString()
    })
    .eq('id', trailId);

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError.message);
    return null;
  }

  console.log('✅ GPX 원본 데이터로 복원 완료!');

  return {
    name: trailName,
    coords: originalCoords,
    distance: totalDistance,
    minAlt,
    maxAlt,
    avgAlt
  };
}

async function restoreAndCompareGyeryongsan2() {
  console.log('🚀 계룡산 2번 코스 원본 복원 및 비교\n');
  console.log('='.repeat(80));
  console.log('작업 내용:');
  console.log('  1. 정방향/역방향 모두 GPX 원본 데이터로 복원');
  console.log('  2. 출발점/도착점 표시');
  console.log('  3. 두 코스 비교 분석');
  console.log('='.repeat(80));

  // 계룡산 2번 코스 정방향, 역방향 조회
  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain')
    .eq('mountain', '계룡산')
    .ilike('name', '%2번%')
    .order('name', { ascending: true });

  if (error || !trails || trails.length === 0) {
    console.error('❌ 계룡산 2번 코스를 찾을 수 없습니다:', error?.message);
    return;
  }

  console.log(`\n📊 발견된 등산로: ${trails.length}개\n`);

  const results = [];

  for (const trail of trails) {
    const result = await restoreTrailFromGPX(trail.id, trail.name);
    if (result) {
      results.push(result);
    }
  }

  // 비교 분석
  if (results.length === 2) {
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 두 코스 비교 분석');
    console.log('='.repeat(80));

    const forward = results[0];
    const reverse = results[1];

    console.log('\n🔍 경로 비교:');
    console.log(`   정방향 거리: ${(forward.distance / 1000).toFixed(2)}km`);
    console.log(`   역방향 거리: ${(reverse.distance / 1000).toFixed(2)}km`);
    console.log(`   거리 차이: ${Math.abs(forward.distance - reverse.distance).toFixed(0)}m`);

    console.log('\n🔍 출발점 비교:');
    console.log(`   정방향: lat=${forward.coords[0].lat.toFixed(6)}, lng=${forward.coords[0].lng.toFixed(6)}, alt=${forward.coords[0].altitude?.toFixed(1)}m`);
    console.log(`   역방향: lat=${reverse.coords[0].lat.toFixed(6)}, lng=${reverse.coords[0].lng.toFixed(6)}, alt=${reverse.coords[0].altitude?.toFixed(1)}m`);

    const startDistance = calculateDistance(
      forward.coords[0].lat,
      forward.coords[0].lng,
      reverse.coords[0].lat,
      reverse.coords[0].lng
    );
    console.log(`   출발점 간 거리: ${startDistance.toFixed(1)}m`);

    console.log('\n🔍 도착점 비교:');
    console.log(`   정방향: lat=${forward.coords[forward.coords.length - 1].lat.toFixed(6)}, lng=${forward.coords[forward.coords.length - 1].lng.toFixed(6)}, alt=${forward.coords[forward.coords.length - 1].altitude?.toFixed(1)}m`);
    console.log(`   역방향: lat=${reverse.coords[reverse.coords.length - 1].lat.toFixed(6)}, lng=${reverse.coords[reverse.coords.length - 1].lng.toFixed(6)}, alt=${reverse.coords[reverse.coords.length - 1].altitude?.toFixed(1)}m`);

    const endDistance = calculateDistance(
      forward.coords[forward.coords.length - 1].lat,
      forward.coords[forward.coords.length - 1].lng,
      reverse.coords[reverse.coords.length - 1].lat,
      reverse.coords[reverse.coords.length - 1].lng
    );
    console.log(`   도착점 간 거리: ${endDistance.toFixed(1)}m`);

    console.log('\n💡 분석 결과:');
    if (startDistance < 50 && endDistance < 50) {
      console.log('   ✅ 정방향과 역방향이 거의 동일한 출발/도착 지점을 가집니다.');
      console.log('   ✅ 정상적인 왕복 코스 또는 순환 코스입니다.');
    } else if (startDistance < 50) {
      console.log('   ⚠️  출발점은 동일하지만 도착점이 다릅니다.');
      console.log('   💡 한쪽 방향만 유효할 가능성이 있습니다.');
    } else {
      console.log('   ⚠️  출발점과 도착점이 모두 다릅니다.');
      console.log('   💡 서로 다른 구간의 코스일 수 있습니다.');
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('✨ 복원 및 비교 완료!');
  console.log('='.repeat(80));
}

restoreAndCompareGyeryongsan2().then(() => process.exit(0));
