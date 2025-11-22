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

async function checkAndGuide() {
  console.log('\n🔍 Supabase 스키마 확인 중...\n');

  // 스키마 확인
  const { data: columns, error: schemaError } = await supabase
    .from('trails')
    .select('*')
    .limit(1);

  if (schemaError) {
    console.error('❌ 스키마 확인 실패:', schemaError.message);
    console.log('\n💡 데이터베이스에 연결할 수 없습니다. 환경 변수를 확인하세요.\n');
    return false;
  }

  if (!columns || columns.length === 0) {
    console.log('⚠️  trails 테이블에 데이터가 없습니다.');
    console.log('   빈 테이블에도 컬럼 추가는 가능합니다.\n');
  }

  const sampleRow = columns.length > 0 ? columns[0] : {};
  const hasTrailType = 'trail_type' in sampleRow;
  const hasOverlapRate = 'overlap_rate' in sampleRow;
  const hasPathCoords = 'path_coordinates' in sampleRow;
  const hasStartLat = 'start_latitude' in sampleRow;
  const hasStartLng = 'start_longitude' in sampleRow;

  console.log('📋 현재 스키마 상태:');
  console.log(`   trail_type: ${hasTrailType ? '✅ 존재' : '❌ 없음'}`);
  console.log(`   overlap_rate: ${hasOverlapRate ? '✅ 존재' : '❌ 없음'}`);
  console.log(`   path_coordinates: ${hasPathCoords ? '✅ 존재' : '❌ 없음'}`);
  console.log(`   start_latitude: ${hasStartLat ? '✅ 존재' : '❌ 없음'}`);
  console.log(`   start_longitude: ${hasStartLng ? '✅ 존재' : '❌ 없음'}`);
  console.log();

  const allColumnsExist = hasTrailType && hasOverlapRate && hasPathCoords && hasStartLat && hasStartLng;

  if (allColumnsExist) {
    console.log('🎉 모든 필수 컬럼이 이미 존재합니다!\n');
    console.log('💡 다음 명령어로 Script 25를 실행하세요:');
    console.log('   node scripts/25_classify_and_upload_trails.js\n');
    return true;
  }

  // 누락된 컬럼이 있으면 안내
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  필수 컬럼이 누락되었습니다');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const migrationPath = path.join(process.cwd(), 'supabase-migration-add-trail-classification.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 마이그레이션 SQL 파일 경로:');
  console.log(`   ${migrationPath}\n`);

  console.log('🔧 Supabase 대시보드에서 다음 SQL을 실행하세요:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(migrationSQL);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📖 실행 방법:');
  console.log('   1. Supabase 대시보드 접속: https://supabase.com/dashboard');
  console.log('   2. 프로젝트 선택');
  console.log('   3. 좌측 메뉴에서 "SQL Editor" 클릭');
  console.log('   4. 위 SQL을 붙여넣기');
  console.log('   5. "Run" 버튼 클릭\n');

  console.log('✅ 완료 후 이 스크립트를 다시 실행하여 확인하세요:');
  console.log('   node scripts/26_apply_schema_migration.js\n');

  return false;
}

// 실행
checkAndGuide()
  .then(ready => {
    if (ready) {
      console.log('✅ 스키마 마이그레이션 준비 완료!\n');
      process.exit(0);
    } else {
      console.log('⏸️  스키마 마이그레이션이 필요합니다.\n');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ 오류 발생:', err);
    process.exit(1);
  });
