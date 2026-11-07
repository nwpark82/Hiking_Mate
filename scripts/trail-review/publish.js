// 신뢰도 판정 결과를 DB 공개 여부에 반영
// usage:
//   node scripts/trail-review/publish.js           # 미리보기 (DB 변경 없음)
//   node scripts/trail-review/publish.js --apply   # 반영 (변경 전 공개 상태 백업)
//
// 전제: SQL 20261108000001_trail_publish_status.sql 실행,
//       reliability.js 실행 (왕복 전환 후라면 export → analyze_v2 → reliability 를 다시 실행 권장)
require('dotenv').config({ path: '.env.local', quiet: true });
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const DIR = path.join(__dirname, '..', '..', 'data', 'trail-review');
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

(async () => {
  const rel = JSON.parse(fs.readFileSync(path.join(DIR, 'reliability.json'), 'utf8'));

  const res = await fetch(`${URL_}/rest/v1/trails?select=id,name,is_published,quality_status&limit=2000`, { headers });
  const current = await res.json();
  if (!Array.isArray(current)) {
    console.error('조회 실패 — SQL(20261108000001_trail_publish_status.sql)을 먼저 실행하세요:', current);
    process.exit(1);
  }
  const byId = Object.fromEntries(current.map((t) => [t.id, t]));

  // 왕복 전환 대상은 실제로 전환된 경우(시작점 = 끝점)에만 공개
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dist = (a, b) => {
    const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };
  let notConverted = 0;
  for (const r of rel.filter((x) => x.will_convert && x.reliable)) {
    const q = await fetch(`${URL_}/rest/v1/trails?select=path_coordinates&id=eq.${r.id}`, { headers });
    const p = (await q.json())[0]?.path_coordinates || [];
    if (!p.length || dist(p[0], p[p.length - 1]) > 100) {
      r.reliable = false;
      r.reasons.push('왕복 전환 미적용 (convert_roundtrip.js --apply 실행 필요)');
      notConverted++;
    }
  }
  if (notConverted) console.log(`왕복 전환이 아직 안 된 ${notConverted}개는 비공개로 둡니다.`);

  const changes = rel.filter((r) => byId[r.id] && byId[r.id].is_published !== r.reliable);
  console.log(`신뢰(공개) ${rel.filter((r) => r.reliable).length} / 비신뢰(비공개) ${rel.filter((r) => !r.reliable).length}`);
  console.log(`공개 상태가 바뀌는 등산로 ${changes.length}개 (공개→비공개 ${changes.filter((r) => !r.reliable).length}, 비공개→공개 ${changes.filter((r) => r.reliable).length})`);

  if (!APPLY) {
    console.log('미리보기만 했습니다. 반영하려면 --apply');
    return;
  }

  const backup = path.join(DIR, `backup-publish-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.json`);
  fs.writeFileSync(backup, JSON.stringify(current));
  console.log(`백업: ${backup}`);

  const now = new Date().toISOString();
  let ok = 0;
  for (const r of rel) {
    if (!byId[r.id]) continue;
    const body = {
      is_published: r.reliable,
      quality_status: r.reliable ? 'reliable' : 'unreliable',
      quality_note: r.reasons.join(' / ') || null,
      quality_checked_at: now,
    };
    const u = await fetch(`${URL_}/rest/v1/trails?id=eq.${r.id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
    if (u.ok) ok++;
    else console.log(`실패: ${r.name} HTTP ${u.status}`);
  }
  console.log(`반영 ${ok}개`);
})();
