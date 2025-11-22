// Google Analytics 4 설정

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// 페이지뷰 추적
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// 커스텀 이벤트 추적
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// 유용한 이벤트 헬퍼 함수
export const trackSignup = (method: string) => {
  event({
    action: 'sign_up',
    category: 'engagement',
    label: method,
  });
};

export const trackLogin = (method: string) => {
  event({
    action: 'login',
    category: 'engagement',
    label: method,
  });
};

export const trackTrailView = (trailId: string, trailName: string) => {
  event({
    action: 'view_trail',
    category: 'content',
    label: `${trailName} (${trailId})`,
  });
};

export const trackHikeStart = (trailId: string) => {
  event({
    action: 'start_hike',
    category: 'engagement',
    label: trailId,
  });
};

export const trackHikeComplete = (trailId: string, duration: number) => {
  event({
    action: 'complete_hike',
    category: 'engagement',
    label: trailId,
    value: Math.round(duration / 60), // 분 단위
  });
};
