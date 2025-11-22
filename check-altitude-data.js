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

async function checkAltitudeData() {
  console.log('🔍 고도 데이터 확인 중...\n');

  // 샘플 트레일 데이터 가져오기 (가리산 2번 코스)
  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, path_coordinates, elevation_gain, max_altitude')
    .ilike('name', '%가리산 2번%')
    .limit(1);

  if (error) {
    console.error('❌ 데이터 로드 실패:', error);
    return;
  }

  if (!trails || trails.length === 0) {
    console.log('❌ 가리산 2번 코스를 찾을 수 없습니다.');
    return;
  }

  const trail = trails[0];

  console.log(`📍 Trail: ${trail.name} (${trail.mountain})`);
  console.log(`   ID: ${trail.id}`);
  console.log(`   elevation_gain: ${trail.elevation_gain}`);
  console.log(`   max_altitude: ${trail.max_altitude}\n`);

  if (!trail.path_coordinates || trail.path_coordinates.length === 0) {
    console.log('❌ 경로 데이터가 없습니다.');
    return;
  }

  console.log(`📊 경로 포인트 개수: ${trail.path_coordinates.length}개\n`);

  // 첫 5개 포인트 확인
  console.log('🔍 첫 5개 포인트 구조:');
  trail.path_coordinates.slice(0, 5).forEach((point, idx) => {
    console.log(`   ${idx + 1}:`, JSON.stringify(point));
  });

  // 고도 데이터 확인
  const hasAltitude = trail.path_coordinates.some(p => p.altitude !== undefined || p.ele !== undefined || p.elevation !== undefined);

  console.log(`\n📈 고도 데이터 존재 여부: ${hasAltitude ? '✅ 있음' : '❌ 없음'}`);

  if (hasAltitude) {
    // 고도 통계 계산
    const altitudes = trail.path_coordinates
      .map(p => p.altitude || p.ele || p.elevation)
      .filter(alt => alt !== undefined && alt !== null);

    if (altitudes.length > 0) {
      const minAlt = Math.min(...altitudes);
      const maxAlt = Math.max(...altitudes);
      const avgAlt = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;

      console.log(`\n📊 고도 통계:`);
      console.log(`   최저: ${Math.round(minAlt)}m`);
      console.log(`   최고: ${Math.round(maxAlt)}m`);
      console.log(`   평균: ${Math.round(avgAlt)}m`);
      console.log(`   데이터 포인트: ${altitudes.length}/${trail.path_coordinates.length}개`);
    }
  } else {
    console.log('\n💡 path_coordinates에 고도 데이터가 없습니다.');
    console.log('   elevation_gain과 max_altitude 컬럼 값을 사용해야 합니다.');
  }
}

checkAltitudeData().catch(console.error);
