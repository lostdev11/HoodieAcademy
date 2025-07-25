import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useWalletSupabase() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect wallet and check admin
  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window?.solana?.isPhantom) throw new Error('Phantom wallet not found');
      const provider = window.solana;
      const response = await provider.connect();
      const walletAddress = response.publicKey.toString();
      setWallet(walletAddress);
      // Upsert last_active
      await supabase
        .from('users')
        .upsert({ wallet_address: walletAddress, last_active: new Date().toISOString() }, { onConflict: 'wallet_address' });
      // Check admin
      const { data, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('wallet_address', walletAddress)
        .single();
      if (adminError) throw adminError;
      setIsAdmin(!!data?.is_admin);
      setLoading(false);
      return walletAddress;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setIsAdmin(false);
      setWallet(null);
      setLoading(false);
      return null;
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWallet(null);
    setIsAdmin(false);
    setError(null);
    // Phantom does not have a disconnect method, but you can clear state
  }, []);

  // Auto-connect on mount if already connected
  useEffect(() => {
    if (window?.solana?.isConnected && window.solana.publicKey) {
      connectWallet();
    }
  }, [connectWallet]);

  // Track course start
  const trackCourseStart = useCallback(async (course_slug: string) => {
    if (!wallet) return;
    try {
      await supabase
        .from('user_course_completions')
        .upsert({ wallet_address: wallet, course_id: course_slug, started_at: new Date().toISOString() }, { onConflict: 'wallet_address,course_id' });
    } catch (err) {
      console.error('Course start tracking failed:', err);
    }
  }, [wallet]);

  // Track course completion
  const trackCourseCompletion = useCallback(async (course_slug: string) => {
    if (!wallet) return;
    try {
      await supabase
        .from('user_course_completions')
        .upsert({ wallet_address: wallet, course_id: course_slug, completed_at: new Date().toISOString() }, { onConflict: 'wallet_address,course_id' });
    } catch (err) {
      console.error('Completion logging failed:', err);
    }
  }, [wallet]);

  return {
    wallet,
    isAdmin,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    trackCourseStart,
    trackCourseCompletion,
  };
} 