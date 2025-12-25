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

async function exportTrails() {
  console.log('\n📥 Fetching all trails from Supabase...\n');

  // Step 1: 먼저 ID 목록만 가져오기
  console.log('  📋 Fetching trail IDs...');
  const { data: idList, error: idError } = await supabase
    .from('trails')
    .select('id')
    .order('created_at', { ascending: true });

  if (idError || !idList) {
    console.error('❌ Error fetching trail IDs:', idError?.message);
    process.exit(1);
  }

  console.log(`  ✅ Found ${idList.length} trails\n`);

  // Step 2: 개별적으로 전체 데이터 가져오기 (path_coordinates 포함)
  let allTrails: any[] = [];
  let errorCount = 0;

  for (let i = 0; i < idList.length; i++) {
    const trailId = idList[i].id;

    try {
      const { data, error } = await supabase
        .from('trails')
        .select('*')
        .eq('id', trailId)
        .single();

      if (error) {
        console.error(`  ❌ Error fetching trail ${trailId}:`, error.message);
        errorCount++;
        continue;
      }

      allTrails.push(data);

      if ((i + 1) % 50 === 0 || i === idList.length - 1) {
        console.log(`  📦 Fetched ${allTrails.length}/${idList.length} trails...`);
      }

      // Rate limit 방지
      await new Promise(resolve => setTimeout(resolve, 30));
    } catch (err: any) {
      console.error(`  ❌ Fetch error for ${trailId}:`, err.message);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    console.log(`\n⚠️  ${errorCount} trails failed to fetch`);
  }

  console.log(`\n✅ Total trails fetched: ${allTrails.length}`);

  // 데이터 저장 경로
  const outputDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 전체 데이터 JSON 저장
  const fullExportPath = path.join(outputDir, 'trails-export.json');
  fs.writeFileSync(fullExportPath, JSON.stringify(allTrails, null, 2), 'utf-8');
  console.log(`📄 Full export saved to: ${fullExportPath}`);

  // 지역별 통계
  const regionStats: Record<string, number> = {};
  const missingRegion: any[] = [];

  allTrails.forEach(trail => {
    const region = trail.region || '미분류';
    regionStats[region] = (regionStats[region] || 0) + 1;

    if (!trail.region) {
      missingRegion.push({
        id: trail.id,
        name: trail.name,
        mountain: trail.mountain,
        start_latitude: trail.start_latitude,
        start_longitude: trail.start_longitude
      });
    }
  });

  console.log('\n📊 Region Statistics:');
  Object.entries(regionStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([region, count]) => {
      console.log(`  ${region}: ${count}개`);
    });

  // 미분류 데이터 별도 저장
  if (missingRegion.length > 0) {
    const missingPath = path.join(outputDir, 'trails-missing-region.json');
    fs.writeFileSync(missingPath, JSON.stringify(missingRegion, null, 2), 'utf-8');
    console.log(`\n⚠️  ${missingRegion.length} trails missing region - saved to: ${missingPath}`);
  }

  // 요약 정보
  console.log('\n📋 Export Summary:');
  console.log(`  Total Trails: ${allTrails.length}`);
  console.log(`  With Region: ${allTrails.length - missingRegion.length}`);
  console.log(`  Missing Region: ${missingRegion.length}`);
}

// 실행
exportTrails().catch(console.error);
