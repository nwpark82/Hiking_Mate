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

async function convertGayasan5ToRoundtrip() {
  console.log('🚀 가야산 5번 코스 왕복 경로 변환 시작\n');
  console.log('='.repeat(80));
  console.log('작업 내용:');
  console.log('  1. 경로 역순 변경 (정상에서 출발하도록)');
  console.log('  2. 왕복 경로 생성 (하산 경로 추가)');
  console.log('  3. 출발/도착 지점 동일하게 만들기');
  console.log('='.repeat(80));
  console.log('');

  // 가야산 5번 코스 조회
  const { data: trail, error } = await supabase
    .from('trails')
    .select('id, name, mountain, path_coordinates')
    .eq('mountain', '가야산')
    .ilike('name', '%5번%')
    .ilike('name', '%왕복%')
    .single();

  if (error || !trail) {
    console.error('❌ 가야산 5번 코스를 찾을 수 없습니다:', error?.message);
    return;
  }

  console.log(`📋 등산로: ${trail.name}`);
  console.log(`🆔 ID: ${trail.id}\n`);

  const coords = trail.path_coordinates as Coordinate[];

  console.log('📊 현재 상태:');
  console.log(`   총 좌표 수: ${coords.length}개`);
  console.log(`   출발점: lat=${coords[0].lat.toFixed(6)}, lng=${coords[0].lng.toFixed(6)}, alt=${coords[0].altitude}m`);
  console.log(`   도착점: lat=${coords[coords.length - 1].lat.toFixed(6)}, lng=${coords[coords.length - 1].lng.toFixed(6)}, alt=${coords[coords.length - 1].altitude}m`);

  // 현재 거리 계산
  let currentDistance = 0;
  for (let i = 1; i < coords.length; i++) {
    currentDistance += calculateDistance(
      coords[i - 1].lat,
      coords[i - 1].lng,
      coords[i].lat,
      coords[i].lng
    );
  }
  console.log(`   총 거리: ${(currentDistance / 1000).toFixed(2)}km\n`);

  console.log('🔄 경로 역순 변환 중...');

  // 1. 경로 역순으로 변경 (정상에서 시작하도록)
  const reversedCoords = [...coords].reverse();

  console.log(`✅ 역순 변환 완료`);
  console.log(`   새 출발점: lat=${reversedCoords[0].lat.toFixed(6)}, lng=${reversedCoords[0].lng.toFixed(6)}, alt=${reversedCoords[0].altitude}m`);
  console.log(`   새 도착점: lat=${reversedCoords[reversedCoords.length - 1].lat.toFixed(6)}, lng=${reversedCoords[reversedCoords.length - 1].lng.toFixed(6)}, alt=${reversedCoords[reversedCoords.length - 1].altitude}m\n`);

  console.log('🔧 왕복 경로 생성 중...');

  // 2. 왕복 경로 생성: 정상 → 낮은 곳 → 다시 정상으로 돌아가기
  // 하산 경로 추가 (마지막 지점 제외하고 역순으로 추가)
  const returnPath = [...reversedCoords].slice(0, -1).reverse();

  console.log(`✅ 왕복 경로 생성: ${returnPath.length}개 포인트 추가\n`);

  // 3. 최종 경로: 역순 경로 + 복귀 경로
  const roundtripCoords = [...reversedCoords, ...returnPath];

  console.log('📊 왕복 경로 결과:');
  console.log(`   총 좌표 수: ${coords.length}개 → ${roundtripCoords.length}개 (+${returnPath.length}개)`);
  console.log(`   출발점: lat=${roundtripCoords[0].lat.toFixed(6)}, lng=${roundtripCoords[0].lng.toFixed(6)}, alt=${roundtripCoords[0].altitude}m`);
  console.log(`   도착점: lat=${roundtripCoords[roundtripCoords.length - 1].lat.toFixed(6)}, lng=${roundtripCoords[roundtripCoords.length - 1].lng.toFixed(6)}, alt=${roundtripCoords[roundtripCoords.length - 1].altitude}m`);

  // 거리 재계산
  let totalDistance = 0;
  for (let i = 1; i < roundtripCoords.length; i++) {
    totalDistance += calculateDistance(
      roundtripCoords[i - 1].lat,
      roundtripCoords[i - 1].lng,
      roundtripCoords[i].lat,
      roundtripCoords[i].lng
    );
  }

  console.log(`   총 거리: ${(currentDistance / 1000).toFixed(2)}km → ${(totalDistance / 1000).toFixed(2)}km\n`);

  // 고도 통계
  const altitudes = roundtripCoords.map(c => c.altitude || 0);
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
      path_coordinates: roundtripCoords,
      start_latitude: roundtripCoords[0].lat,
      start_longitude: roundtripCoords[0].lng,
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
  console.log('✨ 가야산 5번 코스 왕복 경로 변환 완료!');
  console.log('='.repeat(80));
  console.log('\n💡 경로 구조:');
  console.log(`   출발(${Math.round(roundtripCoords[0].altitude!)}m) → 하산 → 도착(${Math.round(roundtripCoords[roundtripCoords.length - 1].altitude!)}m)`);
  console.log('   완전한 왕복 코스로 변환되었습니다!');
}

convertGayasan5ToRoundtrip().then(() => process.exit(0));
