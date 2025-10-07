'use client';

import { ReactNode } from 'react';
import { SettingsProvider } from './SettingsProvider';
import GlobalAnnouncementBanner from '../GlobalAnnouncementBanner';

interface AppProviderProps {
  children: ReactNode;
  initialAnnouncements?: any[];
  initialGlobalSettings?: any;
  initialFeatureFlags?: any[];
}

export default function AppProvider({ 
  children, 
  initialAnnouncements = [],
  initialGlobalSettings = {},
  initialFeatureFlags = []
}: AppProviderProps) {
  // Convert array to FeatureFlags object format
  const featureFlags = initialFeatureFlags.reduce((acc: { [key: string]: boolean }, flag: any) => {
    if (flag && typeof flag === 'object' && flag.key) {
      acc[flag.key] = flag.enabled || false;
    }
    return acc;
  }, {});

  return (
    <SettingsProvider 
      initialGlobalSettings={initialGlobalSettings}
      initialFeatureFlags={featureFlags}
    >
      <div className="min-h-screen w-full overflow-x-hidden">
        <GlobalAnnouncementBanner initialAnnouncements={initialAnnouncements} />
        {children}
      </div>
    </SettingsProvider>
  );
}
