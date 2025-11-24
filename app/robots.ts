import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.hikingmate.co.kr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/reset-password',
          '/profile/edit',
          '/settings',
          '/record/active',
          '/record/save',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
