/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: 'arweave.net' },
      { protocol: 'https', hostname: 'nftstorage.link' },
      { protocol: 'https', hostname: '**.dweb.link' },
      { protocol: 'https', hostname: '**.cf-ipfs.com' },
    ],
  },
};

export default nextConfig; 