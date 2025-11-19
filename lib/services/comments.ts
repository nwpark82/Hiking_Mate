import { supabase } from '@/lib/supabase/client';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  users?: {
    username: string;
    avatar_url?: string;
  };
}

export async function getComments(postId: string) {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select(
        `
        *,
        users:user_id (username, avatar_url)
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { comments: data, error: null };
  } catch (error: any) {
    return { comments: null, error: error.message };
  }
}

export async function createComment(postId: string, userId: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
      })
      .select(
        `
        *,
        users:user_id (username, avatar_url)
      `
      )
      .single();

    if (error) throw error;

    return { comment: data, error: null };
  } catch (error: any) {
    return { comment: null, error: error.message };
  }
}

export async function updateComment(commentId: string, userId: string, content: string) {
  try {
    // Check if user owns the comment
    const { data: comment, error: checkError } = await supabase
      .from('post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (checkError) throw checkError;
    if (comment.user_id !== userId) throw new Error('권한이 없습니다.');

    const { data, error } = await supabase
      .from('post_comments')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select(
        `
        *,
        users:user_id (username, avatar_url)
      `
      )
      .single();

    if (error) throw error;

    return { comment: data, error: null };
  } catch (error: any) {
    return { comment: null, error: error.message };
  }
}

export async function deleteComment(commentId: string, userId: string) {
  try {
    // Check if user owns the comment
    const { data: comment, error: checkError } = await supabase
      .from('post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (checkError) throw checkError;
    if (comment.user_id !== userId) throw new Error('권한이 없습니다.');

    const { error } = await supabase.from('post_comments').delete().eq('id', commentId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}
