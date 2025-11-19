# Account Deletion RPC Function

이 문서는 계정 삭제 기능을 위한 Supabase RPC 함수 설정 가이드입니다.

## 문제점

현재 `lib/services/users.ts`의 `deleteAccount()` 함수는 `users` 테이블의 프로필만 삭제하고, `auth.users`의 인증 계정은 삭제하지 못합니다.

## 해결 방법

Supabase에서 PostgreSQL 함수를 생성하여 사용자가 자신의 인증 계정을 삭제할 수 있도록 합니다.

## 설정 방법

### 1. Supabase Dashboard 접속

1. https://app.supabase.com 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2. SQL 실행

아래 SQL을 **SQL Editor**에 붙여넣고 실행하세요:

```sql
-- 사용자 계정 삭제 RPC 함수
-- 사용자가 자신의 auth.users 계정을 삭제할 수 있도록 허용

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- 현재 인증된 사용자 ID 가져오기
  current_user_id := auth.uid();

  -- 인증되지 않은 경우 에러
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- auth.users에서 사용자 삭제
  -- CASCADE에 의해 관련 데이터도 자동 삭제됨
  DELETE FROM auth.users WHERE id = current_user_id;

  -- 삭제 성공
  RETURN;
END;
$$;

-- 함수 권한 설정: 인증된 사용자만 호출 가능
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;
```

### 3. 함수 테스트 (선택)

SQL Editor에서 다음 쿼리로 함수가 생성되었는지 확인:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'delete_user';
```

## 작동 방식

1. 사용자가 설정 페이지에서 "계정 삭제" 버튼 클릭
2. "계정삭제" 문자열 입력 및 확인
3. `deleteAccount()` 함수 호출:
   - 먼저 `users` 테이블에서 프로필 삭제 (CASCADE로 관련 데이터 자동 삭제)
   - 그 다음 `delete_user()` RPC 호출로 `auth.users`에서 계정 삭제
4. 로그아웃 및 홈으로 리다이렉트

## 보안 고려사항

- **SECURITY DEFINER**: 함수가 생성자 권한으로 실행됨 (auth.users 접근 가능)
- **auth.uid() 검증**: 현재 인증된 사용자만 자신의 계정 삭제 가능
- **GRANT EXECUTE TO authenticated**: 인증된 사용자만 함수 호출 가능

## 관련 파일

- `lib/services/users.ts` - `deleteAccount()` 함수
- `app/(main)/settings/page.tsx` - 계정 삭제 UI

## CASCADE 삭제되는 데이터

`users` 테이블 삭제 시 다음 데이터가 자동 삭제됩니다:
- `posts` - 작성한 게시글
- `comments` - 작성한 댓글
- `likes` - 좋아요
- `tracking_sessions` - GPS 산행 기록
- `favorites` - 즐겨찾기
- Storage의 업로드된 이미지들 (수동 정리 필요)

## 주의사항

⚠️ **경고**: 이 작업은 되돌릴 수 없습니다!
- 사용자의 모든 데이터가 영구적으로 삭제됩니다
- 백업이 없으면 복구 불가능합니다

## 문제 해결

### 함수 실행 오류 시

```sql
-- 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS delete_user();

-- 위의 CREATE FUNCTION 다시 실행
```

### 권한 오류 시

```sql
-- 권한 다시 부여
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;
```

---

**마지막 업데이트**: 2025년 11월 19일
