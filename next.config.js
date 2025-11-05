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
      'wifhoodie.s3.eu-north-1.amazonaws.com',
      'ui-avatars.com'
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
  // Headers for mobile browser compatibility (especially Phantom mobile)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Allow Phantom wallet injection - critical for mobile
          // More permissive CSP for Phantom mobile browser compatibility
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://phantom.app https://*.phantom.app https:",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https:",
              "connect-src 'self' https: wss: ws:",
              "frame-src 'self' https://phantom.app https://*.phantom.app https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig