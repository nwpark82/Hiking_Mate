import { supabase } from '@/lib/supabase/client';

export async function getLikesCount(postId: string) {
  try {
    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error: any) {
    return { count: 0, error: error.message };
  }
}

export async function checkUserLiked(postId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

    return { liked: !!data, error: null };
  } catch (error: any) {
    return { liked: false, error: error.message };
  }
}

export async function toggleLike(postId: string, userId: string) {
  try {
    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) throw deleteError;

      return { liked: false, error: null };
    } else {
      // Like
      const { error: insertError } = await supabase.from('post_likes').insert({
        post_id: postId,
        user_id: userId,
      });

      if (insertError) throw insertError;

      return { liked: true, error: null };
    }
  } catch (error: any) {
    return { liked: false, error: error.message };
  }
}
