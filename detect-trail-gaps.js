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

// 경로의 갭 감지
function detectGaps(coords, thresholds = [100, 200, 500]) {
  if (!coords || coords.length < 2) {
    return { hasGap: false, gaps: [], maxGap: 0 };
  }

  const gaps = [];
  let maxGap = 0;

  for (let i = 1; i < coords.length; i++) {
    const dist = calculateDistance(
      coords[i - 1].lat,
      coords[i - 1].lng,
      coords[i].lat,
      coords[i].lng
    );

    if (dist > thresholds[0]) {
      gaps.push({
        index: i,
        fromPoint: coords[i - 1],
        toPoint: coords[i],
        distance: dist,
        severity: dist > thresholds[2] ? 'critical' : dist > thresholds[1] ? 'major' : 'minor'
      });

      if (dist > maxGap) {
        maxGap = dist;
      }
    }
  }

  return {
    hasGap: gaps.length > 0,
    gaps,
    maxGap,
    gapCount: gaps.length,
    totalPoints: coords.length
  };
}

async function analyzeTrailGaps() {
  console.log('🔍 등산로 경로 갭 분석 시작...\n');

  // 갭 임계값 설정
  const GAP_THRESHOLD_MINOR = 100;  // 100m 이상
  const GAP_THRESHOLD_MAJOR = 200;  // 200m 이상
  const GAP_THRESHOLD_CRITICAL = 500; // 500m 이상

  console.log('📏 갭 분류 기준:');
  console.log(`   Minor (경미): ${GAP_THRESHOLD_MINOR}m ~ ${GAP_THRESHOLD_MAJOR}m`);
  console.log(`   Major (심각): ${GAP_THRESHOLD_MAJOR}m ~ ${GAP_THRESHOLD_CRITICAL}m`);
  console.log(`   Critical (치명적): ${GAP_THRESHOLD_CRITICAL}m 이상\n`);

  // 모든 트레일 데이터 가져오기
  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, region, distance, trail_type, path_coordinates')
    .order('name');

  if (error) {
    console.error('❌ 데이터 로드 실패:', error);
    return;
  }

  console.log(`📊 총 ${trails.length}개 트레일 분석 중...\n`);

  const results = [];
  let processedCount = 0;
  let trailsWithGaps = 0;
  let totalGaps = 0;

  const gapStats = {
    minor: 0,
    major: 0,
    critical: 0
  };

  for (const trail of trails) {
    processedCount++;

    // 진행률 표시
    if (processedCount % 100 === 0) {
      console.log(`   처리 중: ${processedCount}/${trails.length}...`);
    }

    // 경로 데이터가 없는 경우
    if (!trail.path_coordinates || trail.path_coordinates.length < 2) {
      continue;
    }

    // 갭 감지
    const gapAnalysis = detectGaps(
      trail.path_coordinates,
      [GAP_THRESHOLD_MINOR, GAP_THRESHOLD_MAJOR, GAP_THRESHOLD_CRITICAL]
    );

    if (gapAnalysis.hasGap) {
      trailsWithGaps++;
      totalGaps += gapAnalysis.gapCount;

      // 갭 심각도별 통계
      gapAnalysis.gaps.forEach(gap => {
        if (gap.severity === 'minor') gapStats.minor++;
        else if (gap.severity === 'major') gapStats.major++;
        else if (gap.severity === 'critical') gapStats.critical++;
      });

      results.push({
        id: trail.id,
        name: trail.name,
        mountain: trail.mountain,
        region: trail.region,
        distance: trail.distance,
        trail_type: trail.trail_type,
        totalPoints: gapAnalysis.totalPoints,
        gapCount: gapAnalysis.gapCount,
        maxGap: gapAnalysis.maxGap,
        gaps: gapAnalysis.gaps.map(gap => ({
          index: gap.index,
          distance: Math.round(gap.distance),
          severity: gap.severity,
          fromPoint: {
            lat: gap.fromPoint.lat.toFixed(6),
            lng: gap.fromPoint.lng.toFixed(6)
          },
          toPoint: {
            lat: gap.toPoint.lat.toFixed(6),
            lng: gap.toPoint.lng.toFixed(6)
          }
        }))
      });
    }
  }

  console.log(`\n✅ 분석 완료: ${processedCount}개 처리\n`);

  // 통계 출력
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 갭 분석 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`📍 전체 트레일: ${trails.length}개`);
  console.log(`⚠️  갭이 있는 트레일: ${trailsWithGaps}개 (${((trailsWithGaps / trails.length) * 100).toFixed(1)}%)`);
  console.log(`✅ 갭이 없는 트레일: ${trails.length - trailsWithGaps}개 (${(((trails.length - trailsWithGaps) / trails.length) * 100).toFixed(1)}%)`);
  console.log(`\n🔢 총 갭 개수: ${totalGaps}개`);
  console.log(`📊 평균 갭/트레일: ${(totalGaps / trailsWithGaps).toFixed(1)}개\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 갭 심각도별 분포');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`⚠️  Minor (100-200m):     ${gapStats.minor}개 (${((gapStats.minor / totalGaps) * 100).toFixed(1)}%)`);
  console.log(`❌ Major (200-500m):     ${gapStats.major}개 (${((gapStats.major / totalGaps) * 100).toFixed(1)}%)`);
  console.log(`🚨 Critical (500m+):     ${gapStats.critical}개 (${((gapStats.critical / totalGaps) * 100).toFixed(1)}%)\n`);

  // 타입별 갭 통계
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 타입별 갭 발생률');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const types = ['ROUNDTRIP', 'CIRCULAR_PARTIAL', 'CIRCULAR_UNIQUE', 'ONEWAY_PARTIAL', 'ONEWAY_UNIQUE'];
  for (const type of types) {
    const typeTrails = trails.filter(t => t.trail_type === type);
    const typeWithGaps = results.filter(r => r.trail_type === type);
    if (typeTrails.length > 0) {
      const rate = (typeWithGaps.length / typeTrails.length) * 100;
      console.log(`   ${type}: ${typeWithGaps.length}/${typeTrails.length} (${rate.toFixed(1)}%)`);
    }
  }

  // 갭이 가장 많은 트레일 TOP 20
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  갭이 가장 많은 트레일 TOP 20');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sortedByGapCount = [...results].sort((a, b) => b.gapCount - a.gapCount).slice(0, 20);

  sortedByGapCount.forEach((trail, idx) => {
    const criticalGaps = trail.gaps.filter(g => g.severity === 'critical').length;
    const majorGaps = trail.gaps.filter(g => g.severity === 'major').length;
    const minorGaps = trail.gaps.filter(g => g.severity === 'minor').length;

    console.log(`${idx + 1}. ${trail.name} (${trail.mountain})`);
    console.log(`   총 갭: ${trail.gapCount}개 (🚨${criticalGaps} ❌${majorGaps} ⚠️${minorGaps})`);
    console.log(`   최대 갭: ${Math.round(trail.maxGap)}m`);
    console.log(`   타입: ${trail.trail_type}`);
    console.log('');
  });

  // 최대 갭 거리 TOP 20
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚨 최대 갭 거리 TOP 20');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sortedByMaxGap = [...results].sort((a, b) => b.maxGap - a.maxGap).slice(0, 20);

  sortedByMaxGap.forEach((trail, idx) => {
    const biggestGap = trail.gaps.reduce((max, gap) => gap.distance > max.distance ? gap : max, trail.gaps[0]);

    console.log(`${idx + 1}. ${trail.name} (${trail.mountain})`);
    console.log(`   최대 갭: ${Math.round(trail.maxGap)}m`);
    console.log(`   위치: Point ${biggestGap.index}/${trail.totalPoints}`);
    console.log(`   좌표: ${biggestGap.fromPoint.lat}, ${biggestGap.fromPoint.lng}`);
    console.log(`        → ${biggestGap.toPoint.lat}, ${biggestGap.toPoint.lng}`);
    console.log('');
  });

  // 결과를 JSON 파일로 저장
  const outputPath = path.join(process.cwd(), 'trail-gaps-analysis.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        summary: {
          totalTrails: trails.length,
          trailsWithGaps,
          trailsWithoutGaps: trails.length - trailsWithGaps,
          totalGaps,
          avgGapsPerTrail: totalGaps / trailsWithGaps,
          gapStats,
          thresholds: {
            minor: GAP_THRESHOLD_MINOR,
            major: GAP_THRESHOLD_MAJOR,
            critical: GAP_THRESHOLD_CRITICAL
          }
        },
        trails: results.sort((a, b) => b.maxGap - a.maxGap)
      },
      null,
      2
    )
  );

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📁 상세 결과 저장: ${outputPath}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('💡 다음 단계:');
  console.log('   1. trail-gaps-analysis.json 파일에서 상세 갭 정보 확인');
  console.log('   2. 갭이 있는 트레일의 경로 데이터 보완 작업 진행');
  console.log('   3. Kakao Roads API를 활용한 경로 보완 고려\n');
}

analyzeTrailGaps().catch(console.error);
