import { supabase } from '@/lib/supabase/client';
import type { Blog, CreateBlogInput } from './blog.types';

// Client-side functions for admin
export async function createBlog(input: CreateBlogInput) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { blog: null, error: new Error('Not authenticated') };
  }

  // Generate slug from title
  const { data: slugData, error: slugError } = await supabase
    .rpc('generate_slug', { title: input.title });

  if (slugError) {
    return { blog: null, error: slugError };
  }

  const { data, error } = await supabase
    .from('blogs')
    .insert({
      ...input,
      slug: slugData,
      author_id: user.id,
      tags: input.tags || [],
      published: input.published ?? false,
    })
    .select()
    .single();

  return { blog: data as Blog | null, error };
}

export async function getBlogById(id: string) {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .single();

  return { blog: data as Blog | null, error };
}

export async function updateBlog(id: string, input: CreateBlogInput) {
  const { data, error } = await supabase
    .from('blogs')
    .update({
      ...input,
      tags: input.tags || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return { blog: data as Blog | null, error };
}

export async function deleteBlog(id: string) {
  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', id);

  return { error };
}

export async function getMyBlogs() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { blogs: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  return { blogs: data as Blog[] | null, error };
}
