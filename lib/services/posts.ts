import { supabase } from '@/lib/supabase/client';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  images?: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
  users?: {
    username: string;
    avatar_url?: string;
  };
  likes_count?: number;
  comments_count?: number;
}

export async function getPosts(category?: string, limit = 20, offset = 0) {
  try {
    let query = supabase
      .from('posts')
      .select(
        `
        *,
        users:user_id (username, avatar_url),
        likes:post_likes(count),
        comments:post_comments(count)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform the data to include counts
    const posts = data?.map((post: any) => ({
      ...post,
      likes_count: post.likes?.[0]?.count || 0,
      comments_count: post.comments?.[0]?.count || 0,
    }));

    return { posts, total: count, error: null };
  } catch (error: any) {
    return { posts: null, total: 0, error: error.message };
  }
}

export async function getPost(id: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        users:user_id (username, avatar_url)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase
      .from('posts')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id);

    return { post: data, error: null };
  } catch (error: any) {
    return { post: null, error: error.message };
  }
}

export async function createPost(
  userId: string,
  title: string,
  content: string,
  category: string,
  images?: string[]
) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title,
        content,
        category,
        images: images || [],
      })
      .select()
      .single();

    if (error) throw error;

    return { post: data, error: null };
  } catch (error: any) {
    return { post: null, error: error.message };
  }
}

export async function updatePost(
  postId: string,
  userId: string,
  title: string,
  content: string,
  category: string,
  images?: string[]
) {
  try {
    // Check if user owns the post
    const { data: post, error: checkError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (checkError) throw checkError;
    if (post.user_id !== userId) throw new Error('권한이 없습니다.');

    const { data, error } = await supabase
      .from('posts')
      .update({
        title,
        content,
        category,
        images: images || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    return { post: data, error: null };
  } catch (error: any) {
    return { post: null, error: error.message };
  }
}

export async function deletePost(postId: string, userId: string) {
  try {
    // Check if user owns the post
    const { data: post, error: checkError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (checkError) throw checkError;
    if (post.user_id !== userId) throw new Error('권한이 없습니다.');

    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function searchPosts(query: string, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        users:user_id (username, avatar_url)
      `
      )
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { posts: data, error: null };
  } catch (error: any) {
    return { posts: null, error: error.message };
  }
}
