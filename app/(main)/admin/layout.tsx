import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// 관리자 영역은 항상 요청 시점에 권한을 확인
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // auth-helpers는 동기 cookies()를 기대하므로 미리 읽어둔 쿠키 저장소를 전달
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({
    cookies: () => cookieStore as any,
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // admin 페이지는 관리자만 접근 가능 (DB의 RLS 정책과 함께 이중 보호)
  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return <>{children}</>;
}
