/** @type {import('next').NextConfig} */

// The FastAPI backend (backend/) origin. Server components read this directly;
// the rewrite below proxies browser calls to it so the client stays same-origin
// (no CORS surface, backend host never shipped to the browser).
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:8000';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.mixkit.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
