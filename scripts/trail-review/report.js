// 분석 결과를 등산로별 CSV로 저장 (엑셀에서 바로 열 수 있도록 UTF-8 BOM)
// usage: node scripts/trail-review/report.js   (analyze.js, compare_raw.js 실행 후)
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'trail-review');
const analysis = JSON.parse(fs.readFileSync(path.join(DIR, 'analysis.json'), 'utf8'));
const compare = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(DIR, 'raw_compare.json'), 'utf8')).map((r) => [r.id, r])
);

const v2Path = path.join(DIR, 'analysis_v2.json');
const v2 = fs.existsSync(v2Path) ? Object.fromEntries(JSON.parse(fs.readFileSync(v2Path, 'utf8')).map((r) => [r.id, r])) : {};
const VERDICT_LABEL = { USABLE: '사용 가능', FIXABLE: '보정 가능', UNUSABLE: '사용 불가' };
const END_LABEL = { TRAILHEAD: '산 초입', SUMMIT: '정상', MIDWAY: '중턱' };

const GRADE_LABEL = { A: 'A 사용 가능', B: 'B 주의/보정 필요', C: 'C 비공개 권장' };

const sourceStatus = (c) => {
  if (!c || !c.raw) return '원본 없음';
  return c.raw_max_gap >= 300 ? '원본 결함' : '원본 정상';
};

const columns = [
  ['id', (r) => r.id],
  ['사용 판정', (r) => VERDICT_LABEL[v2[r.id]?.verdict] || ''],
  ['보정 방법', (r) => (v2[r.id]?.fix || []).join(' + ')],
  ['판정 사유', (r) => (v2[r.id]?.reasons || []).join(' / ')],
  ['시작', (r) => END_LABEL[v2[r.id]?.start] || ''],
  ['시작 근거', (r) => v2[r.id]?.start_hint || ''],
  ['끝', (r) => END_LABEL[v2[r.id]?.end] || ''],
  ['끝 근거', (r) => v2[r.id]?.end_hint || ''],
  ['끊김 수(100m+)', (r) => v2[r.id]?.gap_count ?? ''],
  ['메울 수 있는 끊김', (r) => v2[r.id]?.gap_fillable ?? ''],
  ['300m+ 끊김 원인', (r) => Object.entries(v2[r.id]?.big_gap_causes || {}).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(', ')],
  ['같은 길 3회+ 비율', (r) => v2[r.id]?.repeat3_share ?? ''],
  ['1차 등급', (r) => GRADE_LABEL[r.grade]],
  ['이름', (r) => r.name],
  ['산', (r) => r.mountain],
  ['지역', (r) => r.region],
  ['유형', (r) => r.trail_type],
  ['원본 상태', (r) => sourceStatus(compare[r.id])],
  ['심각', (r) => r.issues.filter((i) => i.level === 'critical').map((i) => i.msg).join(' / ')],
  ['주의', (r) => r.issues.filter((i) => i.level === 'warning').map((i) => i.msg).join(' / ')],
  ['참고', (r) => r.issues.filter((i) => i.level === 'info').map((i) => i.msg).join(' / ')],
  ['안내 거리(km)', (r) => r.stated_km],
  ['실제 경로(km)', (r) => r.path_km],
  ['최대 끊김(m)', (r) => r.max_gap_m],
  ['시작-끝 거리(m)', (r) => r.start_end_m],
  ['반복 배수', (r) => r.repeat_ratio],
  ['안내 소요(분)', (r) => r.duration_min],
  ['추정 소요(분)', (r) => r.est_duration_min],
  ['좌표 수', (r) => r.points],
  ['조회수', (r) => r.views],
  ['원본 파일', (r) => compare[r.id]?.raw || ''],
  ['원본 이정표 수', (r) => compare[r.id]?.raw_wpts ?? ''],
];

const escape = (v) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const order = { UNUSABLE: 0, FIXABLE: 1, USABLE: 2 };
const rows = [...analysis].sort((a, b) => (order[v2[a.id]?.verdict] ?? 0) - (order[v2[b.id]?.verdict] ?? 0) || b.views - a.views);

const csv = [
  columns.map(([h]) => h).join(','),
  ...rows.map((r) => columns.map(([, f]) => escape(f(r))).join(',')),
].join('\n');

const out = path.join(DIR, 'trail-review.csv');
fs.writeFileSync(out, '﻿' + csv);
console.log(`${rows.length}개 → ${out}`);
