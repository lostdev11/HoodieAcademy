'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDisplayNameWithSNS } from '@/services/sns-resolver';

interface UseSNSResolutionReturn {
  resolvedNames: Record<string, string>;
  resolveName: (walletAddress: string) => Promise<string>;
  resolveMultipleNames: (walletAddresses: string[]) => Promise<void>;
  isLoading: boolean;
}

export function useSNSResolution(): UseSNSResolutionReturn {
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const resolveName = useCallback(async (walletAddress: string): Promise<string> => {
    // Check if we already have this name resolved
    if (resolvedNames[walletAddress]) {
      return resolvedNames[walletAddress];
    }

    // Check localStorage first
    const storedName = localStorage.getItem(`displayName_${walletAddress}`);
    if (storedName) {
      setResolvedNames(prev => ({ ...prev, [walletAddress]: storedName }));
      return storedName;
    }

    try {
      setIsLoading(true);
      const resolvedName = await getDisplayNameWithSNS(walletAddress);
      
      // Cache the resolved name
      setResolvedNames(prev => ({ ...prev, [walletAddress]: resolvedName }));
      localStorage.setItem(`displayName_${walletAddress}`, resolvedName);
      
      return resolvedName;
    } catch (error) {
      console.error('Error resolving SNS name:', error);
      const fallbackName = walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4);
      setResolvedNames(prev => ({ ...prev, [walletAddress]: fallbackName }));
      return fallbackName;
    } finally {
      setIsLoading(false);
    }
  }, [resolvedNames]);

  // Pre-resolve names for a list of wallet addresses
  const resolveMultipleNames = useCallback(async (walletAddresses: string[]) => {
    const uniqueAddresses = Array.from(new Set(walletAddresses));
    const promises = uniqueAddresses.map(address => resolveName(address));
    await Promise.all(promises);
  }, [resolveName]);

  return {
    resolvedNames,
    resolveName,
    isLoading,
    resolveMultipleNames
  };
}
