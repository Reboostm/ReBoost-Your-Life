/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  swcMinify: true,
  experimental: {
    vercelToolbarEnabled: false,
  },
};

export default nextConfig;
