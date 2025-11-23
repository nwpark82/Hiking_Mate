import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Coordinate {
  lat: number;
  lng: number;
  altitude?: number;
}

interface TrailIssue {
  id: string;
  name: string;
  mountain: string;
  issues: {
    highStartPoint: boolean;
    highEndPoint: boolean;
    startAltitude?: number;
    endAltitude?: number;
    hasGaps: boolean;
    gapCount: number;
    maxGapDistance?: number;
    totalCoords: number;
    hasAltitudeData: boolean;
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

function analyzeTrailIssues(
  trail: any,
  gapThreshold: number = 100,
  highAltitudeThreshold: number = 200
): TrailIssue {
  const coords = trail.path_coordinates as Coordinate[];

  if (!coords || coords.length === 0) {
    return {
      id: trail.id,
      name: trail.name,
      mountain: trail.mountain,
      issues: {
        highStartPoint: false,
        highEndPoint: false,
        hasGaps: false,
        gapCount: 0,
        totalCoords: 0,
        hasAltitudeData: false
      }
    };
  }

  // 고도 데이터 확인
  const hasAltitudeData = coords.some(c => c.altitude !== undefined && c.altitude !== null);

  // 출발/도착 지점 고도 확인
  const startAlt = coords[0].altitude;
  const endAlt = coords[coords.length - 1].altitude;

  const highStartPoint = hasAltitudeData && startAlt !== undefined && startAlt > highAltitudeThreshold;
  const highEndPoint = hasAltitudeData && endAlt !== undefined && endAlt > highAltitudeThreshold;

  // 갭 분석
  const gaps: number[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const dist = calculateDistance(
      coords[i].lat,
      coords[i].lng,
      coords[i + 1].lat,
      coords[i + 1].lng
    );

    if (dist > gapThreshold) {
      gaps.push(dist);
    }
  }

  return {
    id: trail.id,
    name: trail.name,
    mountain: trail.mountain,
    issues: {
      highStartPoint,
      highEndPoint,
      startAltitude: startAlt,
      endAltitude: endAlt,
      hasGaps: gaps.length > 0,
      gapCount: gaps.length,
      maxGapDistance: gaps.length > 0 ? Math.max(...gaps) : undefined,
      totalCoords: coords.length,
      hasAltitudeData
    }
  };
}

async function analyzeAllTrails() {
  console.log('🔍 전체 등산로 문제 분석 시작\n');
  console.log('='.repeat(80));
  console.log('분석 기준:');
  console.log('  - 출발/도착 지점: 200m 이상 고도면 "높은 지점" 판정');
  console.log('  - 갭: 연속 좌표 간 100m 이상 거리면 "갭" 판정');
  console.log('='.repeat(80));
  console.log('');

  // 모든 등산로 조회
  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, path_coordinates')
    .order('mountain', { ascending: true });

  if (error) {
    console.error('❌ 데이터 조회 실패:', error.message);
    return;
  }

  if (!trails || trails.length === 0) {
    console.log('❌ 등산로 데이터가 없습니다.');
    return;
  }

  console.log(`📊 총 등산로: ${trails.length}개\n`);

  // 각 등산로 분석
  const issues: TrailIssue[] = [];
  const noCoordinates: string[] = [];
  const noAltitude: string[] = [];

  for (const trail of trails) {
    if (!trail.path_coordinates || (trail.path_coordinates as any).length === 0) {
      noCoordinates.push(`${trail.mountain} - ${trail.name}`);
      continue;
    }

    const issue = analyzeTrailIssues(trail);

    if (!issue.issues.hasAltitudeData) {
      noAltitude.push(`${trail.mountain} - ${trail.name}`);
    }

    if (
      issue.issues.highStartPoint ||
      issue.issues.highEndPoint ||
      issue.issues.hasGaps
    ) {
      issues.push(issue);
    }
  }

  // 결과 출력
  console.log('━'.repeat(80));
  console.log('📋 문제 유형별 통계');
  console.log('━'.repeat(80));
  console.log('');

  // 1. path_coordinates 없음
  console.log(`1️⃣  path_coordinates 없음: ${noCoordinates.length}개`);
  if (noCoordinates.length > 0 && noCoordinates.length <= 10) {
    noCoordinates.forEach(name => console.log(`     - ${name}`));
  } else if (noCoordinates.length > 10) {
    console.log(`     (너무 많아 생략)`);
  }
  console.log('');

  // 2. altitude 데이터 없음
  console.log(`2️⃣  altitude 데이터 없음: ${noAltitude.length}개`);
  if (noAltitude.length > 0 && noAltitude.length <= 10) {
    noAltitude.forEach(name => console.log(`     - ${name}`));
  } else if (noAltitude.length > 10) {
    console.log(`     (처음 10개만 표시)`);
    noAltitude.slice(0, 10).forEach(name => console.log(`     - ${name}`));
  }
  console.log('');

  // 3. 출발점 높은 고도
  const highStartIssues = issues.filter(i => i.issues.highStartPoint);
  console.log(`3️⃣  출발점 높은 고도(200m 이상): ${highStartIssues.length}개`);
  if (highStartIssues.length > 0 && highStartIssues.length <= 20) {
    highStartIssues
      .sort((a, b) => (b.issues.startAltitude || 0) - (a.issues.startAltitude || 0))
      .forEach(issue => {
        console.log(`     - ${issue.mountain} ${issue.name}: ${issue.issues.startAltitude?.toFixed(0)}m`);
      });
  } else if (highStartIssues.length > 20) {
    console.log(`     (Top 20 표시)`);
    highStartIssues
      .sort((a, b) => (b.issues.startAltitude || 0) - (a.issues.startAltitude || 0))
      .slice(0, 20)
      .forEach(issue => {
        console.log(`     - ${issue.mountain} ${issue.name}: ${issue.issues.startAltitude?.toFixed(0)}m`);
      });
  }
  console.log('');

  // 4. 도착점 높은 고도
  const highEndIssues = issues.filter(i => i.issues.highEndPoint);
  console.log(`4️⃣  도착점 높은 고도(200m 이상): ${highEndIssues.length}개`);
  if (highEndIssues.length > 0 && highEndIssues.length <= 20) {
    highEndIssues
      .sort((a, b) => (b.issues.endAltitude || 0) - (a.issues.endAltitude || 0))
      .forEach(issue => {
        console.log(`     - ${issue.mountain} ${issue.name}: ${issue.issues.endAltitude?.toFixed(0)}m`);
      });
  } else if (highEndIssues.length > 20) {
    console.log(`     (Top 20 표시)`);
    highEndIssues
      .sort((a, b) => (b.issues.endAltitude || 0) - (a.issues.endAltitude || 0))
      .slice(0, 20)
      .forEach(issue => {
        console.log(`     - ${issue.mountain} ${issue.name}: ${issue.issues.endAltitude?.toFixed(0)}m`);
      });
  }
  console.log('');

  // 5. 갭 있음
  const gapIssues = issues.filter(i => i.issues.hasGaps);
  console.log(`5️⃣  갭 있음(100m 이상): ${gapIssues.length}개`);
  if (gapIssues.length > 0 && gapIssues.length <= 20) {
    gapIssues
      .sort((a, b) => (b.issues.maxGapDistance || 0) - (a.issues.maxGapDistance || 0))
      .forEach(issue => {
        console.log(`     - ${issue.mountain} ${issue.name}: ${issue.issues.gapCount}개 갭, 최대 ${issue.issues.maxGapDistance?.toFixed(0)}m`);
      });
  } else if (gapIssues.length > 20) {
    console.log(`     (Top 20 표시)`);
    gapIssues
      .sort((a, b) => (b.issues.maxGapDistance || 0) - (a.issues.maxGapDistance || 0))
      .slice(0, 20)
      .forEach(issue => {
        console.log(`     - ${issue.mountain} ${issue.name}: ${issue.issues.gapCount}개 갭, 최대 ${issue.issues.maxGapDistance?.toFixed(0)}m`);
      });
  }
  console.log('');

  // 6. 복합 문제 (출발점 + 갭)
  const complexIssues = issues.filter(i => i.issues.highStartPoint && i.issues.hasGaps);
  console.log(`6️⃣  복합 문제 (높은 출발점 + 갭): ${complexIssues.length}개`);
  if (complexIssues.length > 0 && complexIssues.length <= 20) {
    complexIssues.forEach(issue => {
      console.log(`     - ${issue.mountain} ${issue.name}: 출발 ${issue.issues.startAltitude?.toFixed(0)}m, ${issue.issues.gapCount}개 갭`);
    });
  } else if (complexIssues.length > 20) {
    console.log(`     (처음 20개만 표시)`);
    complexIssues.slice(0, 20).forEach(issue => {
      console.log(`     - ${issue.mountain} ${issue.name}: 출발 ${issue.issues.startAltitude?.toFixed(0)}m, ${issue.issues.gapCount}개 갭`);
    });
  }
  console.log('');

  // 최종 요약
  console.log('━'.repeat(80));
  console.log('📊 최종 요약');
  console.log('━'.repeat(80));
  console.log('');
  console.log(`  전체 등산로: ${trails.length}개`);
  console.log(`  문제 없음: ${trails.length - noCoordinates.length - noAltitude.length - issues.length}개`);
  console.log('');
  console.log(`  ❌ path_coordinates 없음: ${noCoordinates.length}개`);
  console.log(`  ⚠️  altitude 데이터 없음: ${noAltitude.length}개`);
  console.log(`  🔧 출발점 높은 고도: ${highStartIssues.length}개`);
  console.log(`  🔧 도착점 높은 고도: ${highEndIssues.length}개`);
  console.log(`  🔧 갭 있음: ${gapIssues.length}개`);
  console.log(`  🔧 복합 문제: ${complexIssues.length}개`);
  console.log('');

  const totalNeedsFixing = new Set([
    ...highStartIssues.map(i => i.id),
    ...highEndIssues.map(i => i.id),
    ...gapIssues.map(i => i.id)
  ]).size;

  console.log(`  🚨 수정 필요 등산로: ${totalNeedsFixing}개 (${((totalNeedsFixing / trails.length) * 100).toFixed(1)}%)`);
  console.log('');

  // 산별 통계
  const mountainStats: Record<string, { total: number; issues: number }> = {};

  trails.forEach(trail => {
    if (!mountainStats[trail.mountain]) {
      mountainStats[trail.mountain] = { total: 0, issues: 0 };
    }
    mountainStats[trail.mountain].total++;
  });

  issues.forEach(issue => {
    if (mountainStats[issue.mountain]) {
      mountainStats[issue.mountain].issues++;
    }
  });

  console.log('━'.repeat(80));
  console.log('🏔️  산별 통계 (문제 비율 높은 순)');
  console.log('━'.repeat(80));
  console.log('');

  const sortedMountains = Object.entries(mountainStats)
    .filter(([_, stats]) => stats.issues > 0)
    .sort((a, b) => (b[1].issues / b[1].total) - (a[1].issues / a[1].total))
    .slice(0, 30);

  sortedMountains.forEach(([mountain, stats]) => {
    const percentage = ((stats.issues / stats.total) * 100).toFixed(1);
    console.log(`  ${mountain}: ${stats.issues}/${stats.total}개 (${percentage}%)`);
  });

  console.log('');
  console.log('✨ 분석 완료!');
}

analyzeAllTrails().then(() => process.exit(0));
