/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  experimental: {
    serverActions: {
      bodySizeLimit: '16mb'
    }
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

module.exports = nextConfig;