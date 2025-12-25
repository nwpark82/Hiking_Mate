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

interface Trail {
  id: string;
  name: string;
  mountain: string;
  distance: number;
}

async function validateDistances() {
  console.log('🔍 등산로 거리 데이터 검증 시작...\n');

  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, distance')
    .order('distance', { ascending: false });

  if (error) {
    console.error('❌ 데이터 조회 실패:', error);
    return;
  }

  console.log(`✅ 총 ${trails.length}개 등산로 조회 완료\n`);

  // Check for suspiciously large distances (likely meters instead of km)
  const suspiciouslyLarge = trails.filter(t => t.distance > 50);

  // Check for distances that should use toFixed(1)
  const needsFormatting = trails.filter(t => {
    const decimalPlaces = (t.distance.toString().split('.')[1] || '').length;
    return decimalPlaces > 1;
  });

  console.log('\n📊 검증 결과:\n');
  console.log(`총 등산로: ${trails.length}개`);
  console.log(`50km 초과 (단위 의심): ${suspiciouslyLarge.length}개`);
  console.log(`소수점 2자리 이상: ${needsFormatting.length}개\n`);

  if (suspiciouslyLarge.length > 0) {
    console.log('\n⚠️  50km 초과 등산로 (미터 단위 의심):');
    console.log('═'.repeat(80));
    suspiciouslyLarge.slice(0, 20).forEach(t => {
      console.log(`${t.mountain.padEnd(15)} ${t.name.padEnd(25)} ${t.distance.toFixed(2)}km`);
    });
    if (suspiciouslyLarge.length > 20) {
      console.log(`... 그 외 ${suspiciouslyLarge.length - 20}개`);
    }
  }

  // Create detailed report
  const report = [
    '# 등산로 거리 데이터 검증 보고서',
    `생성일: ${new Date().toISOString()}`,
    '',
    '## 요약',
    `- 총 등산로: ${trails.length}개`,
    `- 50km 초과: ${suspiciouslyLarge.length}개`,
    `- 소수점 2자리 이상: ${needsFormatting.length}개`,
    '',
    '## 50km 초과 등산로 (미터 단위 오기재 의심)',
    '',
    '| ID | 산 | 등산로 | 거리(현재) | 추정 거리(km) |',
    '|---|---|---|---|---|',
    ...suspiciouslyLarge.map(t => {
      const estimatedKm = (t.distance / 1000).toFixed(1);
      return `| ${t.id} | ${t.mountain} | ${t.name} | ${t.distance.toFixed(2)}km | ${estimatedKm}km |`;
    }),
    '',
    '## 권장사항',
    '',
    '1. **50km 초과 등산로**: 거리가 미터 단위로 저장되었을 가능성 높음',
    '   - 조치: 값을 1000으로 나누어 km 단위로 변환',
    '',
    '2. **소수점 표시**: 모든 거리는 소수점 첫째자리까지만 표시',
    '   - 조치: `trail.distance.toFixed(1)` 사용',
    '',
    '3. **데이터 검증 필요**: GPX 파일과 대조하여 실제 거리 확인',
    ''
  ].join('\n');

  const reportPath = '.claude/1차 제품고도화/distance-validation-report.txt';
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n✅ 보고서 저장: ${reportPath}`);

  return { suspiciouslyLarge, needsFormatting };
}

validateDistances()
  .then(() => {
    console.log('\n✅ 검증 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
