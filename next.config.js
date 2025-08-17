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
};

module.exports = nextConfig; 