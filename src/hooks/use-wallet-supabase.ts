import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { logCourseActivity, logWalletConnection } from '@/lib/activity-logger';
import { walletTracker } from '@/lib/wallet-connection-tracker';
import { userDataSync } from '@/lib/user-data-sync';
import { simpleUserSync } from '@/lib/simple-user-sync';
import { robustUserSync } from '@/lib/robust-user-sync';
import { simpleUserTracker } from '@/lib/simple-user-tracker';


export function useWalletSupabase() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const autoConnectAttempted = useRef(false);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 useWalletSupabase - State changed:', { wallet, isAdmin, loading, error, isInitialized });
  }, [wallet, isAdmin, loading, error, isInitialized]);

  // Initialize from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      console.log('🔄 Initializing from localStorage...');
      
      const storedWallet = localStorage.getItem('hoodie_academy_wallet');
      const storedAdmin = localStorage.getItem('hoodie_academy_is_admin');
      
      if (storedWallet) {
        setWallet(storedWallet);
        console.log('💾 Wallet restored from localStorage:', storedWallet);
      }
      
      if (storedAdmin === 'true') {
        setIsAdmin(true);
        console.log('💾 Admin status restored from localStorage');
      }
      
      setLoading(false);
      setIsInitialized(true);
      console.log('✅ Initialization complete');
    }
  }, [isInitialized]);

  // Persist wallet to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (wallet) {
        localStorage.setItem('hoodie_academy_wallet', wallet);
        console.log('💾 Wallet saved to localStorage:', wallet);
      } else {
        localStorage.removeItem('hoodie_academy_wallet');
        console.log('🗑️ Wallet removed from localStorage');
        // Reset auto-connect attempt when wallet is cleared
        autoConnectAttempted.current = false;
      }
    }
  }, [wallet]);

  // Persist admin status to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hoodie_academy_is_admin', isAdmin.toString());
      console.log('💾 Admin status saved to localStorage:', isAdmin);
    }
  }, [isAdmin]);

  // Connect wallet and check admin
  const connectWallet = useCallback(async () => {
    console.log('🔗 Attempting to connect wallet...');
    setLoading(true);
    setError(null);
    
    try {
      const provider = typeof window !== 'undefined' ? window.solana : undefined;
      if (!provider) {
        throw new Error('Phantom wallet not found');
      }

      console.log('📱 Phantom wallet found, checking connection status...');
      console.log('🔑 Current public key:', provider.publicKey?.toString() || 'None');

      // Connect only if not already connected
      if (!provider.publicKey) {
        console.log('🔌 No public key, attempting to connect...');
        try {
          await provider.connect({ onlyIfTrusted: true } as any);
          console.log('✅ Connected with trusted connection');
        } catch (trustedError) {
          console.log('⚠️ Trusted connection failed, trying regular connection...');
          await provider.connect();
          console.log('✅ Connected with regular connection');
        }
      } else {
        console.log('✅ Already connected, using existing connection');
      }

      const walletAddress = provider.publicKey!.toString();
      console.log('🎯 Wallet address:', walletAddress);
      
      // Set wallet address first (this is the most important part)
      setWallet(walletAddress);
      setLoading(false);
      
      // Check admin status after wallet connection
      await checkAdminStatus(walletAddress);
      
      // Track wallet connection with enhanced data
      try {
        await walletTracker.trackConnection(
          walletAddress,
          'connect',
          'phantom',
          undefined,
          {
            page_url: window.location.href,
            referrer: document.referrer || 'direct',
            connection_method: 'wallet_extension'
          }
        );
        console.log('📊 Wallet connection tracked with enhanced data');
      } catch (trackError) {
        console.warn('Failed to track wallet connection:', trackError);
      }

      // Track user in database - simple and clean
      try {
        await simpleUserTracker.trackWalletConnection(walletAddress);
        console.log('👤 User tracked in database successfully');
      } catch (userError) {
        console.warn('Failed to track user in database:', userError);
        // Don't fail the connection for database errors
      }
      
      // Now try to do the additional operations, but don't fail the connection if they error
      
      try {
        // Upsert last_active - use upsert to handle both insert and update
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({ 
            wallet_address: walletAddress, 
            last_active: new Date().toISOString() 
          }, { 
            onConflict: 'wallet_address' 
          });
        
        if (upsertError) {
          console.warn('Failed to update user last_active:', upsertError);
        } else {
          console.log('✅ User last_active updated');
        }
      } catch (dbError) {
        console.warn('Failed to update user last_active:', dbError);
        // Don't fail the connection for database errors
      }
      
      // Check admin status asynchronously without blocking the connection
      setTimeout(async () => {
        try {
          console.log('🔍 Checking admin status for wallet:', walletAddress);
          
          // First try RPC function
          try {
            const { data: isAdminStatus, error: adminError } = await supabase.rpc('is_wallet_admin', { 
              wallet: walletAddress 
            });
            
            if (!adminError && isAdminStatus !== null) {
              console.log('👑 Admin status (RPC):', !!isAdminStatus);
              setIsAdmin(!!isAdminStatus);
              return;
            }
          } catch (rpcError) {
            console.warn('RPC admin check failed, trying fallback:', rpcError);
          }
          
          // Fallback: Check against hardcoded admin wallets
          const adminWallets = [
            'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
            'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
            '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
            '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
          ];
          
          const isAdminHardcoded = adminWallets.includes(walletAddress);
          console.log('👑 Admin status (hardcoded):', isAdminHardcoded);
          setIsAdmin(isAdminHardcoded);
          
        } catch (adminError) {
          console.warn('Failed to check admin status:', adminError);
          setIsAdmin(false);
        }
      }, 100); // Small delay to ensure connection is established first
      
      console.log('🎉 Wallet connection successful!');
      return walletAddress;
    } catch (err: any) {
      console.error('💥 Wallet connection failed:', err);
      setError(err.message || 'Unknown error');
      setIsAdmin(false);
      setWallet(null);
      setLoading(false);
      return null;
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    if (wallet) {
      try {
        // Enhanced wallet disconnection tracking
        await walletTracker.trackDisconnection(wallet, 'phantom');
        console.log('📊 Enhanced wallet disconnection tracked');
        
        // Legacy logging for backward compatibility
        await logWalletConnection(wallet, 'wallet_disconnect', { reason: 'user_disconnect' });
        console.log('📊 Legacy wallet disconnection logged');
      } catch (logError) {
        console.warn('Failed to log wallet disconnection:', logError);
      }
    }
    setWallet(null);
    setIsAdmin(false);
    setError(null);
    // Phantom does not have a disconnect method, but you can clear state
  }, [wallet]);

  // Auto-connect on mount if already connected
  useEffect(() => {
    const sol = typeof window !== 'undefined' ? window.solana : undefined;
    
    // Only auto-connect if:
    // 1. Phantom is available
    // 2. Phantom has a public key
    // 3. We don't already have a wallet
    // 4. We're initialized (to prevent race conditions with localStorage restoration)
    // 5. We haven't already attempted auto-connect
    if (sol?.publicKey && !wallet && isInitialized && !autoConnectAttempted.current) {
      const walletAddress = sol.publicKey.toString();
      
      // Prevent auto-connecting to the same wallet we just restored from localStorage
      const storedWallet = localStorage.getItem('hoodie_academy_wallet');
      if (storedWallet === walletAddress) {
        console.log('🔄 Wallet already restored from localStorage, skipping auto-connect');
        return;
      }
      
      console.log('🔄 Auto-connecting to existing wallet:', walletAddress);
      autoConnectAttempted.current = true; // Mark that we've attempted auto-connect
      
      // Only auto-connect if we don't already have a wallet
      const autoConnect = async () => {
        try {
          console.log('🎯 Auto-connecting to wallet:', walletAddress);
          
          // Set wallet state directly without calling connectWallet
          setWallet(walletAddress);
          
          // Track user in database
          try {
            await simpleUserTracker.trackWalletConnection(walletAddress);
            console.log('👤 Auto-connected wallet tracked successfully');
          } catch (autoSyncError) {
            console.warn('Auto-connect tracking failed:', autoSyncError);
          }
          
          // Check admin status using RPC function with fallback
          try {
            const { data: isAdminStatus, error: adminError } = await supabase.rpc('is_wallet_admin', { 
              wallet: walletAddress 
            });
            
            if (!adminError && isAdminStatus !== null) {
              console.log('👑 Auto-connect admin status (RPC):', !!isAdminStatus);
              setIsAdmin(!!isAdminStatus);
            } else {
              throw new Error('RPC failed or returned null');
            }
          } catch (rpcError) {
            console.warn('RPC admin check failed during auto-connect, using hardcoded fallback:', rpcError);
            
            // Fallback: Check against hardcoded admin wallets
            const adminWallets = [
              'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
              'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
              '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
              '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
            ];
            
            const isAdminHardcoded = adminWallets.includes(walletAddress);
            console.log('👑 Auto-connect admin status (hardcoded):', isAdminHardcoded);
            setIsAdmin(isAdminHardcoded);
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      };
      
      autoConnect();
    }
    
    // Listen for wallet connection changes
    const handleAccountChange = async () => {
      if (sol?.publicKey) {
        const newWalletAddress = sol.publicKey.toString();
        if (newWalletAddress !== wallet) {
          console.log('🔄 Account changed to:', newWalletAddress);
          setWallet(newWalletAddress);
          
          // Track user in database
          try {
            await simpleUserTracker.trackWalletConnection(newWalletAddress);
            console.log('👤 Account change wallet tracked successfully');
          } catch (accountSyncError) {
            console.warn('Account change tracking failed:', accountSyncError);
          }
          
          // Check admin status for new wallet
          await checkAdminStatus(newWalletAddress);
        }
      } else {
        console.log('🔄 Account disconnected');
        setWallet(null);
        setIsAdmin(false);
      }
    };
    
    if (sol && typeof sol.on === 'function') {
      sol.on('accountChanged', handleAccountChange);
    }
    
    return () => {
      if (sol && typeof sol.off === 'function') {
        sol.off('accountChanged', handleAccountChange);
      }
    };
  }, [isInitialized]); // Add isInitialized to dependencies to prevent race conditions
  
  // Separate function to check admin status
  const checkAdminStatus = useCallback(async (walletAddress: string) => {
    try {
      console.log('🔍 checkAdminStatus: Checking admin status for wallet:', walletAddress);
      
      // First try RPC function
      try {
        const { data: isAdminStatus, error: adminError } = await supabase.rpc('is_wallet_admin', { 
          wallet: walletAddress 
        });
        
        if (!adminError && isAdminStatus !== null) {
          console.log('👑 checkAdminStatus: Admin status (RPC):', !!isAdminStatus);
          setIsAdmin(!!isAdminStatus);
          return;
        }
      } catch (rpcError) {
        console.warn('RPC admin check failed in checkAdminStatus, using fallback:', rpcError);
      }
      
      // Fallback: Check against hardcoded admin wallets
      const adminWallets = [
        'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
        'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
        '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
        '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
      ];
      
      const isAdminHardcoded = adminWallets.includes(walletAddress);
      console.log('👑 checkAdminStatus: Admin status (hardcoded):', isAdminHardcoded);
      setIsAdmin(isAdminHardcoded);
      
    } catch (adminError) {
      console.warn('Failed to check admin status:', adminError);
      setIsAdmin(false);
    }
  }, []);

  // Track course start
  const trackCourseStart = useCallback(async (course_slug: string) => {
    if (!wallet) return;
    try {
      await supabase
        .from('course_completions')
        .upsert({ wallet_address: wallet, course_id: course_slug, started_at: new Date().toISOString() }, { onConflict: 'wallet_address,course_id' });
      
      // Log course start activity
      await logCourseActivity(wallet, 'course_start', {
        course_id: course_slug,
        course_name: course_slug,
        completion_status: 'started'
      });
    } catch (err) {
      console.error('Course start tracking failed:', err);
    }
  }, [wallet]);

  // Track course completion
  const trackCourseCompletion = useCallback(async (course_slug: string) => {
    if (!wallet) return;
    try {
      await supabase
        .from('course_completions')
        .upsert({ wallet_address: wallet, course_id: course_slug, completed_at: new Date().toISOString() }, { onConflict: 'wallet_address,course_id' });
      
      // Log course completion activity
      await logCourseActivity(wallet, 'course_complete', {
        course_id: course_slug,
        course_name: course_slug,
        completion_status: 'completed'
      });
    } catch (err) {
      console.error('Completion logging failed:', err);
    }
  }, [wallet]);

  // Manual admin status refresh function
  const refreshAdminStatus = useCallback(async () => {
    if (wallet) {
      console.log('🔄 refreshAdminStatus: Manually refreshing admin status for wallet:', wallet);
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
    trackCourseStart,
    trackCourseCompletion,
    refreshAdminStatus,
  };
} 