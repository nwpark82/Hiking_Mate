// DB 등산로와 원본 GPX 비교 (읽기 전용)
// usage: node compare_raw.js <rawdata 폴더>
const fs = require('fs');
const path = require('path');

// 데이터 폴더: data/trail-review (export.js 결과)
const DIR = path.join(__dirname, '..', '..', 'data', 'trail-review');
const RAW = process.argv[2];
const trails = JSON.parse(fs.readFileSync(path.join(DIR, 'trails.json'), 'utf8'));
const analysis = JSON.parse(fs.readFileSync(path.join(DIR, 'analysis.json'), 'utf8'));
const aById = Object.fromEntries(analysis.map((a) => [a.id, a]));

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
const dist = (a, b) => {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

// ----- 원본 GPX 파싱 (봉우리 코스 데이터셋 제외) -----
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.includes('봉우리')) continue;
      walk(p, out);
    } else if (e.name.endsWith('.gpx')) out.push(p);
  }
  return out;
}

const raws = [];
for (const file of walk(RAW)) {
  const xml = fs.readFileSync(file, 'utf8');
  const pts = [];
  for (const m of xml.matchAll(/<trkpt[^>]*lat="([-\d.]+)"[^>]*lon="([-\d.]+)"/g)) pts.push({ lat: +m[1], lng: +m[2] });
  const wpts = (xml.match(/<wpt /g) || []).length;
  const segs = (xml.match(/<trkseg/g) || []).length;
  if (pts.length < 2) continue;
  let maxGap = 0;
  let gaps1k = 0;
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    L += d;
    maxGap = Math.max(maxGap, d);
    if (d >= 1000) gaps1k++;
  }
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  raws.push({
    file: path.relative(RAW, file),
    pts,
    wpts,
    segs,
    maxGap,
    gaps1k,
    km: L / 1000,
    se: dist(pts[0], pts[pts.length - 1]),
    bbox: [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)],
  });
}
console.log(`원본 GPX ${raws.length}개 파싱`);
console.log(`원본 중 1km 이상 끊김 있는 파일: ${raws.filter((r) => r.gaps1k > 0).length}개`);
console.log(`원본 중 300m 이상 끊김 있는 파일: ${raws.filter((r) => r.maxGap >= 300).length}개`);
console.log(`원본 중 여러 구간(trkseg>1) 파일: ${raws.filter((r) => r.segs > 1).length}개`);

// ----- DB 등산로 ↔ 원본 매칭 (원본 점들이 DB 경로 30m 이내에 얼마나 있는지) -----
const CELL = 0.0003;
const key = (p) => `${Math.floor(p.lat / CELL)}:${Math.floor(p.lng / (CELL * 1.25))}`;
function cellSet(pts) {
  const s = new Set();
  for (const p of pts) {
    const a = Math.floor(p.lat / CELL);
    const b = Math.floor(p.lng / (CELL * 1.25));
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) s.add(`${a + i}:${b + j}`);
  }
  return s;
}
const overlap = (b1, b2) => !(b1[1] < b2[0] || b2[1] < b1[0] || b1[3] < b2[2] || b2[3] < b1[2]);

const rows = [];
for (const t of trails) {
  const p = t.path_coordinates;
  const lats = p.map((x) => x.lat);
  const lngs = p.map((x) => x.lng);
  const bbox = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const cells = cellSet(p);
  let best = null;
  for (const r of raws) {
    if (!overlap(bbox, r.bbox)) continue;
    let hit = 0;
    for (const q of r.pts) if (cells.has(key(q))) hit++;
    const cover = hit / r.pts.length; // 원본이 DB 경로 위에 있는 비율
    if (cover > 0.8 && (!best || r.pts.length * cover > best.score)) best = { r, cover, score: r.pts.length * cover };
  }
  const a = aById[t.id];
  rows.push({
    id: t.id,
    name: t.name,
    grade: a.grade,
    db_max_gap: a.max_gap_m,
    db_km: a.path_km,
    raw: best ? best.r.file : null,
    raw_cover: best ? +best.cover.toFixed(2) : null,
    raw_max_gap: best ? Math.round(best.r.maxGap) : null,
    raw_km: best ? +best.r.km.toFixed(2) : null,
    raw_wpts: best ? best.r.wpts : null,
    raw_se: best ? Math.round(best.r.se) : null,
  });
}
fs.writeFileSync(path.join(DIR, 'raw_compare.json'), JSON.stringify(rows, null, 1));

const matched = rows.filter((r) => r.raw);
console.log(`\nDB ${rows.length}개 중 원본 매칭 ${matched.length}개`);
const dbGap = matched.filter((r) => r.db_max_gap >= 1000);
const fromRaw = dbGap.filter((r) => r.raw_max_gap >= 1000);
console.log(`DB에서 1km+ 끊김 ${dbGap.length}개 중 원본에도 1km+ 끊김: ${fromRaw.length}개 / 원본은 정상(가공 중 발생): ${dbGap.length - fromRaw.length}개`);
const dbGap3 = matched.filter((r) => r.db_max_gap >= 300 && r.db_max_gap < 1000);
console.log(`DB에서 300m~1km 끊김 ${dbGap3.length}개 중 원본에도 300m+ 끊김: ${dbGap3.filter((r) => r.raw_max_gap >= 300).length}개`);
const longer = matched.filter((r) => r.db_km > r.raw_km * 1.6);
console.log(`DB 경로가 원본보다 1.6배 이상 긴 것(왕복/중복 추가): ${longer.length}개`);
for (const g of ['A', 'B', 'C']) {
  const m = matched.filter((r) => r.grade === g);
  console.log(`등급 ${g}: 매칭 ${m.length}개, 원본 자체가 깨끗(최대 간격<300m) ${m.filter((r) => r.raw_max_gap < 300).length}개`);
}
console.log(`매칭 원본의 웨이포인트(이정표) 수 중앙값: ${[...matched.map((r) => r.raw_wpts)].sort((a, b) => a - b)[matched.length >> 1]}`);
