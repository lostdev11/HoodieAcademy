'use client';

import { ReactNode } from 'react';
import { SettingsProvider } from './SettingsProvider';
import { QueryProvider } from './QueryProvider';
import GlobalAnnouncementBanner from '../GlobalAnnouncementBanner';
import { Toaster } from '@/components/ui/toaster';

interface AppProviderProps {
  children: ReactNode;
}

export default function AppProvider({ children }: AppProviderProps) {
  // PERFORMANCE FIX: Removed server-side data fetching that was blocking every page load
  // All data now loads client-side with proper caching
  
  return (
    <QueryProvider>
      <SettingsProvider>
        <div className="min-h-screen w-full overflow-x-hidden">
          <GlobalAnnouncementBanner />
          {children}
          {/* Toast notification system - displays XP notifications and other toasts */}
          <Toaster />
        </div>
      </SettingsProvider>
    </QueryProvider>
  );
}
