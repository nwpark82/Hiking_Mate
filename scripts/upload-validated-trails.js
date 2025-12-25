const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const data = require('../data/validated_trails_2025-11-26 (4).json');

async function updateTrails() {
  console.log('총', data.trails.length, '개 등산로 업데이트 시작...\n');

  let success = 0;
  let failed = 0;

  for (const trail of data.trails) {
    // trackPoints를 path 형식으로 변환
    const path = trail.trackPoints.map(p => ({
      lat: p.lat,
      lng: p.lng,
      elevation: p.alt
    }));

    const { error } = await supabase
      .from('trails')
      .update({
        distance: trail.distance,
        path_coordinates: path
      })
      .eq('id', trail.id);

    if (error) {
      console.error('❌ 실패:', trail.name, error.message);
      failed++;
    } else {
      console.log('✅ 성공:', trail.name);
      console.log('   거리:', trail.originalDistance?.toFixed(2), '→', trail.distance?.toFixed(2), 'km');
      console.log('   좌표:', trail.trackPoints.length, '개');
      success++;
    }
  }

  console.log('\n========== 결과 ==========');
  console.log('성공:', success);
  console.log('실패:', failed);
  console.log('========================');
}

updateTrails().catch(console.error);
