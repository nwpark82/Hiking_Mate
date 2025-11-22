const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://chnqwgyiaagqxtvwueux.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobnF3Z3lpYWFncXh0dnd1ZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzM5NTcsImV4cCI6MjA3OTEwOTk1N30.QWDGk8EOqPusOsCTqwxIflSCko3QbCdF8vIOd3SX3oU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});

async function testConnection() {
  console.log('\n🔍 Supabase 연결 테스트 중...\n');

  try {
    // 1. 트레일 개수 확인
    console.log('1. 트레일 개수 확인 중...');
    const { count, error: countError } = await supabase
      .from('trails')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 트레일 개수 확인 실패:', countError);
      throw countError;
    }

    console.log(`✅ 트레일 개수: ${count}개\n`);

    // 2. 첫 5개 트레일 가져오기 (리스트 화면용 필드만)
    console.log('2. 첫 5개 트레일 가져오기 중...');
    const { data, error } = await supabase
      .from('trails')
      .select(`
        id,
        name,
        mountain,
        region,
        difficulty,
        distance,
        duration,
        elevation_gain,
        start_latitude,
        start_longitude,
        trail_type,
        overlap_rate,
        view_count,
        like_count,
        created_at
      `)
      .limit(5);

    if (error) {
      console.error('❌ 트레일 데이터 가져오기 실패:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  데이터가 없습니다.');
      return;
    }

    console.log(`✅ ${data.length}개 트레일 로드 성공\n`);
    console.log('샘플 데이터:');
    data.forEach((trail, i) => {
      console.log(`\n${i + 1}. ${trail.name} (${trail.mountain})`);
      console.log(`   - ID: ${trail.id}`);
      console.log(`   - 난이도: ${trail.difficulty}`);
      console.log(`   - 거리: ${trail.distance}m`);
      console.log(`   - 지역: ${trail.region || 'N/A'}`);
      console.log(`   - GPS: ${trail.start_latitude ? 'O' : 'X'}`);
    });

    console.log('\n✅ Supabase 연결 정상!\n');

  } catch (error) {
    console.error('\n❌ 연결 실패:', error);
    console.error('\n상세 에러:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
  }
}

testConnection();
