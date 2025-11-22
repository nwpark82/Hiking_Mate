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
const supabase = createClient(supabaseUrl, supabaseKey);

// Haversine 공식으로 두 지점 간 거리 계산 (미터)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 지구 반경 (미터)
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

// 경로 좌표로부터 총 거리 계산
function calculatePathDistance(coords) {
  if (!coords || coords.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < coords.length; i++) {
    const dist = calculateDistance(
      coords[i - 1].lat,
      coords[i - 1].lng,
      coords[i].lat,
      coords[i].lng
    );
    totalDistance += dist;
  }

  return totalDistance / 1000; // km로 변환
}

async function validateDistances() {
  console.log('🔍 등산로 거리 데이터 검증 시작...\n');

  // 모든 트레일 데이터 가져오기
  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, distance, path_coordinates, trail_type')
    .order('name');

  if (error) {
    console.error('❌ 데이터 로드 실패:', error);
    return;
  }

  console.log(`📊 총 ${trails.length}개 트레일 분석 중...\n`);

  const results = [];
  let processedCount = 0;
  let errorCount = 0;

  for (const trail of trails) {
    processedCount++;

    // 진행률 표시
    if (processedCount % 100 === 0) {
      console.log(`   처리 중: ${processedCount}/${trails.length}...`);
    }

    // 경로 데이터가 없는 경우
    if (!trail.path_coordinates || trail.path_coordinates.length < 2) {
      errorCount++;
      results.push({
        ...trail,
        calculatedDistance: 0,
        error: '경로 데이터 없음',
        diff: null,
        diffPercent: null
      });
      continue;
    }

    // 경로로부터 거리 계산
    const calculatedDistance = calculatePathDistance(trail.path_coordinates);
    const dbDistance = trail.distance;

    // 오차 계산
    const diff = Math.abs(calculatedDistance - dbDistance);
    const diffPercent = dbDistance > 0 ? (diff / dbDistance) * 100 : 0;

    results.push({
      ...trail,
      calculatedDistance,
      dbDistance,
      diff,
      diffPercent,
      error: null
    });
  }

  console.log(`\n✅ 분석 완료: ${processedCount}개 처리, ${errorCount}개 오류\n`);

  // 통계 계산
  const validResults = results.filter(r => r.error === null);
  const diffs = validResults.map(r => r.diff);
  const diffPercents = validResults.map(r => r.diffPercent);

  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const avgDiffPercent = diffPercents.reduce((a, b) => a + b, 0) / diffPercents.length;

  const sortedDiffs = [...diffs].sort((a, b) => a - b);
  const medianDiff = sortedDiffs[Math.floor(sortedDiffs.length / 2)];

  const sortedPercents = [...diffPercents].sort((a, b) => a - b);
  const medianPercent = sortedPercents[Math.floor(sortedPercents.length / 2)];

  const maxDiff = Math.max(...diffs);
  const minDiff = Math.min(...diffs);

  // 오차 범위별 분포
  const within5Percent = validResults.filter(r => r.diffPercent <= 5).length;
  const within10Percent = validResults.filter(r => r.diffPercent <= 10).length;
  const within20Percent = validResults.filter(r => r.diffPercent <= 20).length;
  const within50Percent = validResults.filter(r => r.diffPercent <= 50).length;
  const over50Percent = validResults.filter(r => r.diffPercent > 50).length;

  // 결과 출력
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 거리 오차 통계');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`📍 전체 트레일: ${trails.length}개`);
  console.log(`✅ 유효 데이터: ${validResults.length}개`);
  console.log(`❌ 오류 데이터: ${errorCount}개\n`);

  console.log(`📏 평균 절대 오차: ${avgDiff.toFixed(3)} km`);
  console.log(`📏 중앙값 절대 오차: ${medianDiff.toFixed(3)} km`);
  console.log(`📏 최대 오차: ${maxDiff.toFixed(3)} km`);
  console.log(`📏 최소 오차: ${minDiff.toFixed(3)} km\n`);

  console.log(`📊 평균 상대 오차: ${avgDiffPercent.toFixed(2)}%`);
  console.log(`📊 중앙값 상대 오차: ${medianPercent.toFixed(2)}%\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 오차 범위별 분포');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`✅ ±5% 이내:   ${within5Percent}개 (${((within5Percent / validResults.length) * 100).toFixed(1)}%)`);
  console.log(`✅ ±10% 이내:  ${within10Percent}개 (${((within10Percent / validResults.length) * 100).toFixed(1)}%)`);
  console.log(`⚠️  ±20% 이내:  ${within20Percent}개 (${((within20Percent / validResults.length) * 100).toFixed(1)}%)`);
  console.log(`⚠️  ±50% 이내:  ${within50Percent}개 (${((within50Percent / validResults.length) * 100).toFixed(1)}%)`);
  console.log(`❌ 50% 초과:   ${over50Percent}개 (${((over50Percent / validResults.length) * 100).toFixed(1)}%)\n`);

  // 타입별 통계
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 타입별 평균 오차');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const types = ['ROUNDTRIP', 'CIRCULAR_PARTIAL', 'CIRCULAR_UNIQUE', 'ONEWAY_PARTIAL', 'ONEWAY_UNIQUE'];
  for (const type of types) {
    const typeResults = validResults.filter(r => r.trail_type === type);
    if (typeResults.length > 0) {
      const typeAvgPercent = typeResults.reduce((sum, r) => sum + r.diffPercent, 0) / typeResults.length;
      console.log(`   ${type}: ${typeAvgPercent.toFixed(2)}% (${typeResults.length}개)`);
    }
  }

  // 오차가 큰 트레일 상위 20개
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  오차가 큰 트레일 TOP 20');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sortedByError = [...validResults].sort((a, b) => b.diffPercent - a.diffPercent).slice(0, 20);

  sortedByError.forEach((trail, idx) => {
    console.log(`${idx + 1}. ${trail.name} (${trail.mountain})`);
    console.log(`   DB 거리: ${trail.dbDistance.toFixed(2)} km`);
    console.log(`   계산 거리: ${trail.calculatedDistance.toFixed(2)} km`);
    console.log(`   오차: ${trail.diff.toFixed(3)} km (${trail.diffPercent.toFixed(1)}%)`);
    console.log(`   타입: ${trail.trail_type}`);
    console.log('');
  });

  // 결과를 JSON 파일로 저장
  const outputPath = path.join(process.cwd(), 'distance-validation-results.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        summary: {
          total: trails.length,
          valid: validResults.length,
          errors: errorCount,
          avgDiff,
          avgDiffPercent,
          medianDiff,
          medianPercent,
          maxDiff,
          minDiff,
          distribution: {
            within5Percent,
            within10Percent,
            within20Percent,
            within50Percent,
            over50Percent
          }
        },
        trails: results
      },
      null,
      2
    )
  );

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📁 상세 결과 저장: ${outputPath}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

validateDistances().catch(console.error);
