import fs from 'fs';
import path from 'path';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXml = promisify(parseString);

interface Waypoint {
  lat: number;
  lon: number;
  name: string;
  category: string;
  elevation?: number;
}

interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
  time?: string;
}

interface TrailData {
  mountain: string;
  courseName: string;
  category: string;
  difficulty: string;
  distance: number;
  duration: number;
  elevationGain: number;
  waypoints: Waypoint[];
  trackPoints: TrackPoint[];
  bounds: {
    maxLat: number;
    maxLon: number;
    minLat: number;
    minLon: number;
  };
  features: string[];
}

// Haversine 거리 계산
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 난이도 추정
function estimateDifficulty(distance: number, elevationGain: number): string {
  const score = distance / 1000 + elevationGain / 100;

  if (score < 5) return 'easy';
  if (score < 10) return 'normal';
  if (score < 15) return 'hard';
  return 'expert';
}

// 예상 소요 시간 계산
function estimateDuration(distance: number, elevationGain: number): number {
  const flatTime = (distance / 1000) * 30;
  const elevationTime = elevationGain / 5;
  return Math.round(flatTime + elevationTime);
}

async function parseGPXFile(
  filePath: string,
  trailName: string,
  category: string,
  features: string[]
): Promise<TrailData | null> {
  try {
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    const result: any = await parseXml(xmlContent);

    const gpx = result.gpx;
    if (!gpx) return null;

    const bounds = gpx.metadata?.[0]?.bounds?.[0]?.$;

    // Waypoints 추출
    const waypoints: Waypoint[] = [];
    if (gpx.wpt) {
      for (const wpt of gpx.wpt) {
        waypoints.push({
          lat: parseFloat(wpt.$.lat),
          lon: parseFloat(wpt.$.lon),
          name: wpt.name?.[0]?._?.trim() || wpt.name?.[0] || '',
          category: wpt.extensions?.[0]?.category?.[0]?._?.trim() ||
                   wpt.extensions?.[0]?.category?.[0] || 'ETC',
          elevation: wpt.ele ? parseFloat(wpt.ele[0]) : undefined,
        });
      }
    }

    // Track Points 추출
    const trackPoints: TrackPoint[] = [];
    let totalDistance = 0;
    let minEle = Infinity;
    let maxEle = -Infinity;

    if (gpx.trk?.[0]?.trkseg) {
      for (const trkseg of gpx.trk[0].trkseg) {
        if (trkseg.trkpt) {
          for (let i = 0; i < trkseg.trkpt.length; i++) {
            const trkpt = trkseg.trkpt[i];
            const lat = parseFloat(trkpt.$.lat);
            const lon = parseFloat(trkpt.$.lon);
            const ele = trkpt.ele ? parseFloat(trkpt.ele[0]) : 0;

            trackPoints.push({
              lat,
              lon,
              ele,
              time: trkpt.time?.[0],
            });

            if (i > 0) {
              const prevPt = trkseg.trkpt[i - 1];
              const prevLat = parseFloat(prevPt.$.lat);
              const prevLon = parseFloat(prevPt.$.lon);
              totalDistance += calculateDistance(prevLat, prevLon, lat, lon);
            }

            if (ele < minEle) minEle = ele;
            if (ele > maxEle) maxEle = ele;
          }
        }
      }
    }

    const elevationGain = maxEle - minEle;
    const difficulty = estimateDifficulty(totalDistance, elevationGain);
    const duration = estimateDuration(totalDistance, elevationGain);

    // 코스 이름 생성
    const fileName = path.basename(filePath, '.gpx');
    const courseNumber = fileName.split('_')[1] || '1';
    const courseName = `${trailName} ${courseNumber}`;

    return {
      mountain: trailName,
      courseName,
      category,
      difficulty,
      distance: Math.round(totalDistance),
      duration,
      elevationGain: Math.round(elevationGain),
      waypoints,
      trackPoints,
      bounds: {
        maxLat: parseFloat(bounds?.maxlat || '0'),
        maxLon: parseFloat(bounds?.maxlon || '0'),
        minLat: parseFloat(bounds?.minlat || '0'),
        minLon: parseFloat(bounds?.minlon || '0'),
      },
      features,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

// 100대명산 처리
async function process100Mountains() {
  const basePath = path.join(process.cwd(), '.rawdata', '한국등산트레킹지원센터_산림청 100대명산_20220112', '100대명산');
  const mountains = fs.readdirSync(basePath);
  const trails: TrailData[] = [];

  console.log(`\n📍 100대명산: ${mountains.length}개 산 처리 중...`);

  for (const mountain of mountains) {
    const mountainPath = path.join(basePath, mountain);
    const stats = fs.statSync(mountainPath);

    if (!stats.isDirectory()) continue;

    const gpxFiles = fs.readdirSync(mountainPath).filter(f => f.endsWith('.gpx'));

    for (const gpxFile of gpxFiles) {
      const gpxPath = path.join(mountainPath, gpxFile);
      const trailData = await parseGPXFile(
        gpxPath,
        mountain,
        'mountain',
        ['등산로', '명산', '100대명산']
      );

      if (trailData) {
        trails.push(trailData);
      }
    }
  }

  console.log(`  ✓ ${trails.length}개 코스 파싱 완료`);
  return trails;
}

// 국가숲길 처리
async function processNationalForestTrails() {
  const basePath = path.join(process.cwd(), '.rawdata', '한국등산트레킹지원센터_국가숲길 코스_20230825');

  if (!fs.existsSync(basePath)) {
    console.log(`\n⏭️  국가숲길 데이터 없음 - 건너뜀`);
    return [];
  }

  const folders = fs.readdirSync(basePath);
  const trails: TrailData[] = [];

  console.log(`\n📍 국가숲길: ${folders.length}개 코스 처리 중...`);

  for (const folder of folders) {
    const folderPath = path.join(basePath, folder);
    const stats = fs.statSync(folderPath);

    if (!stats.isDirectory()) continue;

    // 폴더명에서 코스명 추출 (예: "9900000002_내포문화숲길" -> "내포문화숲길")
    const trailName = folder.split('_')[1] || folder;

    const gpxFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.gpx'));

    for (const gpxFile of gpxFiles) {
      const gpxPath = path.join(folderPath, gpxFile);
      const trailData = await parseGPXFile(
        gpxPath,
        trailName,
        'forest',
        ['국가숲길', '숲길', '트레킹']
      );

      if (trailData) {
        trails.push(trailData);
      }
    }
  }

  console.log(`  ✓ ${trails.length}개 코스 파싱 완료`);
  return trails;
}

// 9정맥 처리
async function process9Ridges() {
  const basePath = path.join(process.cwd(), '.rawdata', '한국등산트레킹지원센터_9정맥 종주코스_20220112');

  if (!fs.existsSync(basePath)) {
    console.log(`\n⏭️  9정맥 데이터 없음 - 건너뜀`);
    return [];
  }

  // TODO: 9정맥 데이터 구조에 맞게 파싱 로직 구현
  console.log(`\n⏭️  9정맥 데이터 - 추후 구현 예정`);
  return [];
}

// 백두대간 처리
async function processBaekdudaegan() {
  const basePath = path.join(process.cwd(), '.rawdata', '한국등산트레킹지원센터_백두대간 종주길_20220112');

  if (!fs.existsSync(basePath)) {
    console.log(`\n⏭️  백두대간 데이터 없음 - 건너뜀`);
    return [];
  }

  // TODO: 백두대간 데이터 구조에 맞게 파싱 로직 구현
  console.log(`\n⏭️  백두대간 데이터 - 추후 구현 예정`);
  return [];
}

// 전체 처리
async function processAllTrails() {
  const outputPath = path.join(process.cwd(), 'data', 'trails.json');

  // 출력 디렉토리 생성
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🏔️  등산로 데이터 파싱 시작...\n');

  const allTrails: TrailData[] = [];

  // 각 카테고리 처리
  const mountains = await process100Mountains();
  allTrails.push(...mountains);

  const forestTrails = await processNationalForestTrails();
  allTrails.push(...forestTrails);

  const ridges = await process9Ridges();
  allTrails.push(...ridges);

  const baekdu = await processBaekdudaegan();
  allTrails.push(...baekdu);

  // JSON 파일로 저장
  fs.writeFileSync(outputPath, JSON.stringify(allTrails, null, 2), 'utf-8');
  console.log(`\n✅ 총 ${allTrails.length}개 코스 저장 완료: ${outputPath}`);

  // 통계 출력
  console.log('\n📊 카테고리별 통계:');
  const categories = allTrails.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count}개`);
  });

  const difficulties = allTrails.reduce((acc, t) => {
    acc[t.difficulty] = (acc[t.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\n📊 난이도별 통계:');
  Object.entries(difficulties).forEach(([diff, count]) => {
    console.log(`  - ${diff}: ${count}개`);
  });
}

// 실행
processAllTrails().catch(console.error);
