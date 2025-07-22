/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    unoptimized: false,
  },
  env: {
    NEXT_PUBLIC_HELIUS_API_KEY: process.env.NEXT_PUBLIC_HELIUS_API_KEY,
  },
  // Optimize for Vercel
  output: 'standalone',
  poweredByHeader: false,
}

module.exports = nextConfig 