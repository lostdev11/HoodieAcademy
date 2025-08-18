'use client';

import Image from 'next/image';
import { CheckCircle } from 'lucide-react';

const isHttpUrl = (v?: string | null) => !!v && /^(https?:)?\/\//i.test(v);

export function ProfileAvatar({ pfpUrl, size = 96 }: { pfpUrl?: string | null; size?: number }) {
  const fallback = '/images/hoodie-academy-pixel-art-logo.png'; // Using your existing logo as fallback
  const showImage = isHttpUrl(pfpUrl);
  const src = showImage ? pfpUrl! : fallback;

  return (
    <div className="relative">
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
      
      {/* Current PFP indicator */}
      {showImage && (
        <div className="absolute -bottom-1 -right-1 bg-cyan-400 text-slate-900 rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
          <CheckCircle className="w-4 h-4" />
        </div>
      )}
      
      {/* Hover effect for NFT PFPs */}
      {showImage && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 rounded-full flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
            Current PFP
          </div>
        </div>
      )}
    </div>
  );
}
