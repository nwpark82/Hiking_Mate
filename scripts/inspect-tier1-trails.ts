import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Tier 1 priority mountains
const tier1Mountains = ['북한산', '관악산', '인왕산', '북악산', '아차산'];

// Target course names (to help identify specific trails)
const tier1Targets = {
  '북한산': '백운대',
  '관악산': '연주대',
  '인왕산': '순환',
  '북악산': '순환',
  '아차산': '해맞이'
};

async function inspectTier1Trails() {
  console.log('='.repeat(80));
  console.log('Tier 1 Trail Data Inspection');
  console.log('='.repeat(80));
  console.log();

  for (const mountain of tier1Mountains) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Mountain: ${mountain}`);
    console.log('─'.repeat(80));

    try {
      const { data: trails, error } = await supabase
        .from('trails')
        .select('*')
        .eq('mountain', mountain)
        .order('name');

      if (error) {
        console.error(`Error fetching trails for ${mountain}:`, error);
        continue;
      }

      if (!trails || trails.length === 0) {
        console.log(`❌ No trails found for ${mountain}`);
        continue;
      }

      console.log(`✅ Found ${trails.length} trail(s) for ${mountain}:\n`);

      trails.forEach((trail, index) => {
        const targetCourse = tier1Targets[mountain as keyof typeof tier1Targets];
        const isTarget = trail.name.includes(targetCourse);

        console.log(`${index + 1}. ${isTarget ? '⭐ ' : ''}Trail: ${trail.name}`);
        console.log(`   ID: ${trail.id}`);
        console.log(`   Region: ${trail.region}`);
        console.log(`   Difficulty: ${trail.difficulty}`);
        console.log(`   Distance: ${trail.distance}km`);
        console.log(`   Duration: ${trail.duration}분`);
        console.log(`   Elevation: ${trail.elevation_gain || 'N/A'}m`);
        console.log(`   View Count: ${trail.view_count}`);
        console.log(`   Like Count: ${trail.like_count}`);

        // Check content richness
        console.log(`\n   Content Status:`);
        console.log(`   ├─ Description: ${trail.description ? `✅ (${trail.description.length} chars)` : '❌ Missing'}`);
        console.log(`   ├─ Access Info: ${trail.access_info ? `✅ (${trail.access_info.length} chars)` : '❌ Missing'}`);
        console.log(`   ├─ Features: ${trail.features?.length > 0 ? `✅ (${trail.features.length} items)` : '❌ Missing'}`);
        console.log(`   ├─ Health Benefits: ${trail.health_benefits?.length > 0 ? `✅ (${trail.health_benefits.length} items)` : '❌ Missing'}`);
        console.log(`   ├─ Attractions: ${trail.attractions?.length > 0 ? `✅ (${trail.attractions.length} items)` : '❌ Missing'}`);
        console.log(`   └─ Warnings: ${trail.warnings?.length > 0 ? `✅ (${trail.warnings.length} items)` : '❌ Missing'}`);

        if (trail.description) {
          console.log(`\n   Description Preview:`);
          console.log(`   "${trail.description.substring(0, 100)}..."`);
        }

        if (trail.access_info) {
          console.log(`\n   Access Info Preview:`);
          console.log(`   "${trail.access_info.substring(0, 100)}..."`);
        }

        console.log();
      });

    } catch (error) {
      console.error(`Failed to inspect trails for ${mountain}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));

  // Get total count for all Tier 1 mountains
  const { count, error: countError } = await supabase
    .from('trails')
    .select('*', { count: 'exact', head: true })
    .in('mountain', tier1Mountains);

  if (!countError) {
    console.log(`Total Tier 1 trails in database: ${count}`);
  }

  console.log('\nTarget Trails to Enhance:');
  Object.entries(tier1Targets).forEach(([mountain, course]) => {
    console.log(`  • ${mountain} ${course} 코스`);
  });
}

inspectTier1Trails()
  .then(() => {
    console.log('\n✅ Inspection complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Inspection failed:', error);
    process.exit(1);
  });
