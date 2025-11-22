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

async function checkTrailTypes() {
  console.log('🔍 트레일 타입 분류 상태 확인 중...\n');

  // 전체 트레일 개수
  const { count: totalCount } = await supabase
    .from('trails')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 총 트레일: ${totalCount}개\n`);

  // 타입별 분류
  const types = ['ROUNDTRIP', 'CIRCULAR_PARTIAL', 'CIRCULAR_UNIQUE', 'ONEWAY_PARTIAL', 'ONEWAY_UNIQUE'];

  console.log('📋 타입별 분류:');
  for (const type of types) {
    const { count } = await supabase
      .from('trails')
      .select('*', { count: 'exact', head: true })
      .eq('trail_type', type);

    console.log(`   ${type}: ${count || 0}개`);
  }

  // NULL 체크
  const { count: nullCount } = await supabase
    .from('trails')
    .select('*', { count: 'exact', head: true })
    .is('trail_type', null);

  console.log(`   NULL (미분류): ${nullCount || 0}개`);

  // 샘플 데이터 확인
  const { data: samples } = await supabase
    .from('trails')
    .select('name, trail_type, overlap_rate')
    .limit(5);

  console.log('\n📝 샘플 데이터:');
  samples?.forEach((trail, idx) => {
    console.log(`   ${idx + 1}. ${trail.name}`);
    console.log(`      타입: ${trail.trail_type || 'NULL'}`);
    console.log(`      중복률: ${trail.overlap_rate !== null ? (trail.overlap_rate * 100).toFixed(1) + '%' : 'NULL'}`);
  });
}

checkTrailTypes();
