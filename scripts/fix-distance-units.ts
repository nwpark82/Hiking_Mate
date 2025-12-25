import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDistanceUnits() {
  console.log('🔧 거리 단위 수정 시작 (미터 → 킬로미터)\n');

  // Find trails with distance > 50km (likely in meters)
  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, distance')
    .gt('distance', 50)
    .order('distance', { ascending: false });

  if (error) {
    console.error('❌ 데이터 조회 실패:', error);
    return;
  }

  console.log(`📊 수정 대상: ${trails.length}개 등산로\n`);

  const fixes = [];
  let successCount = 0;
  let failCount = 0;

  for (const trail of trails) {
    const oldDistance = trail.distance;
    const newDistance = Number((oldDistance / 1000).toFixed(1));

    console.log(`수정 중: ${trail.mountain} ${trail.name}`);
    console.log(`  ${oldDistance.toFixed(0)}m → ${newDistance}km`);

    const { error: updateError } = await supabase
      .from('trails')
      .update({ distance: newDistance })
      .eq('id', trail.id);

    if (updateError) {
      console.error(`  ❌ 실패:`, updateError.message);
      failCount++;
    } else {
      console.log(`  ✅ 완료`);
      successCount++;
      fixes.push({
        id: trail.id,
        mountain: trail.mountain,
        name: trail.name,
        oldDistance,
        newDistance
      });
    }
  }

  console.log(`\n📊 수정 완료:`);
  console.log(`  ✅ 성공: ${successCount}개`);
  console.log(`  ❌ 실패: ${failCount}개`);

  // Save detailed report
  const report = [
    '# 거리 단위 수정 보고서',
    `생성일: ${new Date().toISOString()}`,
    '',
    '## 요약',
    `- 수정 대상: ${trails.length}개`,
    `- 성공: ${successCount}개`,
    `- 실패: ${failCount}개`,
    '',
    '## 수정 내역',
    '',
    '| ID | 산 | 등산로 | 기존 거리 | 수정 거리 |',
    '|---|---|---|---|---|',
    ...fixes.map(f =>
      `| ${f.id} | ${f.mountain} | ${f.name} | ${f.oldDistance.toFixed(0)}m | ${f.newDistance}km |`
    ),
    ''
  ].join('\n');

  const reportPath = '.claude/1차 제품고도화/distance-fix-report.txt';
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n✅ 보고서 저장: ${reportPath}`);

  return fixes;
}

fixDistanceUnits()
  .then(() => {
    console.log('\n✅ 모든 거리 단위 수정 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
