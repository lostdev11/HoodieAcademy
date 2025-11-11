'use client';

import { useState } from 'react';
import Image from 'next/image';

interface BlogCardImageProps {
  src: string;
  alt: string;
}

export default function BlogCardImage({ src, alt }: BlogCardImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  const handleError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc('/images/classickong.png'); // Use placeholder on error
    }
  };

  return (
    <div className="relative w-full h-48">
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className="object-cover"
        onError={handleError}
      />
    </div>
  );
}

