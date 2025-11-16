'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CoverImageProps {
  src: string;
  alt: string;
}

export default function CoverImage({ src, alt }: CoverImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  const handleError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc('/images/classickong.png'); // Use placeholder on error
    }
  };

  return (
    <div className="relative w-full h-64 md:h-96 mb-8 rounded-xl overflow-hidden">
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 896px"
        className="object-cover scale-105"
        priority
        onError={handleError}
      />
    </div>
  );
}

