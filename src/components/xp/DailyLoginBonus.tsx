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
  const loadStatus = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const result = await xpBountyService.checkDailyLoginStatus(walletAddress);
      setStatus(result);
    } catch (err) {
      console.error('Error loading daily login status:', err);
      setError('Failed to load daily login status');
    } finally {
      setLoading(false);
    }
  };

  // Claim daily login bonus
  const claimDailyBonus = async () => {
    if (!walletAddress || !status || status.alreadyClaimed || claiming) return;

    try {
      setClaiming(true);
      setError(null);

      const result = await xpBountyService.awardDailyLoginBonus(walletAddress);

      if (result.success) {
        // Calculate tomorrow for countdown
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        // Update status to claimed with next available time
        setStatus(prev => prev ? { 
          ...prev, 
          alreadyClaimed: true,
          lastClaimed: new Date().toISOString(),
          nextAvailable: tomorrow.toISOString()
        } : prev);
        
        // Show beautiful success toast
        toast({
          title: (
            <div className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-400">Daily Bonus Claimed!</span>
            </div>
          ),
          description: (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-lg font-bold text-cyan-400">+{result.xpAwarded} XP</span>
              </div>
              <div className="text-sm text-gray-300">
                Come back tomorrow for more!
              </div>
              <div className="text-sm font-semibold text-cyan-400">
                Total: {result.newTotalXP?.toLocaleString() || 'N/A'} XP
              </div>
              {result.levelUp && (
                <div className="text-sm font-bold text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Level up to {result.newLevel}!
                </div>
              )}
            </div>
          ),
          duration: 6000,
          className: "bg-gradient-to-r from-yellow-900/90 to-orange-900/90 border-yellow-500/50",
        });
        
        // Stop claiming state immediately
        setClaiming(false);
        
        // Reload status in background (don't wait)
        setTimeout(() => loadStatus(), 1000);
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
    if (!status || !status.nextAvailable) return;

    const now = new Date().getTime();
    const nextAvailable = new Date(status.nextAvailable).getTime();
    const timeLeft = nextAvailable - now;

    if (timeLeft > 0) {
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      setTimeUntilNext({ hours, minutes, seconds });
    } else {
      setTimeUntilNext(null);
      // Reload status when countdown reaches zero
      loadStatus();
    }
  }, [status, loadStatus]);

  // Load status on mount and when wallet changes
  useEffect(() => {
    loadStatus();
  }, [walletAddress]);

  // Update countdown timer
  useEffect(() => {
    updateCountdown();
    
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [updateCountdown]);

  // Auto-refresh status every minute
  useEffect(() => {
    const interval = setInterval(loadStatus, 60000);
    return () => clearInterval(interval);
  }, [walletAddress]);

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

  const canClaim = !status.alreadyClaimed;

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
        {canClaim ? (
          <Button
            onClick={claimDailyBonus}
            disabled={claiming || status.alreadyClaimed}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {claiming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Claiming...
              </>
            ) : status.alreadyClaimed ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Already Claimed
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Claim Daily Bonus
              </>
            )}
          </Button>
        ) : (
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
              <p className="text-lg font-bold text-green-400">Available!</p>
            )}
          </div>
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
