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

// Haversine 거리 계산
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

// 왕복 경로 방식 갭 채우기
function smartFillGaps(coords: Coordinate[], gapThreshold: number = 100): {
  coords: Coordinate[];
  gapsFilled: number;
} {
  if (!coords || coords.length < 2) {
    return { coords, gapsFilled: 0 };
  }

  let result = [...coords];
  let gapsFilled = 0;

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
    return { coords, gapsFilled: 0 };
  }

  for (const gap of gaps) {
    let closestIndex = -1;
    let closestDistance = Infinity;

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

    if (gap.startIndex === 0 && closestIndex === -1) {
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
      // 직선 보간
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

      result.splice(gap.endIndex + gapsFilled, 0, ...interpolated);
      gapsFilled++;
      continue;
    }

    const roundtripSegment: Coordinate[] = [];

    if (gap.startIndex === 0 && closestIndex > gap.endIndex) {
      for (let i = coords.length - 1; i >= closestIndex; i--) {
        roundtripSegment.push(coords[i]);
      }
    } else {
      for (let i = gap.startIndex; i >= closestIndex; i--) {
        roundtripSegment.push(coords[i]);
      }
    }

    result.splice(gap.endIndex + gapsFilled, 0, ...roundtripSegment);
    gapsFilled++;
  }

  return { coords: result, gapsFilled };
}

// 출발점 재정렬
function reorderFromLowestPoint(coords: Coordinate[]): {
  coords: Coordinate[];
  reordered: boolean;
} {
  const altitudes = coords.map(c => c.altitude || 999999);
  const minAltIndex = altitudes.indexOf(Math.min(...altitudes));

  if (coords[0].altitude !== undefined && coords[0].altitude < 200) {
    return { coords, reordered: false };
  }

  const reordered = [
    ...coords.slice(minAltIndex),
    ...coords.slice(0, minAltIndex)
  ];

  return { coords: reordered, reordered: true };
}

async function fixSingleTrail(trail: any): Promise<{
  success: boolean;
  updated: boolean;
  altitudeAdded: boolean;
  reordered: boolean;
  gapsFilled: number;
  error?: string;
}> {
  try {
    // GPX 데이터에서 altitude 추출
    const gpxData = trail.gpx_data as any;
    if (!gpxData?.trackPoints) {
      return {
        success: false,
        updated: false,
        altitudeAdded: false,
        reordered: false,
        gapsFilled: 0,
        error: 'No GPX trackPoints'
      };
    }

    // path_coordinates 생성 (altitude 포함)
    let coords: Coordinate[] = gpxData.trackPoints.map((pt: any) => ({
      lat: pt.lat,
      lng: pt.lon,
      altitude: pt.ele
    }));

    const hasAltitude = coords.some(c => c.altitude !== undefined);
    if (!hasAltitude) {
      return {
        success: false,
        updated: false,
        altitudeAdded: false,
        reordered: false,
        gapsFilled: 0,
        error: 'No altitude in trackPoints'
      };
    }

    // 출발점 재정렬
    const { coords: reordered, reordered: wasReordered } = reorderFromLowestPoint(coords);
    coords = reordered;

    // 갭 처리
    const { coords: filled, gapsFilled } = smartFillGaps(coords, 100);

    // 거리 계산
    let totalDistance = 0;
    for (let i = 1; i < filled.length; i++) {
      totalDistance += calculateDistance(
        filled[i - 1].lat,
        filled[i - 1].lng,
        filled[i].lat,
        filled[i].lng
      );
    }

    // 고도 통계
    const altitudes = filled.map(c => c.altitude || 0);
    const minAlt = Math.min(...altitudes);
    const maxAlt = Math.max(...altitudes);
    const avgAlt = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;

    // 업데이트
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
      .eq('id', trail.id);

    if (updateError) {
      return {
        success: false,
        updated: false,
        altitudeAdded: false,
        reordered: false,
        gapsFilled: 0,
        error: updateError.message
      };
    }

    return {
      success: true,
      updated: true,
      altitudeAdded: true,
      reordered: wasReordered,
      gapsFilled
    };
  } catch (error: any) {
    return {
      success: false,
      updated: false,
      altitudeAdded: false,
      reordered: false,
      gapsFilled: 0,
      error: error.message
    };
  }
}

async function fixAllTrailsBatch() {
  console.log('🚀 전체 등산로 일괄 수정 시작\n');
  console.log('='.repeat(80));
  console.log('작업 내용:');
  console.log('  1. GPX에서 altitude 데이터 추출');
  console.log('  2. 출발점 재정렬 (200m 이상 고도이면)');
  console.log('  3. 갭 처리 (왕복 경로 방식)');
  console.log('  4. 거리 및 고도 통계 재계산');
  console.log('='.repeat(80));
  console.log('');

  // 전체 등산로 조회
  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, gpx_data')
    .order('mountain', { ascending: true });

  if (error || !trails) {
    console.error('❌ 데이터 조회 실패:', error?.message);
    return;
  }

  console.log(`📊 전체 등산로: ${trails.length}개\n`);

  const stats = {
    total: trails.length,
    success: 0,
    failed: 0,
    altitudeAdded: 0,
    reordered: 0,
    gapsFixed: 0,
    noGpxData: 0
  };

  const processedTrails: Array<{
    mountain: string;
    name: string;
    status: string;
    details: string;
  }> = [];

  let currentMountain = '';
  let batchCount = 0;

  for (let i = 0; i < trails.length; i++) {
    const trail = trails[i];

    if (trail.mountain !== currentMountain) {
      if (currentMountain !== '') {
        console.log('');
      }
      currentMountain = trail.mountain;
      console.log(`\n🏔️  ${currentMountain}`);
      console.log('-'.repeat(80));
    }

    const result = await fixSingleTrail(trail);

    let status = '';
    let details = '';

    if (result.success) {
      stats.success++;
      status = '✅';

      const updates: string[] = [];
      if (result.altitudeAdded) {
        stats.altitudeAdded++;
        updates.push('altitude');
      }
      if (result.reordered) {
        stats.reordered++;
        updates.push('reordered');
      }
      if (result.gapsFilled > 0) {
        stats.gapsFixed++;
        updates.push(`${result.gapsFilled} gaps`);
      }

      details = updates.length > 0 ? `[${updates.join(', ')}]` : '[no changes]';
    } else {
      stats.failed++;
      if (result.error === 'No GPX trackPoints') {
        stats.noGpxData++;
        status = '⚠️';
        details = '[No GPX]';
      } else {
        status = '❌';
        details = `[${result.error}]`;
      }
    }

    console.log(`  ${status} ${trail.name} ${details}`);

    processedTrails.push({
      mountain: trail.mountain,
      name: trail.name,
      status,
      details
    });

    batchCount++;

    // 100개마다 진행률 표시
    if (batchCount % 100 === 0) {
      const progress = ((batchCount / trails.length) * 100).toFixed(1);
      console.log(`\n  📊 진행률: ${batchCount}/${trails.length} (${progress}%)\n`);
    }
  }

  // 최종 요약
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 최종 결과');
  console.log('='.repeat(80));
  console.log('');
  console.log(`  전체: ${stats.total}개`);
  console.log(`  ✅ 성공: ${stats.success}개`);
  console.log(`  ❌ 실패: ${stats.failed}개`);
  console.log(`  ⚠️  GPX 없음: ${stats.noGpxData}개`);
  console.log('');
  console.log(`  🏔️  altitude 추가: ${stats.altitudeAdded}개`);
  console.log(`  🔄 출발점 재정렬: ${stats.reordered}개`);
  console.log(`  🔧 갭 수정: ${stats.gapsFixed}개`);
  console.log('');

  const successRate = ((stats.success / stats.total) * 100).toFixed(1);
  console.log(`  성공률: ${successRate}%`);
  console.log('');
  console.log('✨ 일괄 수정 완료!');
}

fixAllTrailsBatch().then(() => process.exit(0));
