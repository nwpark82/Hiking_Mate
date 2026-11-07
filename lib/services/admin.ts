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
  target_preview?: string | null;
  target_link?: string | null;
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

  const reports = (data as Report[] | null) || [];
  const idsOf = (type: Report['target_type']) =>
    reports.filter((r) => r.target_type === type).map((r) => r.target_id);

  // 신고 대상 내용 미리보기 (이미 삭제된 대상은 미리보기 없음)
  const [{ data: posts }, { data: comments }] = await Promise.all([
    supabase.from('posts').select('id, title').in('id', idsOf('post')),
    supabase.from('comments').select('id, post_id, content').in('id', idsOf('comment')),
  ]);

  const enriched = reports.map((report) => {
    if (report.target_type === 'post') {
      const post = posts?.find((p) => p.id === report.target_id);
      return { ...report, target_preview: post?.title ?? null, target_link: post ? `/community/${post.id}` : null };
    }
    if (report.target_type === 'comment') {
      const comment = comments?.find((c) => c.id === report.target_id);
      return {
        ...report,
        target_preview: comment?.content ?? null,
        target_link: comment ? `/community/${comment.post_id}` : null,
      };
    }
    return { ...report, target_preview: null, target_link: null };
  });

  return { reports: enriched, error: error?.message || null };
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
