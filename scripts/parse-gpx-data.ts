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
}

// Haversine 거리 계산
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 지구 반지름 (미터)
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

// 난이도 추정 (거리와 고도 기반)
function estimateDifficulty(distance: number, elevationGain: number): string {
  const score = distance / 1000 + elevationGain / 100;

  if (score < 5) return 'easy';
  if (score < 10) return 'normal';
  if (score < 15) return 'hard';
  return 'expert';
}

// 예상 소요 시간 계산 (분)
function estimateDuration(distance: number, elevationGain: number): number {
  // 평지 2km/h, 상승 300m/h 기준
  const flatTime = (distance / 1000) * 30; // 분
  const elevationTime = elevationGain / 5; // 분
  return Math.round(flatTime + elevationTime);
}

async function parseGPXFile(filePath: string, mountainName: string): Promise<TrailData | null> {
  try {
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    const result: any = await parseXml(xmlContent);

    const gpx = result.gpx;
    if (!gpx) return null;

    // 메타데이터에서 경계 좌표 추출
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

            // 거리 계산
            if (i > 0) {
              const prevPt = trkseg.trkpt[i - 1];
              const prevLat = parseFloat(prevPt.$.lat);
              const prevLon = parseFloat(prevPt.$.lon);
              totalDistance += calculateDistance(prevLat, prevLon, lat, lon);
            }

            // 고도 범위 계산
            if (ele < minEle) minEle = ele;
            if (ele > maxEle) maxEle = ele;
          }
        }
      }
    }

    const elevationGain = maxEle - minEle;
    const difficulty = estimateDifficulty(totalDistance, elevationGain);
    const duration = estimateDuration(totalDistance, elevationGain);

    // 코스 이름 생성 (파일명에서 추출)
    const fileName = path.basename(filePath, '.gpx');
    const courseNumber = fileName.split('_')[1];
    const courseName = `${mountainName} 코스 ${parseInt(courseNumber)}`;

    return {
      mountain: mountainName,
      courseName,
      category: 'mountain',
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
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

async function processAllMountains() {
  const rawDataPath = path.join(process.cwd(), '.rawdata', '한국등산트레킹지원센터_산림청 100대명산_20220112', '100대명산');
  const outputPath = path.join(process.cwd(), 'data', 'trails.json');

  // 출력 디렉토리 생성
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const mountains = fs.readdirSync(rawDataPath);
  const allTrails: TrailData[] = [];

  console.log(`Processing ${mountains.length} mountains...`);

  for (const mountain of mountains) {
    const mountainPath = path.join(rawDataPath, mountain);
    const stats = fs.statSync(mountainPath);

    if (!stats.isDirectory()) continue;

    const gpxFiles = fs.readdirSync(mountainPath).filter(f => f.endsWith('.gpx'));
    console.log(`\n📍 ${mountain}: ${gpxFiles.length} courses`);

    for (const gpxFile of gpxFiles) {
      const gpxPath = path.join(mountainPath, gpxFile);
      const trailData = await parseGPXFile(gpxPath, mountain);

      if (trailData) {
        allTrails.push(trailData);
        console.log(`  ✓ ${trailData.courseName} - ${trailData.distance}m, ${trailData.duration}min, ${trailData.difficulty}`);
      }
    }
  }

  // JSON 파일로 저장
  fs.writeFileSync(outputPath, JSON.stringify(allTrails, null, 2), 'utf-8');
  console.log(`\n✅ Total ${allTrails.length} trails saved to ${outputPath}`);

  // 통계 출력
  console.log('\n📊 Statistics:');
  console.log(`  - Total mountains: ${mountains.length}`);
  console.log(`  - Total trails: ${allTrails.length}`);
  console.log(`  - Average courses per mountain: ${(allTrails.length / mountains.length).toFixed(1)}`);

  const difficulties = allTrails.reduce((acc, t) => {
    acc[t.difficulty] = (acc[t.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`  - Difficulty distribution:`, difficulties);
}

// 실행
processAllMountains().catch(console.error);
