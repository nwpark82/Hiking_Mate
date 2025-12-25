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

async function restoreGyeryongsan2ReverseFromGPX() {
  console.log('🚀 계룡산 2번 코스 역방향 원본 복원 시작\n');
  console.log('='.repeat(80));
  console.log('작업 내용:');
  console.log('  1. GPX 원본 trackPoints 데이터 추출');
  console.log('  2. path_coordinates 재생성 (altitude 포함)');
  console.log('  3. 거리 및 고도 통계 재계산');
  console.log('  4. 데이터베이스 업데이트');
  console.log('='.repeat(80));
  console.log('');

  // 계룡산 2번 코스 역방향 조회
  const { data: trail, error } = await supabase
    .from('trails')
    .select('id, name, mountain, path_coordinates, gpx_data')
    .eq('mountain', '계룡산')
    .ilike('name', '%2번%')
    .ilike('name', '%역방향%')
    .single();

  if (error || !trail) {
    console.error('❌ 계룡산 2번 코스 역방향을 찾을 수 없습니다:', error?.message);
    return;
  }

  console.log(`📋 등산로: ${trail.name}`);
  console.log(`🆔 ID: ${trail.id}\n`);

  const currentCoords = trail.path_coordinates as Coordinate[];
  console.log('📊 현재 상태:');
  console.log(`   총 좌표 수: ${currentCoords.length}개`);
  console.log(`   출발점: lat=${currentCoords[0].lat.toFixed(6)}, lng=${currentCoords[0].lng.toFixed(6)}, alt=${currentCoords[0].altitude}m`);
  console.log(`   도착점: lat=${currentCoords[currentCoords.length - 1].lat.toFixed(6)}, lng=${currentCoords[currentCoords.length - 1].lng.toFixed(6)}, alt=${currentCoords[currentCoords.length - 1].altitude}m\n`);

  // GPX 데이터에서 원본 trackPoints 추출
  const gpxData = trail.gpx_data as any;

  if (!gpxData?.trackPoints) {
    console.error('❌ GPX trackPoints 데이터가 없습니다.');
    return;
  }

  console.log('📂 GPX 원본 데이터 추출 중...');

  // 원본 좌표 생성 (altitude 포함)
  const originalCoords: Coordinate[] = gpxData.trackPoints.map((pt: any) => ({
    lat: pt.lat,
    lng: pt.lon,
    altitude: pt.ele
  }));

  console.log(`✅ 원본 좌표 추출 완료: ${originalCoords.length}개\n`);

  console.log('📊 원본 데이터:');
  console.log(`   총 좌표 수: ${originalCoords.length}개`);
  console.log(`   출발점: lat=${originalCoords[0].lat.toFixed(6)}, lng=${originalCoords[0].lng.toFixed(6)}, alt=${originalCoords[0].altitude}m`);
  console.log(`   도착점: lat=${originalCoords[originalCoords.length - 1].lat.toFixed(6)}, lng=${originalCoords[originalCoords.length - 1].lng.toFixed(6)}, alt=${originalCoords[originalCoords.length - 1].altitude}m\n`);

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

  console.log(`   총 거리: ${(totalDistance / 1000).toFixed(2)}km\n`);

  // 고도 통계
  const altitudes = originalCoords.map(c => c.altitude || 0);
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const avgAlt = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;

  console.log('📊 고도 통계:');
  console.log(`   최저 고도: ${Math.round(minAlt)}m`);
  console.log(`   최고 고도: ${Math.round(maxAlt)}m`);
  console.log(`   평균 고도: ${Math.round(avgAlt)}m\n`);

  // 변경 사항 요약
  console.log('📊 변경 사항:');
  console.log(`   좌표 수: ${currentCoords.length}개 → ${originalCoords.length}개 (${originalCoords.length > currentCoords.length ? '+' : ''}${originalCoords.length - currentCoords.length}개)`);

  const oldDistance = currentCoords.reduce((sum, coord, i) => {
    if (i === 0) return 0;
    return sum + calculateDistance(
      currentCoords[i - 1].lat,
      currentCoords[i - 1].lng,
      coord.lat,
      coord.lng
    );
  }, 0);

  console.log(`   거리: ${(oldDistance / 1000).toFixed(2)}km → ${(totalDistance / 1000).toFixed(2)}km\n`);

  // 데이터베이스 업데이트
  console.log('📤 데이터베이스 업데이트 중...');

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
    .eq('id', trail.id);

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError.message);
    return;
  }

  console.log('✅ 업데이트 완료!\n');
  console.log('='.repeat(80));
  console.log('✨ 계룡산 2번 코스 역방향 원본 복원 완료!');
  console.log('='.repeat(80));
}

restoreGyeryongsan2ReverseFromGPX().then(() => process.exit(0));
