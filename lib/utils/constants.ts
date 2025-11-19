// App constants
export const APP_NAME = '하이킹메이트';
export const APP_DESCRIPTION = '등산로 정보 + 커뮤니티 + GPS 기록';

// Difficulty levels
export const DIFFICULTY_LEVELS = ['초급', '중급', '고급', '전문가'] as const;

// Post categories
export const POST_CATEGORIES = ['자유', '후기', '질문', '장비', '정보'] as const;

// Regions
export const REGIONS = [
  '서울',
  '경기',
  '인천',
  '강원',
  '충북',
  '충남',
  '대전',
  '세종',
  '전북',
  '전남',
  '광주',
  '경북',
  '경남',
  '대구',
  '울산',
  '부산',
  '제주',
] as const;

// Routes
export const ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  RECORD: '/record',
  COMMUNITY: '/community',
  TRAILS: '/trails',
  POSTS: '/posts',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  LOGIN: '/login',
  SIGNUP: '/signup',
} as const;
