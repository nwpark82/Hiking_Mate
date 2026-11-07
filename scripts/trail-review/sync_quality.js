// 분석 결과(판정 상세)를 DB trails.quality_detail 에 저장 → 관리자 화면에서 확인
// 공개 여부(is_published)는 바꾸지 않음 (공개 반영은 publish.js)
// usage:
//   node scripts/trail-review/sync_quality.js           # 미리보기
//   node scripts/trail-review/sync_quality.js --apply   # 저장
// 전제: SQL 20261108000002_trail_quality_detail.sql 실행, analyze_v2.js · reliability.js 실행
require('dotenv').config({ path: '.env.local', quiet: true });
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const DIR = path.join(__dirname, '..', '..', 'data', 'trail-review');
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const v2 = JSON.parse(fs.readFileSync(path.join(DIR, 'analysis_v2.json'), 'utf8'));
const rel = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(DIR, 'reliability.json'), 'utf8')).map((r) => [r.id, r]));
const analyzedAt = fs.statSync(path.join(DIR, 'analysis_v2.json')).mtime.toISOString();

const details = v2.map((r) => ({
  id: r.id,
  detail: {
    verdict: r.verdict,
    fix: r.fix || [],
    reasons: r.reasons || [],
    start: r.start || null,
    start_hint: r.start_hint || null,
    end: r.end || null,
    end_hint: r.end_hint || null,
    start_end_m: r.start_end_m ?? null,
    gap_count: r.gap_count ?? 0,
    gap_fillable: r.gap_fillable ?? 0,
    max_gap_m: r.max_gap_m ?? 0,
    big_gap_causes: r.big_gap_causes || {},
    fill_sources: r.fill_sources || '',
    repeat3_share: r.repeat3_share ?? 0,
    alt_spikes: r.alt_spikes ?? 0,
    alt_spike_causes: r.alt_spike_causes || {},
    est_min: rel[r.id]?.est_min ?? null,
    duration_ratio: rel[r.id]?.duration_ratio ?? null,
    will_convert: rel[r.id]?.will_convert ?? false,
    reliability_reasons: rel[r.id]?.reasons || [],
    analyzed_at: analyzedAt,
  },
}));

(async () => {
  const count = (v) => details.filter((d) => d.detail.verdict === v).length;
  console.log(`저장 대상 ${details.length}개 (사용 가능 ${count('USABLE')} / 보정 가능 ${count('FIXABLE')} / 사용 불가 ${count('UNUSABLE')})`);
  if (!APPLY) {
    console.log('미리보기만 했습니다. 저장하려면 --apply');
    return;
  }

  // 여러 건을 동시에 보내 시간 단축 (10개씩)
  let ok = 0;
  for (let i = 0; i < details.length; i += 10) {
    const batch = details.slice(i, i + 10);
    const results = await Promise.all(
      batch.map((d) =>
        fetch(`${URL_}/rest/v1/trails?id=eq.${d.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ quality_detail: d.detail }),
        })
      )
    );
    results.forEach((res, k) => {
      if (res.ok) ok++;
      else console.log(`실패: ${batch[k].id} HTTP ${res.status}`);
    });
    if (i === 0 && ok === 0) {
      console.error('저장 실패 — SQL(20261108000002_trail_quality_detail.sql)을 먼저 실행하세요.');
      process.exit(1);
    }
  }
  console.log(`저장 ${ok}개`);
})();
