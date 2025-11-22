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

  return totalDistance / 1000; // km
}

async function analyzeDuration() {
  console.log('🔍 등산로 소요시간 분석 시작...\n');

  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, difficulty, distance, duration, path_coordinates, trail_type')
    .order('name');

  if (error) {
    console.error('❌ 데이터 로드 실패:', error);
    return;
  }

  console.log(`📊 총 ${trails.length}개 트레일 분석 중...\n`);

  const results = [];
  const speedsByDifficulty = {
    '초급': [],
    '중급': [],
    '고급': [],
    '전문가': []
  };
  const speedsByType = {
    'ROUNDTRIP': [],
    'CIRCULAR_PARTIAL': [],
    'CIRCULAR_UNIQUE': [],
    'ONEWAY_UNIQUE': []
  };

  let processedCount = 0;

  for (const trail of trails) {
    processedCount++;

    if (processedCount % 100 === 0) {
      console.log(`   처리 중: ${processedCount}/${trails.length}...`);
    }

    if (!trail.path_coordinates || trail.path_coordinates.length < 2) {
      continue;
    }

    // 계산된 거리
    const calculatedDistance = calculatePathDistance(trail.path_coordinates);

    // DB 거리 기준 평균 속도
    const dbSpeed = trail.duration > 0 ? (trail.distance / (trail.duration / 60)) : 0;

    // 계산된 거리 기준 평균 속도
    const calculatedSpeed = trail.duration > 0 ? (calculatedDistance / (trail.duration / 60)) : 0;

    results.push({
      id: trail.id,
      name: trail.name,
      mountain: trail.mountain,
      difficulty: trail.difficulty,
      trail_type: trail.trail_type,
      dbDistance: trail.distance,
      calculatedDistance,
      duration: trail.duration,
      dbSpeed,
      calculatedSpeed
    });

    // 난이도별 속도 수집
    if (speedsByDifficulty[trail.difficulty] && calculatedSpeed > 0 && calculatedSpeed < 10) {
      speedsByDifficulty[trail.difficulty].push(calculatedSpeed);
    }

    // 타입별 속도 수집 (이상치 제외)
    if (speedsByType[trail.trail_type] && calculatedSpeed > 0 && calculatedSpeed < 10) {
      speedsByType[trail.trail_type].push(calculatedSpeed);
    }
  }

  console.log(`\n✅ 분석 완료: ${processedCount}개 처리\n`);

  // 평균 계산
  const avgSpeed = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const medianSpeed = (arr) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };

  // 통계 출력
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 난이도별 평균 속도 (계산된 거리 기준)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const difficultyStats = {};
  for (const [difficulty, speeds] of Object.entries(speedsByDifficulty)) {
    const avg = avgSpeed(speeds);
    const median = medianSpeed(speeds);
    difficultyStats[difficulty] = { avg, median, count: speeds.length };

    console.log(`   ${difficulty}:`);
    console.log(`      평균: ${avg.toFixed(2)} km/h`);
    console.log(`      중앙값: ${median.toFixed(2)} km/h`);
    console.log(`      샘플 수: ${speeds.length}개\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 타입별 평균 속도 (계산된 거리 기준)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const typeStats = {};
  for (const [type, speeds] of Object.entries(speedsByType)) {
    const avg = avgSpeed(speeds);
    const median = medianSpeed(speeds);
    typeStats[type] = { avg, median, count: speeds.length };

    console.log(`   ${type}:`);
    console.log(`      평균: ${avg.toFixed(2)} km/h`);
    console.log(`      중앙값: ${median.toFixed(2)} km/h`);
    console.log(`      샘플 수: ${speeds.length}개\n`);
  }

  // 이상치 감지
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  이상 속도 트레일 (계산된 거리 기준)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const tooFast = results.filter(r => r.calculatedSpeed > 5).sort((a, b) => b.calculatedSpeed - a.calculatedSpeed);
  const tooSlow = results.filter(r => r.calculatedSpeed > 0 && r.calculatedSpeed < 1).sort((a, b) => a.calculatedSpeed - b.calculatedSpeed);

  console.log(`🚀 너무 빠름 (>5 km/h): ${tooFast.length}개\n`);
  tooFast.slice(0, 10).forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.name} (${t.mountain})`);
    console.log(`      속도: ${t.calculatedSpeed.toFixed(2)} km/h`);
    console.log(`      거리: ${t.calculatedDistance.toFixed(2)} km / 시간: ${t.duration}분`);
    console.log(`      난이도: ${t.difficulty} / 타입: ${t.trail_type}\n`);
  });

  console.log(`🐌 너무 느림 (<1 km/h): ${tooSlow.length}개\n`);
  tooSlow.slice(0, 10).forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.name} (${t.mountain})`);
    console.log(`      속도: ${t.calculatedSpeed.toFixed(2)} km/h`);
    console.log(`      거리: ${t.calculatedDistance.toFixed(2)} km / 시간: ${t.duration}분`);
    console.log(`      난이도: ${t.difficulty} / 타입: ${t.trail_type}\n`);
  });

  // 권장 평균 속도 제안
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 권장 평균 속도 (재계산용)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const recommendedSpeeds = {
    '초급': Math.max(2.5, difficultyStats['초급']?.median || 3.0),
    '중급': Math.max(2.0, difficultyStats['중급']?.median || 2.5),
    '고급': Math.max(1.5, difficultyStats['고급']?.median || 2.0),
    '전문가': Math.max(1.2, difficultyStats['전문가']?.median || 1.5)
  };

  for (const [difficulty, speed] of Object.entries(recommendedSpeeds)) {
    console.log(`   ${difficulty}: ${speed.toFixed(2)} km/h`);
  }

  console.log('\n   (데이터의 중앙값과 일반적인 등산 속도를 고려한 권장값)\n');

  // 재계산 필요한 트레일 수
  const needsUpdate = results.filter(r => {
    const expectedSpeed = recommendedSpeeds[r.difficulty] || 2.5;
    const deviation = Math.abs(r.calculatedSpeed - expectedSpeed) / expectedSpeed;
    return deviation > 0.3; // 30% 이상 차이
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`⚙️  재계산 필요: ${needsUpdate.length}개 (속도가 권장값의 ±30% 이상 차이)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 결과 저장
  const outputPath = path.join(process.cwd(), 'duration-analysis.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        summary: {
          total: trails.length,
          processed: results.length,
          tooFast: tooFast.length,
          tooSlow: tooSlow.length,
          needsUpdate: needsUpdate.length,
          difficultyStats,
          typeStats,
          recommendedSpeeds
        },
        trails: results,
        tooFast: tooFast.slice(0, 50),
        tooSlow: tooSlow.slice(0, 50),
        needsUpdate
      },
      null,
      2
    )
  );

  console.log(`📁 상세 결과 저장: ${outputPath}\n`);
}

analyzeDuration().catch(console.error);
