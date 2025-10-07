'use client';

import { useEffect, useRef } from 'react';
import { simpleWalletTracker } from '@/lib/simple-wallet-tracker';

/**
 * Simple wallet tracking hook that adds minimal tracking to existing wallet connections
 * This is completely non-intrusive and won't affect your current wallet connection flow
 */
export function useSimpleWalletTracking(walletAddress: string | null) {
  const hasTrackedRef = useRef<boolean>(false);
  const lastWalletRef = useRef<string | null>(null);

  useEffect(() => {
    // Only track if wallet is connected and we haven't tracked this wallet yet
    if (walletAddress && !hasTrackedRef.current && lastWalletRef.current !== walletAddress) {
      // Track wallet connection in the background (non-blocking)
      simpleWalletTracker.trackWalletConnection(walletAddress, {
        page_url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString()
      }).catch(error => {
        // Silently handle errors - don't let tracking affect wallet connection
        console.warn('Wallet tracking failed (non-blocking):', error);
      });

      hasTrackedRef.current = true;
      lastWalletRef.current = walletAddress;
    }

    // Reset tracking flag when wallet disconnects
    if (!walletAddress && lastWalletRef.current) {
      hasTrackedRef.current = false;
      lastWalletRef.current = null;
    }
  }, [walletAddress]);

  return {
    trackWalletConnection: (address: string, metadata?: any) => 
      simpleWalletTracker.trackWalletConnection(address, metadata),
    getUserData: (address: string) => simpleWalletTracker.getUserData(address),
    updateUser: (address: string, updates: any) => simpleWalletTracker.updateUser(address, updates),
    addXP: (address: string, amount: number, source?: string) => 
      simpleWalletTracker.addXP(address, amount, source)
  };
}
