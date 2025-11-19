import { supabase } from '@/lib/supabase/client';

export async function signUp(email: string, password: string, username: string) {
  try {
    // 1. 이메일/비밀번호로 회원가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('회원가입에 실패했습니다.');

    // 2. users 테이블에 프로필 생성
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      username: username,
    });

    if (profileError) throw profileError;

    return { user: authData.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}
