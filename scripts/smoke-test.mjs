// 운영 사이트 핵심 흐름 자동 점검 (주간 GitHub Actions에서 실행)
// 사용법: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 환경변수 설정 후
//   node scripts/smoke-test.mjs
// 'smoketest_' 계정을 만들어 가입 → 글/댓글/좋아요/신고 → 권한 공격 차단 → 탈퇴를 확인하고,
// 실패 여부와 관계없이 마지막에 계정을 삭제함 (CASCADE로 테스트 데이터도 삭제)

import { randomBytes } from 'node:crypto';

const SITE = process.env.SITE_URL || 'https://www.hikingmate.co.kr';
const URL_ = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !ANON || !SERVICE) {
  console.error('SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');
  process.exit(1);
}

const serviceHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };
const userHeaders = (token) => ({
  apikey: ANON,
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
});

const results = [];
let failed = false;

async function check(name, fn) {
  try {
    await fn();
    results.push(`✅ ${name}`);
  } catch (error) {
    failed = true;
    results.push(`❌ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function rest(path, options = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

// ===== 1. 사이트 =====
for (const path of ['/', '/explore', '/community', '/blog', '/feedback']) {
  await check(`페이지 ${path}`, async () => {
    const res = await fetch(SITE + path);
    await res.arrayBuffer();
    assert(res.status === 200, `HTTP ${res.status}`);
  });
}

await check('사이트맵 등산로 100개 이상 (공개된 등산로만 포함)', async () => {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const count = (xml.match(/\/explore\//g) || []).length;
  assert(count >= 100, `${count}개`);
});

await check('DB 유지 크론 외부 호출 차단', async () => {
  const res = await fetch(`${SITE}/api/keep-alive`);
  await res.arrayBuffer();
  assert(res.status === 401, `HTTP ${res.status}`);
});

await check('관리자 페이지 비로그인 차단', async () => {
  const res = await fetch(`${SITE}/admin`, { redirect: 'manual' });
  await res.arrayBuffer();
  assert(res.status === 307 || res.status === 308, `HTTP ${res.status}`);
});

// ===== 2. 회원 흐름 =====
const suffix = randomBytes(4).toString('hex');
const email = `smoketest-${suffix}@hikingmate.co.kr`;
const password = `Smoke-${randomBytes(12).toString('hex')}`;
let userId = null;
let token = null;
let postId = null;

try {
  await check('가입 및 프로필 생성', async () => {
    const res = await fetch(`${URL_}/auth/v1/admin/users`, {
      method: 'POST',
      headers: serviceHeaders,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { username: `smoketest_${suffix}` },
      }),
    });
    const body = await res.json();
    assert(body.id, JSON.stringify(body));
    userId = body.id;

    await new Promise((r) => setTimeout(r, 1500));
    const profile = await rest(`users?select=role&id=eq.${userId}`, { headers: serviceHeaders });
    assert(profile.body?.[0]?.role === 'user', `프로필: ${JSON.stringify(profile.body)}`);
  });

  await check('로그인', async () => {
    const res = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    token = (await res.json()).access_token;
    assert(token, `HTTP ${res.status}`);
  });

  await check('보안: 자기 권한 상승 차단', async () => {
    const res = await rest(`users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: userHeaders(token),
      body: JSON.stringify({ role: 'admin' }),
    });
    assert(res.status === 403, `HTTP ${res.status}`);
  });

  await check('보안: 등산로 수정 차단', async () => {
    const trail = (await rest('trails?select=id,name&limit=1', { headers: serviceHeaders })).body[0];
    const res = await rest(`trails?select=id&id=eq.${trail.id}`, {
      method: 'PATCH',
      headers: userHeaders(token),
      body: JSON.stringify({ name: trail.name }),
    });
    assert(Array.isArray(res.body) && res.body.length === 0, `수정됨: HTTP ${res.status}`);
  });

  await check('보안: 공지 작성 차단', async () => {
    const res = await rest('posts', {
      method: 'POST',
      headers: userHeaders(token),
      body: JSON.stringify({ user_id: userId, title: 'smoketest', content: 'x', category: 'notice' }),
    });
    assert(res.status === 403, `HTTP ${res.status}`);
  });

  await check('게시글 작성', async () => {
    const res = await rest('posts?select=id', {
      method: 'POST',
      headers: userHeaders(token),
      body: JSON.stringify({ user_id: userId, title: '[자동 점검] 테스트 글', content: '자동 삭제됨', category: 'info' }),
    });
    assert(res.status === 201, `HTTP ${res.status} ${JSON.stringify(res.body)}`);
    postId = res.body[0].id;
  });

  await check('댓글/좋아요/신고', async () => {
    const comment = await rest('comments', {
      method: 'POST',
      headers: userHeaders(token),
      body: JSON.stringify({ post_id: postId, user_id: userId, content: '자동 점검 댓글' }),
    });
    assert(comment.status === 201, `댓글 HTTP ${comment.status}`);

    const like = await rest('likes', {
      method: 'POST',
      headers: userHeaders(token),
      body: JSON.stringify({ post_id: postId, user_id: userId }),
    });
    assert(like.status === 201, `좋아요 HTTP ${like.status}`);

    const report = await rest('reports', {
      method: 'POST',
      headers: userHeaders(token),
      body: JSON.stringify({ reporter_id: userId, target_type: 'post', target_id: postId, reason: '기타' }),
    });
    assert(report.status === 201, `신고 HTTP ${report.status}`);
  });

  await check('커뮤니티 목록 조회 (댓글/좋아요 수)', async () => {
    const res = await rest(
      `posts?select=id,likes:likes(count),comments:comments(count)&id=eq.${postId}`,
      { headers: { apikey: ANON } }
    );
    const post = res.body?.[0];
    assert(post?.likes?.[0]?.count === 1 && post?.comments?.[0]?.count === 1, JSON.stringify(res.body));
  });

  await check('조회수 증가', async () => {
    const res = await rest('rpc/increment_post_view', {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_post_id: postId }),
    });
    assert(res.status === 204 || res.status === 200, `HTTP ${res.status}`);
    const view = await rest(`posts?select=view_count&id=eq.${postId}`, { headers: serviceHeaders });
    assert(view.body?.[0]?.view_count === 1, JSON.stringify(view.body));
  });

  await check('회원 탈퇴 (데이터 삭제 포함)', async () => {
    const res = await rest('rpc/delete_user', { method: 'POST', headers: userHeaders(token), body: '{}' });
    assert(res.status === 204 || res.status === 200, `HTTP ${res.status}`);
    const left = await rest(`posts?select=id&id=eq.${postId}`, { headers: serviceHeaders });
    assert(Array.isArray(left.body) && left.body.length === 0, '게시글이 남아 있음');
    const auth = await fetch(`${URL_}/auth/v1/admin/users/${userId}`, { headers: serviceHeaders });
    assert(auth.status === 404, `계정이 남아 있음 (HTTP ${auth.status})`);
    userId = null;
  });
} finally {
  // 실패 시에도 테스트 계정 정리
  if (userId) {
    await fetch(`${URL_}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: serviceHeaders });
  }
}

console.log(results.join('\n'));
if (failed) {
  console.error('\n일부 점검이 실패했습니다.');
  process.exit(1);
}
console.log('\n모든 점검 통과');
// 열린 HTTP 연결이 남아 있어도 바로 종료
process.exit(0);
