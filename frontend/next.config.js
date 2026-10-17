/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    if (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes('127.0.0.1') && !process.env.BACKEND_URL.includes('localhost')) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_URL}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
