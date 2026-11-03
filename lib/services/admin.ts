import { supabase } from '@/lib/supabase/client';

// 관리자 전용 기능. 권한 검사는 DB(RLS, is_admin 함수)에서 수행됨

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'moderator';
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  posts_count: number;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'comment' | 'user';
  target_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalUsers: number;
  newUsers7d: number;
  totalPosts: number;
  newFeedback: number;
  pendingReports: number;
}

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export async function getAdminStats(): Promise<AdminStats> {
  const count = async (query: PromiseLike<{ count: number | null }>) =>
    (await query).count || 0;

  const [totalUsers, newUsers7d, totalPosts, newFeedback, pendingReports] = await Promise.all([
    count(supabase.from('users').select('*', { count: 'exact', head: true })),
    count(
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', daysAgo(7))
    ),
    count(supabase.from('posts').select('*', { count: 'exact', head: true })),
    count(
      supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
    ),
    count(
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'reviewing'])
    ),
  ]);

  return { totalUsers, newUsers7d, totalPosts, newFeedback, pendingReports };
}

export async function listUsers() {
  const { data, error } = await supabase.rpc('admin_list_users');
  return { users: (data as AdminUser[] | null) || [], error: error?.message || null };
}

export async function setUserBan(userId: string, banned: boolean) {
  const { error } = await supabase.rpc('admin_set_user_ban', {
    p_user_id: userId,
    p_banned: banned,
  });
  return { error: error?.message || null };
}

export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  return { reports: (data as Report[] | null) || [], error: error?.message || null };
}

export async function updateReport(id: string, status: Report['status'], adminNote?: string) {
  const update: Partial<Report> = { status };
  if (adminNote !== undefined) update.admin_note = adminNote;

  const { error } = await supabase.from('reports').update(update).eq('id', id);
  return { error: error?.message || null };
}

export async function deleteReportedContent(targetType: 'post' | 'comment', targetId: string) {
  const table = targetType === 'post' ? 'posts' : 'comments';
  const { error } = await supabase.from(table).delete().eq('id', targetId);
  return { error: error?.message || null };
}
