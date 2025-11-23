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
 * 왕복 경로 방식 갭 채우기
 *
 * 원리:
 * 1. 갭의 끝 포인트와 가장 가까운 이전 포인트를 찾음
 * 2. 그 포인트부터 갭 직전까지를 역순으로 채움
 * 3. 왕복 등산로를 시뮬레이션
 *
 * 예시:
 * 원본: [A, B, C, D, E | 갭 500m | F, G, H, I, J]
 *       (F가 C 근처)
 * 결과: [A, B, C, D, E, E, D, C, (F와 근접하여 연결)]
 */
function smartFillGaps(coords: Coordinate[], gapThreshold: number = 100): {
  coords: Coordinate[];
  gapsFilled: number;
  details: Array<{ gapIndex: number; gapDistance: number; pointsAdded: number; method: string }>;
} {
  if (!coords || coords.length < 2) {
    return {
      coords,
      gapsFilled: 0,
      details: []
    };
  }

  let result = [...coords];
  let gapsFilled = 0;
  let details: Array<{ gapIndex: number; gapDistance: number; pointsAdded: number; method: string }> = [];

  // 1. 모든 갭 찾기
  const gaps: Array<{
    startIndex: number;
    endIndex: number;
    distance: number;
    startPoint: Coordinate;
    endPoint: Coordinate;
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
        startIndex: i,
        endIndex: i + 1,
        distance: dist,
        startPoint: coords[i],
        endPoint: coords[i + 1]
      });
    }
  }

  if (gaps.length === 0) {
    return {
      coords,
      gapsFilled: 0,
      details: []
    };
  }

  console.log(`\n🔍 발견된 갭: ${gaps.length}개\n`);

  // 2. 각 갭 처리
  for (const gap of gaps) {
    console.log(`  갭 ${gapsFilled + 1}:`);
    console.log(`    위치: 인덱스 ${gap.startIndex} → ${gap.endIndex}`);
    console.log(`    거리: ${gap.distance.toFixed(1)}m`);

    // 갭 끝점과 가장 가까운 포인트 찾기
    let closestIndex = -1;
    let closestDistance = Infinity;

    // 갭 시작점 이전의 모든 포인트에서 탐색
    for (let i = 0; i < gap.startIndex; i++) {
      const dist = calculateDistance(
        coords[i].lat,
        coords[i].lng,
        gap.endPoint.lat,
        gap.endPoint.lng
      );

      if (dist < closestDistance) {
        closestDistance = dist;
        closestIndex = i;
      }
    }

    // 순환 구조: 갭이 시작 부분(0→1)에 있으면 끝부분에서 탐색
    if (gap.startIndex === 0 && closestIndex === -1) {
      console.log(`    🔄 순환 구조 탐색: 끝부분에서 가장 가까운 지점 찾기`);

      for (let i = coords.length - 1; i > gap.endIndex; i--) {
        const dist = calculateDistance(
          coords[i].lat,
          coords[i].lng,
          gap.endPoint.lat,
          gap.endPoint.lng
        );

        if (dist < closestDistance) {
          closestDistance = dist;
          closestIndex = i;
        }
      }
    }

    if (closestIndex === -1) {
      console.log(`    ⚠️  적합한 연결점을 찾지 못함 - 직선 보간 사용`);

      // 직선 보간으로 폴백
      const numSegments = Math.ceil(gap.distance / 50);
      const interpolated: Coordinate[] = [];

      for (let i = 1; i < numSegments; i++) {
        const ratio = i / numSegments;
        const lat = gap.startPoint.lat + (gap.endPoint.lat - gap.startPoint.lat) * ratio;
        const lng = gap.startPoint.lng + (gap.endPoint.lng - gap.startPoint.lng) * ratio;

        let altitude: number | undefined;
        if (gap.startPoint.altitude !== undefined && gap.endPoint.altitude !== undefined) {
          altitude = gap.startPoint.altitude + (gap.endPoint.altitude - gap.startPoint.altitude) * ratio;
        }

        interpolated.push({ lat, lng, altitude });
      }

      // 갭 위치에 삽입
      result.splice(gap.endIndex + gapsFilled, 0, ...interpolated);

      details.push({
        gapIndex: gap.startIndex,
        gapDistance: gap.distance,
        pointsAdded: interpolated.length,
        method: 'linear'
      });

      console.log(`    ✅ 직선 보간: ${interpolated.length}개 포인트 추가\n`);
      gapsFilled++;
      continue;
    }

    console.log(`    📍 가장 가까운 지점: 인덱스 ${closestIndex} (거리 ${closestDistance.toFixed(1)}m)`);

    // 왕복 경로 생성
    const roundtripSegment: Coordinate[] = [];

    if (gap.startIndex === 0 && closestIndex > gap.endIndex) {
      // 순환 구조: 끝에서 역순으로 추가
      console.log(`    🔄 순환 구조 왕복 경로: 끝에서 시작까지 역순`);

      for (let i = coords.length - 1; i >= closestIndex; i--) {
        roundtripSegment.push(coords[i]);
      }

      console.log(`    ✅ 왕복 경로: ${roundtripSegment.length}개 포인트 추가 (인덱스 ${coords.length - 1} → ${closestIndex} 역순)\n`);
    } else {
      // 일반 경우: closestIndex부터 gap.startIndex까지 역순
      for (let i = gap.startIndex; i >= closestIndex; i--) {
        roundtripSegment.push(coords[i]);
      }

      console.log(`    ✅ 왕복 경로: ${roundtripSegment.length}개 포인트 추가 (인덱스 ${gap.startIndex} → ${closestIndex} 역순)\n`);
    }

    // 갭 위치에 삽입
    result.splice(gap.endIndex + gapsFilled, 0, ...roundtripSegment);

    details.push({
      gapIndex: gap.startIndex,
      gapDistance: gap.distance,
      pointsAdded: roundtripSegment.length,
      method: 'roundtrip'
    });

    gapsFilled++;
  }

  return {
    coords: result,
    gapsFilled,
    details
  };
}

/**
 * 출발점을 가장 낮은 고도로 재정렬
 */
function reorderFromLowestPoint(coords: Coordinate[]): {
  coords: Coordinate[];
  reordered: boolean;
  lowestIndex: number;
} {
  const altitudes = coords.map(c => c.altitude || 999999);
  const minAltIndex = altitudes.indexOf(Math.min(...altitudes));

  // 출발점이 이미 낮은 고도(<200m)이면 재정렬 불필요
  if (coords[0].altitude !== undefined && coords[0].altitude < 200) {
    return { coords, reordered: false, lowestIndex: 0 };
  }

  // 재정렬
  const reordered = [
    ...coords.slice(minAltIndex),
    ...coords.slice(0, minAltIndex)
  ];

  return {
    coords: reordered,
    reordered: true,
    lowestIndex: minAltIndex
  };
}

async function fixTrailWithRoundtripGapFill(trailId: string, trailName: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🏔️  ${trailName}`);
  console.log('='.repeat(70));

  // 1. 원본 GPX 데이터 조회
  const { data, error } = await supabase
    .from('trails')
    .select('id, name, gpx_data')
    .eq('id', trailId)
    .single();

  if (error || !data) {
    console.error('❌ 데이터 조회 실패:', error?.message);
    return;
  }

  // GPX trackPoints를 path_coordinates로 변환 (altitude 포함)
  const gpxData = data.gpx_data as any;
  if (!gpxData?.trackPoints) {
    console.error('❌ GPX trackPoints 없음');
    return;
  }

  const originalCoords: Coordinate[] = gpxData.trackPoints.map((pt: any) => ({
    lat: pt.lat,
    lng: pt.lon,
    altitude: pt.ele
  }));

  console.log(`\n📍 원본 GPX 좌표: ${originalCoords.length}개`);
  console.log(`   출발 고도: ${originalCoords[0].altitude}m`);
  console.log(`   도착 고도: ${originalCoords[originalCoords.length - 1].altitude}m`);

  // 2. 출발점 재정렬
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('단계 1: 출발점 재정렬 (최저 고도 지점으로)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const { coords: reordered, reordered: wasReordered, lowestIndex } = reorderFromLowestPoint(originalCoords);

  if (wasReordered) {
    console.log(`\n  ✅ 재정렬 완료`);
    console.log(`     최저 고도 지점: 인덱스 ${lowestIndex} (${originalCoords[lowestIndex].altitude}m)`);
    console.log(`     새 출발점: ${reordered[0].altitude}m`);
    console.log(`     새 도착점: ${reordered[reordered.length - 1].altitude}m`);
  } else {
    console.log(`\n  ✓  재정렬 불필요 (이미 낮은 고도에서 시작)`);
  }

  // 3. 왕복 경로 방식 갭 채우기
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('단계 2: 왕복 경로 방식 갭 채우기');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const { coords: filled, gapsFilled, details } = smartFillGaps(reordered, 100);

  console.log(`\n📊 갭 처리 결과:`);
  console.log(`   처리된 갭: ${gapsFilled}개`);
  console.log(`   추가된 포인트: ${filled.length - reordered.length}개`);
  console.log(`   최종 좌표 수: ${filled.length}개\n`);

  if (details.length > 0) {
    console.log(`상세 내역:`);
    details.forEach((detail, idx) => {
      console.log(`  갭 ${idx + 1}:`);
      console.log(`    원본 인덱스: ${detail.gapIndex}`);
      console.log(`    거리: ${detail.gapDistance.toFixed(1)}m`);
      console.log(`    추가 포인트: ${detail.pointsAdded}개`);
      console.log(`    방법: ${detail.method === 'roundtrip' ? '왕복 경로' : '직선 보간'}`);
    });
  }

  // 4. 거리 재계산
  let totalDistance = 0;
  for (let i = 1; i < filled.length; i++) {
    totalDistance += calculateDistance(
      filled[i - 1].lat,
      filled[i - 1].lng,
      filled[i].lat,
      filled[i].lng
    );
  }

  // 5. 고도 통계
  const altitudes = filled.map(c => c.altitude || 0);
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const avgAlt = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('단계 3: 최종 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`  📍 출발점: lat=${filled[0].lat}, lng=${filled[0].lng}, alt=${filled[0].altitude}m`);
  console.log(`  📍 도착점: lat=${filled[filled.length - 1].lat}, lng=${filled[filled.length - 1].lng}, alt=${filled[filled.length - 1].altitude}m`);
  console.log(`  📏 총 거리: ${(totalDistance / 1000).toFixed(2)}km`);
  console.log(`  📊 총 좌표: ${filled.length}개`);
  console.log(`  🏔️  최저 고도: ${Math.round(minAlt)}m`);
  console.log(`  🏔️  최고 고도: ${Math.round(maxAlt)}m`);
  console.log(`  🏔️  평균 고도: ${Math.round(avgAlt)}m\n`);

  // 6. 데이터베이스 업데이트
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('단계 4: 데이터베이스 업데이트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { error: updateError } = await supabase
    .from('trails')
    .update({
      path_coordinates: filled,
      start_latitude: filled[0].lat,
      start_longitude: filled[0].lng,
      distance: Math.round(totalDistance),
      min_altitude: Math.round(minAlt),
      max_altitude: Math.round(maxAlt),
      avg_altitude: Math.round(avgAlt),
      updated_at: new Date().toISOString()
    })
    .eq('id', trailId);

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError.message);
    return;
  }

  console.log('✅ 데이터베이스 업데이트 완료\n');
  console.log('✨ 등산로 경로 수정 완료!');
}

async function fixAllTrails() {
  console.log('🚀 왕복 경로 방식 갭 채우기 시작\n');

  const trails = [
    { id: '8ce61126-a2ee-4e7f-ad7f-34861c6c1dbf', name: '북한산 9번 코스 (역방향)' },
    { id: '5d5a0bea-1958-4108-9cdd-d872dc1ba1a0', name: '관악산 1번 코스 (정방향)' }
  ];

  for (const trail of trails) {
    await fixTrailWithRoundtripGapFill(trail.id, trail.name);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✨ 모든 등산로 처리 완료!');
  console.log('='.repeat(70));
}

fixAllTrails().then(() => process.exit(0));
