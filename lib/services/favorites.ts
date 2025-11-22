import { supabase } from '@/lib/supabase/client';

export interface Favorite {
  id: string;
  user_id: string;
  trail_id: string;
  created_at: string;
}

/**
 * Check if a trail is favorited by the current user
 */
export async function isFavorite(trailId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('trail_id', trailId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking favorite:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Failed to check favorite:', error);
    return false;
  }
}

/**
 * Add a trail to favorites
 */
export async function addFavorite(trailId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        trail_id: trailId,
      });

    if (error) {
      // Ignore duplicate errors (user already favorited)
      if (error.code === '23505') {
        return true;
      }
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return false;
  }
}

/**
 * Remove a trail from favorites
 */
export async function removeFavorite(trailId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('trail_id', trailId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return false;
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(trailId: string): Promise<boolean> {
  const currentlyFavorited = await isFavorite(trailId);

  if (currentlyFavorited) {
    return await removeFavorite(trailId);
  } else {
    return await addFavorite(trailId);
  }
}

/**
 * Get all favorite trails for the current user
 */
export async function getFavoriteTrails() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        trails (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Extract trails from the joined data
    return data?.map(fav => (fav as any).trails).filter(Boolean) || [];
  } catch (error) {
    console.error('Failed to fetch favorite trails:', error);
    return [];
  }
}

/**
 * Get favorite count for a trail
 */
export async function getFavoriteCount(trailId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('trail_id', trailId);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Failed to get favorite count:', error);
    return 0;
  }
}
