import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function emergencyRestore() {
  console.log('🚨 EMERGENCY: Attempting to restore distance values\n');

  // Try direct SQL approach using fetch
  const sql = `
    -- First, check current state
    SELECT COUNT(*) as total,
           COUNT(*) FILTER (WHERE distance > 100) as over_100km,
           COUNT(*) FILTER (WHERE distance > 1000) as over_1000km,
           MAX(distance) as max_distance
    FROM trails;
  `;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.json();
    console.log('Database status check result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Direct SQL failed:', error);
  }

  console.log('\n📝 Attempting batch update to revert extreme values...\n');

  // Try to update trails with impossible distances (> 100km) back to original_distance
  try {
    const updateSql = `
      UPDATE trails
      SET distance = CASE
        WHEN original_distance IS NOT NULL AND original_distance > 0 AND original_distance < 100
          THEN original_distance
        WHEN distance > 1000
          THEN distance / 1000
        WHEN distance > 100
          THEN LEAST(distance / 100, 50)
        ELSE distance
      END
      WHERE distance > 100 OR (original_distance IS NOT NULL AND original_distance > 0);
    `;

    const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: updateSql })
    });

    const result2 = await response2.json();
    console.log('Update result:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.error('Update failed:', error);
  }
}

emergencyRestore()
  .then(() => {
    console.log('\n✅ Emergency restore attempt completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Emergency restore failed:', error);
    process.exit(1);
  });
