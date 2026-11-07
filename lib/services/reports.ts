import { supabase } from '@/lib/supabase/client';

export type ReportTargetType = 'post' | 'comment' | 'user';

export const REPORT_REASONS = [
  '스팸/광고',
  '욕설/비방',
  '음란/선정적 내용',
  '개인정보 노출',
  '허위 정보',
  '기타',
] as const;

export async function createReport(
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
  description?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    // 같은 대상에 대한 중복 신고 방지
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error('이미 신고한 내용입니다.');
    }

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      description: description?.trim() || null,
    });

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}
