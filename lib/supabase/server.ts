import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// 서버 컴포넌트에서 사용할 Supabase 클라이언트 (로그인 세션 포함)
// Note: In Next.js 15+, cookies() is async but createServerComponentClient expects sync function,
// so the cookie store is resolved first and passed in synchronously
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();
  return createServerComponentClient({
    cookies: () => cookieStore as any,
  });
};

// 공개 데이터 조회용 클라이언트 (세션 없음, 사이트맵 등 정적 생성에 사용)
export const createPublicSupabaseClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
