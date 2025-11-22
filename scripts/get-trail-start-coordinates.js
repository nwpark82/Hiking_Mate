const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTrailStartCoordinates() {
  try {
    console.log('=== 테스트용 등산로 시작점 좌표 ===\n');

    // 시작점 좌표가 있는 등산로 중 일부 선택
    const { data: trails, error } = await supabase
      .from('trails')
      .select('id, name, mountain, region, start_latitude, start_longitude, trail_type')
      .not('start_latitude', 'is', null)
      .not('start_longitude', 'is', null)
      .limit(20);

    if (error) throw error;

    if (!trails || trails.length === 0) {
      console.log('시작점 좌표가 있는 등산로를 찾을 수 없습니다.');
      return;
    }

    console.log(`총 ${trails.length}개 등산로 샘플:\n`);

    trails.forEach((trail, index) => {
      console.log(`${index + 1}. ${trail.name} (${trail.mountain})`);
      console.log(`   지역: ${trail.region}`);
      console.log(`   유형: ${trail.trail_type}`);
      console.log(`   📍 시작점 좌표:`);
      console.log(`      위도(Latitude): ${trail.start_latitude}`);
      console.log(`      경도(Longitude): ${trail.start_longitude}`);
      console.log(`   🔗 Google Maps: https://www.google.com/maps?q=${trail.start_latitude},${trail.start_longitude}`);
      console.log('');
    });

    console.log('=== Chrome DevTools Sensors 설정 방법 ===');
    console.log('1. F12 → Ctrl+Shift+P → "Show Sensors" 입력');
    console.log('2. Location 섹션에서 "Other..." 선택');
    console.log('3. 위 좌표 중 하나를 입력:');
    console.log(`   예) Latitude: ${trails[0].start_latitude}`);
    console.log(`       Longitude: ${trails[0].start_longitude}`);
    console.log('');

    console.log('=== 25m 근처 테스트 좌표 (시작점에서 약간 떨어진 위치) ===');
    const testTrail = trails[0];
    // 약 20m 정도 북쪽으로 이동 (위도 +0.0002)
    const nearbyLat = testTrail.start_latitude + 0.0002;
    const nearbyLng = testTrail.start_longitude;

    console.log(`테스트 등산로: ${testTrail.name}`);
    console.log('');
    console.log('✅ 출발지점 (성공 테스트용):');
    console.log(`   Latitude: ${testTrail.start_latitude}`);
    console.log(`   Longitude: ${testTrail.start_longitude}`);
    console.log('');
    console.log('⚠️  약 20m 떨어진 위치 (알림 테스트용):');
    console.log(`   Latitude: ${nearbyLat}`);
    console.log(`   Longitude: ${nearbyLng}`);
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  }
}

getTrailStartCoordinates();
