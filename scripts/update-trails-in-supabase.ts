import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in .env.local');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

interface TrailUpdate {
  id: string;
  [key: string]: any;
}

async function updateTrails() {
  // 수정된 데이터 파일 경로
  const updateFilePath = path.join(process.cwd(), 'data', 'trails-to-update.json');

  if (!fs.existsSync(updateFilePath)) {
    console.error('❌ trails-to-update.json not found.');
    console.error('Create a file with array of { id, ...fieldsToUpdate }');
    console.error('\nExample format:');
    console.error(JSON.stringify([
      { id: 'uuid-1', region: '경기도' },
      { id: 'uuid-2', region: '강원도', difficulty: '중급' }
    ], null, 2));
    process.exit(1);
  }

  const updates: TrailUpdate[] = JSON.parse(fs.readFileSync(updateFilePath, 'utf-8'));
  console.log(`\n📂 Loaded ${updates.length} updates from ${updateFilePath}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    const { id, ...fieldsToUpdate } = update;

    if (!id) {
      console.error('❌ Missing id in update object:', update);
      errorCount++;
      continue;
    }

    try {
      const { error } = await supabase
        .from('trails')
        .update(fieldsToUpdate)
        .eq('id', id);

      if (error) {
        console.error(`❌ Failed to update ${id}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Updated ${id}:`, Object.keys(fieldsToUpdate).join(', '));
        successCount++;
      }

      // Rate limit 방지
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error: any) {
      console.error(`❌ Error updating ${id}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Update Summary:');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log(`  📈 Total: ${updates.length}`);
}

// 실행
updateTrails().catch(console.error);
