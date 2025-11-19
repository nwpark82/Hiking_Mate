import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://hiking-mate.vercel.app';

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
