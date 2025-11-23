import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

async function analyzeBukhansan9() {
  console.log('🔍 북한산 9번 코스 (역방향) 문제 분석\n');

  const trailId = '8ce61126-a2ee-4e7f-ad7f-34861c6c1dbf';

  const { data, error } = await supabase
    .from('trails')
    .select('id, name, path_coordinates, gpx_data')
    .eq('id', trailId)
    .single();

  if (error || !data) {
    console.error('❌ 데이터 조회 실패:', error?.message);
    return;
  }

  const coords = data.path_coordinates as Array<{ lat: number; lng: number; altitude?: number }>;
  const gpxData = data.gpx_data as any;

  console.log('📍 기본 정보');
  console.log(`  등산로: ${data.name}`);
  console.log(`  좌표 수: ${coords.length}개\n`);

  // 문제 1: 출발/도착 지점 분석
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 문제 1: 출발/도착 지점 분석');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const firstPoint = coords[0];
  const lastPoint = coords[coords.length - 1];

  console.log('현재 path_coordinates:');
  console.log(`  출발점: lat=${firstPoint.lat}, lng=${firstPoint.lng}, alt=${firstPoint.altitude}m`);
  console.log(`  도착점: lat=${lastPoint.lat}, lng=${lastPoint.lng}, alt=${lastPoint.altitude}m\n`);

  // GPX 원본 데이터와 비교
  if (gpxData?.trackPoints) {
    const gpxFirst = gpxData.trackPoints[0];
    const gpxLast = gpxData.trackPoints[gpxData.trackPoints.length - 1];

    console.log('원본 GPX trackPoints:');
    console.log(`  첫 포인트: lat=${gpxFirst.lat}, lng=${gpxFirst.lon}, ele=${gpxFirst.ele}m`);
    console.log(`  마지막 포인트: lat=${gpxLast.lat}, lng=${gpxLast.lon}, ele=${gpxLast.ele}m\n`);

    // 역방향 여부 확인
    const distFirstToFirst = calculateDistance(firstPoint.lat, firstPoint.lng, gpxFirst.lat, gpxFirst.lon);
    const distFirstToLast = calculateDistance(firstPoint.lat, firstPoint.lng, gpxLast.lat, gpxLast.lon);

    console.log('방향성 분석:');
    console.log(`  path_coordinates 출발점 ↔ GPX 첫 포인트: ${distFirstToFirst.toFixed(1)}m`);
    console.log(`  path_coordinates 출발점 ↔ GPX 마지막 포인트: ${distFirstToLast.toFixed(1)}m`);

    if (distFirstToLast < distFirstToFirst) {
      console.log(`  ⚠️  GPX 데이터가 역방향으로 저장되어 있음!`);
    } else {
      console.log(`  ✅ 방향 일치`);
    }
  }

  // 고도 기반 출발/도착 지점 판단
  const altitudes = coords.map(c => c.altitude || 0);
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);

  const minAltIndex = altitudes.indexOf(minAlt);
  const maxAltIndex = altitudes.indexOf(maxAlt);

  console.log('\n고도 기반 분석:');
  console.log(`  최저 고도: ${minAlt}m (인덱스 ${minAltIndex})`);
  console.log(`  최고 고도: ${maxAlt}m (인덱스 ${maxAltIndex})`);
  console.log(`  현재 출발점 고도: ${firstPoint.altitude}m`);
  console.log(`  현재 도착점 고도: ${lastPoint.altitude}m`);

  if (firstPoint.altitude! > 400) {
    console.log(`  ❌ 출발점이 높은 고도(${firstPoint.altitude}m)에 위치 - 산 정상 근처`);
  }
  if (lastPoint.altitude! > 400) {
    console.log(`  ❌ 도착점이 높은 고도(${lastPoint.altitude}m)에 위치 - 산 정상 근처`);
  }

  // 문제 2: 갭(Gap) 분석
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 문제 2: 갭(Gap) 분석');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const gapThreshold = 100; // 100m 이상 갭
  const gaps: Array<{
    index: number;
    distance: number;
    from: { lat: number; lng: number; alt?: number };
    to: { lat: number; lng: number; alt?: number };
  }> = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const dist = calculateDistance(
      coords[i].lat,
      coords[i].lng,
      coords[i + 1].lat,
      coords[i + 1].lng
    );

    if (dist > gapThreshold) {
      gaps.push({
        index: i,
        distance: dist,
        from: coords[i],
        to: coords[i + 1]
      });
    }
  }

  console.log(`갭 탐지 기준: ${gapThreshold}m 이상`);
  console.log(`발견된 갭: ${gaps.length}개\n`);

  if (gaps.length > 0) {
    console.log('상세 갭 정보:');
    gaps.forEach((gap, idx) => {
      console.log(`\n  갭 ${idx + 1}:`);
      console.log(`    위치: 인덱스 ${gap.index} → ${gap.index + 1}`);
      console.log(`    거리: ${gap.distance.toFixed(1)}m`);
      console.log(`    출발: lat=${gap.from.lat}, lng=${gap.from.lng}, alt=${gap.from.alt}m`);
      console.log(`    도착: lat=${gap.to.lat}, lng=${gap.to.lng}, alt=${gap.to.alt}m`);

      // 고도 차이로 갭 유형 판단
      const altDiff = Math.abs((gap.to.alt || 0) - (gap.from.alt || 0));
      console.log(`    고도 차이: ${altDiff.toFixed(1)}m`);

      if (altDiff < 10 && gap.distance > 200) {
        console.log(`    ⚠️  평지 이동 - 도로 구간 가능성 높음 (보간 필요)`);
      } else if (gap.distance > 500) {
        console.log(`    ❌ 심각한 갭 - 데이터 누락 또는 이상`);
      }
    });
  } else {
    console.log('  ✅ 갭 없음');
  }

  // 권장 수정 사항
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 권장 수정 사항');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1. 출발/도착 지점 수정:');
  if (firstPoint.altitude! > 300) {
    // 가장 낮은 고도 지점 찾기
    const lowAltPoints = coords
      .map((c, i) => ({ ...c, index: i }))
      .filter(c => (c.altitude || 0) < 200)
      .sort((a, b) => (a.altitude || 0) - (b.altitude || 0));

    if (lowAltPoints.length > 0) {
      console.log(`   - 출발점을 인덱스 ${lowAltPoints[0].index} (고도 ${lowAltPoints[0].altitude}m)으로 변경 권장`);
    }
  }

  console.log('\n2. 갭 처리:');
  if (gaps.length > 0) {
    console.log(`   - ${gaps.length}개 갭에 대해 보간 처리 필요`);
    console.log('   - 직선 보간 또는 도로 경로 기반 보간 적용');
  }

  console.log('\n3. 역방향 처리:');
  console.log('   - GPX 데이터가 역방향인 경우 path_coordinates 뒤집기');
  console.log('   - 등산로명에 "역방향" 표시가 있으면 고도 낮은 곳 → 높은 곳 순서 확인');
}

analyzeBukhansan9().then(() => process.exit(0));
