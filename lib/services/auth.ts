import { supabase } from '@/lib/supabase/client';

export async function signUp(email: string, password: string, username: string) {
  try {
    // Database trigger가 자동으로 users 테이블에 프로필 생성
    // metadata로 username 전달
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('회원가입에 실패했습니다.');

    return { user: data.user, error: null };
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
    // Get base URL from environment variable or window.location
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/reset-password`,
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
