import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

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

interface TrailData {
  mountain: string;
  courseName: string;
  category: string;
  difficulty: string;
  distance: number;
  duration: number;
  elevationGain: number;
  waypoints: any[];
  trackPoints: any[];
  bounds: {
    maxLat: number;
    maxLon: number;
    minLat: number;
    minLon: number;
  };
}

async function uploadTrails() {
  const dataPath = path.join(process.cwd(), 'data', 'trails.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ trails.json not found. Run parse-gpx-data.ts first.');
    process.exit(1);
  }

  const trails: TrailData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`📂 Loaded ${trails.length} trails from ${dataPath}`);

  let successCount = 0;
  let errorCount = 0;

  console.log('\n⬆️  Uploading trails to Supabase using SQL...\n');

  for (const trail of trails) {
    try {
      // 직접 SQL INSERT 사용 (PostgREST 우회)
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO trails (
            name, mountain, region, category, difficulty,
            distance, duration, elevation_gain, gpx_data,
            coordinates, description, images, features
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
        `,
        params: [
          trail.courseName,
          trail.mountain,
          null,
          trail.category || 'mountain',
          trail.difficulty,
          trail.distance,
          trail.duration,
          trail.elevationGain,
          JSON.stringify({
            waypoints: trail.waypoints,
            trackPoints: trail.trackPoints,
            bounds: trail.bounds,
          }),
          JSON.stringify({
            lat: (trail.bounds.maxLat + trail.bounds.minLat) / 2,
            lng: (trail.bounds.maxLon + trail.bounds.minLon) / 2,
          }),
          null,
          JSON.stringify([]),
          JSON.stringify(['등산로', '명산', '100대명산'])
        ]
      });

      if (error) {
        console.error(`❌ ${trail.courseName}:`, error.message);
        errorCount++;
      } else {
        console.log(`✓ ${trail.courseName} - ${trail.distance}m`);
        successCount++;
      }

      // Rate limit 방지
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`❌ ${trail.courseName}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Upload Summary:');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log(`  📈 Total: ${trails.length}`);
}

// 실행
uploadTrails().catch(console.error);
