import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllMountains() {
  console.log('Checking all mountains in database...\n');

  try {
    // Get all unique mountains
    const { data: trails, error } = await supabase
      .from('trails')
      .select('mountain');

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (!trails || trails.length === 0) {
      console.log('No trails found in database!');
      return;
    }

    // Get unique mountains
    const mountainSet = new Set(trails.map((t: any) => t.mountain));
    const mountains = Array.from(mountainSet).sort();

    console.log(`Total unique mountains: ${mountains.length}\n`);

    // Search for Tier 1 mountains
    const tier1Keywords = ['인왕', '북악', '아차'];

    console.log('Searching for Tier 1 mountains:');
    console.log('─'.repeat(60));

    tier1Keywords.forEach(keyword => {
      console.log(`\n${keyword} 관련 산:`);
      const matches = mountains.filter(m => m.includes(keyword));
      if (matches.length > 0) {
        matches.forEach(m => console.log(`  ✅ ${m}`));
      } else {
        console.log(`  ❌ No matches found`);
      }
    });

    console.log('\n' + '─'.repeat(60));
    console.log('\nAll mountains in database (first 50):');
    console.log('─'.repeat(60));
    mountains.slice(0, 50).forEach((m, i) => {
      console.log(`${(i + 1).toString().padStart(2)}. ${m}`);
    });

    if (mountains.length > 50) {
      console.log(`\n... and ${mountains.length - 50} more mountains`);
    }

  } catch (error) {
    console.error('Failed to check mountains:', error);
  }
}

checkAllMountains()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
