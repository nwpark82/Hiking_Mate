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

async function checkAltitudeStats() {
  console.log('📊 전체 트레일 고도 데이터 통계\n');

  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain, elevation_gain, max_altitude')
    .order('name')
    .limit(1031);

  if (error) {
    console.error('❌ 데이터 로드 실패:', error);
    return;
  }

  console.log(`전체 트레일: ${trails.length}개\n`);

  const withElevationGain = trails.filter(t => t.elevation_gain !== null && t.elevation_gain > 0);
  const withMaxAltitude = trails.filter(t => t.max_altitude !== null && t.max_altitude > 0);
  const withBoth = trails.filter(t => t.elevation_gain !== null && t.max_altitude !== null && t.elevation_gain > 0 && t.max_altitude > 0);

  console.log(`elevation_gain 있음: ${withElevationGain.length}개 (${(withElevationGain.length / trails.length * 100).toFixed(1)}%)`);
  console.log(`max_altitude 있음: ${withMaxAltitude.length}개 (${(withMaxAltitude.length / trails.length * 100).toFixed(1)}%)`);
  console.log(`둘 다 있음: ${withBoth.length}개 (${(withBoth.length / trails.length * 100).toFixed(1)}%)\n`);

  if (withElevationGain.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 elevation_gain이 있는 트레일 샘플 10개');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    withElevationGain.slice(0, 10).forEach((trail, idx) => {
      console.log(`${idx + 1}. ${trail.name} (${trail.mountain})`);
      console.log(`   elevation_gain: ${trail.elevation_gain}m`);
      console.log(`   max_altitude: ${trail.max_altitude || 'null'}\n`);
    });
  }

  if (withMaxAltitude.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⛰️  max_altitude가 있는 트레일 샘플 10개');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    withMaxAltitude.slice(0, 10).forEach((trail, idx) => {
      console.log(`${idx + 1}. ${trail.name} (${trail.mountain})`);
      console.log(`   elevation_gain: ${trail.elevation_gain || 'null'}`);
      console.log(`   max_altitude: ${trail.max_altitude}m\n`);
    });
  }
}

checkAltitudeStats().catch(console.error);
