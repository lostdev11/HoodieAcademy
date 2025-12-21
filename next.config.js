/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Explicitly set the workspace root to silence the multiple lockfiles warning
  outputFileTracingRoot: path.join(__dirname),
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Server external packages (moved from experimental)
  serverExternalPackages: ['@supabase/supabase-js'],
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
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Enable React strict mode for better performance warnings
  reactStrictMode: true,
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
      },
      {
        protocol: 'https',
        hostname: 'wifhoodie.s3.eu-north-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'mchwxspjjgyboshzqrsd.supabase.co',
      },
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
          // CSP temporarily removed to debug mobile loading issues
          // Will re-add with more permissive settings once mobile is confirmed working
        ],
      },
    ];
  },
  // Webpack configuration to ignore problematic files
  webpack: (config, { webpack }) => {
    // Ignore problematic files in node_modules using IgnorePlugin
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /node_modules\/thread-stream\/.*\.(md|txt|zip|sh|test\.ts|LICENSE)$/,
      })
    );

    return config;
  },
}

module.exports = nextConfig