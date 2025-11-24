import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 서버 컴포넌트에서 사용할 Supabase 클라이언트
// Note: In Next.js 15+, cookies() is async but createServerComponentClient expects sync function
export const createServerSupabaseClient = () => {
  return createServerComponentClient({
    cookies: async () => await cookies()
  });
};
