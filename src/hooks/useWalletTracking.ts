'use client';

import { useEffect, useCallback } from 'react';
import { logWalletConnect, logWalletDisconnect } from '@/lib/tracking/client';
import { UseWalletTrackingOptions } from '@/types/tracking';

/**
 * Hook for tracking wallet connection events
 * Automatically logs wallet connect/disconnect events
 */
export function useWalletTracking(options: UseWalletTrackingOptions) {
  const { walletAddress, sessionId, autoStart = true } = options;

  const logConnect = useCallback(async (address: string) => {
    const result = await logWalletConnect(address, sessionId || undefined);
    if (!result.success) {
      console.error('Failed to log wallet connect:', result.error);
    }
  }, [sessionId]);

  const logDisconnect = useCallback(async (address: string) => {
    const result = await logWalletDisconnect(address, sessionId || undefined);
    if (!result.success) {
      console.error('Failed to log wallet disconnect:', result.error);
    }
  }, [sessionId]);

  // Auto-log wallet connect when wallet address changes
  useEffect(() => {
    if (autoStart && walletAddress) {
      logConnect(walletAddress);
    }
  }, [walletAddress, autoStart, logConnect]);

  return {
    logConnect,
    logDisconnect
  };
}