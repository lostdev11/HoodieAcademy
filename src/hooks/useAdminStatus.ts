import { useState, useEffect, useCallback } from 'react';

interface UseAdminStatusReturn {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to manage admin status across the application
 * This prevents multiple components from making redundant admin checks
 */
export function useAdminStatus(): UseAdminStatusReturn {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number>(0);

  const checkAdminStatus = useCallback(async (force = false) => {
    // Prevent checking too frequently (unless forced)
    const now = Date.now();
    if (!force && now - lastChecked < 5000) { // 5 second cooldown
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get connected wallet address
      const walletAddress = localStorage.getItem('walletAddress') || localStorage.getItem('connectedWallet');
      
      if (!walletAddress) {
        setIsAdmin(false);
        setIsLoading(false);
        setLastChecked(now);
        return;
      }

      // Use direct admin check to bypass RLS policy issues
      const { checkAdminStatusDirect } = await import('@/lib/admin-check');
      const adminStatus = await checkAdminStatusDirect(walletAddress);
      
      setIsAdmin(adminStatus);
      setLastChecked(now);
      
      if (adminStatus) {
        console.log('✅ useAdminStatus: Admin status confirmed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check admin status';
      setError(errorMessage);
      setIsAdmin(false);
      console.error('💥 useAdminStatus: Failed to check admin:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lastChecked]);

  const refetch = useCallback(() => checkAdminStatus(true), [checkAdminStatus]);

  useEffect(() => {
    // Initial check
    checkAdminStatus(true);
    
    // Set up periodic checks (less frequent)
    const interval = setInterval(() => checkAdminStatus(), 30000); // 30 seconds
    
    // Listen for wallet connection changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walletAddress' || e.key === 'connectedWallet') {
        checkAdminStatus(true);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAdminStatus]);

  return {
    isAdmin,
    isLoading,
    error,
    refetch
  };
}
