import { ImageResponse } from 'next/og';

// Image metadata
export const alt = '하이킹메이트 - 전국 등산로 정보 & GPS 산행 기록';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
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
            opacity: 0.1,
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.3) 35px, rgba(255,255,255,.3) 70px)`,
          }}
        />

        {/* Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            zIndex: 1,
          }}
        >
          {/* Icon/Logo */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '30px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                fontSize: '64px',
                display: 'flex',
              }}
            >
              ⛰️
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '20px',
              textAlign: 'center',
              letterSpacing: '-2px',
              textShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            하이킹메이트
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '36px',
              color: 'rgba(255,255,255,0.95)',
              marginBottom: '30px',
              textAlign: 'center',
              fontWeight: '500',
            }}
          >
            전국 등산로 정보 & GPS 산행 기록
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '60px',
              marginTop: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.2)',
                padding: '20px 40px',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                663개
              </div>
              <div
                style={{
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: '8px',
                }}
              >
                등산로
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.2)',
                padding: '20px 40px',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                GPS
              </div>
              <div
                style={{
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: '8px',
                }}
              >
                산행 기록
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.2)',
                padding: '20px 40px',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                무료
              </div>
              <div
                style={{
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: '8px',
                }}
              >
                서비스
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '24px',
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          www.hikingmate.co.kr
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
