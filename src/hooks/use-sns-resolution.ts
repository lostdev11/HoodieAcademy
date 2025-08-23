'use client';

import { useState, useEffect } from 'react';

export function useSNSResolution(walletAddress: string | null) {
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setResolvedName(null);
      return;
    }

    const resolveName = async () => {
      setLoading(true);
      try {
        // This should check your database first instead of localStorage
        // For now, we'll skip the localStorage check and go straight to resolution
        
        // TODO: Check database for existing resolution
        // const existingName = await fetchResolvedNameFromDatabase(walletAddress);
        // if (existingName) {
        //   setResolvedName(existingName);
        //   setLoading(false);
        //   return;
        // }

        // Resolve SNS name
        const response = await fetch(`/api/sns/resolve?address=${walletAddress}`);
        if (response.ok) {
          const data = await response.json();
          if (data.name) {
            setResolvedName(data.name);
            
            // Save to database instead of localStorage
            // TODO: Implement database save here
            console.log('SNS name resolved, should save to database:', { walletAddress, name: data.name });
          }
        }
      } catch (error) {
        console.error('Error resolving SNS name:', error);
      } finally {
        setLoading(false);
      }
    };

    resolveName();
  }, [walletAddress]);

  return { resolvedName, loading };
}
