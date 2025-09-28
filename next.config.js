/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep ONLY ONE config file (next.config.js). Delete any next.config.mjs/ts.
  trailingSlash: true, // remove if you don't need trailing slashes
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'arweave.net' },
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: 'nftstorage.link' },
      { protocol: 'https', hostname: 'cf-ipfs.com' },
      { protocol: 'https', hostname: 'shdw-drive.genesysgo.net' },
      { protocol: 'https', hostname: '**.dweb.link' },
    ],
    // leave optimization ON (default)
  },
  env: {
    NEXT_PUBLIC_HELIUS_API_KEY: process.env.NEXT_PUBLIC_HELIUS_API_KEY,
  },
  // Temporary redirect for T100 course until database slug is fixed
  async redirects() {
    return [
      {
        source: '/courses/ab647c24-8554-4bc5-a275-53456bc0851e',
        destination: '/courses/t100-chart-literacy',
        permanent: false,
      },
      {
        source: '/courses/ab647c24-8554-4bc5-a275-53456bc0851e/',
        destination: '/courses/t100-chart-literacy/',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig; 