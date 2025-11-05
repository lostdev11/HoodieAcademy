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
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Redirects for SEO: Normalize www to non-www and HTTP to HTTPS
  // Note: These are handled by middleware, but added here as backup
  // The middleware handles dynamic redirects based on the request
  async redirects() {
    return [
      // Redirect www to non-www (handled by middleware, but here as fallback)
      // Note: Middleware handles this dynamically, so this may not be needed
      // but it's here as a backup for edge cases
    ];
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
    domains: [
      'images.unsplash.com', 
      'via.placeholder.com', 
      'arweave.net',
      'wifhoodie.s3.eu-north-1.amazonaws.com'
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Reduce module resolution overhead
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
}

module.exports = nextConfig