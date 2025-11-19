# 회원가입 문제 해결 가이드

## 🔍 문제 진단

회원가입이 실패하는 주요 원인:
1. **이메일 확인 필수 설정**: 이메일 확인 전까지 `auth.uid()`가 null
2. **타이밍 이슈**: Auth 사용자 생성과 프로필 생성 사이의 시간차
3. **RLS 정책 적용 시점**: 세션이 완전히 설정되기 전에 INSERT 시도

---

## ✅ 해결책 1: Database Trigger 사용 (권장)

가장 안정적인 방법은 Database Trigger를 사용하여 Auth 사용자가 생성될 때 자동으로 프로필을 생성하는 것입니다.

### Supabase SQL Editor에서 실행:

```sql
-- 1. 기존 트리거 및 함수 삭제 (있다면)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. 새 사용자 생성 시 자동으로 프로필 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 3. Auth 사용자 생성 시 트리거 실행
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 함수 실행 권한 부여
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
```

### 앱 코드 수정:

트리거를 사용하면 코드가 훨씬 단순해집니다:

```typescript
// lib/services/auth.ts
export async function signUp(email: string, password: string, username: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username, // 트리거에서 사용
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('회원가입에 실패했습니다.');

    // 프로필은 트리거가 자동으로 생성하므로 별도 INSERT 불필요!
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}
```

---

## ✅ 해결책 2: 이메일 확인 비활성화 (개발 중)

개발 단계에서는 이메일 확인을 비활성화하는 것이 편리합니다.

### Supabase Dashboard 설정:

```
1. Supabase Dashboard 접속
2. Authentication → Settings
3. Email 섹션
4. "Enable email confirmations" → OFF
5. Save
```

---

## ✅ 해결책 3: RLS 정책 수정 (대안)

트리거를 사용하지 않는다면, RLS 정책을 임시로 우회할 수 있습니다:

```sql
-- users 테이블에 대한 임시 INSERT 정책 (개발용)
DROP POLICY IF EXISTS "Allow public signup" ON users;

CREATE POLICY "Allow public signup"
  ON users
  FOR INSERT
  WITH CHECK (true);  -- 모든 INSERT 허용
```

**⚠️ 주의**: 프로덕션에서는 사용하지 마세요! 보안 문제가 발생할 수 있습니다.

---

## 🧪 테스트 순서

### 1단계: Database Trigger 생성
- 위의 SQL을 Supabase SQL Editor에서 실행

### 2단계: 코드 수정
- `lib/services/auth.ts` 파일 수정 (아래 참고)

### 3단계: 이메일 확인 비활성화 (선택)
- Supabase Dashboard에서 설정

### 4단계: 회원가입 테스트
```
1. 새 이메일로 회원가입 시도
2. 성공 시 자동으로 users 테이블에 레코드 생성 확인
3. 로그인 가능 여부 확인
```

---

## 🔍 디버깅 방법

### Supabase SQL Editor에서 확인:

```sql
-- 1. Auth 사용자 확인
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Users 테이블 확인
SELECT id, username, created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. 트리거 동작 확인
SELECT
  a.id,
  a.email,
  u.username,
  CASE
    WHEN u.id IS NULL THEN '프로필 없음 ❌'
    ELSE '프로필 생성됨 ✅'
  END as status
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.id
ORDER BY a.created_at DESC
LIMIT 5;
```

---

## 📝 추가 팁

### 회원가입 시 추가 정보 저장:

```typescript
// 회원가입 시 더 많은 정보 저장
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      username: username,
      full_name: fullName,    // 추가 정보
      avatar_url: '',         // 기본값
    }
  }
});
```

트리거에서 이 정보를 활용:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    username,
    full_name,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## ⚠️ 주의사항

1. **트리거 사용 시**:
   - 앱 코드에서 users 테이블 INSERT 제거
   - metadata로 username 전달 필수

2. **이메일 확인 비활성화 시**:
   - 프로덕션에서는 반드시 활성화
   - 스팸 가입 방지 필요

3. **RLS 정책**:
   - 트리거는 SECURITY DEFINER로 실행되어 RLS 우회
   - 안전하고 권장되는 방법

---

## 🚀 권장 설정 (최종)

```
✅ Database Trigger 사용
✅ 이메일 확인 개발 중에는 OFF (프로덕션에서는 ON)
✅ RLS 정책 유지
✅ 앱 코드에서 users 테이블 INSERT 제거
```

이 방법이 가장 안정적이고 Supabase 공식 권장 방법입니다!
