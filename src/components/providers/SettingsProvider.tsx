'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

interface GlobalSettings {
  site_maintenance: boolean;
  registration_enabled: boolean;
  course_submissions_enabled: boolean;
  bounty_submissions_enabled: boolean;
  chat_enabled: boolean;
  leaderboard_enabled: boolean;
  [key: string]: any;
}

interface FeatureFlags {
  [key: string]: boolean;
}

interface SettingsContextType {
  globalSettings: GlobalSettings;
  featureFlags: FeatureFlags;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultGlobalSettings: GlobalSettings = {
  site_maintenance: false,
  registration_enabled: true,
  course_submissions_enabled: true,
  bounty_submissions_enabled: true,
  chat_enabled: true,
  leaderboard_enabled: true,
};

const defaultFeatureFlags: FeatureFlags = {};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(defaultGlobalSettings);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(defaultFeatureFlags);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    // PERFORMANCE FIX: Add caching to prevent refetching on every mount
    const cachedSettings = typeof window !== 'undefined' ? sessionStorage.getItem('globalSettings') : null;
    const cachedFlags = typeof window !== 'undefined' ? sessionStorage.getItem('featureFlags') : null;
    const cacheTime = typeof window !== 'undefined' ? sessionStorage.getItem('settingsCacheTime') : null;
    
    // Use cached data if less than 5 minutes old
    if (cachedSettings && cacheTime) {
      const cacheAge = Date.now() - parseInt(cacheTime);
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        setGlobalSettings(JSON.parse(cachedSettings));
        if (cachedFlags) setFeatureFlags(JSON.parse(cachedFlags));
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const supabase = getSupabaseBrowser();
      
      // Fetch both in parallel instead of sequential
      const [settingsResult, flagsResult] = await Promise.all([
        supabase.from('global_settings').select('*').maybeSingle(),
        supabase.from('feature_flags').select('*')
      ]);

      if (settingsResult.error) {
        console.error('Error fetching global settings:', settingsResult.error);
        setGlobalSettings(defaultGlobalSettings);
      } else if (settingsResult.data) {
        setGlobalSettings(settingsResult.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('globalSettings', JSON.stringify(settingsResult.data));
        }
      }
      
      if (flagsResult.error) {
        console.error('Error fetching feature flags:', flagsResult.error);
        setFeatureFlags(defaultFeatureFlags);
      } else if (flagsResult.data) {
        const flags = flagsResult.data.reduce((acc: { [key: string]: boolean }, flag: any) => {
          if (flag && typeof flag === 'object' && flag.key) {
            acc[flag.key] = flag.enabled || false;
          }
          return acc;
        }, {});
        setFeatureFlags(flags);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('featureFlags', JSON.stringify(flags));
        }
      }
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('settingsCacheTime', Date.now().toString());
      }
    } catch (error) {
      console.error('Error:', error);
      setGlobalSettings(defaultGlobalSettings);
      setFeatureFlags(defaultFeatureFlags);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  const value: SettingsContextType = {
    globalSettings,
    featureFlags,
    isLoading,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Convenience hooks for specific settings
export function useMaintenanceMode() {
  const { globalSettings } = useSettings();
  return globalSettings.site_maintenance;
}

export function useFeatureFlag(flagKey: string) {
  const { featureFlags } = useSettings();
  return featureFlags[flagKey] || false;
}

export function useRegistrationEnabled() {
  const { globalSettings } = useSettings();
  return globalSettings.registration_enabled;
}

export function useCourseSubmissionsEnabled() {
  const { globalSettings } = useSettings();
  return globalSettings.course_submissions_enabled;
}

export function useBountySubmissionsEnabled() {
  const { globalSettings } = useSettings();
  return globalSettings.bounty_submissions_enabled;
}
