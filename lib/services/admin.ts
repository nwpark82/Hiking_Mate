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

export async function setUserRole(userId: string, role: AdminUser['role']) {
  const { error } = await supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: role });
  return { error: error?.message || null };
}

// ===== 콘텐츠 관리 =====

export interface AdminPost {
  id: string;
  title: string;
  category: string;
  created_at: string;
  view_count: number;
  users?: { username: string } | null;
}

export interface AdminComment {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  users?: { username: string } | null;
}

export async function listPosts(search = '') {
  let query = supabase
    .from('posts')
    .select('id, title, category, created_at, view_count, users:user_id (username)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (search.trim()) query = query.ilike('title', `%${search.trim()}%`);

  const { data, error } = await query;
  return { posts: (data as unknown as AdminPost[] | null) || [], error: error?.message || null };
}

export async function listRecentComments(search = '') {
  let query = supabase
    .from('comments')
    .select('id, post_id, content, created_at, users:user_id (username)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (search.trim()) query = query.ilike('content', `%${search.trim()}%`);

  const { data, error } = await query;
  return { comments: (data as unknown as AdminComment[] | null) || [], error: error?.message || null };
}

export async function deleteContent(type: 'post' | 'comment', id: string) {
  const { error } = await supabase.from(type === 'post' ? 'posts' : 'comments').delete().eq('id', id);
  return { error: error?.message || null };
}

// ===== 등산로 관리 =====

export const TRAIL_DIFFICULTIES = ['초급', '중급', '고급', '전문가'] as const;

export interface AdminTrail {
  id: string;
  name: string;
  mountain: string;
  region: string;
  difficulty: string;
  distance: number;
  duration: number;
  description: string | null;
  access_info: string | null;
  warnings: string[] | null;
  updated_at: string | null;
  is_published: boolean;
  quality_status: 'reliable' | 'unreliable' | null;
  quality_note: string | null;
}

const TRAIL_FIELDS =
  'id, name, mountain, region, difficulty, distance, duration, description, access_info, warnings, updated_at, is_published, quality_status, quality_note';

export type TrailPublishFilter = 'all' | 'published' | 'hidden';

export async function searchTrails(search: string, filter: TrailPublishFilter = 'all') {
  const keyword = search.trim().replace(/[,()]/g, ' ');
  let query = supabase.from('trails').select(TRAIL_FIELDS).order('name').limit(50);
  if (keyword) query = query.or(`name.ilike.%${keyword}%,mountain.ilike.%${keyword}%`);
  if (filter !== 'all') query = query.eq('is_published', filter === 'published');

  const { data, error } = await query;
  return { trails: (data as AdminTrail[] | null) || [], error: error?.message || null };
}

export async function getTrail(id: string) {
  const { data, error } = await supabase.from('trails').select(TRAIL_FIELDS).eq('id', id).single();
  return { trail: data as AdminTrail | null, error: error?.message || null };
}

export async function updateTrail(
  id: string,
  input: Pick<
    AdminTrail,
    'name' | 'difficulty' | 'distance' | 'duration' | 'description' | 'access_info' | 'warnings' | 'is_published'
  >
) {
  const { data, error } = await supabase
    .from('trails')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');

  if (!error && (!data || data.length === 0)) {
    return { error: '수정 권한이 없습니다. DB 관리자 설정(SQL)이 적용되었는지 확인하세요.' };
  }
  return { error: error?.message || null };
}

// ===== 작업 기록 / 사용량 =====

export interface AdminLog {
  id: string;
  admin_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, any>;
  created_at: string;
}

export async function getAdminLogs() {
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  return { logs: (data as AdminLog[] | null) || [], error: error?.message || null };
}

export interface AdminUsage {
  db_bytes: number;
  storage_bytes: number;
  storage_files: number;
  trails: number;
  comments: number;
  tracking_sessions: number;
}

export async function getUsage() {
  const { data, error } = await supabase.rpc('admin_usage');
  return { usage: data as AdminUsage | null, error: error?.message || null };
}
