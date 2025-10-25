'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWalletSupabase } from './use-wallet-supabase';

interface DisplayNameState {
  displayName: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Global display name management hook
 * Provides synchronized display name across all components
 */
export function useDisplayName() {
  const [state, setState] = useState<DisplayNameState>({
    displayName: null,
    isLoading: true,
    error: null
  });
  
  const { wallet } = useWalletSupabase();

  // Load display name from multiple sources
  const loadDisplayName = useCallback(async (walletAddress: string) => {
    if (!walletAddress) {
      setState({ displayName: null, isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First, check localStorage for quick access (but don't set as final yet)
      const cachedName = localStorage.getItem('userDisplayName');
      if (cachedName) {
        setState(prev => ({ ...prev, displayName: cachedName, isLoading: false }));
      }

      // Then fetch from database for accuracy
      const response = await fetch(`/api/users/track?wallet=${walletAddress}&t=${Date.now()}`, {
        cache: 'no-store'
      });

      if (response.ok) {
        const userData = await response.json();
        const dbDisplayName = userData?.user?.display_name;
        
        console.log('🔍 [DISPLAY NAME] Fetched user data:', userData);
        console.log('🔍 [DISPLAY NAME] Database display name:', dbDisplayName);
        
        if (dbDisplayName) {
          // Database has a display name - use it and update localStorage
          localStorage.setItem('userDisplayName', dbDisplayName);
          setState({
            displayName: dbDisplayName,
            isLoading: false,
            error: null
          });
          console.log('✅ [DISPLAY NAME] Using database display name:', dbDisplayName);
        } else {
          // No display name in database, use cached or fallback
          const finalName = cachedName || `User ${walletAddress.slice(0, 6)}...`;
          setState({
            displayName: finalName,
            isLoading: false,
            error: null
          });
          console.log('⚠️ [DISPLAY NAME] No database display name, using fallback:', finalName);
        }
      } else {
        // API failed, use cached or fallback
        const fallbackName = cachedName || `User ${walletAddress.slice(0, 6)}...`;
        setState({
          displayName: fallbackName,
          isLoading: false,
          error: 'Failed to fetch display name from database'
        });
      }
    } catch (error) {
      console.error('Error loading display name:', error);
      const fallbackName = localStorage.getItem('userDisplayName') || 
                          (walletAddress ? `User ${walletAddress.slice(0, 6)}...` : null);
      setState({
        displayName: fallbackName,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);

  // Update display name globally
  const updateDisplayName = useCallback((newDisplayName: string) => {
    // Update localStorage immediately for instant UI update
    localStorage.setItem('userDisplayName', newDisplayName);
    
    // Update state
    setState(prev => ({
      ...prev,
      displayName: newDisplayName,
      error: null
    }));

    // Trigger storage event for other tabs/components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'userDisplayName',
      newValue: newDisplayName,
      oldValue: state.displayName || null
    }));
  }, [state.displayName]);

  // Load display name when wallet changes
  useEffect(() => {
    if (wallet) {
      loadDisplayName(wallet);
    } else {
      setState({ displayName: null, isLoading: false, error: null });
    }
  }, [wallet, loadDisplayName]);

  // Listen for storage changes (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userDisplayName' && e.newValue !== null) {
        setState(prev => ({
          ...prev,
          displayName: e.newValue,
          error: null
        }));
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail?.key === 'userDisplayName' && e.detail?.newValue) {
        setState(prev => ({
          ...prev,
          displayName: e.detail.newValue,
          error: null
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('displayNameUpdated', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('displayNameUpdated', handleCustomStorageChange as EventListener);
    };
  }, []);

  // Refresh display name from database
  const refreshDisplayName = useCallback(() => {
    if (wallet) {
      loadDisplayName(wallet);
    }
  }, [wallet, loadDisplayName]);

  return {
    displayName: state.displayName,
    isLoading: state.isLoading,
    error: state.error,
    updateDisplayName,
    refreshDisplayName
  };
}

/**
 * Hook for components that only need to read display name
 * (lighter weight than useDisplayName)
 */
export function useDisplayNameReadOnly() {
  const { displayName, isLoading, error } = useDisplayName();
  return { displayName, isLoading, error };
}
