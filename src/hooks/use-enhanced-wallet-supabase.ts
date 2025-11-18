'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSessionTracking } from './useSessionTracking';
import { useWalletTracking } from './useWalletTracking';
import { usePageView } from './usePageView';
import { logWalletConnect, logWalletDisconnect } from '@/lib/tracking/client';

/**
 * Enhanced wallet hook that integrates with the new tracking system
 * This replaces the existing useWalletSupabase with comprehensive tracking
 */
export function useEnhancedWalletSupabase() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session tracking
  const { sessionId, isActive: sessionActive, startSession, endSession } = useSessionTracking({
    walletAddress: wallet,
    autoStart: false // We'll start manually after wallet connects
  });

  // Initialize wallet tracking
  const { logConnect, logDisconnect } = useWalletTracking(wallet, sessionId);

  // Initialize page view tracking
  usePageView(sessionId);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 useEnhancedWalletSupabase - State changed:', { 
      wallet, 
      isAdmin, 
      loading, 
      error, 
      isInitialized,
      sessionId,
      sessionActive
    });
  }, [wallet, isAdmin, loading, error, isInitialized, sessionId, sessionActive]);

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
      // Handle mobile: redirect to Phantom if not already in Phantom's in-app browser
      if (isMobile && !isPhantomInApp) {
        const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
        const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
        console.log('📱 Mobile detected, redirecting to Phantom app...');
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

      console.log('📱 Phantom wallet found, checking connection status...');
      console.log('🔑 Current public key:', provider.publicKey?.toString() || 'None');

      // Connect only if not already connected
      if (!provider.publicKey) {
        console.log('🔌 No public key, attempting to connect...');
        try {
          await provider.connect({ onlyIfTrusted: true } as any);
          console.log('✅ Connected with trusted connection');
        } catch (trustedError: any) {
          console.log('⚠️ Trusted connection failed, trying regular connection...', trustedError?.message);
          try {
            await provider.connect();
            console.log('✅ Connected with user approval');
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
      } else {
        console.log('✅ Already connected, using existing connection');
      }

      if (!provider.publicKey) {
        throw new Error('Connection succeeded but no public key was returned. Please try again.');
      }

      const walletAddress = provider.publicKey.toString();
      console.log('🎯 Wallet address:', walletAddress);
      
      // Set wallet address first
      setWallet(walletAddress);
      setLoading(false);
      
      // Start session tracking
      const newSessionId = await startSession();
      if (newSessionId) {
        console.log('📊 Session started:', newSessionId);
        
        // Log wallet connection with new tracking system
        try {
          await logConnect(walletAddress);
          console.log('📊 Wallet connection tracked with new system');
        } catch (trackError) {
          console.warn('Failed to track wallet connection:', trackError);
        }
      }

      // Create/update user profile in the new tracking system
      try {
        // Upsert profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: (await supabase.auth.getUser()).data.user?.id || crypto.randomUUID(),
            primary_wallet: walletAddress,
            display_name: `User ${walletAddress.slice(0, 6)}`,
            last_active_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.warn('Failed to upsert profile:', profileError);
        }

        // Upsert wallet
        const { error: walletError } = await supabase
          .from('wallets')
          .upsert({
            user_id: (await supabase.auth.getUser()).data.user?.id || crypto.randomUUID(),
            address: walletAddress,
            is_primary: true,
            connected_first_at: new Date().toISOString(),
            connected_last_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,address'
          });

        if (walletError) {
          console.warn('Failed to upsert wallet:', walletError);
        }

        console.log('👤 User data synced with new tracking system');
      } catch (userError) {
        console.warn('Failed to sync user data:', userError);
      }
      
      // Check admin status asynchronously without blocking the connection
      setTimeout(async () => {
        try {
          console.log('🔍 Checking admin status for wallet:', walletAddress);
          
          // Check against hardcoded admin wallets
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
      }, 100);
      
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
  }, [startSession, logConnect]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    if (wallet) {
      try {
        // Log wallet disconnection
        await logDisconnect(wallet);
        console.log('📊 Wallet disconnection tracked');
      } catch (logError) {
        console.warn('Failed to log wallet disconnection:', logError);
      }

      // End session
      await endSession();
      console.log('📊 Session ended');
    }
    
    setWallet(null);
    setIsAdmin(false);
    setError(null);
  }, [wallet, logDisconnect, endSession]);

  // Auto-connect on mount if already connected
  useEffect(() => {
    const sol = typeof window !== 'undefined' ? window.solana : undefined;
    
    if (sol?.publicKey && !wallet && isInitialized) {
      console.log('🔄 Auto-connecting to existing wallet:', sol.publicKey.toString());
      
      const autoConnect = async () => {
        try {
          const walletAddress = sol.publicKey!.toString();
          console.log('🎯 Auto-connecting to wallet:', walletAddress);
          
          // Set wallet state directly
          setWallet(walletAddress);
          
          // Start session tracking
          const newSessionId = await startSession();
          if (newSessionId) {
            console.log('📊 Auto-connect session started:', newSessionId);
            
            // Log wallet connection
            try {
              await logConnect(walletAddress);
              console.log('📊 Auto-connect wallet connection tracked');
            } catch (trackError) {
              console.warn('Auto-connect tracking failed:', trackError);
            }
          }
          
          // Check admin status
          const adminWallets = [
            'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
            'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
            '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
            '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
          ];
          
          const isAdminHardcoded = adminWallets.includes(walletAddress);
          console.log('👑 Auto-connect admin status:', isAdminHardcoded);
          setIsAdmin(isAdminHardcoded);
          
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
          
          // End current session
          await endSession();
          
          // Set new wallet
          setWallet(newWalletAddress);
          
          // Start new session
          const newSessionId = await startSession();
          if (newSessionId) {
            try {
              await logConnect(newWalletAddress);
              console.log('📊 Account change wallet connection tracked');
            } catch (trackError) {
              console.warn('Account change tracking failed:', trackError);
            }
          }
          
          // Check admin status for new wallet
          const adminWallets = [
            'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
            'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
            '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
            '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
          ];
          
          const isAdminHardcoded = adminWallets.includes(newWalletAddress);
          setIsAdmin(isAdminHardcoded);
        }
      } else {
        console.log('🔄 Account disconnected');
        await endSession();
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
  }, [wallet, isInitialized, startSession, endSession, logConnect]);

  // Track course start
  const trackCourseStart = useCallback(async (course_slug: string) => {
    if (!wallet) return;
    try {
      // Use new tracking system
      const { logCourseStart } = await import('@/lib/tracking/client');
      await logCourseStart(course_slug, sessionId || undefined);
      console.log('📊 Course start tracked with new system');
    } catch (err) {
      console.error('Course start tracking failed:', err);
    }
  }, [wallet, sessionId]);

  // Track course completion
  const trackCourseCompletion = useCallback(async (course_slug: string) => {
    if (!wallet) return;
    try {
      // Use new tracking system
      const { logCourseComplete } = await import('@/lib/tracking/client');
      await logCourseComplete(course_slug, sessionId || undefined);
      console.log('📊 Course completion tracked with new system');
    } catch (err) {
      console.error('Completion logging failed:', err);
    }
  }, [wallet, sessionId]);

  return {
    wallet,
    isAdmin,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    trackCourseStart,
    trackCourseCompletion,
    sessionId,
    sessionActive,
    // Additional tracking utilities
    startSession,
    endSession
  };
}
