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

// Haversine 공식
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

/**
 * 스마트 갭 채우기
 *
 * 원리:
 * 1. 갭의 끝 포인트와 가장 가까운 이전 포인트를 찾음
 * 2. 그 포인트부터 갭 직전까지를 역순으로 채움
 * 3. 왕복 등산로를 시뮬레이션
 *
 * 예시:
 * 원본: [A, B, C, D, E | 갭 500m | F, G]
 *       (F가 C 근처)
 * 결과: [A, B, C, D, E, E, D, C, (F와 근접)]
 */
function smartFillGaps(coords, gapThreshold = 100) {
  if (!coords || coords.length < 2) {
    return {
      coords,
      hasGaps: false,
      gapsFilled: 0,
      details: []
    };
  }

  let result = [...coords];
  let gapsFilled = 0;
  let details = [];
  let offset = 0; // 삽입으로 인한 인덱스 오프셋

  // 1. 모든 갭 찾기
  const gaps = [];
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
      hasGaps: false,
      gapsFilled: 0,
      details: []
    };
  }

  // 2. 각 갭 처리
  for (const gap of gaps) {
    const gapStartIdx = gap.startIndex + offset;
    const gapEndIdx = gap.endIndex + offset;
    const gapEndPoint = result[gapEndIdx];

    // 갭 이전 포인트들 중에서 갭 끝 포인트와 가장 가까운 포인트 찾기
    let closestIndex = -1;
    let minDistance = Infinity;

    // 역순으로 탐색 (갭에서 가까운 쪽부터)
    for (let i = gapStartIdx; i >= 0; i--) {
      const dist = calculateDistance(
        result[i].lat,
        result[i].lng,
        gapEndPoint.lat,
        gapEndPoint.lng
      );

      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }

      // 거리가 다시 증가하기 시작하면 최소값을 찾았으므로 중단
      // (효율성을 위해, 거리가 minDistance의 2배가 되면 중단)
      if (i < gapStartIdx - 10 && dist > minDistance * 2) {
        break;
      }
    }

    // 갭 채우기: closestIndex부터 gapStartIdx까지 역순으로 추가
    if (closestIndex !== -1 && closestIndex < gapStartIdx) {
      const fillPath = [];
      for (let i = gapStartIdx; i >= closestIndex; i--) {
        fillPath.push({ ...result[i] });
      }

      // gapStartIdx 다음에 fillPath 삽입
      result.splice(gapStartIdx + 1, 0, ...fillPath);

      gapsFilled++;
      details.push({
        originalGapIndex: gap.startIndex,
        gapDistance: Math.round(gap.distance),
        closestPointIndex: closestIndex,
        closestPointDistance: Math.round(minDistance),
        fillPointsCount: fillPath.length,
        method: 'reverse_path'
      });

      // 오프셋 업데이트
      offset += fillPath.length;

    } else if (gap.distance > 500) {
      // 500m 이상의 큰 갭은 선형 보간
      const numPoints = Math.ceil(gap.distance / 50); // 50m마다 1개 포인트
      const fillPath = [];

      for (let i = 1; i < numPoints; i++) {
        const ratio = i / numPoints;
        fillPath.push({
          lat: result[gapStartIdx].lat + (gapEndPoint.lat - result[gapStartIdx].lat) * ratio,
          lng: result[gapStartIdx].lng + (gapEndPoint.lng - result[gapStartIdx].lng) * ratio
        });
      }

      result.splice(gapStartIdx + 1, 0, ...fillPath);

      gapsFilled++;
      details.push({
        originalGapIndex: gap.startIndex,
        gapDistance: Math.round(gap.distance),
        closestPointIndex: null,
        closestPointDistance: null,
        fillPointsCount: fillPath.length,
        method: 'linear_interpolation'
      });

      offset += fillPath.length;
    }
  }

  return {
    coords: result,
    hasGaps: gaps.length > 0,
    totalGaps: gaps.length,
    gapsFilled,
    originalLength: coords.length,
    newLength: result.length,
    pointsAdded: result.length - coords.length,
    details
  };
}

async function processTrailGaps() {
  console.log('🚀 스마트 갭 채우기 시작...\n');

  // trail-gaps-analysis.json 파일 읽기
  const gapsFilePath = path.join(process.cwd(), 'trail-gaps-analysis.json');

  if (!fs.existsSync(gapsFilePath)) {
    console.error('❌ trail-gaps-analysis.json 파일을 찾을 수 없습니다.');
    console.log('💡 먼저 detect-trail-gaps.js를 실행하세요.\n');
    return;
  }

  const gapsData = JSON.parse(fs.readFileSync(gapsFilePath, 'utf-8'));
  const trailsWithGaps = gapsData.trails;

  console.log(`📊 갭이 있는 트레일: ${trailsWithGaps.length}개`);
  console.log(`🔢 총 갭 개수: ${gapsData.summary.totalGaps}개\n`);

  // 사용자 확인
  console.log('⚠️  이 작업은 데이터베이스의 경로 데이터를 수정합니다.');
  console.log('   계속하려면 스크립트를 실행하세요.\n');

  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  const results = [];

  // 처리할 트레일 ID 목록
  const trailIds = trailsWithGaps.map(t => t.id);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 갭 채우기 처리 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const trailId of trailIds) {
    processedCount++;

    // 트레일 데이터 가져오기
    const { data: trail, error: fetchError } = await supabase
      .from('trails')
      .select('id, name, mountain, path_coordinates')
      .eq('id', trailId)
      .single();

    if (fetchError || !trail) {
      console.error(`   ❌ ${trailId}: 데이터 로드 실패`);
      errorCount++;
      continue;
    }

    if (!trail.path_coordinates || trail.path_coordinates.length < 2) {
      console.log(`   ⏭️  ${trail.name}: 경로 데이터 없음`);
      continue;
    }

    // 갭 채우기 적용
    const result = smartFillGaps(trail.path_coordinates, 100);

    if (!result.hasGaps) {
      console.log(`   ⏭️  ${trail.name}: 갭 없음`);
      continue;
    }

    // 데이터베이스 업데이트
    const { error: updateError } = await supabase
      .from('trails')
      .update({ path_coordinates: result.coords })
      .eq('id', trailId);

    if (updateError) {
      console.error(`   ❌ ${trail.name}: 업데이트 실패 - ${updateError.message}`);
      errorCount++;
      continue;
    }

    successCount++;
    console.log(`   ✅ ${trail.name} (${trail.mountain})`);
    console.log(`      갭: ${result.totalGaps}개 → ${result.gapsFilled}개 채움`);
    console.log(`      포인트: ${result.originalLength}개 → ${result.newLength}개 (+${result.pointsAdded})`);

    results.push({
      id: trailId,
      name: trail.name,
      mountain: trail.mountain,
      ...result
    });

    // 진행률 표시
    if (processedCount % 10 === 0) {
      console.log(`\n   진행률: ${processedCount}/${trailIds.length}...\n`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 처리 완료');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${errorCount}개`);
  console.log(`⏭️  스킵: ${processedCount - successCount - errorCount}개\n`);

  // 결과 저장
  const outputPath = path.join(process.cwd(), 'gap-fill-results.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        summary: {
          processed: processedCount,
          success: successCount,
          error: errorCount,
          timestamp: new Date().toISOString()
        },
        trails: results
      },
      null,
      2
    )
  );

  console.log(`📁 상세 결과 저장: ${outputPath}\n`);
}

processTrailGaps().catch(console.error);
