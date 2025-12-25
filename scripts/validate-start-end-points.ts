import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Coordinate {
  lat: number;
  lng: number;
  altitude?: number;
}

interface Waypoint {
  lat: number;
  lon: number;
  ele?: number;
  name?: string;
  category?: string;
}

interface ValidationResult {
  id: string;
  name: string;
  mountain: string;
  issues: {
    highStartAltitude: boolean;
    highEndAltitude: boolean;
    noValidStartPoint: boolean;
    noValidEndPoint: boolean;
    startAltitude?: number;
    endAltitude?: number;
    nearbyStartWaypoints: string[];
    nearbyEndWaypoints: string[];
    hasWaypoints: boolean;
  };
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

// 유효한 출발/도착 지점 키워드
const VALID_KEYWORDS = [
  '입구',
  '주차장',
  '매표소',
  '화장실',
  '버스',
  '정류장',
  '승강장',
  '탐방지원센터',
  '안내소',
  '관리사무소',
  '매점',
  '휴게소',
  '쉼터',
  '광장',
  '공원',
  '주차',
  'ENTRY',
  'PARKING',
  'TRANS',
  'TOILET',
  'BUS'
];

// waypoint name에 유효한 키워드가 포함되어 있는지 확인
function isValidWaypoint(name: string): boolean {
  if (!name) return false;

  const upperName = name.toUpperCase();
  return VALID_KEYWORDS.some(keyword =>
    upperName.includes(keyword.toUpperCase())
  );
}

// 특정 지점 근처의 유효한 waypoint 찾기
function findNearbyValidWaypoints(
  point: Coordinate,
  waypoints: Waypoint[],
  maxDistance: number = 200
): string[] {
  const nearby: string[] = [];

  for (const wpt of waypoints) {
    const dist = calculateDistance(point.lat, point.lng, wpt.lat, wpt.lon);

    if (dist <= maxDistance && wpt.name && isValidWaypoint(wpt.name)) {
      nearby.push(`${wpt.name} (${dist.toFixed(0)}m)`);
    }
  }

  return nearby;
}

async function validateStartEndPoints() {
  console.log('🔍 출발점/도착점 유효성 검증 시작\n');
  console.log('='.repeat(80));
  console.log('검증 기준:');
  console.log('  1. 출발점 고도: 200m 이상이면 "높은 출발점" 판정');
  console.log('  2. 도착점 고도: 200m 이상이면 "높은 도착점" 판정');
  console.log('  3. 출발점 근처 200m 이내 유효한 waypoint 확인');
  console.log('  4. 도착점 근처 200m 이내 유효한 waypoint 확인');
  console.log('  5. 유효한 waypoint: 입구, 주차장, 매표소, 화장실, 버스 등');
  console.log('='.repeat(80));
  console.log('');

  // 전체 등산로 수 조회
  const { count, error: countError } = await supabase
    .from('trails')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ 데이터 조회 실패:', countError.message);
    return;
  }

  const totalTrails = count || 0;
  console.log(`📊 총 등산로: ${totalTrails}개\n`);
  console.log('배치 처리 시작...\n');

  const batchSize = 100;
  const allTrails = [];

  for (let i = 0; i < totalTrails; i += batchSize) {
    const { data: trails, error } = await supabase
      .from('trails')
      .select('id, name, mountain, path_coordinates, gpx_data')
      .order('mountain', { ascending: true })
      .range(i, i + batchSize - 1);

    if (error) {
      console.error(`❌ 배치 ${Math.floor(i / batchSize) + 1} 조회 실패:`, error.message);
      continue;
    }

    if (trails && trails.length > 0) {
      allTrails.push(...trails);
      console.log(`  ✓ ${i + 1}-${i + trails.length} 조회 완료 (${allTrails.length}/${totalTrails})`);
    }
  }

  if (allTrails.length === 0) {
    console.log('❌ 등산로 데이터가 없습니다.');
    return;
  }

  console.log(`\n✅ 전체 조회 완료: ${allTrails.length}개\n`);
  const trails = allTrails;

  const issues: ValidationResult[] = [];
  const stats = {
    total: trails.length,
    highStartAltitude: 0,
    highEndAltitude: 0,
    noValidStartPoint: 0,
    noValidEndPoint: 0,
    noWaypoints: 0,
    allValid: 0
  };

  for (const trail of trails) {
    const coords = trail.path_coordinates as Coordinate[];

    if (!coords || coords.length === 0) {
      continue;
    }

    const gpxData = trail.gpx_data as any;
    const waypoints: Waypoint[] = gpxData?.waypoints || [];

    const startPoint = coords[0];
    const endPoint = coords[coords.length - 1];

    const startAlt = startPoint.altitude || 0;
    const endAlt = endPoint.altitude || 0;

    // 출발점/도착점 근처 유효한 waypoint 찾기
    const nearbyStartWaypoints = findNearbyValidWaypoints(startPoint, waypoints, 200);
    const nearbyEndWaypoints = findNearbyValidWaypoints(endPoint, waypoints, 200);

    // 문제 판정
    const highStartAltitude = startAlt > 200;
    const highEndAltitude = endAlt > 200;
    const noValidStartPoint = nearbyStartWaypoints.length === 0;
    const noValidEndPoint = nearbyEndWaypoints.length === 0;
    const hasWaypoints = waypoints.length > 0;

    if (!hasWaypoints) {
      stats.noWaypoints++;
    }

    if (highStartAltitude) {
      stats.highStartAltitude++;
    }

    if (highEndAltitude) {
      stats.highEndAltitude++;
    }

    if (noValidStartPoint) {
      stats.noValidStartPoint++;
    }

    if (noValidEndPoint) {
      stats.noValidEndPoint++;
    }

    // 문제가 있는 경우만 기록
    if (
      highStartAltitude ||
      highEndAltitude ||
      (hasWaypoints && noValidStartPoint) ||
      (hasWaypoints && noValidEndPoint)
    ) {
      issues.push({
        id: trail.id,
        name: trail.name,
        mountain: trail.mountain,
        issues: {
          highStartAltitude,
          highEndAltitude,
          noValidStartPoint: hasWaypoints && noValidStartPoint,
          noValidEndPoint: hasWaypoints && noValidEndPoint,
          startAltitude: startAlt,
          endAltitude: endAlt,
          nearbyStartWaypoints,
          nearbyEndWaypoints,
          hasWaypoints
        }
      });
    } else {
      stats.allValid++;
    }
  }

  // 결과 출력
  console.log('━'.repeat(80));
  console.log('📋 문제 유형별 통계');
  console.log('━'.repeat(80));
  console.log('');
  console.log(`  전체 등산로: ${stats.total}개`);
  console.log(`  ✅ 문제 없음: ${stats.allValid}개`);
  console.log(`  ⚠️  GPX waypoint 없음: ${stats.noWaypoints}개`);
  console.log('');
  console.log(`  🔴 높은 출발점 (200m 이상): ${stats.highStartAltitude}개`);
  console.log(`  🔴 높은 도착점 (200m 이상): ${stats.highEndAltitude}개`);
  console.log(`  🔴 유효한 출발점 waypoint 없음: ${stats.noValidStartPoint}개`);
  console.log(`  🔴 유효한 도착점 waypoint 없음: ${stats.noValidEndPoint}개`);
  console.log('');

  // 문제 있는 등산로 상세 출력
  if (issues.length > 0) {
    console.log('━'.repeat(80));
    console.log('⚠️  문제가 있는 등산로 상세');
    console.log('━'.repeat(80));
    console.log('');

    let currentMountain = '';

    for (const issue of issues) {
      if (issue.mountain !== currentMountain) {
        if (currentMountain !== '') {
          console.log('');
        }
        currentMountain = issue.mountain;
        console.log(`\n🏔️  ${currentMountain}`);
        console.log('-'.repeat(80));
      }

      const problems: string[] = [];

      if (issue.issues.highStartAltitude) {
        problems.push(`출발점 높음 (${issue.issues.startAltitude?.toFixed(0)}m)`);
      }

      if (issue.issues.highEndAltitude) {
        problems.push(`도착점 높음 (${issue.issues.endAltitude?.toFixed(0)}m)`);
      }

      if (issue.issues.noValidStartPoint) {
        problems.push('유효한 출발점 waypoint 없음');
      }

      if (issue.issues.noValidEndPoint) {
        problems.push('유효한 도착점 waypoint 없음');
      }

      console.log(`\n  ${issue.name}`);
      console.log(`    문제: ${problems.join(', ')}`);
      console.log(`    출발점: ${issue.issues.startAltitude?.toFixed(0)}m`);
      console.log(`    도착점: ${issue.issues.endAltitude?.toFixed(0)}m`);

      if (issue.issues.hasWaypoints) {
        if (issue.issues.nearbyStartWaypoints.length > 0) {
          console.log(`    출발점 근처 waypoints: ${issue.issues.nearbyStartWaypoints.join(', ')}`);
        } else {
          console.log(`    출발점 근처 waypoints: 없음`);
        }

        if (issue.issues.nearbyEndWaypoints.length > 0) {
          console.log(`    도착점 근처 waypoints: ${issue.issues.nearbyEndWaypoints.join(', ')}`);
        } else {
          console.log(`    도착점 근처 waypoints: 없음`);
        }
      } else {
        console.log(`    ⚠️  GPX waypoint 데이터 없음`);
      }
    }
  }

  // 최종 요약
  console.log('\n\n' + '━'.repeat(80));
  console.log('📊 최종 요약');
  console.log('━'.repeat(80));
  console.log('');
  console.log(`  전체: ${stats.total}개`);
  console.log(`  ✅ 유효: ${stats.allValid}개 (${((stats.allValid / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  ⚠️  문제 있음: ${issues.length}개 (${((issues.length / stats.total) * 100).toFixed(1)}%)`);
  console.log('');
  console.log('✨ 검증 완료!');
}

validateStartEndPoints().then(() => process.exit(0));
