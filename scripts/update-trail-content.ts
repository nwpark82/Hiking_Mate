import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key for updates

const supabase = createClient(supabaseUrl, supabaseKey);

interface TrailContent {
  trail_id: string;
  trail_name: string;
  description: string;
  access_info: string;
  health_benefits: string[];
  attractions: string[];
  warnings: string[];
}

async function updateTrailContent() {
  console.log('='.repeat(80));
  console.log('Updating Trail Content');
  console.log('='.repeat(80));
  console.log();

  const contentFiles = [
    'scripts/trail-content/bukhansan-9.json',
    'scripts/trail-content/gwanaksan-1.json'
  ];

  let successCount = 0;
  let failCount = 0;

  for (const filePath of contentFiles) {
    try {
      console.log(`\nProcessing: ${filePath}`);
      console.log('─'.repeat(80));

      // Read content file
      const fullPath = path.join(process.cwd(), filePath);
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const content: TrailContent = JSON.parse(fileContent);

      console.log(`Trail: ${content.trail_name}`);
      console.log(`ID: ${content.trail_id}`);

      // Verify trail exists
      const { data: existingTrail, error: fetchError } = await supabase
        .from('trails')
        .select('id, name, mountain')
        .eq('id', content.trail_id)
        .single();

      if (fetchError || !existingTrail) {
        console.error(`❌ Trail not found in database: ${content.trail_id}`);
        failCount++;
        continue;
      }

      console.log(`✅ Trail found: ${existingTrail.mountain} - ${existingTrail.name}`);

      // Prepare update data
      const updateData = {
        description: content.description,
        access_info: content.access_info,
        health_benefits: content.health_benefits,
        attractions: content.attractions,
        warnings: content.warnings,
        updated_at: new Date().toISOString()
      };

      // Display what will be updated
      console.log(`\nContent Summary:`);
      console.log(`  Description: ${content.description.length} chars`);
      console.log(`  Access Info: ${content.access_info.length} chars`);
      console.log(`  Health Benefits: ${content.health_benefits.length} items`);
      console.log(`  Attractions: ${content.attractions.length} items`);
      console.log(`  Warnings: ${content.warnings.length} items`);

      // Update database
      const { error: updateError } = await supabase
        .from('trails')
        .update(updateData)
        .eq('id', content.trail_id);

      if (updateError) {
        console.error(`❌ Update failed:`, updateError);
        failCount++;
        continue;
      }

      console.log(`✅ Successfully updated trail content`);
      successCount++;

      // Verify update
      const { data: updatedTrail, error: verifyError } = await supabase
        .from('trails')
        .select('description, access_info, health_benefits, attractions, warnings')
        .eq('id', content.trail_id)
        .single();

      if (verifyError || !updatedTrail) {
        console.error(`⚠️  Could not verify update`);
      } else {
        console.log(`\nVerification:`);
        console.log(`  ✅ Description: ${updatedTrail.description ? updatedTrail.description.length : 0} chars`);
        console.log(`  ✅ Access Info: ${updatedTrail.access_info ? updatedTrail.access_info.length : 0} chars`);
        console.log(`  ✅ Health Benefits: ${updatedTrail.health_benefits?.length || 0} items`);
        console.log(`  ✅ Attractions: ${updatedTrail.attractions?.length || 0} items`);
        console.log(`  ✅ Warnings: ${updatedTrail.warnings?.length || 0} items`);
      }

    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error);
      failCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('Update Summary');
  console.log('='.repeat(80));
  console.log(`✅ Successfully updated: ${successCount} trails`);
  console.log(`❌ Failed: ${failCount} trails`);
  console.log();

  if (successCount > 0) {
    console.log('Next Steps:');
    console.log('1. Visit trail detail pages on the website');
    console.log('2. Verify all content displays correctly');
    console.log('3. Test on mobile devices');
    console.log('4. Check if pages now meet AdSense content requirements');
  }
}

updateTrailContent()
  .then(() => {
    console.log('\n✅ Update process complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update process failed:', error);
    process.exit(1);
  });
