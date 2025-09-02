import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logCourseActivity, logWalletConnection } from '@/lib/activity-logger';

export function useWalletSupabase() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
      
      // Now try to do the additional operations, but don't fail the connection if they error
      try {
        // Log wallet connection activity
        await logWalletConnection(walletAddress, 'wallet_connect', { provider: 'phantom' });
        console.log('📊 Wallet connection logged');
      } catch (logError) {
        console.warn('Failed to log wallet connection:', logError);
        // Don't fail the connection for logging errors
      }
      
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
          // Use the regular supabase client instead of admin client to avoid GoTrueClient warnings
          const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('wallet_address', walletAddress)
            .single();
          
          if (adminError) {
            console.warn('Failed to check admin status:', adminError);
            setIsAdmin(false);
          } else {
            const isAdminStatus = !!adminData?.is_admin;
            console.log('👑 Admin status:', isAdminStatus);
            setIsAdmin(isAdminStatus);
          }
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
      // Log wallet disconnection activity
      await logWalletConnection(wallet, 'wallet_disconnect', { reason: 'user_disconnect' });
    }
    setWallet(null);
    setIsAdmin(false);
    setError(null);
    // Phantom does not have a disconnect method, but you can clear state
  }, [wallet]);

  // Auto-connect on mount if already connected
  useEffect(() => {
    const sol = typeof window !== 'undefined' ? window.solana : undefined;
    
    if (sol?.publicKey && !wallet) {
      console.log('🔄 Auto-connecting to existing wallet:', sol.publicKey.toString());
      // Only auto-connect if we don't already have a wallet
      const autoConnect = async () => {
        try {
          const walletAddress = sol.publicKey!.toString();
          console.log('🎯 Auto-connecting to wallet:', walletAddress);
          
          // Set wallet state directly without calling connectWallet
          setWallet(walletAddress);
          
          // Check admin status
          const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('wallet_address', walletAddress)
            .single();
          
          if (adminError) {
            console.warn('Failed to check admin status during auto-connect:', adminError);
            setIsAdmin(false);
          } else {
            const isAdminStatus = !!adminData?.is_admin;
            console.log('👑 Auto-connect admin status:', isAdminStatus);
            setIsAdmin(isAdminStatus);
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      };
      
      autoConnect();
    }
    
    // Listen for wallet connection changes
    const handleAccountChange = () => {
      if (sol?.publicKey) {
        const newWalletAddress = sol.publicKey.toString();
        if (newWalletAddress !== wallet) {
          console.log('🔄 Account changed to:', newWalletAddress);
          setWallet(newWalletAddress);
          // Check admin status for new wallet
          checkAdminStatus(newWalletAddress);
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
  }, []); // Remove connectWallet and wallet from dependencies
  
  // Separate function to check admin status
  const checkAdminStatus = useCallback(async (walletAddress: string) => {
    try {
      console.log('🔍 checkAdminStatus: Checking admin status for wallet:', walletAddress);
      const { data, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('wallet_address', walletAddress)
        .single();
      if (adminError) {
        console.warn('Failed to check admin status:', adminError);
        setIsAdmin(false);
      } else {
        const isAdminStatus = !!data?.is_admin;
        console.log('👑 checkAdminStatus: Admin status result:', isAdminStatus, 'for data:', data);
        setIsAdmin(isAdminStatus);
      }
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