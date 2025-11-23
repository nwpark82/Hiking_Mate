import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkElevation() {
  const trailIds = [
    { id: '8ce61126-a2ee-4e7f-ad7f-34861c6c1dbf', name: '북한산 9번' },
    { id: '5d5a0bea-1958-4108-9cdd-d872dc1ba1a0', name: '관악산 1번' }
  ];

  console.log('고도 데이터 확인\n');

  for (const trail of trailIds) {
    const { data } = await supabase
      .from('trails')
      .select('name, elevation_gain, min_altitude, max_altitude, avg_altitude')
      .eq('id', trail.id)
      .single();

    if (data) {
      console.log(`${data.name}`);
      console.log(`  고도 상승: ${data.elevation_gain || 'N/A'}m`);
      console.log(`  최저 고도: ${data.min_altitude || 'N/A'}m`);
      console.log(`  최고 고도: ${data.max_altitude || 'N/A'}m`);
      console.log(`  평균 고도: ${data.avg_altitude || 'N/A'}m\n`);
    }
  }
}

checkElevation().then(() => process.exit(0));
