import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TrailData {
  mountain: string;
  courseName: string;
  distance: number; // in meters
}

async function restoreOriginalDistances() {
  console.log('🔄 원본 거리 데이터 복구 시작\n');

  // 1. Read trails.json
  const jsonPath = path.join(__dirname, '../data/trails.json');
  const trailsData: TrailData[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`✅ trails.json에서 ${trailsData.length}개 등산로 로드 완료\n`);

  // 2. Fetch all trails from database
  console.log('📊 데이터베이스에서 등산로 조회 중...');
  const { data: dbTrails, error: fetchError } = await supabase
    .from('trails')
    .select('id, name, mountain');

  if (fetchError) {
    console.error('❌ 데이터베이스 조회 실패:', fetchError);
    return;
  }

  console.log(`✅ 데이터베이스에서 ${dbTrails.length}개 등산로 조회 완료\n`);

  // 3. Match and update
  let matchCount = 0;
  let updateCount = 0;
  let notFoundCount = 0;

  for (const jsonTrail of trailsData) {
    // Find matching trail in database
    // Match by mountain and name (courseName in JSON = name in DB)
    const dbTrail = dbTrails.find(
      (t) => t.mountain === jsonTrail.mountain && t.name.includes(jsonTrail.courseName.split(' ')[0])
    );

    if (!dbTrail) {
      notFoundCount++;
      if (notFoundCount <= 5) {
        console.log(`⚠️  매칭 실패: ${jsonTrail.mountain} ${jsonTrail.courseName}`);
      }
      continue;
    }

    matchCount++;

    // Convert meters to kilometers
    const originalDistanceKm = Number((jsonTrail.distance / 1000).toFixed(1));

    // Update with original_distance
    const { error: updateError } = await supabase
      .from('trails')
      .update({ original_distance: originalDistanceKm })
      .eq('id', dbTrail.id);

    if (updateError) {
      console.error(`❌ 업데이트 실패 (${dbTrail.mountain} ${dbTrail.name}):`, updateError);
    } else {
      updateCount++;
      if (updateCount <= 10) {
        console.log(`✅ ${dbTrail.mountain} ${dbTrail.name}: ${originalDistanceKm}km`);
      } else if (updateCount === 11) {
        console.log('   ... (나머지 업데이트 진행 중)');
      }
    }
  }

  console.log(`\n📊 작업 완료:`)
  console.log(`  - 매칭 성공: ${matchCount}개`);
  console.log(`  - 업데이트 성공: ${updateCount}개`);
  console.log(`  - 매칭 실패: ${notFoundCount}개`);

  // 4. Save report
  const report = [
    '# 원본 거리 데이터 복구 보고서',
    `생성일: ${new Date().toISOString()}`,
    '',
    '## 요약',
    `- trails.json 파일: ${trailsData.length}개 등산로`,
    `- 데이터베이스: ${dbTrails.length}개 등산로`,
    `- 매칭 성공: ${matchCount}개`,
    `- 업데이트 성공: ${updateCount}개`,
    `- 매칭 실패: ${notFoundCount}개`,
    '',
    '## 다음 단계',
    '1. Supabase에서 현재 distance와 original_distance 비교',
    '2. 차이가 큰 등산로 확인 및 검증',
    '3. 문제가 없으면 original_distance를 distance로 복사',
    ''
  ].join('\n');

  const reportPath = '.claude/1차 제품고도화/original-distance-restore-report.txt';
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n✅ 보고서 저장: ${reportPath}`);
}

restoreOriginalDistances()
  .then(() => {
    console.log('\n✅ 원본 거리 복구 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
