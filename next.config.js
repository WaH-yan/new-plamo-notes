/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure we can use the public directory for static assets
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig