// 정상/중턱에서 끝나는 편도 등산로를 왕복으로 전환
// usage:
//   node scripts/trail-review/convert_roundtrip.js           # 미리보기 (DB 변경 없음)
//   node scripts/trail-review/convert_roundtrip.js --apply   # 실제 반영 (변경 전 데이터 백업)
//
// 대상: analysis_v2.json 에서 판정 FIXABLE + 보정 방법이 '왕복 전환' 하나뿐인 등산로
//       (출발점은 산 초입, 끝이 정상/중턱, 경로에 큰 끊김·반복 없음)
// 변환: 경로 = 올라간 경로 + 같은 길로 내려오는 경로
//       거리 = 경로 길이로 재계산
//       소요시간 = 기존 × (왕복 표준 추정 ÷ 편도 표준 추정)  — 원본 기록의 걸음 속도 유지
//                  표준 추정: 거리 4km/h + 누적 상승 500m/h (reliability.js 와 같은 평활화 고도)
//       유형 = ROUNDTRIP, 이름 끝 '(정방향)/(역방향)' → '(왕복코스)'
require('dotenv').config({ path: '.env.local', quiet: true });
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const DIR = path.join(__dirname, '..', '..', 'data', 'trail-review');
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };


const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
const dist = (a, b) => {
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const pathKm = (p) => {
  let L = 0;
  for (let i = 1; i < p.length; i++) L += dist(p[i - 1], p[i]);
  return +(L / 1000).toFixed(2);
};

(async () => {
  const v2 = JSON.parse(fs.readFileSync(path.join(DIR, 'analysis_v2.json'), 'utf8'));
  const targets = v2.filter((r) => r.verdict === 'FIXABLE' && r.fix?.length === 1 && r.fix[0] === '왕복 전환');
  const names = new Set(v2.map((r) => r.name));
  const rel = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(DIR, 'reliability.json'), 'utf8')).map((r) => [r.id, r]));

  const plan = [];
  for (const r of targets) {
    const res = await fetch(`${URL_}/rest/v1/trails?select=id,name,distance,duration,trail_type,path_coordinates&id=eq.${r.id}`, { headers });
    const [t] = await res.json();
    const up = t.path_coordinates;
    const down = up.slice(0, -1).reverse();
    const newPath = [...up, ...down];
    const newName = t.name.replace(/ \((정방향|역방향)\)$/, ' (왕복코스)');
    plan.push({
      before: t,
      after: {
        name: newName,
        trail_type: 'ROUNDTRIP',
        path_coordinates: newPath,
        distance: pathKm(newPath),
        // 왕복 추정 = 거리 2배 + 상승은 그대로(내리막은 상승 아님)
        duration: (() => {
          const g = rel[t.id]?.est_gain_m;
          const km = pathKm(up);
          if (g === null || g === undefined) return Math.round(t.duration * 1.67);
          const ow = km / 4 + g / 500;
          const rt = (km * 2) / 4 + g / 500;
          return Math.round((t.duration * rt) / ow);
        })(),
      },
      nameConflict: newName !== t.name && names.has(newName),
      end: r.end,
    });
  }

  console.log(`대상 ${plan.length}개 (끝: 정상 ${plan.filter((p) => p.end === 'SUMMIT').length} / 중턱 ${plan.filter((p) => p.end === 'MIDWAY').length})`);
  console.log(`이름 변경 ${plan.filter((p) => p.after.name !== p.before.name).length}개, 이미 '(왕복코스)' 이름 ${plan.filter((p) => p.after.name === p.before.name).length}개`);
  console.log(`이름 충돌(같은 이름의 왕복코스가 이미 있음) ${plan.filter((p) => p.nameConflict).length}개`);
  console.log('\n예시:');
  for (const p of plan.slice(0, 8)) {
    console.log(`  ${p.before.name} → ${p.after.name}`);
    console.log(`    거리 ${p.before.distance}km → ${p.after.distance}km, 소요 ${p.before.duration}분 → ${p.after.duration}분, 좌표 ${p.before.path_coordinates.length} → ${p.after.path_coordinates.length}`);
  }

  if (!APPLY) {
    console.log('\n미리보기만 했습니다. 반영하려면 --apply');
    return;
  }

  const backup = path.join(DIR, `backup-roundtrip-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.json`);
  fs.writeFileSync(backup, JSON.stringify(plan.map((p) => p.before)));
  console.log(`\n백업: ${backup}`);

  let ok = 0;
  for (const p of plan) {
    if (p.nameConflict) {
      console.log(`  건너뜀(이름 충돌): ${p.before.name}`);
      continue;
    }
    const res = await fetch(`${URL_}/rest/v1/trails?id=eq.${p.before.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ ...p.after, updated_at: new Date().toISOString() }),
    });
    if (res.ok) ok++;
    else console.log(`  실패: ${p.before.name} HTTP ${res.status} ${await res.text()}`);
  }
  console.log(`반영 완료 ${ok}개`);
})();
