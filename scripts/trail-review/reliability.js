// 등산로 신뢰도 판정 (읽기 전용) → data/trail-review/reliability.json
// usage: node scripts/trail-review/reliability.js [하한] [상한]   (기본 0.6 2.5)
//
// 신뢰 = 경로 판정 '사용 가능'(왕복 전환 대상은 전환 후 기준)
//      + 안내 소요시간이 표준 추정치와 크게 다르지 않음
// 표준 추정: 거리 4km/h + 누적 상승 500m/h (고도는 이동 중앙값으로 평활화 후 10m 이상 변화만 누적)
// 안내 소요시간은 원본 기록 시간(휴식 포함)으로 보여 추정치보다 긴 경향 → 상한을 넉넉히 둠
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'trail-review');
const LO = Number(process.argv[2] || 0.6);
const HI = Number(process.argv[3] || 2.5);

const trails = JSON.parse(fs.readFileSync(path.join(DIR, 'trails.json'), 'utf8'));
const v2 = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(DIR, 'analysis_v2.json'), 'utf8')).map((r) => [r.id, r]));

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
const dist = (a, b) => {
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

function smoothedGain(p) {
  const alts = p.map((x) => x.altitude);
  if (alts.filter(Number.isFinite).length < p.length * 0.9) return null;
  const w = 7;
  const sm = alts.map((_, i) => {
    const win = alts.slice(Math.max(0, i - w), i + w + 1).filter(Number.isFinite).sort((a, b) => a - b);
    return win[win.length >> 1];
  });
  let gain = 0;
  let ref = sm[0];
  for (const a of sm) {
    if (a - ref > 10) { gain += a - ref; ref = a; }
    else if (ref - a > 10) ref = a;
  }
  return gain;
}

const out = [];
for (const t of trails) {
  const r = v2[t.id];
  const p = t.path_coordinates;
  let km = 0;
  for (let i = 1; i < p.length; i++) km += dist(p[i - 1], p[i]) / 1000;
  const gain = smoothedGain(p);
  const est = gain === null ? null : (km / 4 + gain / 500) * 60;
  const ratio = est && t.duration > 0 ? t.duration / est : null;

  const willConvert = r.verdict === 'FIXABLE' && r.fix?.length === 1 && r.fix[0] === '왕복 전환';
  const pathUsable = r.verdict === 'USABLE' || willConvert;

  const reasons = [];
  if (!pathUsable) reasons.push(...(r.reasons?.length ? r.reasons : ['경로 판정 사용 불가']));
  if (ratio === null) reasons.push('소요시간 검증 불가(고도/시간 정보 없음)');
  else if (ratio < LO) reasons.push(`안내 소요시간이 추정치보다 짧음 (${t.duration}분 / 추정 ${Math.round(est)}분)`);
  else if (ratio > HI) reasons.push(`안내 소요시간이 추정치보다 김 (${t.duration}분 / 추정 ${Math.round(est)}분)`);

  out.push({
    id: t.id,
    name: t.name,
    reliable: reasons.length === 0,
    will_convert: willConvert,
    path_verdict: r.verdict,
    est_min: est === null ? null : Math.round(est),
    est_gain_m: gain === null ? null : Math.round(gain),
    duration_ratio: ratio === null ? null : +ratio.toFixed(2),
    reasons,
  });
}
fs.writeFileSync(path.join(DIR, 'reliability.json'), JSON.stringify(out, null, 1));

const n = (f) => out.filter(f).length;
console.log(`허용 범위 ${LO}~${HI}배`);
console.log(`신뢰 ${n((r) => r.reliable)} / 비신뢰 ${n((r) => !r.reliable)}  (왕복 전환 포함 신뢰 ${n((r) => r.reliable && r.will_convert)})`);
const pathOk = out.filter((r) => r.path_verdict === 'USABLE' || r.will_convert);
console.log(`경로 사용 가능 ${pathOk.length}개 중 소요시간 때문에 제외 ${pathOk.filter((r) => !r.reliable).length}개`);
const rs = pathOk.map((r) => r.duration_ratio).filter((x) => x !== null).sort((a, b) => a - b);
console.log('경로 사용 가능 등산로의 안내/추정 비율 p10/p25/p50/p75/p90:', [0.1, 0.25, 0.5, 0.75, 0.9].map((q) => rs[Math.floor((rs.length - 1) * q)]));
for (const [lo, hi] of [[0.7, 2], [0.6, 2.5], [0.5, 3]]) {
  console.log(`  범위 ${lo}~${hi}: 경로 사용 가능 중 통과 ${rs.filter((x) => x >= lo && x <= hi).length}개`);
}
