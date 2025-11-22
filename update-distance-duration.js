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

// 난이도별 권장 평균 속도 (km/h)
const RECOMMENDED_SPEEDS = {
  '초급': 2.50,
  '중급': 2.00,
  '고급': 1.55,
  '전문가': 1.49
};

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

async function updateDistanceAndDuration() {
  console.log('🚀 Distance & Duration 업데이트 시작...\n');

  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, difficulty, distance, duration, path_coordinates, trail_type')
    .order('name');

  if (error) {
    console.error('❌ 데이터 로드 실패:', error);
    return;
  }

  console.log(`📊 총 ${trails.length}개 트레일 처리 예정\n`);

  let processedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const updates = [];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 Distance & Duration 재계산 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const trail of trails) {
    processedCount++;

    if (processedCount % 100 === 0) {
      console.log(`   처리 중: ${processedCount}/${trails.length}...`);
    }

    // 경로 데이터가 없으면 스킵
    if (!trail.path_coordinates || trail.path_coordinates.length < 2) {
      skippedCount++;
      continue;
    }

    // 계산된 거리
    const calculatedDistance = calculatePathDistance(trail.path_coordinates);

    if (calculatedDistance === 0) {
      skippedCount++;
      continue;
    }

    // 난이도별 권장 속도
    const recommendedSpeed = RECOMMENDED_SPEEDS[trail.difficulty] || 2.0;

    // 새로운 소요시간 계산 (분)
    const newDuration = Math.round((calculatedDistance / recommendedSpeed) * 60);

    // 반올림된 거리 (소수점 2자리)
    const newDistance = Math.round(calculatedDistance * 100) / 100;

    // 변화가 있는 경우만 업데이트
    const distanceChanged = Math.abs(newDistance - trail.distance) > 0.01;
    const durationChanged = Math.abs(newDuration - trail.duration) > 1;

    if (distanceChanged || durationChanged) {
      updates.push({
        id: trail.id,
        name: trail.name,
        mountain: trail.mountain,
        difficulty: trail.difficulty,
        oldDistance: trail.distance,
        newDistance,
        oldDuration: trail.duration,
        newDuration,
        recommendedSpeed
      });

      // DB 업데이트
      const { error: updateError } = await supabase
        .from('trails')
        .update({
          distance: newDistance,
          duration: newDuration
        })
        .eq('id', trail.id);

      if (updateError) {
        console.error(`   ❌ ${trail.name}: 업데이트 실패 - ${updateError.message}`);
        errorCount++;
      } else {
        updatedCount++;

        // 주요 변화만 출력
        if (processedCount <= 10 || (distanceChanged && Math.abs(newDistance - trail.distance) > 1)) {
          console.log(`   ✅ ${trail.name} (${trail.mountain})`);
          console.log(`      거리: ${trail.distance.toFixed(2)}km → ${newDistance.toFixed(2)}km`);
          console.log(`      시간: ${trail.duration}분 → ${newDuration}분`);
          console.log(`      속도: ${recommendedSpeed.toFixed(2)} km/h (${trail.difficulty})\n`);
        }
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 처리 완료');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`✅ 업데이트 완료: ${updatedCount}개`);
  console.log(`⏭️  변화 없음: ${skippedCount}개`);
  console.log(`❌ 실패: ${errorCount}개\n`);

  // 통계
  const distanceIncreases = updates.filter(u => u.newDistance > u.oldDistance).length;
  const distanceDecreases = updates.filter(u => u.newDistance < u.oldDistance).length;
  const durationIncreases = updates.filter(u => u.newDuration > u.oldDuration).length;
  const durationDecreases = updates.filter(u => u.newDuration < u.oldDuration).length;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 변화 통계');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`   Distance:`);
  console.log(`      증가: ${distanceIncreases}개`);
  console.log(`      감소: ${distanceDecreases}개\n`);

  console.log(`   Duration:`);
  console.log(`      증가: ${durationIncreases}개`);
  console.log(`      감소: ${durationDecreases}개\n`);

  // 가장 큰 변화 TOP 10
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 가장 큰 Distance 변화 TOP 10');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const biggestDistanceChanges = [...updates]
    .sort((a, b) => Math.abs(b.newDistance - b.oldDistance) - Math.abs(a.newDistance - a.oldDistance))
    .slice(0, 10);

  biggestDistanceChanges.forEach((u, i) => {
    const change = u.newDistance - u.oldDistance;
    console.log(`   ${i + 1}. ${u.name} (${u.mountain})`);
    console.log(`      ${u.oldDistance.toFixed(2)}km → ${u.newDistance.toFixed(2)}km (${change > 0 ? '+' : ''}${change.toFixed(2)}km)`);
    console.log(`      난이도: ${u.difficulty}\n`);
  });

  // 결과 저장
  const outputPath = path.join(process.cwd(), 'distance-duration-updates.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        summary: {
          total: trails.length,
          updated: updatedCount,
          skipped: skippedCount,
          error: errorCount,
          distanceIncreases,
          distanceDecreases,
          durationIncreases,
          durationDecreases,
          recommendedSpeeds: RECOMMENDED_SPEEDS
        },
        updates
      },
      null,
      2
    )
  );

  console.log(`📁 상세 결과 저장: ${outputPath}\n`);
}

updateDistanceAndDuration().catch(console.error);
