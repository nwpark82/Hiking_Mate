const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTrailNaming() {
  try {
    console.log('=== 등산로 명명 규칙 확인 ===\n');

    // 1. trail_type별 분포 확인
    const { data: typeDistribution, error: typeError } = await supabase
      .from('trails')
      .select('trail_type')
      .order('trail_type');

    if (typeError) throw typeError;

    const typeCounts = {};
    typeDistribution.forEach(t => {
      const type = t.trail_type || 'null';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    console.log('1. Trail Type 분포:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}개`);
    });
    console.log('');

    // 2. "(정방향)" 포함된 등산로 확인
    const { data: forwardTrails, error: forwardError } = await supabase
      .from('trails')
      .select('id, name, mountain, trail_type')
      .like('name', '%(정방향)%')
      .order('name');

    if (forwardError) throw forwardError;

    console.log(`2. "(정방향)" 포함 등산로: ${forwardTrails.length}개`);
    if (forwardTrails.length > 0) {
      console.log('\n   샘플 (처음 10개):');
      forwardTrails.slice(0, 10).forEach(trail => {
        console.log(`   - ${trail.name} (${trail.mountain}) [${trail.trail_type || 'N/A'}]`);
      });

      // trail_type별 분포
      const forwardTypeCounts = {};
      forwardTrails.forEach(t => {
        const type = t.trail_type || 'null';
        forwardTypeCounts[type] = (forwardTypeCounts[type] || 0) + 1;
      });

      console.log('\n   "(정방향)" Trail Type 분포:');
      Object.entries(forwardTypeCounts).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}개`);
      });
    }
    console.log('');

    // 3. "(역방향)" 포함된 등산로 확인
    const { data: backwardTrails, error: backwardError } = await supabase
      .from('trails')
      .select('id, name, mountain, trail_type')
      .like('name', '%(역방향)%')
      .order('name');

    if (backwardError) throw backwardError;

    console.log(`3. "(역방향)" 포함 등산로: ${backwardTrails.length}개`);
    if (backwardTrails.length > 0) {
      console.log('\n   샘플 (처음 10개):');
      backwardTrails.slice(0, 10).forEach(trail => {
        console.log(`   - ${trail.name} (${trail.mountain}) [${trail.trail_type || 'N/A'}]`);
      });

      // trail_type별 분포
      const backwardTypeCounts = {};
      backwardTrails.forEach(t => {
        const type = t.trail_type || 'null';
        backwardTypeCounts[type] = (backwardTypeCounts[type] || 0) + 1;
      });

      console.log('\n   "(역방향)" Trail Type 분포:');
      Object.entries(backwardTypeCounts).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}개`);
      });
    }
    console.log('');

    // 4. trail_type = 'roundtrip' 인 등산로 중 일부 확인
    const { data: roundtripTrails, error: roundtripError } = await supabase
      .from('trails')
      .select('id, name, mountain, trail_type')
      .eq('trail_type', 'roundtrip')
      .limit(20);

    if (!roundtripError && roundtripTrails) {
      console.log(`4. trail_type = 'roundtrip' 샘플 (20개):`);
      roundtripTrails.forEach(trail => {
        console.log(`   - ${trail.name} (${trail.mountain})`);
      });
    }
    console.log('');

    // 5. 요약 및 권장사항
    console.log('=== 요약 ===');
    console.log(`총 등산로: ${typeDistribution.length}개`);
    console.log(`"(정방향)" 포함: ${forwardTrails.length}개`);
    console.log(`"(역방향)" 포함: ${backwardTrails.length}개`);
    console.log('');
    console.log('=== 권장사항 ===');
    if (forwardTrails.length > 0) {
      const roundtripCount = forwardTrails.filter(t => t.trail_type === 'roundtrip').length;
      console.log(`"(정방향)" 중 trail_type='roundtrip': ${roundtripCount}개`);

      if (roundtripCount === forwardTrails.length) {
        console.log('✅ 모든 "(정방향)"이 roundtrip입니다.');
        console.log('   → "(정방향)"을 "(왕복코스)"로 변경 권장');
      } else {
        console.log('⚠️  일부 "(정방향)"이 roundtrip이 아닙니다.');
        console.log('   → trail_type=\'roundtrip\'인 경우만 변경 권장');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTrailNaming();
