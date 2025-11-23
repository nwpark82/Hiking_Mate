import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkPathCoordinates() {
  const trailIds = [
    { id: '8ce61126-a2ee-4e7f-ad7f-34861c6c1dbf', name: '북한산 9번' },
    { id: '5d5a0bea-1958-4108-9cdd-d872dc1ba1a0', name: '관악산 1번' }
  ];

  console.log('Path Coordinates 데이터 확인\n');

  for (const trail of trailIds) {
    const { data, error } = await supabase
      .from('trails')
      .select('id, name, path_coordinates')
      .eq('id', trail.id)
      .single();

    if (error) {
      console.error(`Error: ${error.message}`);
      continue;
    }

    if (data) {
      console.log(`${data.name}`);

      if (!data.path_coordinates) {
        console.log(`  ❌ path_coordinates: NULL\n`);
        continue;
      }

      const coords = data.path_coordinates as any[];
      console.log(`  ✅ path_coordinates 존재`);
      console.log(`  - 포인트 수: ${coords.length}개`);

      if (coords.length > 0) {
        const firstPoint = coords[0];
        const lastPoint = coords[coords.length - 1];

        console.log(`  - 첫 번째 포인트:`, firstPoint);
        console.log(`  - 마지막 포인트:`, lastPoint);

        // altitude 데이터 확인
        const hasAltitude = coords.some((c: any) => c.altitude !== undefined && c.altitude !== null);
        console.log(`  - altitude 데이터: ${hasAltitude ? '✅ 있음' : '❌ 없음'}`);

        if (hasAltitude) {
          const altitudes = coords
            .filter((c: any) => c.altitude !== undefined && c.altitude !== null)
            .map((c: any) => c.altitude);

          console.log(`  - 최소 altitude: ${Math.min(...altitudes)}m`);
          console.log(`  - 최대 altitude: ${Math.max(...altitudes)}m`);
        }
      }

      console.log();
    }
  }
}

checkPathCoordinates().then(() => process.exit(0));
