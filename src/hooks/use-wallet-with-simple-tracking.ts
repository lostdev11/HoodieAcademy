'use client';

import { useEffect } from 'react';
import { useWalletSupabase } from './use-wallet-supabase';
import { useSimpleWalletTracking } from './use-simple-wallet-tracking';

/**
 * Enhanced wallet hook that adds simple tracking to your existing wallet connection
 * This keeps your current wallet connection exactly the same while adding minimal tracking
 */
export function useWalletWithSimpleTracking() {
  // Use your existing wallet connection hook (unchanged)
  const walletData = useWalletSupabase();
  
  // Add simple tracking (completely non-intrusive)
  const tracking = useSimpleWalletTracking(walletData.wallet);

  return {
    // All your existing wallet data and methods (unchanged)
    ...walletData,
    
    // Additional tracking methods for future use
    tracking: {
      getUserData: tracking.getUserData,
      updateUser: tracking.updateUser,
      addXP: tracking.addXP,
      trackWalletConnection: tracking.trackWalletConnection
    }
  };
}

/**
 * Example of how to use this in a component:
 * 
 * function MyComponent() {
 *   const { wallet, connectWallet, isAdmin, loading, tracking } = useWalletWithSimpleTracking();
 *   
 *   // Your existing wallet connection works exactly the same
 *   const handleConnect = () => {
 *     connectWallet(); // Same as before
 *   };
 *   
 *   // New tracking capabilities for future features
 *   const handleAddXP = async () => {
 *     if (wallet) {
 *       await tracking.addXP(wallet, 100, 'course_completion');
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleConnect}>
 *         {loading ? 'Connecting...' : 'Connect Wallet'}
 *       </button>
 *       
 *       {wallet && (
 *         <p>Connected: {wallet}</p>
 *       )}
 *       
 *       <button onClick={handleAddXP}>
 *         Add XP (Future Feature)
 *       </button>
 *     </div>
 *   );
 * }
 */
