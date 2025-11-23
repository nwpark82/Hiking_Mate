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

// Landmark keywords to search for
const landmarkKeywords: Record<string, string[]> = {
  '북한산': ['백운대', '인수봉', '만경대', '노적봉', '비봉'],
  '관악산': ['연주대', '연주암', '깔딱고개', '관악산'],
  '인왕산': ['범바위', '치마바위', '인왕산', '청운대'],
  '북악산': ['와룡공원', '숙정문', '백악마루', '청운대'],
  '아차산': ['아차산', '해맞이', '고구려', '용마봉']
};

interface TrailScore {
  trail: any;
  score: number;
  reasons: string[];
}

async function identifyBestTrails() {
  console.log('='.repeat(80));
  console.log('Best Trail Identification for Tier 1 Mountains');
  console.log('='.repeat(80));
  console.log();

  const recommendations: Record<string, TrailScore[]> = {};

  for (const mountain of tier1Mountains) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Analyzing: ${mountain}`);
    console.log('─'.repeat(80));

    try {
      const { data: trails, error } = await supabase
        .from('trails')
        .select('*')
        .eq('mountain', mountain)
        .order('view_count', { ascending: false });

      if (error) {
        console.error(`Error fetching trails for ${mountain}:`, error);
        continue;
      }

      if (!trails || trails.length === 0) {
        console.log(`❌ No trails found for ${mountain}`);
        continue;
      }

      console.log(`Found ${trails.length} trails`);

      // Score each trail
      const scoredTrails: TrailScore[] = trails.map(trail => {
        let score = 0;
        const reasons: string[] = [];

        // Popularity score (view_count)
        if (trail.view_count > 0) {
          score += trail.view_count * 10;
          reasons.push(`${trail.view_count} views`);
        }

        // Like score
        if (trail.like_count > 0) {
          score += trail.like_count * 20;
          reasons.push(`${trail.like_count} likes`);
        }

        // Check for landmark keywords in trail name
        const keywords = landmarkKeywords[mountain] || [];
        keywords.forEach(keyword => {
          if (trail.name.includes(keyword)) {
            score += 50;
            reasons.push(`Contains "${keyword}"`);
          }
        });

        // Check features for landmarks
        if (trail.features && Array.isArray(trail.features)) {
          trail.features.forEach((feature: string) => {
            keywords.forEach(keyword => {
              if (feature.includes(keyword)) {
                score += 30;
                reasons.push(`Feature: "${keyword}"`);
              }
            });
          });
        }

        // Prefer intermediate to difficult trails (more interesting)
        if (trail.difficulty === '고급' || trail.difficulty === '전문가') {
          score += 15;
          reasons.push(`Challenging (${trail.difficulty})`);
        } else if (trail.difficulty === '중급') {
          score += 10;
          reasons.push(`Moderate (${trail.difficulty})`);
        }

        // Prefer moderate distances (4-10km) - good for day hikes
        if (trail.distance >= 4 && trail.distance <= 10) {
          score += 10;
          reasons.push(`Good distance (${trail.distance}km)`);
        }

        // Prefer trails with good elevation gain (scenic views)
        if (trail.elevation_gain && trail.elevation_gain > 500) {
          score += 5;
          reasons.push(`Good elevation (${trail.elevation_gain}m)`);
        }

        return { trail, score, reasons };
      });

      // Sort by score
      scoredTrails.sort((a, b) => b.score - a.score);

      // Store top 5
      recommendations[mountain] = scoredTrails.slice(0, 5);

      // Display results
      console.log(`\nTop 5 Recommended Trails for ${mountain}:\n`);
      scoredTrails.slice(0, 5).forEach((item, index) => {
        const { trail, score, reasons } = item;
        console.log(`${index + 1}. ⭐ Score: ${score} - ${trail.name}`);
        console.log(`   ID: ${trail.id}`);
        console.log(`   Details: ${trail.distance}km, ${trail.duration}분, ${trail.elevation_gain || 'N/A'}m`);
        console.log(`   Difficulty: ${trail.difficulty}`);
        console.log(`   Engagement: ${trail.view_count} views, ${trail.like_count} likes`);
        console.log(`   Reasons: ${reasons.length > 0 ? reasons.join(', ') : 'Basic trail data'}`);

        if (trail.features && trail.features.length > 0) {
          console.log(`   Features: ${trail.features.join(', ')}`);
        }
        console.log();
      });

      // Show difficulty distribution
      const difficultyDist = trails.reduce((acc: any, trail: any) => {
        acc[trail.difficulty] = (acc[trail.difficulty] || 0) + 1;
        return acc;
      }, {});

      console.log(`Difficulty Distribution:`);
      Object.entries(difficultyDist).forEach(([diff, count]) => {
        console.log(`  ${diff}: ${count} trails`);
      });

    } catch (error) {
      console.error(`Failed to analyze trails for ${mountain}:`, error);
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('FINAL RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('\nTop Pick for Each Mountain:\n');

  tier1Mountains.forEach(mountain => {
    const topTrails = recommendations[mountain];
    if (topTrails && topTrails.length > 0) {
      const best = topTrails[0];
      console.log(`${mountain}:`);
      console.log(`  → ${best.trail.name}`);
      console.log(`     ID: ${best.trail.id}`);
      console.log(`     ${best.trail.distance}km, ${best.trail.difficulty}, Score: ${best.score}`);
      console.log();
    }
  });

  console.log('\nNext Steps:');
  console.log('1. Review the recommended trails above');
  console.log('2. Research content for each trail (descriptions, access info, etc.)');
  console.log('3. Create comprehensive content following the template');
  console.log('4. Update database with rich content');
  console.log('5. Verify UI displays all new content properly');
}

identifyBestTrails()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
