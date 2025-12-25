import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Trail {
  id: string;
  name: string;
  mountain: string;
  distance: number;
  original_distance: number | null;
}

async function checkDistanceIssues() {
  console.log('🔍 거리 단위 및 데이터 검증 시작...\n');

  // Fetch all trails
  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, distance, original_distance')
    .order('name');

  if (error) {
    console.error('❌ 데이터 조회 실패:', error);
    return;
  }

  console.log(`✅ 총 ${trails.length}개 등산로 조회 완료\n`);

  // Check for trails with 3x or more difference from original
  const problematicTrails: Trail[] = [];
  const needsReversion: Trail[] = [];

  for (const trail of trails) {
    if (trail.original_distance && trail.original_distance > 0) {
      const ratio = trail.distance / trail.original_distance;

      // If current distance is 3x or more different from original
      if (ratio >= 3 || ratio <= 0.33) {
        problematicTrails.push(trail);
        needsReversion.push(trail);

        console.log(`⚠️  ${trail.mountain} ${trail.name}`);
        console.log(`   현재 거리: ${trail.distance.toFixed(2)}km`);
        console.log(`   원천 거리: ${trail.original_distance.toFixed(2)}km`);
        console.log(`   비율: ${ratio.toFixed(2)}x\n`);
      }
    }
  }

  // Check for potential meter/km confusion (distances > 100)
  const suspiciouslyLarge = trails.filter(t => t.distance > 100);

  if (suspiciouslyLarge.length > 0) {
    console.log(`\n📊 100km 이상 등산로 (단위 오기재 의심):`);
    for (const trail of suspiciouslyLarge) {
      console.log(`   ${trail.mountain} ${trail.name}: ${trail.distance.toFixed(2)}km`);
    }
  }

  // Summary
  console.log(`\n📋 검증 결과 요약:`);
  console.log(`   - 총 등산로: ${trails.length}개`);
  console.log(`   - 원천 데이터 대비 3배 이상 차이: ${problematicTrails.length}개`);
  console.log(`   - 100km 초과 (단위 의심): ${suspiciouslyLarge.length}개`);

  // Save list to file
  if (needsReversion.length > 0) {
    const reportPath = '.claude/1차 제품고도화/distance-issues-report.txt';
    const report = [
      '# 거리 데이터 검증 보고서',
      `생성일: ${new Date().toISOString()}`,
      '',
      '## 원천 데이터 대비 3배 이상 차이 나는 등산로',
      `총 ${needsReversion.length}개`,
      '',
      '| ID | 산 | 등산로 | 현재 거리(km) | 원천 거리(km) | 비율 |',
      '|---|---|---|---|---|---|',
      ...needsReversion.map(t => {
        const ratio = t.distance / t.original_distance!;
        return `| ${t.id} | ${t.mountain} | ${t.name} | ${t.distance.toFixed(2)} | ${t.original_distance!.toFixed(2)} | ${ratio.toFixed(2)}x |`;
      }),
      '',
      '## 다음 단계',
      '1. 위 등산로들의 GPX 파일 직접 확인',
      '2. 거리 데이터가 정확한지 검증',
      '3. 필요시 원천 데이터로 복원',
      ''
    ].join('\n');

    const fs = require('fs');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`\n✅ 보고서 저장: ${reportPath}`);
  }

  return needsReversion;
}

checkDistanceIssues()
  .then(() => {
    console.log('\n✅ 검증 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
