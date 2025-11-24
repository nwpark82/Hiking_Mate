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

interface TrailJson {
  mountain: string;
  courseName: string;
  distance: number; // in meters
}

async function fixShortDistances() {
  console.log('🔧 짧은 거리 등산로 수정 시작\n');

  // 1. Load trails.json
  const jsonPath = path.join(__dirname, '../data/trails.json');
  const jsonTrails: TrailJson[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`✅ trails.json 로드: ${jsonTrails.length}개\n`);

  // 2. Get trails with distance < 1km from database
  const { data: shortTrails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, distance')
    .lt('distance', 1);

  if (error) {
    console.error('❌ 조회 실패:', error);
    return;
  }

  console.log(`📊 수정 대상: ${shortTrails.length}개 (1km 미만 등산로)\n`);

  let fixedCount = 0;
  let notFoundCount = 0;

  for (const dbTrail of shortTrails) {
    // Find matching trail in JSON
    // Match by mountain name
    const jsonTrail = jsonTrails.find(j =>
      j.mountain === dbTrail.mountain &&
      (dbTrail.name.includes(j.courseName.split(' ')[0]) ||
       j.courseName.includes(dbTrail.name.split(' ')[0]))
    );

    if (!jsonTrail) {
      notFoundCount++;
      console.log(`⚠️  매칭 실패: ${dbTrail.mountain} ${dbTrail.name}`);
      continue;
    }

    const correctDistanceKm = Number((jsonTrail.distance / 1000).toFixed(1));

    // Only update if significantly different
    if (Math.abs(correctDistanceKm - dbTrail.distance) > 0.5) {
      const { error: updateError } = await supabase
        .from('trails')
        .update({
          distance: correctDistanceKm,
          original_distance: correctDistanceKm
        })
        .eq('id', dbTrail.id);

      if (updateError) {
        console.error(`❌ 업데이트 실패 (${dbTrail.name}):`, updateError);
      } else {
        fixedCount++;
        console.log(`✅ ${dbTrail.mountain} ${dbTrail.name}: ${dbTrail.distance}km → ${correctDistanceKm}km`);
      }
    }
  }

  console.log(`\n📊 결과:`);
  console.log(`  - 수정 완료: ${fixedCount}개`);
  console.log(`  - 매칭 실패: ${notFoundCount}개`);
}

fixShortDistances()
  .then(() => {
    console.log('\n✅ 짧은 거리 수정 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
