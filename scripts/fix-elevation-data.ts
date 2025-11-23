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

interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
  time?: string;
}

interface PathCoordinate {
  lat: number;
  lng: number;
  altitude?: number;
}

async function fixElevationData() {
  console.log('🔧 고도 데이터 복구 시작...\n');

  // Tier 1 대상 등산로
  const targetTrails = [
    { id: '8ce61126-a2ee-4e7f-ad7f-34861c6c1dbf', name: '북한산 9번 코스' },
    { id: '5d5a0bea-1958-4108-9cdd-d872dc1ba1a0', name: '관악산 1번 코스' }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const trail of targetTrails) {
    try {
      console.log(`\n📍 ${trail.name} 처리 중...`);

      // 1. gpx_data에서 trackPoints 가져오기
      const { data, error } = await supabase
        .from('trails')
        .select('id, name, gpx_data, path_coordinates')
        .eq('id', trail.id)
        .single();

      if (error) {
        console.error(`  ❌ 데이터 조회 실패:`, error.message);
        errorCount++;
        continue;
      }

      if (!data?.gpx_data?.trackPoints) {
        console.error(`  ❌ gpx_data.trackPoints 없음`);
        errorCount++;
        continue;
      }

      const trackPoints = data.gpx_data.trackPoints as TrackPoint[];
      console.log(`  ✅ trackPoints ${trackPoints.length}개 발견`);

      // 2. trackPoints를 path_coordinates 형식으로 변환 (altitude 포함)
      const pathCoordinatesWithAltitude: PathCoordinate[] = trackPoints.map(pt => ({
        lat: pt.lat,
        lng: pt.lon,
        altitude: pt.ele
      }));

      // 3. 고도 데이터 통계
      const altitudes = trackPoints.map(pt => pt.ele).filter(e => e !== undefined && e !== null);
      const minAlt = Math.min(...altitudes);
      const maxAlt = Math.max(...altitudes);
      const avgAlt = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;

      console.log(`  📊 고도 범위: ${Math.round(minAlt)}m ~ ${Math.round(maxAlt)}m`);
      console.log(`  📊 평균 고도: ${Math.round(avgAlt)}m`);

      // 4. path_coordinates 업데이트 (altitude 포함)
      const { error: updateError } = await supabase
        .from('trails')
        .update({
          path_coordinates: pathCoordinatesWithAltitude,
          min_altitude: Math.round(minAlt),
          max_altitude: Math.round(maxAlt),
          avg_altitude: Math.round(avgAlt),
          updated_at: new Date().toISOString()
        })
        .eq('id', trail.id);

      if (updateError) {
        console.error(`  ❌ 업데이트 실패:`, updateError.message);
        errorCount++;
        continue;
      }

      console.log(`  ✅ path_coordinates 업데이트 완료 (altitude 포함)`);

      // 5. 검증
      const { data: verifyData } = await supabase
        .from('trails')
        .select('path_coordinates')
        .eq('id', trail.id)
        .single();

      const firstCoord = verifyData?.path_coordinates?.[0];
      const lastCoord = verifyData?.path_coordinates?.[verifyData.path_coordinates.length - 1];

      if (firstCoord?.altitude !== undefined) {
        console.log(`  ✅ 검증 성공 - 첫 포인트 altitude: ${firstCoord.altitude}m`);
        console.log(`  ✅ 검증 성공 - 마지막 포인트 altitude: ${lastCoord?.altitude}m`);
        successCount++;
      } else {
        console.error(`  ❌ 검증 실패 - altitude 필드 없음`);
        errorCount++;
      }

    } catch (error: any) {
      console.error(`  ❌ 오류:`, error.message);
      errorCount++;
    }
  }

  console.log('\n\n📊 작업 완료');
  console.log(`  ✅ 성공: ${successCount}개`);
  console.log(`  ❌ 실패: ${errorCount}개`);
  console.log(`  📈 전체: ${targetTrails.length}개`);
}

fixElevationData().then(() => {
  console.log('\n✨ 고도 데이터 복구 완료!');
  process.exit(0);
});
