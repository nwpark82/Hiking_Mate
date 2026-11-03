import { ImageResponse } from 'next/og';
import { getBlogPostBySlug } from '@/lib/blog';

export const alt = '하이킹메이트 블로그';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // 공개 블로그는 content/blog 마크다운 파일 기준
  const blog = getBlogPostBySlug(slug);

  if (!blog) {
    // Fallback image
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
          하이킹메이트 블로그
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Green Header Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            width: '100%',
            height: '140px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 60px',
          }}
        >
          <div
            style={{
              fontSize: '40px',
              marginRight: '20px',
            }}
          >
            ⛰️
          </div>
          <div
            style={{
              fontSize: '32px',
              color: 'white',
              fontWeight: '600',
            }}
          >
            하이킹메이트 블로그
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            background: 'white',
          }}
        >
          {/* Category Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#10B981',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '24px',
              fontSize: '22px',
              fontWeight: '600',
              marginBottom: '30px',
              alignSelf: 'flex-start',
            }}
          >
            {blog.category}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '24px',
              lineHeight: 1.2,
              display: 'flex',
              maxHeight: '280px',
              overflow: 'hidden',
            }}
          >
            {blog.title}
          </div>

          {/* Meta Info */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              fontSize: '22px',
              color: '#6B7280',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              ✍️ {blog.author}
            </div>
            {blog.tags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                🏷️ {blog.tags.slice(0, 3).join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Accent */}
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
