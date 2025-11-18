'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDevice } from '@/hooks/use-device';
import { createClient } from '@supabase/supabase-js';
import { logWalletConnection, logUserActivity } from '@/lib/activity-logger';
import { walletTracker } from '@/lib/wallet-connection-tracker';
import { simpleUserTracker } from '@/lib/simple-user-tracker';

// Hardcoded admin wallets for fallback
const adminWallets = [
  'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
  '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
  '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
];

export function useWalletSupabase() {
  const { isMobile, isPhantomInApp } = useDevice();
  const [wallet, setWallet] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const autoConnectAttempted = useRef(false);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const storedWallet = localStorage.getItem('hoodie_academy_wallet');
      const storedAdmin = localStorage.getItem('hoodie_academy_is_admin');
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Set admin status from localStorage immediately
      if (storedAdmin === 'true') {
        setIsAdmin(true);
      }
      
      if (storedWallet) {
        setWallet(storedWallet);
        
        // Validate with API (with timeout to prevent hanging)
        timeoutId = setTimeout(() => {
          setLoading(false);
          setIsInitialized(true);
        }, 5000); // 5 second timeout
        
        fetch('/api/wallet/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: storedWallet })
        })
          .then(res => res.json())
          .then(data => {
            if (timeoutId) clearTimeout(timeoutId);
            if (!data.valid) {
              // Server says wallet is invalid (banned, etc.)
              setWallet(null);
              localStorage.removeItem('hoodie_academy_wallet');
            }
            setLoading(false);
            setIsInitialized(true);
          })
          .catch(err => {
            if (timeoutId) clearTimeout(timeoutId);
            // On API error, keep the localStorage value (fail open)
            setLoading(false);
            setIsInitialized(true);
          });
      } else {
        setLoading(false);
        setIsInitialized(true);
      }
      
      // Cleanup function
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [isInitialized]);

  // Persist wallet to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (wallet) {
        localStorage.setItem('hoodie_academy_wallet', wallet);
      } else {
        localStorage.removeItem('hoodie_academy_wallet');
        // Reset auto-connect attempt when wallet is cleared
        autoConnectAttempted.current = false;
      }
    }
  }, [wallet]);

  // Persist admin status to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hoodie_academy_is_admin', isAdmin.toString());
    }
  }, [isAdmin]);

  // Connect wallet and check admin
  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Handle mobile: redirect to Phantom if not already in Phantom's in-app browser
      if (isMobile && !isPhantomInApp) {
        const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
        const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
        window.location.href = phantomUrl;
        setLoading(false);
        return;
      }

      const provider = typeof window !== 'undefined' ? window.solana : undefined;
      if (!provider) {
        const errorMsg = isMobile 
          ? 'Please open this page in the Phantom app browser' 
          : 'Phantom wallet not found. Please install Phantom extension.';
        throw new Error(errorMsg);
      }

      // Connect only if not already connected
      if (!provider.publicKey) {
        try {
          await provider.connect({ onlyIfTrusted: true } as any);
        } catch (trustedError: any) {
          try {
            await provider.connect();
          } catch (connectError: any) {
            const errorMessage = connectError?.message || connectError?.toString() || '';
            const isUserRejection = 
              errorMessage.includes('User rejected') ||
              errorMessage.includes('User cancelled') ||
              errorMessage.includes('not been authorized') ||
              errorMessage.includes('4001') ||
              connectError?.code === 4001;
            
            if (isUserRejection) {
              throw new Error('Connection was cancelled. Please approve the connection request in your wallet to continue.');
            } else {
              throw new Error(`Connection failed: ${errorMessage || 'Unknown error. Please try again.'}`);
            }
          }
        }
      }

      if (!provider.publicKey) {
        throw new Error('Connection succeeded but no public key was returned. Please try again.');
      }

      const walletAddress = provider.publicKey.toString();
      
      // Set wallet address first (this is the most important part)
      setWallet(walletAddress);
      setLoading(false);
      
      // Log connection to API (hybrid approach - fire and don't wait)
      fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet: walletAddress,
          provider: 'phantom'
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.isAdmin !== undefined) {
            setIsAdmin(data.isAdmin);
            localStorage.setItem('hoodie_academy_is_admin', data.isAdmin ? 'true' : 'false');
          }
          
          if (data.banned) {
            // Wallet is banned, disconnect immediately
            disconnectWallet();
          }
        })
        .catch(err => {
          // Continue anyway - don't block user
        });

      // Enhanced tracking
      try {
        await walletTracker.trackConnection(
          walletAddress,
          'phantom',
          { 
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            referrer: document.referrer
          }
        );
      } catch (trackError) {
        // Silent error handling
      }

      // Simple user tracking
      try {
        await simpleUserTracker.trackWalletConnection(walletAddress);
      } catch (userError) {
        // Don't fail the connection for database errors
      }

      // Update user last_active in database
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            wallet_address: walletAddress,
            last_active: new Date().toISOString()
          }, {
            onConflict: 'wallet_address'
          });

        if (upsertError) {
          // Silent error handling
        }
      } catch (dbError) {
        // Don't fail the connection for database errors
      }

      // Check admin status
      try {
        // Try RPC method first
        try {
          const response = await fetch('/api/admin/check-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress })
          });
          
          const { isAdmin: isAdminStatus, error: adminError } = await response.json();
          
          if (!adminError && isAdminStatus !== null) {
            setIsAdmin(!!isAdminStatus);
            return walletAddress;
          }
        } catch (rpcError) {
          // Fall back to hardcoded list
        }

        // Fallback to hardcoded admin list
        const isAdminHardcoded = adminWallets.includes(walletAddress);
        setIsAdmin(isAdminHardcoded);
      } catch (adminError) {
        setIsAdmin(false);
      }
      
      return walletAddress;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setLoading(false);
      throw err;
    }
  }, [isMobile, isPhantomInApp]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    const currentWallet = wallet;
    
    if (currentWallet) {
      // Log disconnection to API
      fetch('/api/wallet/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: currentWallet })
      })
        .then(res => res.json())
        .then(data => {
          // Silent success
        })
        .catch(err => {
          // Silent error handling
        });

      // Enhanced tracking
      try {
        await walletTracker.trackDisconnection(currentWallet, 'phantom');
        
        await logWalletConnection(currentWallet, 'wallet_disconnect', { reason: 'user_disconnect' });
      } catch (logError) {
        // Silent error handling
      }
    }
    
    // Clear state
    setWallet(null);
    setIsAdmin(false);
    setError(null);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hoodie_academy_wallet');
      localStorage.removeItem('hoodie_academy_is_admin');
    }
    
    // Reset auto-connect flag
    autoConnectAttempted.current = false;
  }, [wallet]);

  // Auto-connect on page load
  useEffect(() => {
    if (!isInitialized || wallet || autoConnectAttempted.current) return;

    const autoConnect = async () => {
      const storedWallet = localStorage.getItem('hoodie_academy_wallet');
      if (!storedWallet) return;

      if (storedWallet === wallet) {
        return;
      }
      
      autoConnectAttempted.current = true; // Mark that we've attempted auto-connect
      
      try {
        // Check if wallet is still connected
        if (typeof window !== 'undefined' && window.solana?.publicKey) {
          const currentWallet = window.solana.publicKey.toString();
          
          if (currentWallet === storedWallet) {
            setWallet(currentWallet);
            
            // Track the auto-connection
            try {
              await simpleUserTracker.trackWalletConnection(currentWallet);
            } catch (autoSyncError) {
              // Silent error handling
            }

            // Check admin status for auto-connected wallet
            try {
              const response = await fetch('/api/admin/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: currentWallet })
              });
              
              const { isAdmin: isAdminStatus, error: adminError } = await response.json();
              
              if (!adminError && isAdminStatus !== null) {
                setIsAdmin(!!isAdminStatus);
                return;
              }
            } catch (rpcError) {
              // Fall back to hardcoded list
            }

            // Fallback to hardcoded admin list
            const isAdminHardcoded = adminWallets.includes(currentWallet);
            setIsAdmin(isAdminHardcoded);
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };

    autoConnect();
  }, [isInitialized, wallet]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.solana) return;

    const handleAccountChange = (publicKey: any) => {
      if (publicKey) {
        const newWalletAddress = publicKey.toString();
        if (newWalletAddress !== wallet) {
          setWallet(newWalletAddress);
          
          // Track account change
          try {
            simpleUserTracker.trackWalletConnection(newWalletAddress);
          } catch (accountSyncError) {
            // Silent error handling
          }
        }
      } else {
        setWallet(null);
        setIsAdmin(false);
      }
    };

    window.solana.on('accountChanged', handleAccountChange);

    return () => {
      if (window.solana?.off) {
        window.solana.off('accountChanged', handleAccountChange);
      }
    };
  }, [wallet]);

  // Check admin status function
  const checkAdminStatus = useCallback(async (walletAddress: string) => {
    try {
      // Try RPC method first
      try {
        const response = await fetch('/api/admin/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress })
        });
        
        const { isAdmin: isAdminStatus, error: adminError } = await response.json();
        
        if (!adminError && isAdminStatus !== null) {
          setIsAdmin(!!isAdminStatus);
          return;
        }
      } catch (rpcError) {
        // Fall back to hardcoded list
      }

      // Fallback to hardcoded admin list
      const isAdminHardcoded = adminWallets.includes(walletAddress);
      setIsAdmin(isAdminHardcoded);
    } catch (adminError) {
      setIsAdmin(false);
    }
  }, []);

  // Track course start
  const trackCourseStart = useCallback(async (courseSlug: string) => {
    if (!wallet) return;
    
    try {
      await logUserActivity({
        wallet_address: wallet,
        activity_type: 'course_start',
        course_data: {
          course_id: courseSlug,
          course_name: courseSlug,
          completion_status: 'started'
        }
      });
    } catch (err) {
      // Silent error handling
    }
  }, [wallet]);

  // Track course completion
  const trackCourseCompletion = useCallback(async (courseSlug: string, score?: number) => {
    if (!wallet) return;
    
    try {
      await logUserActivity({
        wallet_address: wallet,
        activity_type: 'course_completion',
        course_data: {
          course_id: courseSlug,
          course_name: courseSlug,
          completion_status: 'completed',
          score: score
        }
      });
    } catch (err) {
      // Silent error handling
    }
  }, [wallet]);

  // Refresh admin status
  const refreshAdminStatus = useCallback(async () => {
    if (wallet) {
      await checkAdminStatus(wallet);
    }
  }, [wallet, checkAdminStatus]);

  return {
    wallet,
    isAdmin,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    checkAdminStatus,
    trackCourseStart,
    trackCourseCompletion,
    refreshAdminStatus
  };
}
