import { useEffect, useCallback, useRef } from 'react';
import { xpBountyService } from '@/services/xp-bounty-service';

export function useAutoDailyLogin(walletAddress?: string) {
  const lastCheckRef = useRef<number>(0);
  const THROTTLE_MS = 10000; // Only check once every 10 seconds

  const checkAndAwardDailyLogin = useCallback(async () => {
    if (!walletAddress) return;

    const now = Date.now();
    if (now - lastCheckRef.current < THROTTLE_MS) {
      console.log('⏰ [Auto Daily Login] Throttled - too soon since last check');
      return;
    }
    lastCheckRef.current = now;

    try {
      console.log('🔄 [Auto Daily Login] Checking daily login status for:', walletAddress);
      
      // Check if user already claimed today
      const status = await xpBountyService.checkDailyLoginStatus(walletAddress);
      
      if (status && !status.alreadyClaimed) {
        console.log('ℹ️ [Auto Daily Login] Daily login bonus available - user can claim manually');
        // Don't auto-claim, just let the user claim manually via the button
      } else {
        console.log('ℹ️ [Auto Daily Login] Daily login bonus already claimed today');
      }
    } catch (error) {
      console.error('❌ [Auto Daily Login] Error checking/awarding daily login:', error);
    }
  }, [walletAddress]);

  // Auto-check daily login when wallet connects
  useEffect(() => {
    if (walletAddress) {
      // Small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        checkAndAwardDailyLogin();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [walletAddress, checkAndAwardDailyLogin]);

  // Also check daily login when the page becomes visible (user returns to tab)
  // BUT with throttling to prevent spam
  useEffect(() => {
    let lastCheck = 0;
    const THROTTLE_MS = 30000; // Only check once every 30 seconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && walletAddress) {
        const now = Date.now();
        if (now - lastCheck > THROTTLE_MS) {
          lastCheck = now;
          // Small delay to avoid spam
          setTimeout(() => {
            checkAndAwardDailyLogin();
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [walletAddress, checkAndAwardDailyLogin]);

  return {
    checkAndAwardDailyLogin
  };
}
