// App constants
export const APP_NAME = '하이킹메이트';
export const APP_DESCRIPTION = '등산로 정보 + 커뮤니티 + GPS 기록';

// Difficulty levels
export const DIFFICULTY_LEVELS = ['초급', '중급', '고급', '전문가'] as const;

// Post categories (커뮤니티)
export const POST_CATEGORIES = [
  { id: 'review', label: '후기', imageLimit: 5 },
  { id: 'question', label: '질문', imageLimit: 3 },
  { id: 'info', label: '정보', imageLimit: 3 },
  { id: 'companion', label: '동행찾기', imageLimit: 3 },
] as const;

// 카테고리별 이미지 업로드 제한
export const CATEGORY_IMAGE_LIMITS = {
  review: 5,      // 후기: 5장 (사진 중심)
  question: 3,    // 질문: 3장
  info: 3,        // 정보: 3장
  companion: 3,   // 동행찾기: 3장
} as const;

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
