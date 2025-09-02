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
  initialGlobalSettings?: GlobalSettings;
  initialFeatureFlags?: FeatureFlags;
}

export function SettingsProvider({ 
  children, 
  initialGlobalSettings = defaultGlobalSettings,
  initialFeatureFlags = defaultFeatureFlags
}: SettingsProviderProps) {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(initialGlobalSettings);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(initialFeatureFlags);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching global settings:', error);
        // Use default settings if table doesn't exist or has permission issues
        setGlobalSettings(defaultGlobalSettings);
        return;
      }

      setGlobalSettings(data);
    } catch (error) {
      console.error('Error:', error);
      // Use default settings on any error
      setGlobalSettings(defaultGlobalSettings);
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
