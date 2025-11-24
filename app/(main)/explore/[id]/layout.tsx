import { Metadata } from 'next';
import { getTrailById } from '@/lib/services/trails';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const trail = await getTrailById(params.id);

    if (!trail) {
      return {
        title: '등산로를 찾을 수 없습니다 | 하이킹메이트',
        description: '요청하신 등산로 정보가 존재하지 않습니다.',
      };
    }

    const title = `${trail.name} - ${trail.mountain} | 하이킹메이트`;
    const description = trail.description
      ? trail.description.substring(0, 160)
      : `${trail.mountain} ${trail.name} 등산로. 거리: ${trail.distance}km, 소요시간: ${Math.floor(trail.duration / 60)}시간 ${trail.duration % 60}분, 난이도: ${trail.difficulty}. 전국 663개 등산로 정보와 GPS 기록.`;

    const keywords = [
      trail.name,
      trail.mountain,
      `${trail.mountain} 등산`,
      `${trail.name} 등산로`,
      trail.region,
      trail.difficulty,
      '등산',
      '산행',
      '등산로',
      'GPS',
      '하이킹',
    ].filter(Boolean);

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: `https://www.hikingmate.co.kr/explore/${trail.id}`,
        type: 'website',
        siteName: '하이킹메이트',
        locale: 'ko_KR',
        images: [
          {
            url: `https://www.hikingmate.co.kr/explore/${trail.id}/opengraph-image`,
            width: 1200,
            height: 630,
            alt: `${trail.name} - ${trail.mountain}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`https://www.hikingmate.co.kr/explore/${trail.id}/opengraph-image`],
      },
      alternates: {
        canonical: `https://www.hikingmate.co.kr/explore/${trail.id}`,
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
  } catch (error) {
    console.error('Error generating metadata for trail:', error);
    return {
      title: '등산로 정보 | 하이킹메이트',
      description: '전국 등산로 정보를 확인하세요.',
    };
  }
}

export default function TrailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
