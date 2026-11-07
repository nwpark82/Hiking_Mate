// 등산로 데이터 안전성 분석 (읽기 전용)
const fs = require('fs');
const path = require('path');

// 데이터 폴더: data/trail-review (export.js 결과)
const DIR = path.join(__dirname, '..', '..', 'data', 'trail-review');
const trails = JSON.parse(fs.readFileSync(path.join(DIR, 'trails.json'), 'utf8'));

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
function dist(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function bearing(a, b) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

// 산별 중심 (위치 이상 탐지용)
const byMountain = {};
for (const t of trails) {
  const p = t.path_coordinates || [];
  if (!p.length) continue;
  const c = { lat: median(p.map((x) => x.lat)), lng: median(p.map((x) => x.lng)) };
  (byMountain[t.mountain] ||= []).push(c);
}
const mountainCenter = {};
for (const [m, cs] of Object.entries(byMountain)) {
  mountainCenter[m] = { lat: median(cs.map((c) => c.lat)), lng: median(cs.map((c) => c.lng)) };
}

const results = [];

for (const t of trails) {
  const p = (t.path_coordinates || []).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));
  const issues = []; // {level: 'critical'|'warning'|'info', code, msg}
  const add = (level, code, msg) => issues.push({ level, code, msg });

  const n = p.length;
  const r = {
    id: t.id,
    name: t.name,
    mountain: t.mountain,
    region: t.region,
    trail_type: t.trail_type,
    difficulty: t.difficulty,
    points: n,
    stated_km: t.distance,
    duration_min: t.duration,
    views: t.view_count || 0,
  };

  if (n < 20) {
    add('critical', 'TOO_FEW_POINTS', `좌표 ${n}개뿐 (경로 표시 불가 수준)`);
    r.issues = issues;
    results.push(r);
    continue;
  }

  // 구간 거리
  const seg = [];
  let L = 0;
  for (let i = 1; i < n; i++) {
    const d = dist(p[i - 1], p[i]);
    seg.push(d);
    L += d;
  }
  const medSeg = median(seg.filter((d) => d > 0));
  r.path_km = +(L / 1000).toFixed(2);
  r.median_spacing_m = +medSeg.toFixed(1);

  // ===== 1. 범위/위치 =====
  const outside = p.filter((x) => x.lat < 33 || x.lat > 38.7 || x.lng < 124.5 || x.lng > 131.9).length;
  if (outside) add('critical', 'OUT_OF_KOREA', `한국 범위 밖 좌표 ${outside}개`);
  const center = { lat: median(p.map((x) => x.lat)), lng: median(p.map((x) => x.lng)) };
  const mc = mountainCenter[t.mountain];
  if (mc) {
    const off = dist(center, mc);
    r.mountain_offset_km = +(off / 1000).toFixed(1);
    // 둘레길/트레일/숲길, 지리산처럼 넓은 지역에 걸친 코스는 멀리 떨어진 것이 정상
    const longDistance = /둘레길|트레일|숲길/.test(t.name) || t.mountain === '지리산';
    if (off > 15000 && !longDistance) add('critical', 'WRONG_MOUNTAIN', `같은 산 다른 코스들과 ${(off / 1000).toFixed(1)}km 떨어짐 (산 정보 오류 의심)`);
  }

  // ===== 2. 시작과 끝 =====
  const start = p[0];
  const end = p[n - 1];
  const se = dist(start, end);
  r.start_end_m = Math.round(se);
  if (t.start_latitude && t.start_longitude) {
    const sm = dist(start, { lat: t.start_latitude, lng: t.start_longitude });
    r.start_marker_offset_m = Math.round(sm);
    if (sm > 300) add('warning', 'START_MARKER_MISMATCH', `안내 출발점과 경로 시작점이 ${Math.round(sm)}m 떨어짐`);
  }

  const type = t.trail_type || '';
  const loopLike = type.startsWith('CIRCULAR') || type === 'ROUNDTRIP';
  if (loopLike && se > 500) add('warning', 'TYPE_MISMATCH_OPEN', `${type}인데 시작-끝이 ${Math.round(se)}m 떨어짐`);
  if (type === 'ONEWAY_UNIQUE' && se < 150) add('info', 'TYPE_MISMATCH_CLOSED', `편도인데 시작-끝이 ${Math.round(se)}m (순환 가능성)`);

  // 정상에서 시작/끝 (편도 기준) - 고도
  const alts = p.map((x) => x.altitude).filter((a) => Number.isFinite(a));
  if (alts.length > n * 0.9) {
    const maxA = Math.max(...alts);
    const minA = Math.min(...alts);
    const range = maxA - minA;
    r.alt_min = Math.round(minA);
    r.alt_max = Math.round(maxA);
    const sA = p[0].altitude;
    const eA = p[n - 1].altitude;
    if (range > 150 && Number.isFinite(sA)) {
      const startRel = (sA - minA) / range;
      r.start_alt_rel = +startRel.toFixed(2);
      if (startRel > 0.8) add('warning', 'STARTS_HIGH', `출발점 고도가 코스 최고점 부근 (${Math.round(sA)}m / 최고 ${Math.round(maxA)}m) - 출발지까지 접근 방법 불명확`);
    }
    if (range > 150 && Number.isFinite(eA) && type === 'ONEWAY_UNIQUE') {
      const endRel = (eA - minA) / range;
      if (endRel > 0.8) add('info', 'ENDS_HIGH', `편도인데 도착점이 정상 부근 (${Math.round(eA)}m) - 하산 경로 없음`);
    }
  } else {
    add('warning', 'ALT_MISSING', `고도 값 누락 ${n - alts.length}개 / ${n}`);
  }

  // ===== 3. 중간 누락 (갭) =====
  const gapThreshold = Math.max(100, medSeg * 8);
  const gaps = [];
  seg.forEach((d, i) => {
    if (d >= gapThreshold) gaps.push({ index: i, m: Math.round(d) });
  });
  const maxGap = seg.length ? Math.max(...seg) : 0;
  r.max_gap_m = Math.round(maxGap);
  r.gap_count = gaps.length;
  const g1000 = gaps.filter((g) => g.m >= 1000).length;
  const g300 = gaps.filter((g) => g.m >= 300 && g.m < 1000).length;
  const g100 = gaps.filter((g) => g.m < 300).length;
  if (g1000) add('critical', 'GAP_1KM', `1km 이상 끊긴 구간 ${g1000}개 (최대 ${Math.round(maxGap)}m)`);
  if (g300) add('warning', 'GAP_300M', `300m~1km 끊긴 구간 ${g300}개`);
  if (g100) add('info', 'GAP_100M', `100~300m 끊긴 구간 ${g100}개`);
  r.gaps = gaps.slice(0, 10);

  // ===== 4. GPS 튐 (spike) =====
  let spikes = 0;
  for (let i = 1; i < n - 1; i++) {
    const a = seg[i - 1];
    const b = seg[i];
    if (a > 60 && b > 60) {
      const direct = dist(p[i - 1], p[i + 1]);
      if (direct < 0.25 * Math.min(a, b)) spikes++;
    }
  }
  r.spikes = spikes;
  if (spikes >= 3) add('warning', 'GPS_SPIKES', `GPS 튐 의심 지점 ${spikes}개`);
  else if (spikes > 0) add('info', 'GPS_SPIKES', `GPS 튐 의심 지점 ${spikes}개`);

  // ===== 5. 직선 보간 (인위적 경로) 의심 =====
  // 방향이 거의 같고 간격이 거의 일정한 점이 연속되는 구간
  let straightMax = 0;
  let run = 0;
  let runStart = 0;
  for (let i = 2; i < n; i++) {
    const b1 = bearing(p[i - 2], p[i - 1]);
    const b2 = bearing(p[i - 1], p[i]);
    const db = Math.min(Math.abs(b1 - b2), 360 - Math.abs(b1 - b2));
    const s1 = seg[i - 2];
    const s2 = seg[i - 1];
    const evenSpacing = s1 > 2 && Math.abs(s1 - s2) / Math.max(s1, s2) < 0.05;
    if (db < 1.5 && evenSpacing) {
      if (run === 0) runStart = i - 2;
      run++;
    } else {
      if (run >= 4) {
        let len = 0;
        for (let k = runStart; k < runStart + run + 1; k++) len += seg[k];
        straightMax = Math.max(straightMax, len);
      }
      run = 0;
    }
  }
  r.synthetic_straight_m = Math.round(straightMax);
  if (straightMax >= 300) add('warning', 'SYNTHETIC_STRAIGHT', `인위적 직선 구간 의심 ${Math.round(straightMax)}m (실제 길과 다를 수 있음)`);

  // ===== 6. 경로 중복 (같은 길 여러 번) =====
  const cells = new Set();
  for (const x of p) cells.add(`${Math.round(x.lat / 0.0002)}:${Math.round(x.lng / 0.00025)}`);
  const uniqueApprox = cells.size * 20; // 셀 ≈ 20m
  const repeat = uniqueApprox > 0 ? L / uniqueApprox : 1;
  r.repeat_ratio = +repeat.toFixed(2);
  // 왕복은 약 2배가 정상, 그 이상은 중복
  if (repeat > 2.6) add('critical', 'DUPLICATED_PATH', `같은 길이 ${repeat.toFixed(1)}배 반복 (가공 중 중복 생성 의심)`);
  else if (type !== 'ROUNDTRIP' && repeat > 1.7 && type !== 'CIRCULAR_PARTIAL') add('info', 'REPEATED_SECTIONS', `되돌아오는 구간 많음 (${repeat.toFixed(1)}배)`);

  // ===== 7. 안내 거리 vs 실제 경로 =====
  if (t.distance > 0) {
    const ratio = L / 1000 / t.distance;
    r.length_ratio = +ratio.toFixed(2);
    if (ratio < 0.7 || ratio > 1.4) add('warning', 'DISTANCE_MISMATCH', `안내 거리 ${t.distance}km, 실제 경로 ${(L / 1000).toFixed(1)}km`);
  }

  // ===== 8. 고도 이상 =====
  if (alts.length) {
    let altSpikes = 0;
    for (let i = 1; i < n; i++) {
      const a0 = p[i - 1].altitude;
      const a1 = p[i].altitude;
      if (Number.isFinite(a0) && Number.isFinite(a1) && seg[i - 1] < 50 && Math.abs(a1 - a0) > 40) altSpikes++;
    }
    r.alt_spikes = altSpikes;
    if (altSpikes >= 3) add('warning', 'ALT_SPIKES', `고도 급변 지점 ${altSpikes}개 (고도 그래프 왜곡)`);
    if (Math.max(...alts) > 1960 || Math.min(...alts) < -20) add('warning', 'ALT_RANGE', `고도 범위 이상 (${Math.round(Math.min(...alts))}~${Math.round(Math.max(...alts))}m)`);

    // 누적 상승 (5m 이상 변화만)
    let gain = 0;
    let ref = alts[0];
    for (const a of alts) {
      if (a - ref > 5) {
        gain += a - ref;
        ref = a;
      } else if (ref - a > 5) ref = a;
    }
    r.gain_m = Math.round(gain);

    // ===== 9. 소요시간 타당성 (평지 4km/h + 상승 500m/h 기준) =====
    // 고도가 튀는 경로는 상승고도가 부풀려지므로 거리만으로 추정 (보수적)
    if (t.duration > 0) {
      const reliableGain = altSpikes < 3 && gain < 3000 ? gain : 0;
      const est = (L / 1000 / 4 + reliableGain / 500) * 60;
      r.est_duration_min = Math.round(est);
      const dr = t.duration / est;
      r.duration_ratio = +dr.toFixed(2);
      if (dr < 0.6) add('warning', 'DURATION_SHORT', `안내 소요시간 ${t.duration}분이 추정치 ${Math.round(est)}분보다 너무 짧음 (일몰·체력 위험)`);
      else if (dr > 2) add('info', 'DURATION_LONG', `안내 소요시간 ${t.duration}분이 추정치 ${Math.round(est)}분보다 김`);
    }
  }

  r.issues = issues;
  results.push(r);
}

// ===== 정/역방향 쌍 일관성 =====
const byBase = {};
for (const r of results) {
  const m = r.name.match(/^(.*) \((정방향|역방향)\)$/);
  if (m) (byBase[m[1]] ||= {})[m[2]] = r;
}
const tById = Object.fromEntries(trails.map((t) => [t.id, t]));
let pairs = 0;
let pairMismatch = 0;
for (const [base, pr] of Object.entries(byBase)) {
  if (!pr['정방향'] || !pr['역방향']) continue;
  pairs++;
  const a = tById[pr['정방향'].id].path_coordinates;
  const b = tById[pr['역방향'].id].path_coordinates;
  const d1 = dist(a[0], b[b.length - 1]);
  const d2 = dist(a[a.length - 1], b[0]);
  if (d1 > 200 || d2 > 200) {
    pairMismatch++;
    pr['역방향'].issues.push({ level: 'info', code: 'PAIR_MISMATCH', msg: `정방향 코스와 시작/끝이 서로 맞지 않음 (${Math.round(d1)}m / ${Math.round(d2)}m)` });
  }
  pr['역방향'].pair_of = pr['정방향'].id;
}

// ===== 등급 =====
for (const r of results) {
  const lv = r.issues.map((i) => i.level);
  r.grade = lv.includes('critical') ? 'C' : lv.includes('warning') ? 'B' : 'A';
}

fs.writeFileSync(path.join(DIR, 'analysis.json'), JSON.stringify(results, null, 1));

// ===== 요약 =====
const count = (f) => results.filter(f).length;
const pct = (x) => `${((x / results.length) * 100).toFixed(1)}%`;
console.log(`총 ${results.length}개`);
for (const g of ['A', 'B', 'C']) console.log(`등급 ${g}: ${count((r) => r.grade === g)} (${pct(count((r) => r.grade === g))})`);
console.log('');
const codes = {};
for (const r of results) for (const i of r.issues) {
  const k = `${i.level}|${i.code}`;
  codes[k] = (codes[k] || 0) + 1;
}
Object.entries(codes)
  .sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a[0].split('|')[0]] - { critical: 0, warning: 1, info: 2 }[b[0].split('|')[0]] || b[1] - a[1]))
  .forEach(([k, v]) => console.log(k.padEnd(36), v));
console.log('');
console.log(`정/역방향 쌍 ${pairs}개, 시작/끝 불일치 ${pairMismatch}개`);
const spacing = results.map((r) => r.median_spacing_m).filter(Boolean);
console.log('좌표 간격 중앙값 분포(m):', [0.1, 0.5, 0.9].map((q) => median(spacing.filter((_, i, a) => true).sort((a, b) => a - b).slice(0, Math.ceil(spacing.length * q)))));
