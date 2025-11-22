import { supabase } from '@/lib/supabase/client';

export interface Feedback {
  id: string;
  user_id: string | null;
  email: string | null;
  category: 'bug' | 'feature' | 'question' | 'improvement' | 'other';
  title: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackData {
  category: Feedback['category'];
  title: string;
  message: string;
  email?: string;  // 비로그인 사용자용
}

/**
 * 피드백 제출
 */
export async function createFeedback(data: CreateFeedbackData): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const feedbackData: any = {
      category: data.category,
      title: data.title,
      message: data.message,
      status: 'new',
    };

    // 로그인한 사용자
    if (user) {
      feedbackData.user_id = user.id;
    } else {
      // 비로그인 사용자는 이메일 필수
      if (!data.email) {
        return { success: false, error: '이메일을 입력해주세요.' };
      }
      feedbackData.email = data.email;
    }

    const { error } = await supabase
      .from('feedback')
      .insert([feedbackData]);

    if (error) {
      console.error('Feedback creation error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Feedback creation error:', error);
    return { success: false, error: '피드백 전송 중 오류가 발생했습니다.' };
  }
}

/**
 * 내 피드백 목록 조회
 */
export async function getMyFeedback(): Promise<Feedback[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
}

/**
 * 모든 피드백 조회 (관리자용)
 */
export async function getAllFeedback(): Promise<Feedback[]> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all feedback:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return [];
  }
}

/**
 * 피드백 상태 업데이트 (관리자용)
 */
export async function updateFeedbackStatus(
  id: string,
  status: Feedback['status'],
  adminNote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = { status };
    if (adminNote !== undefined) {
      updateData.admin_note = adminNote;
    }

    const { error } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating feedback:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating feedback:', error);
    return { success: false, error: '피드백 업데이트 중 오류가 발생했습니다.' };
  }
}

/**
 * 사용자 role 확인
 */
export async function getUserRole(): Promise<'user' | 'admin' | 'moderator' | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }

    return data?.role || 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user';
  }
}

/**
 * 관리자 권한 확인
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin' || role === 'moderator';
}
