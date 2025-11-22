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

// 역순 패턴 감지
function detectReversePattern(coords, windowSize = 50) {
  if (coords.length < windowSize * 2) return null;

  // 경로의 중간 지점 근처에서 역순 패턴 찾기
  const midPoint = Math.floor(coords.length / 2);

  // 중간 지점 앞쪽 windowSize개
  const beforeMid = coords.slice(Math.max(0, midPoint - windowSize), midPoint);
  // 중간 지점 뒤쪽 windowSize개
  const afterMid = coords.slice(midPoint, Math.min(coords.length, midPoint + windowSize));

  // 뒤쪽이 앞쪽의 역순인지 확인
  let matchCount = 0;
  const checkSize = Math.min(beforeMid.length, afterMid.length, 10);

  for (let i = 0; i < checkSize; i++) {
    const beforePoint = beforeMid[beforeMid.length - 1 - i];
    const afterPoint = afterMid[i];

    const dist = calculateDistance(
      beforePoint.lat,
      beforePoint.lng,
      afterPoint.lat,
      afterPoint.lng
    );

    // 10m 이내면 같은 지점으로 간주
    if (dist < 10) {
      matchCount++;
    }
  }

  const matchRate = matchCount / checkSize;

  return {
    hasReversePattern: matchRate > 0.7, // 70% 이상 일치
    matchRate,
    midPoint,
    beforeMid: beforeMid.slice(-5),
    afterMid: afterMid.slice(0, 5)
  };
}

async function checkGapFillMethod() {
  console.log('🔍 갭 처리 방식 확인 중...\n');

  // 갭이 있던 트레일 중 CIRCULAR_PARTIAL 타입만 확인
  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, path_coordinates, trail_type')
    .eq('trail_type', 'CIRCULAR_PARTIAL')
    .limit(10);

  if (error) {
    console.error('❌ 데이터 로드 실패:', error);
    return;
  }

  console.log(`📊 ${trails.length}개 CIRCULAR_PARTIAL 트레일 분석 중...\n`);

  for (const trail of trails) {
    if (!trail.path_coordinates || trail.path_coordinates.length < 100) {
      continue;
    }

    const coords = trail.path_coordinates;
    const reversePattern = detectReversePattern(coords);

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 ${trail.name} (${trail.mountain})`);
    console.log(`   총 포인트: ${coords.length}개`);

    if (reversePattern.hasReversePattern) {
      console.log(`   ✅ 역순 패턴 감지: ${(reversePattern.matchRate * 100).toFixed(1)}% 일치`);
      console.log(`   📍 중간 지점: ${reversePattern.midPoint}`);

      // 역순 시작 부분 5개 포인트
      console.log(`\n   역순 전 (마지막 5개):`);
      reversePattern.beforeMid.forEach((p, i) => {
        console.log(`      ${reversePattern.midPoint - 5 + i}: ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`);
      });

      console.log(`\n   역순 후 (처음 5개):`);
      reversePattern.afterMid.forEach((p, i) => {
        console.log(`      ${reversePattern.midPoint + i}: ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`);
      });

      // 시작점과 끝점 확인
      const start = coords[0];
      const end = coords[coords.length - 1];
      const startEndDist = calculateDistance(start.lat, start.lng, end.lat, end.lng);

      console.log(`\n   시작-끝 거리: ${Math.round(startEndDist)}m`);

      if (startEndDist < 50) {
        console.log(`   ✅ 왕복 경로 (시작=끝)`);
      }
    } else {
      console.log(`   ❌ 역순 패턴 없음: ${(reversePattern.matchRate * 100).toFixed(1)}% 일치`);
    }

    console.log('');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 결론:');
  console.log('   - 역순 패턴이 감지되면: 갭 채우기가 적용된 경로');
  console.log('   - 역순 패턴이 없으면: 원본 경로 또는 다른 방식');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

checkGapFillMethod().catch(console.error);
