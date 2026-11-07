// 등산로 사용 가능성 정밀 분석 (읽기 전용)
// usage: node --max-old-space-size=6144 scripts/trail-review/analyze_v2.js .rawdata
//
// 판정 기준 (운영자 기준, 2026-11-08)
// - 시작/끝: 양 끝이 '산 초입'(주차장·입구 등)이면 유효. 멀리 떨어져 있어도 초입이면 유효.
//            왕복은 끝이 출발점 인근(500m)이어도 유효.
// - 정상(또는 중턱)에서 끝나는 편도 → 왕복 전환 후보
// - 경로: 300m 이상 끊김, 좌표 순서 꼬임, 같은 길 3회 이상 반복이 없어야 사용 가능
// 산 초입 판별 근거: 원본 GPX 기록 시작/종료 위치(등산객이 기록을 켜고 끈 곳),
//                    원본 이정표(주차장·입구·안내소·매표소·정류장 등), 코스 내 상대 고도

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'trail-review');
const RAW = process.argv[2];
const trails = JSON.parse(fs.readFileSync(path.join(DIR, 'trails.json'), 'utf8'));
const prevCompare = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(DIR, 'raw_compare.json'), 'utf8')).map((r) => [r.id, r])
);

// ---------- 공통 ----------
const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
function dist(aLat, aLng, bLat, bLng) {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[a.length >> 1] : 0);

class Grid {
  constructor(cellDeg) {
    this.c = cellDeg;
    this.m = new Map();
  }
  key(lat, lng) {
    return Math.floor(lat / this.c) * 1000003 + Math.floor(lng / this.c);
  }
  add(lat, lng, v) {
    const k = this.key(lat, lng);
    let arr = this.m.get(k);
    if (!arr) this.m.set(k, (arr = []));
    arr.push(v);
  }
  near(lat, lng) {
    const a = Math.floor(lat / this.c);
    const b = Math.floor(lng / this.c);
    const out = [];
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const arr = this.m.get((a + i) * 1000003 + (b + j));
        if (arr) for (const v of arr) out.push(v);
      }
    return out;
  }
}

// ---------- DB 등산로 범위 (원본 필터링용) ----------
const dbBoxes = trails.map((t) => {
  const p = t.path_coordinates;
  let a = 90, b = -90, c = 180, d = -180;
  for (const x of p) {
    a = Math.min(a, x.lat); b = Math.max(b, x.lat); c = Math.min(c, x.lng); d = Math.max(d, x.lng);
  }
  return [a - 0.02, b + 0.02, c - 0.02, d + 0.02];
});
const touchesDb = (bb) => dbBoxes.some((x) => !(bb[1] < x[0] || x[1] < bb[0] || bb[3] < x[2] || x[3] < bb[2]));

// ---------- 원본 GPX 로딩 ----------
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.gpx')) out.push(p);
  }
  return out;
}

const TRAILHEAD_WORDS = /주차장|주차|입구|들머리|날머리|안내소|탐방지원센터|탐방안내|매표소|정류장|버스|마을회관|관리사무소/;

const tracks = []; // {file, lat:Float64Array, lng, ele, segStarts}
const trailheadGrid = new Grid(0.003); // 원본 기록 시작/종료 + 초입 이정표
const files = walk(RAW);
let skipped = 0;
for (const file of files) {
  const xml = fs.readFileSync(file, 'utf8');
  const bm = xml.match(/<bounds maxlat="([-\d.]+)" maxlon="([-\d.]+)" minlat="([-\d.]+)" minlon="([-\d.]+)"/);
  if (bm && !touchesDb([+bm[3], +bm[1], +bm[4], +bm[2]])) {
    skipped++;
    continue;
  }
  const lat = [], lng = [], ele = [], segStarts = [];
  for (const seg of xml.split('<trkseg').slice(1)) {
    segStarts.push(lat.length);
    for (const m of seg.matchAll(/<trkpt[^>]*lat="([-\d.]+)"[^>]*lon="([-\d.]+)"[^>]*>(?:\s*<ele>([-\d.]+)<\/ele>)?/g)) {
      lat.push(+m[1]); lng.push(+m[2]); ele.push(m[3] !== undefined ? +m[3] : NaN);
    }
  }
  if (lat.length < 2) continue;
  const idx = tracks.length;
  tracks.push({
    file: path.relative(RAW, file),
    lat: Float64Array.from(lat),
    lng: Float64Array.from(lng),
    ele: Float64Array.from(ele),
    segStarts,
  });
  // 기록 시작/종료 위치 = 초입 근거
  trailheadGrid.add(lat[0], lng[0], { lat: lat[0], lng: lng[0], kind: 'record', track: idx });
  trailheadGrid.add(lat[lat.length - 1], lng[lng.length - 1], { lat: lat[lat.length - 1], lng: lng[lng.length - 1], kind: 'record', track: idx });
  for (const m of xml.matchAll(/<wpt lat="([-\d.]+)" lon="([-\d.]+)"[\s\S]*?<name><!\[CDATA\[(.*?)\]\]><\/name>/g)) {
    if (TRAILHEAD_WORDS.test(m[3])) trailheadGrid.add(+m[1], +m[2], { lat: +m[1], lng: +m[2], kind: 'waypoint', name: m[3] });
  }
}
console.log(`원본 GPX ${files.length}개 중 등산로 주변 ${tracks.length}개 사용 (범위 밖 ${skipped}개 제외)`);

// 원본 경로 점 색인 (약 33m 셀)
const rawGrid = new Grid(0.0003);
let rawPoints = 0;
tracks.forEach((t, ti) => {
  for (let i = 0; i < t.lat.length; i++) {
    rawGrid.add(t.lat[i], t.lng[i], ti * 1e6 + i);
    rawPoints++;
  }
});
console.log(`원본 좌표 ${rawPoints.toLocaleString()}개 색인`);
const fileToTrack = Object.fromEntries(tracks.map((t, i) => [t.file, i]));

// ---------- 등산로별 분석 ----------
// ownTrack: 이 등산로를 만든 원본 기록 (자기 자신은 근거에서 제외)
function classifyEndpoint(pt, minA, maxA, ownTrack) {
  const near = trailheadGrid.near(pt.lat, pt.lng).filter((h) => dist(pt.lat, pt.lng, h.lat, h.lng) <= 250);
  const records = new Set(near.filter((h) => h.kind === 'record' && h.track !== ownTrack).map((h) => h.track)).size;
  const waypoint = near.find((h) => h.kind === 'waypoint');
  const range = maxA - minA;
  const rel = Number.isFinite(pt.altitude) && range > 100 ? (pt.altitude - minA) / range : null;
  let type;
  if (rel !== null && rel >= 0.85 && !waypoint) type = 'SUMMIT';
  else if (waypoint || records >= 2 || (records === 1 && (rel === null || rel <= 0.5))) type = 'TRAILHEAD';
  else if (rel !== null && rel <= 0.15) type = 'TRAILHEAD'; // 코스 최저 지점 부근
  else type = 'MIDWAY';
  return { type, records, waypoint: waypoint?.name || null, rel: rel === null ? null : +rel.toFixed(2) };
}

// 원본 기록에서 a→b 를 이어주는 구간 찾기 (갭 메우기 가능성)
function findFill(a, b, gapM) {
  const nearA = rawGrid.near(a.lat, a.lng);
  const nearB = rawGrid.near(b.lat, b.lng);
  const bestA = new Map(); // track -> [idx, d]
  for (const v of nearA) {
    const ti = Math.floor(v / 1e6), i = v % 1e6, t = tracks[ti];
    const d = dist(a.lat, a.lng, t.lat[i], t.lng[i]);
    if (d <= 40 && (!bestA.has(ti) || d < bestA.get(ti)[1])) bestA.set(ti, [i, d]);
  }
  let best = null;
  const seenB = new Map();
  for (const v of nearB) {
    const ti = Math.floor(v / 1e6), i = v % 1e6;
    if (!bestA.has(ti)) continue;
    const t = tracks[ti];
    const d = dist(b.lat, b.lng, t.lat[i], t.lng[i]);
    if (d <= 40 && (!seenB.has(ti) || d < seenB.get(ti)[1])) seenB.set(ti, [i, d]);
  }
  for (const [ti, [ib]] of seenB) {
    const [ia] = bestA.get(ti);
    const t = tracks[ti];
    const lo = Math.min(ia, ib), hi = Math.max(ia, ib);
    let len = 0, maxStep = 0;
    for (let k = lo + 1; k <= hi; k++) {
      const s = dist(t.lat[k - 1], t.lng[k - 1], t.lat[k], t.lng[k]);
      len += s;
      maxStep = Math.max(maxStep, s);
    }
    if (maxStep < 60 && len >= gapM * 0.9 && len <= Math.max(gapM * 3, gapM + 2000) && (!best || len < best.len)) {
      best = { file: t.file, len: Math.round(len), points: hi - lo };
    }
  }
  return best;
}

const results = [];
for (const t of trails) {
  const p = t.path_coordinates.filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));
  const n = p.length;
  const r = { id: t.id, name: t.name, mountain: t.mountain, trail_type: t.trail_type, views: t.view_count || 0, points: n };
  results.push(r);
  if (n < 20) {
    r.verdict = 'UNUSABLE';
    r.reasons = ['좌표 20개 미만'];
    continue;
  }

  const seg = new Float64Array(n - 1);
  let L = 0;
  for (let i = 1; i < n; i++) {
    seg[i - 1] = dist(p[i - 1].lat, p[i - 1].lng, p[i].lat, p[i].lng);
    L += seg[i - 1];
  }
  r.path_km = +(L / 1000).toFixed(2);
  const alts = p.map((x) => x.altitude).filter(Number.isFinite);
  const minA = alts.length ? Math.min(...alts) : 0;
  const maxA = alts.length ? Math.max(...alts) : 0;

  const own = prevCompare[t.id]?.raw;
  const ti = own !== undefined && own !== null ? fileToTrack[own] : undefined;

  // ===== 1. 시작/끝 =====
  const s = classifyEndpoint(p[0], minA, maxA, ti);
  const e = classifyEndpoint(p[n - 1], minA, maxA, ti);
  const se = dist(p[0].lat, p[0].lng, p[n - 1].lat, p[n - 1].lng);
  r.start = s.type;
  r.end = e.type;
  r.start_end_m = Math.round(se);
  r.start_hint = s.waypoint || (s.records ? `원본 기록 ${s.records}건 시작/종료` : '');
  r.end_hint = e.waypoint || (e.records ? `원본 기록 ${e.records}건 시작/종료` : '');
  const endOk = e.type === 'TRAILHEAD' || se <= 500;
  r.endpoints_ok = s.type === 'TRAILHEAD' && endOk;
  // 순서가 뒤집혀 출발점이 초입이 아닌 경우 (끝은 초입)
  r.reversed_order = s.type !== 'TRAILHEAD' && e.type === 'TRAILHEAD';
  // 정상/중턱에서 끝나는 편도 → 왕복 전환 후보
  r.roundtrip_candidate = s.type === 'TRAILHEAD' && !endOk;

  // ===== 2. 끊김과 메우기 가능성 =====
  const medSeg = median(Array.from(seg).filter((d) => d > 0));
  const gapTh = Math.max(100, medSeg * 8);
  const gaps = [];
  for (let i = 0; i < n - 1; i++) if (seg[i] >= gapTh) gaps.push(i);
  let fillable = 0;
  const fillSources = new Set();
  let maxUnfillable = 0;
  for (const i of gaps) {
    const f = findFill(p[i], p[i + 1], seg[i]);
    if (f) {
      fillable++;
      fillSources.add(f.file.split(/[\\/]/)[0].replace('한국등산트레킹지원센터_', '').replace(/_\d+$/, ''));
    } else maxUnfillable = Math.max(maxUnfillable, seg[i]);
  }
  r.gap_count = gaps.length;
  r.gap_fillable = fillable;
  r.max_gap_m = gaps.length ? Math.round(Math.max(...gaps.map((i) => seg[i]))) : 0;
  r.max_unfillable_gap_m = Math.round(maxUnfillable);
  r.fill_sources = [...fillSources].join('|');

  // ===== 3. 좌표 순서 (자기 원본과 대조) =====
  if (ti !== undefined) {
    const tr = tracks[ti];
    // 직전 대응 지점과 이어지는 원본 지점을 우선 선택 (같은 길을 오가는 구간의 오대응 방지)
    const seq = [];
    let prevIdx = -1;
    for (const x of p) {
      let bi = -1, bd = 30, ci = -1, cd = Infinity;
      for (const v of rawGrid.near(x.lat, x.lng)) {
        if (Math.floor(v / 1e6) !== ti) continue;
        const i = v % 1e6;
        const d = dist(x.lat, x.lng, tr.lat[i], tr.lng[i]);
        if (d >= 30) continue;
        if (d < bd) { bd = d; bi = i; }
        if (prevIdx >= 0 && Math.abs(i - prevIdx) <= 40 && Math.abs(i - prevIdx) < cd) { cd = Math.abs(i - prevIdx); ci = i; }
      }
      const pick = ci >= 0 ? ci : bi;
      seq.push(pick);
      if (pick >= 0) prevIdx = pick;
    }
    const matched = seq.filter((v) => v >= 0);
    r.raw_coverage = +(matched.length / n).toFixed(2);
    // 원본 순서에서 크게 건너뛴 횟수(가까운 위치인데 원본상 멀리 떨어진 점으로 이어짐)
    let splices = 0;
    let prev = -1, prevK = -1;
    for (let k = 0; k < n; k++) {
      if (seq[k] < 0) continue;
      if (prev >= 0 && Math.abs(seq[k] - prev) > 40 && k - prevK <= 2) splices++;
      prev = seq[k];
      prevK = k;
    }
    r.order_splices = splices;
    r._seq = seq;
    r._track = ti;
  }

  // 끊긴 구간별 원인: 원본에는 사이 경로가 있는데 건너뜀(순서 꼬임) / 원본도 끊김(원본 누락) / 원본에 없는 점(가공 추가)
  const gapCause = { 순서꼬임: 0, 원본누락: 0, 가공추가: 0 };
  const bigGapCause = { 순서꼬임: 0, 원본누락: 0, 가공추가: 0 };
  for (const i of gaps) {
    let cause;
    const a = r._seq?.[i], b = r._seq?.[i + 1];
    if (a === undefined || a < 0 || b < 0) cause = '가공추가';
    else if (Math.abs(b - a) <= 3) cause = '원본누락';
    else {
      const tr = tracks[r._track];
      let maxStep = 0;
      for (let k = Math.min(a, b) + 1; k <= Math.max(a, b); k++) maxStep = Math.max(maxStep, dist(tr.lat[k - 1], tr.lng[k - 1], tr.lat[k], tr.lng[k]));
      cause = maxStep < 100 ? '순서꼬임' : '원본누락';
    }
    gapCause[cause]++;
    if (seg[i] >= 300) bigGapCause[cause]++;
  }
  r.gap_causes = gapCause;
  r.big_gap_causes = bigGapCause;

  // ===== 4. 같은 길 반복 (등산로 내부) =====
  const visits = new Map();
  let lastCell = null;
  const cellOf = (x) => Math.floor(x.lat / 0.00025) * 1000003 + Math.floor(x.lng / 0.0003);
  for (const x of p) {
    const c = cellOf(x);
    if (c !== lastCell) visits.set(c, (visits.get(c) || 0) + 1);
    lastCell = c;
  }
  let lenMulti = 0;
  for (let i = 1; i < n; i++) if ((visits.get(cellOf(p[i])) || 0) >= 3) lenMulti += seg[i - 1];
  r.max_passes = Math.max(...visits.values());
  r.repeat3_share = +(lenMulti / L).toFixed(2); // 3번 이상 지나는 구간 비율
  r._cells = visits;

  // ===== 5. 고도 급변 원인 =====
  // DB 고도는 원본 GPX 고도를 그대로 사용함(대조 결과 차이 중앙값 0m) → 끊김/순서와 무관한 급변은 원본 GPS 고도 오차
  let altSpikes = 0, spikeNearGap = 0, spikeOnSplice = 0, spikeGpsNoise = 0;
  for (let i = 1; i < n; i++) {
    const a0 = p[i - 1].altitude, a1 = p[i].altitude;
    if (!Number.isFinite(a0) || !Number.isFinite(a1) || Math.abs(a1 - a0) <= 40) continue;
    if (seg[i - 1] >= 50) continue;
    altSpikes++;
    if (gaps.some((g) => Math.abs(g - (i - 1)) <= 3)) spikeNearGap++;
    else if (r._seq && r._seq[i] >= 0 && r._seq[i - 1] >= 0 && Math.abs(r._seq[i] - r._seq[i - 1]) > 40) spikeOnSplice++;
    else spikeGpsNoise++;
  }
  r.alt_spikes = altSpikes;
  r.alt_spike_causes = { 끊김인접: spikeNearGap, 순서꼬임: spikeOnSplice, 원본GPS고도오차: spikeGpsNoise };

  // ===== 6. 거리/소요시간 불일치 원인 =====
  const rawKm = prevCompare[t.id]?.raw_km;
  r.stated_km = t.distance;
  r.raw_km = rawKm ?? null;
  r.duration_min = t.duration;
  const ratio = t.distance > 0 ? L / 1000 / t.distance : null;
  r.length_ratio = ratio === null ? null : +ratio.toFixed(2);
  if (ratio !== null && (ratio < 0.7 || ratio > 1.4)) {
    if (rawKm && Math.abs(t.distance / rawKm - 1) < 0.15 && Math.abs(L / 1000 / rawKm - 2) < 0.3) r.distance_cause = '안내 거리는 원본(편도) 기준, 경로는 왕복으로 2배';
    else if (gaps.length || r.repeat3_share > 0.1) r.distance_cause = '경로 끊김/중복으로 실제 경로 길이가 왜곡';
    else if (rawKm && Math.abs(L / 1000 / rawKm - 1) < 0.15) r.distance_cause = '경로는 원본과 같고 안내 거리 값이 틀림';
    else r.distance_cause = '기타 (수동 확인 필요)';
  }
  if (t.duration > 0 && t.distance > 0) {
    // 안내 거리 기준 추정과 비교 → 안내 시간 자체가 안내 거리와 맞는지
    const estFromStated = (t.distance / 4) * 60;
    const estFromPath = (L / 1000 / 4) * 60;
    r.duration_vs_stated = +(t.duration / estFromStated).toFixed(2);
    r.duration_vs_path = +(t.duration / estFromPath).toFixed(2);
  }

  // ===== 판정 =====
  const reasons = [];
  if (!r.endpoints_ok) {
    if (r.reversed_order) reasons.push('좌표 순서가 뒤집혀 출발점이 초입이 아님');
    else if (r.roundtrip_candidate) reasons.push(`편도 끝이 ${e.type === 'SUMMIT' ? '정상' : '중턱'} (왕복 전환 후보)`);
    else reasons.push(`출발점이 초입 아님(${s.type})`);
  }
  if (r.max_gap_m >= 300) reasons.push(`300m 이상 끊김 ${gaps.filter((i) => seg[i] >= 300).length}개`);
  if (bigGapCause.순서꼬임) reasons.push(`좌표 순서 꼬임으로 건너뛴 구간 ${bigGapCause.순서꼬임}개`);
  if (r.repeat3_share > 0.1) reasons.push(`같은 길 3회 이상 반복 ${Math.round(r.repeat3_share * 100)}%`);
  r.reasons = reasons;

  // 순서가 달라도 지도상 연속이면(끊김 없음) 사용 가능. 순서 문제는 끊김으로 드러날 때만 판정
  const pathOk = r.max_gap_m < 300 && r.repeat3_share <= 0.1;
  const rawClean = prevCompare[t.id]?.raw_max_gap !== undefined && prevCompare[t.id]?.raw_max_gap !== null && prevCompare[t.id].raw_max_gap < 300;
  const gapsFixable = gaps.filter((i) => seg[i] >= 300).length > 0 && r.max_unfillable_gap_m < 300;

  if (r.endpoints_ok && pathOk) r.verdict = 'USABLE';
  else if ((r.endpoints_ok || r.roundtrip_candidate || r.reversed_order) && (pathOk || rawClean || gapsFixable)) r.verdict = 'FIXABLE';
  else r.verdict = 'UNUSABLE';
  r.fix = [];
  if (r.reversed_order) r.fix.push('좌표 순서 뒤집기');
  if (r.roundtrip_candidate) r.fix.push('왕복 전환');
  if (!pathOk && rawClean) r.fix.push('원본으로 재생성');
  else if (gapsFixable) r.fix.push('다른 기록으로 갭 메우기');
}

// ---------- 등산로 간 중복 (같은 산, 정/역방향 쌍 제외) ----------
const baseName = (nm) => nm.replace(/ \((정방향|역방향|왕복코스)\)$/, '');
const byMountain = {};
for (const r of results) if (r._cells) (byMountain[r.mountain] ||= []).push(r);
let interDup = 0;
for (const list of Object.values(byMountain)) {
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (baseName(a.name) === baseName(b.name)) continue;
      let inter = 0;
      for (const c of a._cells.keys()) if (b._cells.has(c)) inter++;
      const jac = inter / (a._cells.size + b._cells.size - inter);
      if (jac > 0.85) {
        interDup++;
        (a.same_as ||= []).push(b.name);
        (b.same_as ||= []).push(a.name);
      }
    }
}

for (const r of results) {
  delete r._seq;
  delete r._track;
  delete r._cells;
}
fs.writeFileSync(path.join(DIR, 'analysis_v2.json'), JSON.stringify(results, null, 1));

// ---------- 요약 ----------
const cnt = (f) => results.filter(f).length;
console.log('\n=== 판정 ===');
for (const v of ['USABLE', 'FIXABLE', 'UNUSABLE']) console.log(v, cnt((r) => r.verdict === v));
console.log('\n=== 시작/끝 ===');
const ep = {};
results.forEach((r) => { if (r.start) ep[`${r.start}→${r.end}`] = (ep[`${r.start}→${r.end}`] || 0) + 1; });
console.log(ep);
console.log('양 끝 유효', cnt((r) => r.endpoints_ok), '/ 순서 뒤집힘', cnt((r) => r.reversed_order), '/ 왕복 전환 후보', cnt((r) => r.roundtrip_candidate));
console.log('왕복 전환 후보 중 경로 정상', cnt((r) => r.roundtrip_candidate && r.max_gap_m < 300 && r.repeat3_share <= 0.1));
console.log('\n=== 끊김 메우기 ===');
const allGaps = results.reduce((s, r) => s + (r.gap_count || 0), 0);
const allFill = results.reduce((s, r) => s + (r.gap_fillable || 0), 0);
console.log(`끊김 ${allGaps}개 중 원본 기록으로 메울 수 있는 것 ${allFill}개 (${((allFill / allGaps) * 100).toFixed(0)}%)`);
console.log('끊김 있는 등산로', cnt((r) => r.gap_count > 0), '/ 모든 끊김을 메울 수 있는 등산로', cnt((r) => r.gap_count > 0 && r.gap_fillable === r.gap_count));
const src = {};
results.forEach((r) => (r.fill_sources || '').split('|').filter(Boolean).forEach((x) => (src[x] = (src[x] || 0) + 1)));
console.log('메우기 출처(등산로 수)', src);
console.log('\n=== 같은 길 반복 ===');
console.log('3회 이상 지나는 구간 10% 초과 등산로', cnt((r) => r.repeat3_share > 0.1), '/ 최대 통과 횟수 p50/p90/max', median(results.map((r) => r.max_passes || 0)), [...results.map((r) => r.max_passes || 0)].sort((a, b) => a - b)[Math.floor(results.length * 0.9)], Math.max(...results.map((r) => r.max_passes || 0)));
console.log('다른 등산로와 거의 같은 경로(85%+, 정/역방향 쌍 제외) 쌍', interDup);
console.log('\n=== 좌표 순서 ===');
console.log('원본 대조 가능', cnt((r) => r.raw_coverage !== undefined));
const gc = { 순서꼬임: 0, 원본누락: 0, 가공추가: 0 }, bgc = { 순서꼬임: 0, 원본누락: 0, 가공추가: 0 };
results.forEach((r) => { for (const k in gc) { gc[k] += r.gap_causes?.[k] || 0; bgc[k] += r.big_gap_causes?.[k] || 0; } });
console.log('끊김 원인(전체 끊김):', gc, '/ 300m 이상 끊김:', bgc);
console.log('300m+ 끊김이 순서 꼬임 때문인 등산로', cnt((r) => r.big_gap_causes?.순서꼬임 > 0));
console.log('\n=== 고도 급변 원인 (지점 수) ===');
const causes = {};
results.forEach((r) => Object.entries(r.alt_spike_causes || {}).forEach(([k, v]) => (causes[k] = (causes[k] || 0) + v)));
console.log(causes);
console.log('\n=== 거리 불일치 원인 ===');
const dc = {};
results.forEach((r) => r.distance_cause && (dc[r.distance_cause] = (dc[r.distance_cause] || 0) + 1));
console.log(dc);
console.log('안내 소요시간 ÷ 안내거리 기준 추정(4km/h) 중앙값', median(results.map((r) => r.duration_vs_stated).filter(Boolean)), '/ ÷ 실제 경로 기준 중앙값', median(results.map((r) => r.duration_vs_path).filter(Boolean)));
