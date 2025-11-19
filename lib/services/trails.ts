import { supabase } from '@/lib/supabase/client';
import type { Trail } from '@/types';

export interface TrailFilters {
  search?: string;
  difficulty?: string;
  region?: string;
  minDistance?: number;
  maxDistance?: number;
  sortBy?: 'popular' | 'distance' | 'recent';
}

export async function getTrails(filters: TrailFilters = {}) {
  try {
    let query = supabase
      .from('trails')
      .select('*');

    // 검색어 필터
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,mountain.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // 난이도 필터
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    // 지역 필터
    if (filters.region) {
      query = query.eq('region', filters.region);
    }

    // 거리 필터
    if (filters.minDistance !== undefined) {
      query = query.gte('distance', filters.minDistance);
    }
    if (filters.maxDistance !== undefined) {
      query = query.lte('distance', filters.maxDistance);
    }

    // 정렬
    switch (filters.sortBy) {
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'distance':
        query = query.order('distance', { ascending: true });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching trails:', error);
      throw error;
    }

    return data as Trail[];
  } catch (error) {
    console.error('Failed to fetch trails:', error);
    return [];
  }
}

export async function getTrailById(id: string) {
  try {
    const { data, error } = await supabase
      .from('trails')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // 조회수 증가
    await incrementViewCount(id);

    return data as Trail;
  } catch (error) {
    console.error('Failed to fetch trail:', error);
    return null;
  }
}

export async function incrementViewCount(trailId: string) {
  try {
    const { error } = await supabase.rpc('increment_view_count', {
      table_name: 'trails',
      row_id: trailId
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to increment view count:', error);
  }
}

export async function getPopularTrails(limit: number = 5) {
  try {
    const { data, error } = await supabase
      .from('trails')
      .select('*')
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data as Trail[];
  } catch (error) {
    console.error('Failed to fetch popular trails:', error);
    return [];
  }
}

export async function searchTrails(searchTerm: string) {
  try {
    const { data, error } = await supabase
      .from('trails')
      .select('*')
      .textSearch('search_vector', searchTerm, {
        type: 'websearch',
        config: 'simple'
      })
      .limit(20);

    if (error) throw error;

    return data as Trail[];
  } catch (error) {
    console.error('Failed to search trails:', error);
    return [];
  }
}
