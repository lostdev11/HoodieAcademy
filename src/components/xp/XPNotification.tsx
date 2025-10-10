'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Zap, TrendingUp, Gift, Award, Star, Crown } from 'lucide-react';

/**
 * XPNotification Component
 * 
 * Listens for XP award events and displays beautiful toast notifications
 * instead of browser alerts.
 */

interface XPAwardedEvent {
  targetWallet: string;
  xpAwarded: number;
  newTotalXP: number;
  previousLevel?: number;
  newLevel?: number;
  levelUp?: boolean;
  source?: string;
  reason?: string;
}

export default function XPNotification({ walletAddress }: { walletAddress?: string }) {
  const { toast } = useToast();

  useEffect(() => {
    if (!walletAddress) return;

    // Handler for XP awarded events
    const handleXPAwarded = (event: CustomEvent<XPAwardedEvent>) => {
      const { 
        targetWallet, 
        xpAwarded, 
        newTotalXP, 
        previousLevel,
        newLevel,
        levelUp, 
        source, 
        reason 
      } = event.detail;

      // Only show notification if XP was awarded to this user
      if (targetWallet !== walletAddress) return;

      console.log('🎯 [XPNotification] Showing notification for XP award:', event.detail);

      // Determine icon based on source
      let icon: JSX.Element;
      switch (source) {
        case 'course':
          icon = <Award className="w-5 h-5 text-blue-400" />;
          break;
        case 'bounty':
          icon = <Star className="w-5 h-5 text-purple-400" />;
          break;
        case 'daily_login':
          icon = <Gift className="w-5 h-5 text-yellow-400" />;
          break;
        case 'admin':
          icon = <Crown className="w-5 h-5 text-amber-400" />;
          break;
        default:
          icon = <Zap className="w-5 h-5 text-cyan-400" />;
      }

      // Show level up notification if applicable
      if (levelUp && newLevel && previousLevel) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="font-bold text-green-400">LEVEL UP!</span>
            </div>
          ),
          description: (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Level {previousLevel}</span>
                <span className="text-2xl">→</span>
                <span className="text-green-400 font-bold">Level {newLevel}</span>
              </div>
              <div className="text-sm text-gray-400">
                +{xpAwarded} XP from {reason || source}
              </div>
              <div className="text-sm font-semibold text-cyan-400">
                Total: {newTotalXP.toLocaleString()} XP
              </div>
            </div>
          ),
          duration: 8000,
          className: "bg-gradient-to-r from-green-900/90 to-blue-900/90 border-green-500/50",
        });
      } else {
        // Regular XP notification
        toast({
          title: (
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-bold text-cyan-400">+{xpAwarded} XP Earned!</span>
            </div>
          ),
          description: (
            <div className="space-y-1">
              <div className="text-sm text-gray-300">
                {reason || `XP from ${source || 'unknown source'}`}
              </div>
              <div className="text-sm font-semibold text-cyan-400">
                Total: {newTotalXP.toLocaleString()} XP
              </div>
              {newLevel && (
                <div className="text-xs text-gray-400">
                  Level {newLevel} • {1000 - (newTotalXP % 1000)} XP to next level
                </div>
              )}
            </div>
          ),
          duration: 5000,
          className: "bg-gradient-to-r from-slate-900/90 to-blue-900/90 border-cyan-500/50",
        });
      }
    };

    // Listen for XP events
    window.addEventListener('xpAwarded', handleXPAwarded as EventListener);
    window.addEventListener('xpUpdated', handleXPAwarded as EventListener);

    return () => {
      window.removeEventListener('xpAwarded', handleXPAwarded as EventListener);
      window.removeEventListener('xpUpdated', handleXPAwarded as EventListener);
    };
  }, [walletAddress, toast]);

  return null; // This component doesn't render anything visible
}

