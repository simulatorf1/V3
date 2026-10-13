const BASE_URL = 'https://v3-rho-weld.vercel.app';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/']
      }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`
  };
}
