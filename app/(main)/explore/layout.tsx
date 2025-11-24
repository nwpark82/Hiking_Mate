import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '등산로 탐색',
  description:
    '전국 663개 등산로를 난이도별, 지역별로 검색하고 탐색해보세요. GPS 경로, 소요시간, 난이도 정보를 확인하고 나에게 맞는 등산 코스를 찾아보세요.',
  keywords: [
    '등산로검색',
    '등산로추천',
    '등산난이도',
    '등산경로',
    '산행코스',
    '등산',
    '산행',
    '등산정보',
    'GPS등산',
    '등산지도',
    '산행기록',
  ],
  openGraph: {
    title: '등산로 탐색 | 하이킹메이트',
    description: '전국 663개 등산로를 검색하고 탐색해보세요. GPS 경로, 소요시간, 난이도 정보 제공.',
    url: 'https://www.hikingmate.co.kr/explore',
    type: 'website',
    siteName: '하이킹메이트',
    locale: 'ko_KR',
    images: [
      {
        url: 'https://www.hikingmate.co.kr/og-image.png',
        width: 1200,
        height: 630,
        alt: '하이킹메이트 - 등산로 탐색',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '등산로 탐색 | 하이킹메이트',
    description: '전국 663개 등산로를 검색하고 탐색해보세요.',
    images: ['https://www.hikingmate.co.kr/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.hikingmate.co.kr/explore',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
