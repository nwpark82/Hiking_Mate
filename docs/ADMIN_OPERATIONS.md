# 관리자 운영 가이드

하이킹메이트(www.hikingmate.co.kr) 운영자를 위한 문서입니다. 비밀값 자체는 이 문서에 적지 않습니다(공개 저장소).

## 1. 관리자 화면 (`/admin`)

관리자(`role = 'admin'`) 계정으로 로그인 → 우측 상단 메뉴 → **관리자**

| 화면 | 경로 | 기능 |
|---|---|---|
| 대시보드 | `/admin` | 회원/게시글/미처리 피드백·신고 수, Supabase 사용량, 최근 가입 |
| 회원 관리 | `/admin/users` | 검색, 정지/해제, 권한 변경(일반/운영자/관리자) |
| 피드백 관리 | `/admin/feedback` | 상태 변경, 답변 작성(작성자의 문의하기 화면에 표시) |
| 신고 관리 | `/admin/reports` | 신고 내용 확인, 상태 변경, 게시글/댓글 삭제 |
| 콘텐츠 관리 | `/admin/content` | 게시글/댓글 검색·삭제, 공지 작성 |
| 등산로 관리 | `/admin/trails` | 이름·난이도·거리·소요시간·설명·교통·주의사항 수정 |
| 작업 기록 | `/admin/logs` | 삭제·정지·권한 변경·등산로 수정 이력(자동 기록) |
| 블로그 관리 | `/admin/blog` | DB 블로그 (현재 사이트 미노출) |

- 공지는 관리자만 작성할 수 있으며 커뮤니티 '전체' 탭 상단에 고정됩니다.
- 권한 변경은 `admin`만 가능하고, 자기 자신의 권한은 바꿀 수 없습니다.
- 블로그 공식 소스는 `content/blog/*.md` 파일입니다(커밋 → 자동 배포).

## 2. 알림 (Discord)

| 알림 | 발생 위치 | 설정 위치 |
|---|---|---|
| 신규 가입 / 피드백 / 신고 / 새 게시글 | DB 트리거 | Supabase `private.app_settings` 의 `discord_webhook_url` |
| DB 상태 점검 실패 (매일 18:00 KST) | `/api/keep-alive` | Vercel 환경변수 `DISCORD_WEBHOOK_URL` |
| 주간 백업 실패 / 주간 자동 점검 실패 | GitHub Actions | GitHub secret `DISCORD_WEBHOOK_URL` |

웹훅 URL 변경 시 위 세 곳을 모두 바꿉니다. DB 쪽은 SQL Editor에서:

```sql
INSERT INTO private.app_settings (key, value)
VALUES ('discord_webhook_url', '새_웹훅_URL')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

## 3. 비밀값 위치

| 이름 | 위치 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | 사이트 ↔ DB 연결 |
| `CRON_SECRET` | Vercel | `/api/keep-alive` 외부 호출 차단 |
| `DISCORD_WEBHOOK_URL` | Vercel, GitHub secrets | 장애/백업 실패 알림 |
| `SUPABASE_DB_URL` | GitHub secrets | 주간 백업 (Session pooler 연결 문자열) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | GitHub secrets | 주간 자동 점검 (테스트 계정 생성/삭제) |
| `BACKUP_PASSPHRASE` | GitHub secrets + **별도 안전한 곳에 보관** | 백업 암호화/복호화. 분실 시 백업 복원 불가 |
| 서비스 키 (`SUPABASE_SERVICE_ROLE_KEY`) | 로컬 `.env.local` | 데이터 스크립트용. 절대 커밋/공유 금지 |

## 4. DB 변경 이력 (SQL Editor에서 순서대로 실행됨)

| 파일 | 내용 |
|---|---|
| `supabase/migrations/20261103000000_security_hardening.sql` | role 권한 상승 차단, 블로그 관리자 전용, 작성자 위조 차단 |
| `supabase/migrations/20261103000001_admin_ops.sql` | 회원 탈퇴 함수, Discord 알림, 회원 목록/정지 함수 |
| `supabase/migrations/20261107000000_admin_infra.sql` | 작업 기록, 권한 변경, 공지, 조회수, 등산로 수정, 비로그인 문의, 사용량 |
| `supabase/migrations/20261107000001_fix_trails_update_policy.sql` | 일반 회원의 등산로 수정 권한 제거, 등산로 조회수 함수 |
| `supabase/migrations/20261108000000_skip_smoketest_notify.sql` | 자동 점검 계정(`smoketest_`) 활동은 Discord 알림 제외 |

모든 파일은 여러 번 실행해도 안전하도록 작성되어 있습니다.

## 5. 백업과 복원

- **자동 백업**: 매주 월요일 03:00 (KST), GitHub → Actions → **DB Backup** (수동 실행: Run workflow)
- 결과물: 암호화된 `hikingmate-YYYYMMDD.dump.gpg` (Artifacts, 90일 보관)
- 범위: `public`, `private`, `auth` 스키마 (회원 계정 포함). 업로드된 이미지 파일은 포함되지 않음

**복원 (필요할 때만)**

```bash
# 1) Actions 실행 결과 페이지에서 Artifact(zip) 다운로드 후 압축 해제
# 2) 복호화
gpg --decrypt --output backup.dump hikingmate-YYYYMMDD.dump.gpg   # BACKUP_PASSPHRASE 입력
# 3) 내용 확인 (복원 전 목록만 보기)
pg_restore --list backup.dump | head
# 4) 특정 테이블만 복원하는 예 (대상 DB 연결 문자열 사용)
pg_restore --data-only --table=posts --dbname "$TARGET_DB_URL" backup.dump
```

전체 복원은 기존 데이터를 덮어쓸 수 있으므로 새 Supabase 프로젝트에 먼저 복원해 확인한 뒤 진행합니다.

## 6. 주간 자동 점검

- 매주 월요일 09:00 (KST), GitHub → Actions → **Smoke Test** (수동 실행 가능)
- `smoketest_` 임시 계정으로 확인 후 탈퇴(테스트 데이터 자동 삭제)
  - 주요 페이지 응답, 사이트맵 등산로 수, 크론/관리자 페이지 보호
  - 가입 → 로그인 → 글/댓글/좋아요/신고 → 커뮤니티 목록 → 조회수 → 탈퇴
  - 보안: 권한 상승, 등산로 수정, 공지 작성이 일반 회원에게 막혀 있는지
- 실패 시 Discord 알림. 로컬 실행: `SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/smoke-test.mjs`

## 7. 성과 지표 (GA4)

https://analytics.google.com → 하이킹메이트 속성

| 지표 | 의미 | 보는 곳 |
|---|---|---|
| 주간 사용자 | 서비스 규모 | 보고서 → 개요 |
| 검색 유입 비율 | SEO 성과 (핵심 성장 경로) | 보고서 → 획득 → 트래픽 획득 → `Organic Search` |
| 등산로 상세 조회 | 핵심 콘텐츠 소비 | 보고서 → 참여도 → 이벤트 → `view_trail` |
| 많이 본 등산로 | 콘텐츠 보강 우선순위 | `view_trail` 이벤트 → 이벤트 라벨 |
| 가입 전환 | 방문 → 회원 | 이벤트 `sign_up` ÷ 사용자 수 |
| 커뮤니티 참여 | 활성 회원 | 이벤트 `create_post` |

- 수집 중인 이벤트: `view_trail`(등산로 상세), `sign_up`(가입), `login`(로그인), `create_post`(게시글 작성)
- GA4 관리 → 이벤트에서 `sign_up`, `create_post` 를 **주요 이벤트(전환)** 로 표시하면 보고서에서 바로 확인 가능
- 검색어별 노출/클릭은 Google Search Console → 실적에서 확인

## 8. 정기 점검

**매주**
- Discord 알림 확인, `/admin` 에서 미처리 피드백·신고 처리
- GitHub Actions에서 DB Backup / Smoke Test 성공 여부 확인
- GA4 주간 사용자·검색 유입·많이 본 등산로 확인

**매월**
- `/admin` 사용량 확인 (DB 500MB / 파일 1GB 무료 한도, 80% 넘으면 정리 또는 유료 전환 검토)
- `npm audit --omit=dev` 로 보안 취약점 확인, Next.js 패치 업데이트
- Google Search Console / 네이버 서치어드바이저 색인 상태 확인

## 9. 후순위 과제

- 이메일 발송 서버(SMTP, 예: Resend) 연결 — 가입자 증가 시 인증 메일 누락 방지
- 가입 추이·인기 등산로 통계 차트
- 블로그 웹 에디터 통합(현재는 마크다운 파일 커밋 방식)
- 외부 가동 감시(UptimeRobot 등) — Vercel 자체 장애 감지용
