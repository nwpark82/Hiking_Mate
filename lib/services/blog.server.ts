import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Blog } from './blog.types';

// Server-side functions only
export async function getAllBlogs(publishedOnly = true) {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });

  if (publishedOnly) {
    query = query.eq('published', true);
  }

  const { data, error } = await query;

  return { blogs: data as Blog[] | null, error };
}

export async function getBlogBySlug(slug: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  // Increment view count
  if (data) {
    await supabase
      .from('blogs')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);
  }

  return { blog: data as Blog | null, error };
}

export async function getBlogsByCategory(category: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('category', category)
    .eq('published', true)
    .order('created_at', { ascending: false });

  return { blogs: data as Blog[] | null, error };
}
