import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logCourseActivity, logWalletConnection } from '@/lib/activity-logger';

// Hardcoded admin wallets - this will always work
const ADMIN_WALLETS = [
  'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
  '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
  '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
];

export function useWalletSupabaseHardcoded() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 useWalletSupabaseHardcoded - State changed:', { wallet, isAdmin, loading, error, isInitialized });
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
      
      // Set wallet address first
      setWallet(walletAddress);
      setLoading(false);
      
      // Check admin status using hardcoded list
      const isAdminWallet = ADMIN_WALLETS.includes(walletAddress);
      console.log('👑 Hardcoded admin check:', { wallet: walletAddress, isAdmin: isAdminWallet });
      setIsAdmin(isAdminWallet);
      
      // Now try to do the additional operations, but don't fail the connection if they error
      try {
        // Log wallet connection activity
        await logWalletConnection(walletAddress, 'wallet_connect', { provider: 'phantom' });
        console.log('📊 Wallet connection logged');
      } catch (logError) {
        console.warn('Failed to log wallet connection:', logError);
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
      }
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  // Auto-connect on page load if wallet is already connected
  useEffect(() => {
    if (typeof window !== 'undefined' && !wallet && !loading) {
      const checkExistingConnection = async () => {
        try {
          const provider = window.solana;
          if (provider && provider.publicKey) {
            const walletAddress = provider.publicKey.toString();
            console.log('🎯 Auto-connecting to wallet:', walletAddress);
            
            // Set wallet state directly without calling connectWallet
            setWallet(walletAddress);
            
            // Check admin status using hardcoded list
            const isAdminWallet = ADMIN_WALLETS.includes(walletAddress);
            console.log('👑 Auto-connect hardcoded admin check:', { wallet: walletAddress, isAdmin: isAdminWallet });
            setIsAdmin(isAdminWallet);
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      };

      checkExistingConnection();
    }
  }, [wallet, loading]);

  // Listen for wallet changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleWalletChange = () => {
        const provider = window.solana;
        if (provider && provider.publicKey) {
          const newWallet = provider.publicKey.toString();
          console.log('🔄 Wallet changed to:', newWallet);
          setWallet(newWallet);
          
          // Check admin status for new wallet
          checkAdminStatus(newWallet);
        } else {
          console.log('🔄 Wallet disconnected');
          setWallet(null);
          setIsAdmin(false);
        }
      };

      window.addEventListener('walletChange', handleWalletChange);
      return () => window.removeEventListener('walletChange', handleWalletChange);
    }
  }, []);

  // Separate function to check admin status
  const checkAdminStatus = useCallback(async (walletAddress: string) => {
    try {
      console.log('🔍 checkAdminStatus: Checking admin status for wallet:', walletAddress);
      
      // Use hardcoded list instead of database query
      const isAdminWallet = ADMIN_WALLETS.includes(walletAddress);
      console.log('👑 checkAdminStatus: Hardcoded admin status result:', isAdminWallet);
      setIsAdmin(isAdminWallet);
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
      
      await logCourseActivity(wallet, 'course_start', { course_id: course_slug });
    } catch (error) {
      console.error('Failed to track course start:', error);
    }
  }, [wallet]);

  // Track course completion
  const trackCourseCompletion = useCallback(async (course_slug: string, score?: number) => {
    if (!wallet) return;
    try {
      await supabase
        .from('course_completions')
        .upsert({ 
          wallet_address: wallet, 
          course_id: course_slug, 
          completed_at: new Date().toISOString(),
          score: score || null
        }, { onConflict: 'wallet_address,course_id' });
      
      await logCourseActivity(wallet, 'course_complete', { course_id: course_slug, score });
    } catch (error) {
      console.error('Failed to track course completion:', error);
    }
  }, [wallet]);

  // Manual admin status refresh function
  const refreshAdminStatus = useCallback(async () => {
    if (wallet) {
      console.log('🔄 refreshAdminStatus: Manually refreshing admin status for wallet:', wallet);
      await checkAdminStatus(wallet);
    }
  }, [wallet, checkAdminStatus]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.solana && window.solana.disconnect) {
        await window.solana.disconnect();
      }
      setWallet(null);
      setIsAdmin(false);
      localStorage.removeItem('hoodie_academy_wallet');
      localStorage.removeItem('hoodie_academy_is_admin');
      console.log('🔌 Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, []);

  return {
    wallet,
    isAdmin,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    trackCourseStart,
    trackCourseCompletion,
    refreshAdminStatus
  };
}
