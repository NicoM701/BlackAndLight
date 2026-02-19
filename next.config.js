/** @type {import('next').NextConfig} */
const nextConfig = {
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
