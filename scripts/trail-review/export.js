// 등산로 전체를 data/trail-review/trails.json 으로 내려받음 (읽기 전용)
// usage: node scripts/trail-review/export.js   (.env.local 의 서비스 키 사용)
require('dotenv').config({ path: '.env.local', quiet: true });
const fs = require('fs');
const path = require('path');

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUT = path.join(__dirname, '..', '..', 'data', 'trail-review');

const FIELDS = [
  'id', 'name', 'mountain', 'region', 'category', 'difficulty', 'distance', 'duration', 'elevation_gain',
  'start_latitude', 'start_longitude', 'path_coordinates', 'coordinates', 'trail_type', 'overlap_rate',
  'max_altitude', 'min_altitude', 'avg_altitude', 'original_distance', 'view_count',
].join(',');

(async () => {
  const all = [];
  for (let offset = 0; ; offset += 200) {
    const res = await fetch(`${URL_}/rest/v1/trails?select=${FIELDS}&order=id&offset=${offset}&limit=200`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const rows = await res.json();
    all.push(...rows);
    if (rows.length < 200) break;
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'trails.json'), JSON.stringify(all));
  console.log(`${all.length}개 저장: ${OUT}/trails.json`);
})();
