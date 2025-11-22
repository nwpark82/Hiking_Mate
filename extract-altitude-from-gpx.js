import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';

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

// GPX 파일에서 고도 데이터 추출
function extractAltitudeFromGPX(gpxContent) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxContent, 'text/xml');

    // trkpt 요소들에서 ele 태그 추출
    const trkpts = doc.getElementsByTagName('trkpt');
    const altitudes = [];

    for (let i = 0; i < trkpts.length; i++) {
      const trkpt = trkpts[i];
      const eleNodes = trkpt.getElementsByTagName('ele');

      if (eleNodes.length > 0) {
        const eleValue = eleNodes[0].textContent;
        const altitude = parseFloat(eleValue);

        if (!isNaN(altitude)) {
          altitudes.push(altitude);
        }
      }
    }

    if (altitudes.length === 0) {
      return null;
    }

    // 통계 계산
    const minAltitude = Math.min(...altitudes);
    const maxAltitude = Math.max(...altitudes);
    const avgAltitude = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;

    // 누적 상승 고도 계산 (elevation_gain)
    let elevationGain = 0;
    for (let i = 1; i < altitudes.length; i++) {
      const diff = altitudes[i] - altitudes[i - 1];
      if (diff > 0) {
        elevationGain += diff;
      }
    }

    return {
      minAltitude: Math.round(minAltitude),
      maxAltitude: Math.round(maxAltitude),
      avgAltitude: Math.round(avgAltitude),
      elevationGain: Math.round(elevationGain),
      dataPoints: altitudes.length
    };
  } catch (error) {
    console.error('GPX 파싱 오류:', error.message);
    return null;
  }
}

// GPX 파일 경로 찾기
function findGPXFile(trailName, mountain) {
  const rawDataDirs = [
    '.rawdata/한국등산트레킹지원센터_산림청 100대명산_20220112/100대명산',
    '.rawdata/한국등산트레킹지원센터_전국 주요 봉우리 코스_20221116'
  ];

  // 트레일 이름에서 코스 번호 추출 (예: "가리산 2번 코스 (정방향)" -> "2")
  const courseMatch = trailName.match(/(\d+)번/);
  const courseNumber = courseMatch ? courseMatch[1] : '1';

  for (const baseDir of rawDataDirs) {
    // 방법 1: 산 이름 그대로 사용
    const searchPath1 = path.join(baseDir, mountain, `${mountain}_${courseNumber.padStart(10, '0')}.gpx`);
    if (fs.existsSync(searchPath1)) {
      return searchPath1;
    }

    // 방법 2: 와일드카드로 폴더 찾기 (예: 1311010173_말아가리산)
    try {
      if (fs.existsSync(baseDir)) {
        const dirs = fs.readdirSync(baseDir);

        for (const dir of dirs) {
          // 폴더 이름에 산 이름이 포함되어 있는지 확인
          if (dir.includes(mountain) || dir.endsWith(`_${mountain}`)) {
            const searchPath2 = path.join(baseDir, dir, `${mountain}_${courseNumber.padStart(10, '0')}.gpx`);
            if (fs.existsSync(searchPath2)) {
              return searchPath2;
            }
          }
        }
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

async function extractAndUpdateAltitudes() {
  console.log('🗻 GPX 파일에서 고도 데이터 추출 시작...\n');

  // 고도 데이터가 없는 트레일 가져오기
  const { data: trails, error } = await supabase
    .from('trails')
    .select('id, name, mountain')
    .is('max_altitude', null)
    .order('mountain', { ascending: true })

  if (error) {
    console.error('❌ 데이터 로드 실패:', error);
    return;
  }

  console.log(`📊 처리할 트레일: ${trails.length}개\n`);

  let processedCount = 0;
  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  const results = [];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 고도 데이터 추출 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const trail of trails) {
    processedCount++;

    // GPX 파일 찾기
    const gpxPath = findGPXFile(trail.name, trail.mountain);

    if (!gpxPath) {
      console.log(`   ⏭️  ${trail.name} (${trail.mountain}): GPX 파일 없음`);
      notFoundCount++;
      continue;
    }

    try {
      // GPX 파일 읽기
      const gpxContent = fs.readFileSync(gpxPath, 'utf-8');

      // 고도 데이터 추출
      const altitudeData = extractAltitudeFromGPX(gpxContent);

      if (!altitudeData) {
        console.log(`   ⚠️  ${trail.name}: 고도 데이터 추출 실패`);
        errorCount++;
        continue;
      }

      // DB 업데이트
      const { error: updateError } = await supabase
        .from('trails')
        .update({
          min_altitude: altitudeData.minAltitude,
          max_altitude: altitudeData.maxAltitude,
          avg_altitude: altitudeData.avgAltitude,
          elevation_gain: altitudeData.elevationGain
        })
        .eq('id', trail.id);

      if (updateError) {
        console.error(`   ❌ ${trail.name}: 업데이트 실패 - ${updateError.message}`);
        errorCount++;
        continue;
      }

      successCount++;
      console.log(`   ✅ ${trail.name} (${trail.mountain})`);
      console.log(`      최저: ${altitudeData.minAltitude}m | 평균: ${altitudeData.avgAltitude}m | 최고: ${altitudeData.maxAltitude}m`);
      console.log(`      누적상승: ${altitudeData.elevationGain}m | 포인트: ${altitudeData.dataPoints}개\n`);

      results.push({
        id: trail.id,
        name: trail.name,
        mountain: trail.mountain,
        ...altitudeData,
        gpxPath
      });

    } catch (error) {
      console.error(`   ❌ ${trail.name}: ${error.message}`);
      errorCount++;
    }

    // 진행률 표시
    if (processedCount % 10 === 0) {
      console.log(`\n   진행률: ${processedCount}/${trails.length}...\n`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 처리 완료');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`✅ 성공: ${successCount}개`);
  console.log(`⏭️  GPX 없음: ${notFoundCount}개`);
  console.log(`❌ 실패: ${errorCount}개\n`);

  // 결과 저장
  const outputPath = path.join(process.cwd(), 'altitude-extraction-results.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        summary: {
          processed: processedCount,
          success: successCount,
          notFound: notFoundCount,
          error: errorCount,
          timestamp: new Date().toISOString()
        },
        trails: results
      },
      null,
      2
    )
  );

  console.log(`📁 상세 결과 저장: ${outputPath}\n`);
}

extractAndUpdateAltitudes().catch(console.error);
