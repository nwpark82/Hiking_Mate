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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('🔍 trails 테이블의 실제 컬럼 확인 중...\n');

  const { data, error } = await supabase
    .from('trails')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ 오류:', error);
    return;
  }

  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log(`📋 총 ${columns.length}개의 컬럼이 존재합니다:\n`);
    columns.forEach((col, idx) => {
      console.log(`   ${idx + 1}. ${col}`);
    });

    // 주요 컬럼 확인
    console.log('\n✅ 주요 컬럼 확인:');
    console.log(`   like_count: ${columns.includes('like_count') ? '✅ 존재' : '❌ 없음'}`);
    console.log(`   view_count: ${columns.includes('view_count') ? '✅ 존재' : '❌ 없음'}`);
    console.log(`   trail_type: ${columns.includes('trail_type') ? '✅ 존재' : '❌ 없음'}`);
    console.log(`   overlap_rate: ${columns.includes('overlap_rate') ? '✅ 존재' : '❌ 없음'}`);
  } else {
    console.log('⚠️  테이블에 데이터가 없습니다.');
  }
}

checkColumns();
