import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// 관리자 영역은 항상 요청 시점에 권한을 확인
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

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
