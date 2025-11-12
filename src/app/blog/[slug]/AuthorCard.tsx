'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Twitter } from 'lucide-react';

export default function AuthorCard() {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState('/images/founders/Kong.jpg');
  const [shouldUnoptimize, setShouldUnoptimize] = useState(false);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent('Kong')}&background=amber&color=000&size=64`);
      setShouldUnoptimize(false);
    }
  };

  return (
    <a
      href="https://x.com/kongnificent_"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-200 group backdrop-blur-sm"
    >
      <div className="relative flex-shrink-0 overflow-hidden ring-2 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all w-14 h-14 rounded-full">
        <Image
          src={imageSrc}
          alt="Kong"
          fill
          className="object-cover"
          unoptimized={shouldUnoptimize}
          onError={handleImageError}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">
          Kong
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Founder</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Twitter className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-400 transition-colors" />
          <p className="text-xs text-gray-400 truncate group-hover:text-amber-400/80 transition-colors">
            @kongnificent_
          </p>
        </div>
        <p className="text-xs text-gray-300 mt-2 leading-relaxed">
          Simplifying Web3 for the next generation of builders and traders.
        </p>
      </div>
    </a>
  );
}

