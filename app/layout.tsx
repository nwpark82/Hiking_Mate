import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/react';
import { AdSenseScript } from '@/components/analytics/AdSenseScript';
import { Noto_Sans_KR } from 'next/font/google';
import "./globals.css";

// Font optimization
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap', // FOUT/FOIT 방지
  preload: true,
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: {
    default: "하이킹메이트 - 등산로 정보 & 커뮤니티",
    template: "%s | 하이킹메이트",
  },
  description: "전국 등산로 정보, GPS 산행 기록, 등산 커뮤니티. 나만의 등산 기록을 남기고 다른 등산객들과 정보를 공유하세요.",
  keywords: ["등산", "산행", "등산로", "GPS", "커뮤니티", "산", "트레킹", "하이킹", "등산 기록", "등산 정보"],
  authors: [{ name: "HikingMate Team" }],
  creator: "HikingMate",
  publisher: "HikingMate",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.hikingmate.co.kr",
    title: "하이킹메이트 - 등산로 정보 & 커뮤니티",
    description: "전국 663개 등산로 정보, GPS 산행 기록, 등산 커뮤니티. 나만의 등산 기록을 남기고 다른 등산객들과 정보를 공유하세요.",
    siteName: "하이킹메이트",
    images: [
      {
        url: "https://www.hikingmate.co.kr/og-image.png",
        width: 1200,
        height: 630,
        alt: "하이킹메이트 - 등산로 정보 & 커뮤니티",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "하이킹메이트 - 등산로 정보 & 커뮤니티",
    description: "전국 663개 등산로 정보, GPS 산행 기록, 등산 커뮤니티. 나만의 등산 기록을 남기고 다른 등산객들과 정보를 공유하세요.",
    images: ["https://www.hikingmate.co.kr/og-image.png"],
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
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://www.hikingmate.co.kr",
    languages: {
      'ko': 'https://www.hikingmate.co.kr/ko',
      'en': 'https://www.hikingmate.co.kr/en',
      'x-default': 'https://www.hikingmate.co.kr',
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#10B981',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  // JSON-LD structured data for website
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '하이킹메이트',
    alternateName: 'HikingMate',
    url: 'https://www.hikingmate.co.kr',
    description: '전국 등산로 정보, GPS 산행 기록, 등산 커뮤니티',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.hikingmate.co.kr/explore?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'ko-KR',
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '하이킹메이트',
    alternateName: 'HikingMate',
    url: 'https://www.hikingmate.co.kr',
    logo: 'https://www.hikingmate.co.kr/icon-512.svg',
    description: '전국 등산로 정보, GPS 산행 기록, 등산 커뮤니티 플랫폼',
    sameAs: [],
  };

  return (
    <html lang="ko" className={`${notoSansKR.variable} font-sans`} suppressHydrationWarning>
      <head>
        {/* Search Engine Verification */}
        <meta name="google-site-verification" content="QR3VcEuli9CbCjVQM6nxOchfxmKjwaARZRUD838ohvI" />
        <meta name="google-site-verification" content="xQ25wdTWhbrOBcB63lxctsqvbpe3DjKJ1ZiPt2athB0" />
        <meta name="naver-site-verification" content="b8c64384ae035e209858722340148f4bc24154f4" />
        <meta name="naver-site-verification" content="2b16b2d40651f45db4ff34ca78022a0f98a30772" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="하이킹메이트" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        {children}

        {/* Google AdSense - 조건부 로딩 */}
        <AdSenseScript clientId={ADSENSE_CLIENT_ID} />

        {/* Vercel Analytics */}
        <Analytics />

        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
