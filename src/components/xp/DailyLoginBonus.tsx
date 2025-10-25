'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Gift, 
  CheckCircle, 
  Clock, 
  Zap,
  Sparkles,
  PartyPopper,
  TrendingUp
} from 'lucide-react';
import { xpBountyService } from '@/services/xp-bounty-service';

interface DailyLoginBonusProps {
  walletAddress: string;
  className?: string;
}

interface DailyLoginStatus {
  walletAddress: string;
  today: string;
  alreadyClaimed: boolean;
  lastClaimed: string | null;
  nextAvailable: string;
  dailyBonusXP: number;
}

export default function DailyLoginBonus({ walletAddress, className = '' }: DailyLoginBonusProps) {
  const [status, setStatus] = useState<DailyLoginStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  
  const { toast } = useToast();

  // Load daily login status
  const loadStatus = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const result = await xpBountyService.checkDailyLoginStatus(walletAddress);
      console.log('📥 [DailyLoginBonus] Status loaded:', {
        alreadyClaimed: result?.alreadyClaimed,
        nextAvailable: result?.nextAvailable,
        lastClaimed: result?.lastClaimed
      });
      setStatus(result);
    } catch (err) {
      console.error('Error loading daily login status:', err);
      setError('Failed to load daily login status');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Claim daily login bonus
  const claimDailyBonus = async () => {
    if (!walletAddress || !status || status.alreadyClaimed || claiming) return;

    try {
      setClaiming(true);
      setError(null);

      const result = await xpBountyService.awardDailyLoginBonus(walletAddress);

      if (result.success) {
        // Use the server-provided nextAvailable time (24 hours from claim)
        const newStatus = {
          ...status,
          alreadyClaimed: true,
          lastClaimed: result.lastClaimed || new Date().toISOString(),
          nextAvailable: result.nextAvailable || new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()
        };
        
        console.log('✅ [DailyLoginBonus] Updating status after claim:', {
          alreadyClaimed: newStatus.alreadyClaimed,
          nextAvailable: newStatus.nextAvailable,
          lastClaimed: newStatus.lastClaimed
        });
        
        setStatus(newStatus);
        
        // Show beautiful success toast
        toast({
          title: "Daily Bonus Claimed! 🎉",
          description: `+${result.xpAwarded} XP awarded! Total: ${result.newTotalXP?.toLocaleString() || 'N/A'} XP. ${result.levelUp ? `Level up! 🎊` : 'Come back in 24 hours!'}`,
          duration: 6000,
          className: "bg-gradient-to-r from-yellow-900/90 to-orange-900/90 border-yellow-500/50",
        });
        
        // Stop claiming state immediately
        setClaiming(false);
        
        // Dispatch XP update events after state update
        setTimeout(() => {
          console.log('🎯 [DailyLoginBonus] Dispatching XP update events', {
            xpAwarded: result.xpAwarded,
            newTotalXP: result.newTotalXP
          });
          
          // Dispatch XP update event to trigger page refresh
          window.dispatchEvent(new CustomEvent('xpUpdated', {
            detail: {
              targetWallet: walletAddress,
              xpAwarded: result.xpAwarded,
              newTotalXP: result.newTotalXP,
              source: 'daily_login'
            }
          }));

          // Also dispatch xpAwarded for compatibility
          window.dispatchEvent(new CustomEvent('xpAwarded', {
            detail: {
              targetWallet: walletAddress,
              xpAwarded: result.xpAwarded,
              newTotalXP: result.newTotalXP
            }
          }));
          
          // Force refresh all XP displays
          window.dispatchEvent(new CustomEvent('forceXPRefresh', {
            detail: { targetWallet: walletAddress }
          }));
          
          // Trigger global refresh with detail
          window.dispatchEvent(new CustomEvent('forceRefresh', {
            detail: { targetWallet: walletAddress }
          }));
        }, 100);
        
        // Don't reload status immediately - let the local state persist
        // The countdown will use the calculated nextAvailable time
        // Status will refresh naturally via auto-refresh interval
      } else {
        // Show error toast
        toast({
          title: "Unable to Claim",
          description: result.message || 'Failed to claim daily login bonus',
          variant: "destructive",
          duration: 4000,
        });
        setError(result.message || 'Failed to claim daily login bonus');
        
        // Stop claiming state
        setClaiming(false);
      }
    } catch (err) {
      console.error('Error claiming daily login bonus:', err);
      
      const errorMsg = 'Network error while claiming daily login bonus';
      
      // Show error toast
      toast({
        title: "Connection Error",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
      
      setError(errorMsg);
      
      // Stop claiming state
      setClaiming(false);
    }
  };

  // Calculate time until next claim
  const updateCountdown = useCallback(() => {
    if (!status || !status.nextAvailable) {
      setTimeUntilNext(null);
      return;
    }
    
    // Only show countdown if claimed
    if (!status.alreadyClaimed) {
      setTimeUntilNext(null);
      return;
    }

    const now = new Date().getTime();
    const nextAvailable = new Date(status.nextAvailable).getTime();
    const timeLeft = nextAvailable - now;

    console.log('⏱️ [DailyLoginBonus] Countdown update:', {
      now: new Date(now).toISOString(),
      nextAvailable: new Date(nextAvailable).toISOString(),
      timeLeft,
      alreadyClaimed: status.alreadyClaimed
    });

    if (timeLeft > 0) {
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      console.log('✅ [DailyLoginBonus] Setting countdown:', { hours, minutes, seconds });
      setTimeUntilNext({ hours, minutes, seconds });
    } else {
      console.log('⚠️ [DailyLoginBonus] Time reached zero, reloading status');
      setTimeUntilNext(null);
      
      // Mark as available again
      setStatus(prev => prev ? {
        ...prev,
        alreadyClaimed: false,
        lastClaimed: null
      } : prev);
      
      // Reload status from API to confirm
      setTimeout(() => {
        loadStatus();
      }, 100);
    }
  }, [status, loadStatus]);

  // Load status on mount and when wallet changes
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Update countdown timer every second
  useEffect(() => {
    // Initial update
    updateCountdown();
    
    // Set up interval for updates
    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [updateCountdown]);

  // Auto-refresh status every 5 minutes (but not during active countdown)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if not in countdown mode
      if (!status?.alreadyClaimed) {
        console.log('🔄 [DailyLoginBonus] Auto-refreshing status (no active countdown)');
        loadStatus();
      } else {
        console.log('⏸️ [DailyLoginBonus] Skipping auto-refresh during active countdown');
      }
    }, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [status?.alreadyClaimed, loadStatus]);

  if (loading && !status) {
    return (
      <Card className={`bg-slate-800/50 border-yellow-500/30 ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className={`bg-slate-800/50 border-yellow-500/30 ${className}`}>
        <CardContent className="p-6 text-center">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Unable to load daily login status</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-800/50 border-yellow-500/30 ${className}`}>
      <CardHeader>
        <CardTitle className="text-yellow-400 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Daily Login Bonus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-medium">+{status.dailyBonusXP} XP</p>
              <p className="text-sm text-gray-400">Daily reward</p>
            </div>
          </div>
          
          <Badge 
            variant={status.alreadyClaimed ? "default" : "secondary"}
            className={status.alreadyClaimed 
              ? "bg-green-500/20 text-green-400 border-green-500/30" 
              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            }
          >
            {status.alreadyClaimed ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Claimed Today
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Available
              </>
            )}
          </Badge>
        </div>

        {/* Claim Button or Countdown */}
        {status.alreadyClaimed ? (
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-1">Next bonus available in:</p>
            {timeUntilNext ? (
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-yellow-400">
                <span className="bg-slate-800 px-2 py-1 rounded text-sm">
                  {timeUntilNext.hours.toString().padStart(2, '0')}
                </span>
                <span className="text-gray-400">:</span>
                <span className="bg-slate-800 px-2 py-1 rounded text-sm">
                  {timeUntilNext.minutes.toString().padStart(2, '0')}
                </span>
                <span className="text-gray-400">:</span>
                <span className="bg-slate-800 px-2 py-1 rounded text-sm">
                  {timeUntilNext.seconds.toString().padStart(2, '0')}
                </span>
              </div>
            ) : (
              <Button
                onClick={claimDailyBonus}
                disabled={claiming}
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
              >
                <Gift className="w-4 h-4 mr-2" />
                Available Now - Claim Bonus!
              </Button>
            )}
          </div>
        ) : (
          <Button
            onClick={claimDailyBonus}
            disabled={claiming}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {claiming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Claiming...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Claim Daily Bonus
              </>
            )}
          </Button>
        )}

        {/* Error Messages (success now shown as toast) */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Last Claimed Info */}
        {status.lastClaimed && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Last claimed: {new Date(status.lastClaimed).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
