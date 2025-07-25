import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type AdminStatusLoadingState =
  | 'detecting-wallet'
  | 'checking-admin'
  | 'done';

export function useAdminStatus() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loadingState, setLoadingState] = useState<AdminStatusLoadingState>('detecting-wallet');

  // Wallet detection
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    let finished = false;

    const getWalletAddress = () => {
      if (typeof window !== 'undefined' && window.solana?.publicKey) {
        const address = window.solana.publicKey.toString();
        setWalletAddress(address);
        return address;
      }
      const storedWallet = localStorage.getItem('connectedWallet');
      if (storedWallet) {
        setWalletAddress(storedWallet);
        return storedWallet;
      }
      setWalletAddress(null);
      return null;
    };

    getWalletAddress();
    interval = setInterval(getWalletAddress, 1000);

    timeout = setTimeout(() => {
      if (!finished && !walletAddress) {
        // Only set admin to false if no wallet was detected
        setLoadingState('done');
        setIsAdmin(false);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      finished = true;
    };
  }, [walletAddress]);

  // Admin check
  useEffect(() => {
    if (!walletAddress) {
      setIsAdmin(false);
      setLoadingState('done');
      return;
    }
    setLoadingState('checking-admin');
    async function checkIsAdmin() {
      try {
        // Check both admin_wallets table and users.is_admin field
        const [adminWalletsResult, userResult] = await Promise.all([
          supabase
            .from('admin_wallets')
            .select('wallet_address')
            .eq('wallet_address', walletAddress),
          supabase
            .from('users')
            .select('is_admin')
            .eq('wallet_address', walletAddress)
            .single()
        ]);

        const isInAdminWallets = !!adminWalletsResult.data?.some(w => w.wallet_address === walletAddress);
        const isAdminInUsers = !!userResult.data?.is_admin;

        setIsAdmin(isInAdminWallets || isAdminInUsers);
        setLoadingState('done');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setLoadingState('done');
      }
    }
    checkIsAdmin();
  }, [walletAddress]);

  return { walletAddress, isAdmin, loadingState };
} 