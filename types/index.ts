// Database types
export interface User {
  id: string;
  username: string;
  email: string;
  profile_image: string | null;
  bio: string | null;
  total_distance: number;
  total_duration: number;
  total_mountains: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Trail {
  id: string;
  name: string;
  mountain: string;
  region: string;
  difficulty: '초급' | '중급' | '고급' | '전문가';
  distance: number;
  duration: number;
  elevation_gain: number | null;
  max_altitude: number | null;
  start_latitude: number;
  start_longitude: number;
  path_coordinates: any;
  features: string[];
  health_benefits: string[];
  attractions: string[];
  warnings: string[];
  description: string | null;
  access_info: string | null;
  view_count: number;
  like_count: number;
  hike_count: number;
  created_at: string;
}

export interface Hike {
  id: string;
  user_id: string;
  trail_id: string | null;
  gpx_data: any;
  distance: number | null;
  duration: number | null;
  avg_pace: number | null;
  calories: number | null;
  photos: string[];
  notes: string | null;
  rating: number | null;
  weather: string | null;
  is_completed: boolean;
  is_public: boolean;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  trail_id: string | null;
  category: string;
  title: string;
  content: string;
  images: string[];
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  trail?: Trail;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Meetup {
  id: string;
  user_id: string;
  trail_id: string | null;
  title: string;
  description: string | null;
  meet_date: string;
  meet_time: string | null;
  max_participants: number | null;
  difficulty_level: string | null;
  contact_method: string | null;
  contact_info: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// GPS types
export interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  timestamp: number;
}

export interface HikeStats {
  distance: number;
  duration: number;
  avgSpeed: number;
  maxAltitude: number;
}
