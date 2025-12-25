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

async function deleteGarisan1Reverse() {
  console.log('🗑️  가리산 1번 코스 역방향 삭제 시작\n');
  console.log('='.repeat(80));
  console.log('사유: 정방향이 왕복 코스로 변경되어 역방향 불필요');
  console.log('='.repeat(80));
  console.log('');

  // 가리산 1번 코스 역방향 조회
  const { data: trail, error } = await supabase
    .from('trails')
    .select('id, name, mountain')
    .eq('mountain', '가리산')
    .ilike('name', '%1번%')
    .ilike('name', '%역방향%')
    .single();

  if (error || !trail) {
    console.error('❌ 가리산 1번 코스 역방향을 찾을 수 없습니다:', error?.message);
    return;
  }

  console.log(`📋 삭제 대상 등산로:`);
  console.log(`   이름: ${trail.name}`);
  console.log(`   산: ${trail.mountain}`);
  console.log(`   ID: ${trail.id}\n`);

  // 삭제 실행
  console.log('🗑️  삭제 중...');

  const { error: deleteError } = await supabase
    .from('trails')
    .delete()
    .eq('id', trail.id);

  if (deleteError) {
    console.error('❌ 삭제 실패:', deleteError.message);
    return;
  }

  console.log('✅ 삭제 완료!\n');
  console.log('='.repeat(80));
  console.log('✨ 가리산 1번 코스 역방향이 성공적으로 삭제되었습니다!');
  console.log('='.repeat(80));
}

deleteGarisan1Reverse().then(() => process.exit(0));
