'use client';

import Image from 'next/image';

const isHttpUrl = (v?: string | null) => !!v && /^(https?:)?\/\//i.test(v);

export function ProfileAvatar({ pfpUrl, size = 96 }: { pfpUrl?: string | null; size?: number }) {
  const fallback = '/images/hoodie-academy-pixel-art-logo.png'; // Using your existing logo as fallback
  const showImage = isHttpUrl(pfpUrl);
  const src = showImage ? pfpUrl! : fallback;

  return (
    <div className="rounded-full ring-2 ring-yellow-500/40 overflow-hidden" style={{ width: size, height: size }}>
      {showImage ? (
        // Only use Next.js Image for valid HTTP URLs
        <Image src={src} alt="Profile picture" width={size} height={size} className="object-cover" />
      ) : (
        // Show emoji or fallback for non-URL values
        <div 
          className="w-full h-full flex items-center justify-center text-2xl bg-slate-700"
          style={{ fontSize: `${size * 0.4}px` }}
        >
          {pfpUrl && !isHttpUrl(pfpUrl) ? pfpUrl : '🧑‍🎓'}
        </div>
      )}
    </div>
  );
}
