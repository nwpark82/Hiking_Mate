import { ImageResponse } from 'next/og';
import { getTrailById } from '@/lib/services/trails';

export const alt = '하이킹메이트 - 등산로 정보';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trail = await getTrailById(id);

  if (!trail) {
    // Fallback image if trail not found
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
          }}
        >
          하이킹메이트
        </div>
      ),
      { ...size }
    );
  }

  // Map difficulty to colors (handling Korean values)
  const difficultyColor =
    trail.difficulty === '초급' ? '#10B981' :
    trail.difficulty === '중급' ? '#3B82F6' :
    trail.difficulty === '고급' ? '#F59E0B' :
    trail.difficulty === '전문가' ? '#EF4444' : '#6B7280';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.3) 35px, rgba(255,255,255,.3) 70px)`,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginRight: '20px',
            }}
          >
            ⛰️
          </div>
          <div
            style={{
              fontSize: '32px',
              color: '#10B981',
              fontWeight: '600',
            }}
          >
            하이킹메이트
          </div>
        </div>

        {/* Trail Name */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '30px',
            lineHeight: 1.2,
            zIndex: 1,
          }}
        >
          {trail.name}
        </div>

        {/* Trail Info Grid */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            marginBottom: '40px',
            zIndex: 1,
          }}
        >
          {/* Distance */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.1)',
              padding: '24px 36px',
              borderRadius: '16px',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '8px',
              }}
            >
              거리
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              {trail.distance.toFixed(1)}km
            </div>
          </div>

          {/* Duration */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.1)',
              padding: '24px 36px',
              borderRadius: '16px',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '8px',
              }}
            >
              소요시간
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              {Math.floor(trail.duration / 60)}h {trail.duration % 60}m
            </div>
          </div>

          {/* Difficulty */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.1)',
              padding: '24px 36px',
              borderRadius: '16px',
              border: `2px solid ${difficultyColor}`,
            }}
          >
            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '8px',
              }}
            >
              난이도
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: difficultyColor,
              }}
            >
              {trail.difficulty}
            </div>
          </div>
        </div>

        {/* Location */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '28px',
            color: 'rgba(255,255,255,0.8)',
            marginTop: 'auto',
            zIndex: 1,
          }}
        >
          📍 {trail.region} · {trail.mountain}
        </div>
      </div>
    ),
    { ...size }
  );
}
