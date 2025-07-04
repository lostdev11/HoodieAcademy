'use client';

import { useState } from 'react';

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
}

export default function VideoPlayer({ videoId, title, className = "" }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-cyan-400 mb-2">{title}</h3>
      )}
      <div className="relative w-full aspect-video bg-slate-800 rounded-lg overflow-hidden border border-cyan-500/30">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="text-cyan-400 animate-pulse">Loading video...</div>
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title || "Video Player"}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
} 