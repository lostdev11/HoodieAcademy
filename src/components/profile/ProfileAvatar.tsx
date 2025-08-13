'use client';

import Image from 'next/image';

export function ProfileAvatar({ pfpUrl, size = 96 }: { pfpUrl?: string | null; size?: number }) {
  const fallback = '/images/hoodie-academy-pixel-art-logo.png'; // Using your existing logo as fallback
  const src = pfpUrl || fallback;

  return (
    <div className="rounded-full ring-2 ring-yellow-500/40 overflow-hidden" style={{ width: size, height: size }}>
      {/* next/image is fine if the URL is public; for Arweave/IPFS, consider an image proxy */}
      <Image src={src} alt="Profile picture" width={size} height={size} className="object-cover" />
    </div>
  );
}
