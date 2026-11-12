/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString();
  },
  async headers() {
    return [
      {
        source: '/analisis/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
