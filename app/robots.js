const BASE_URL = 'https://equaty.es';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin']
      }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`
  };
}
