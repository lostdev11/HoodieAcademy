'use client';

import { useState } from 'react';

interface VideoPlayerProps {
  videoId?: string;
  videoUrl?: string;
  title?: string;
  className?: string;
}

export default function VideoPlayer({ videoId, videoUrl, title, className = "" }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Extract video ID from YouTube URL if provided
  const getVideoId = () => {
    if (videoId) return videoId;
    if (videoUrl) {
      // Handle different YouTube URL formats
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
      ];
      
      for (const pattern of patterns) {
        const match = videoUrl.match(pattern);
        if (match) return match[1];
      }
    }
    return null;
  };

  const extractedVideoId = getVideoId();
  const isYouTubeVideo = extractedVideoId && (videoUrl?.includes('youtube') || videoUrl?.includes('youtu.be'));

  if (!extractedVideoId && !videoUrl) {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative w-full aspect-video bg-slate-800 rounded-lg overflow-hidden border border-cyan-500/30 flex items-center justify-center">
          <div className="text-cyan-400">No video available</div>
        </div>
      </div>
    );
  }

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
        
        {isYouTubeVideo ? (
          <iframe
            src={`https://www.youtube.com/embed/${extractedVideoId}?rel=0&modestbranding=1`}
            title={title || "Video Player"}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <video
            src={videoUrl}
            controls
            className="w-full h-full"
            onLoadedData={() => setIsLoading(false)}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
} 