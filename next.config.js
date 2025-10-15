/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com', 'arweave.net'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // PERFORMANCE OPTIMIZATIONS
  swcMinify: true, // Use SWC for faster minification
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Enable React strict mode for better performance warnings
  reactStrictMode: true,
  // Optimize images
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com', 'arweave.net'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Reduce module resolution overhead
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
  // Skip building problematic demo pages
  async headers() {
    return [];
  },
  async redirects() {
    return [];
  },
  // Exclude tracking-demo from static export
  exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    // Remove tracking-demo from static generation
    const { '/tracking-demo': removed, ...paths } = defaultPathMap;
    return paths;
  },
}

module.exports = nextConfig