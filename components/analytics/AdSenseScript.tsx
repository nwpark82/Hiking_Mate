'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdSenseScriptProps {
  clientId?: string;
}

export function AdSenseScript({ clientId }: AdSenseScriptProps) {
  const pathname = usePathname();
  const [shouldLoadAds, setShouldLoadAds] = useState(false);

  useEffect(() => {
    // AdSense를 로드하지 않을 경로들
    const excludedPaths = [
      '/auth/',           // 인증 관련 페이지
      '/test',            // 테스트 페이지
    ];

    // 로딩/에러 상태는 pathname으로 감지 불가하므로
    // 실제 광고 유닛 렌더링 시 콘텐츠 유무로 판단

    const isExcluded = excludedPaths.some(path => pathname.startsWith(path));
    setShouldLoadAds(!isExcluded && !!clientId);
  }, [pathname, clientId]);

  if (!shouldLoadAds) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
