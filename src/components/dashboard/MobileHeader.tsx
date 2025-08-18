'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Home } from 'lucide-react';
import Link from 'next/link';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  profileImage?: string;
  title?: string;
  showHomeButton?: boolean;
}

export function MobileHeader({ onOpenSidebar, profileImage = "🧑‍🎓", title, showHomeButton = true }: MobileHeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [userProfileImage, setUserProfileImage] = useState<string>(profileImage);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    // Load saved profile image
    const savedProfileImage = typeof window !== 'undefined' ? localStorage.getItem('userProfileImage') : null;
    if (savedProfileImage) {
      setUserProfileImage(savedProfileImage);
    }
  }, []);

  return (
    <div className="lg:hidden bg-slate-800/90 backdrop-blur-md border-b border-cyan-500/30 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Home button or title */}
        <div className="flex items-center space-x-3">
          {showHomeButton && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-2"
            >
              <Link href="/">
                <Home className="w-5 h-5" />
              </Link>
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          )}
        </div>

        {/* Center - Time display */}
        <div className="text-center">
          <div className="text-xs text-gray-400">Current Time</div>
          <div className="text-sm text-cyan-400 font-mono">{currentTime}</div>
        </div>

        {/* Right side - Profile button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSidebar}
          className="p-2 hover:bg-slate-700/50 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-lg flex items-center justify-center text-sm font-medium">
            {userProfileImage}
          </div>
        </Button>
      </div>
    </div>
  );
}
