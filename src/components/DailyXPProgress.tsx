'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Clock, Target, AlertCircle } from 'lucide-react';

interface DailyXPProgressProps {
  walletAddress: string;
  compact?: boolean;
  showRecent?: boolean;
}

export default function DailyXPProgress({ 
  walletAddress, 
  compact = false,
  showRecent = false 
}: DailyXPProgressProps) {
  const [dailyProgress, setDailyProgress] = useState({
    earnedToday: 0,
    dailyCap: 300,
    remaining: 300,
    percentUsed: 0,
    capReached: false
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDailyProgress = useCallback(async () => {
    try {
      console.log('🔍 [DailyXPProgress] Fetching daily progress for:', walletAddress);
      setLoading(true);
      const response = await fetch(`/api/xp/auto-reward?wallet=${walletAddress}`);
      
      // Check if response is ok
      if (!response.ok) {
        console.warn('⚠️ DailyXPProgress: API returned error status:', response.status);
        setLoading(false);
        return;
      }
      
      // Get response text first to check if it's valid JSON
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn('⚠️ DailyXPProgress: Empty response from API');
        setLoading(false);
        return;
      }
      
      const data = JSON.parse(text);
      console.log('✅ [DailyXPProgress] Received data:', data);

      if (data.success) {
        console.log('✅ [DailyXPProgress] Setting daily progress:', data.dailyProgress);
        setDailyProgress(data.dailyProgress);
        if (showRecent) {
          setRecentActivities(data.recentActivities || []);
        }
      } else {
        console.warn('⚠️ DailyXPProgress: API returned success=false');
      }
    } catch (error) {
      console.error('❌ DailyXPProgress: Error fetching daily XP progress:', error);
      // Use default values on error
      setDailyProgress({
        earnedToday: 0,
        dailyCap: 300,
        remaining: 300,
        percentUsed: 0,
        capReached: false
      });
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Initial fetch on mount and when wallet changes
  useEffect(() => {
    if (walletAddress) {
      fetchDailyProgress();
    }
  }, [walletAddress, fetchDailyProgress]);

  // Listen for XP award events to update in real time
  useEffect(() => {
    if (!walletAddress) return;

    const handleXPAwarded = (event: CustomEvent) => {
      const { targetWallet } = event.detail;
      // If XP was awarded to this user, refresh immediately
      if (targetWallet === walletAddress) {
        console.log('🎯 [DailyXPProgress] XP awarded to this user, refreshing...');
        fetchDailyProgress();
      }
    };

    const handleForceRefresh = () => {
      console.log('🔄 [DailyXPProgress] Force refresh triggered');
      fetchDailyProgress();
    };

    window.addEventListener('xpAwarded', handleXPAwarded as EventListener);
    window.addEventListener('xpUpdated', handleXPAwarded as EventListener);
    window.addEventListener('forceXPRefresh', handleForceRefresh as EventListener);

    return () => {
      window.removeEventListener('xpAwarded', handleXPAwarded as EventListener);
      window.removeEventListener('xpUpdated', handleXPAwarded as EventListener);
      window.removeEventListener('forceXPRefresh', handleForceRefresh as EventListener);
    };
  }, [walletAddress, fetchDailyProgress]);

  if (loading) {
    return (
      <Card className={`bg-slate-800/50 border-cyan-500/30 ${compact ? 'p-3' : ''}`}>
        <CardContent className={compact ? 'p-3' : 'p-4'}>
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              <div className="h-2 bg-slate-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact version
  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-cyan-500/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">Today's XP</span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                dailyProgress.capReached 
                  ? 'border-red-500/30 text-red-400' 
                  : 'border-cyan-500/30 text-cyan-400'
              }`}
            >
              {dailyProgress.earnedToday}/{dailyProgress.dailyCap}
            </Badge>
          </div>
          <Progress value={dailyProgress.percentUsed} className="h-2" />
          <p className="text-xs text-gray-400 mt-1">
            {dailyProgress.capReached ? (
              <span className="text-orange-400">Daily cap reached! Come back tomorrow 🌙</span>
            ) : (
              <span>{dailyProgress.remaining} XP remaining today</span>
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <Card className={`bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-cyan-500/30 ${
      dailyProgress.capReached ? 'border-orange-500/50' : ''
    }`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <span>Daily XP Progress</span>
                <Calendar className="w-4 h-4 text-cyan-400" />
              </h3>
              <p className="text-sm text-gray-400">Resets at midnight UTC</p>
            </div>
          </div>
          {dailyProgress.capReached && (
            <Badge className="bg-orange-600 text-white animate-pulse">
              Cap Reached!
            </Badge>
          )}
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">Earned Today</p>
            <p className="text-2xl font-bold text-cyan-400">{dailyProgress.earnedToday}</p>
            <p className="text-xs text-gray-500">XP</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Remaining</p>
            <p className={`text-2xl font-bold ${
              dailyProgress.remaining === 0 ? 'text-red-400' : 'text-purple-400'
            }`}>
              {dailyProgress.remaining}
            </p>
            <p className="text-xs text-gray-500">XP</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Daily Cap</p>
            <p className="text-2xl font-bold text-gray-400">{dailyProgress.dailyCap}</p>
            <p className="text-xs text-gray-500">XP</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className={`font-semibold ${
              dailyProgress.percentUsed >= 100 ? 'text-red-400' : 
              dailyProgress.percentUsed >= 75 ? 'text-orange-400' : 
              'text-cyan-400'
            }`}>
              {dailyProgress.percentUsed}%
            </span>
          </div>
          <Progress value={dailyProgress.percentUsed} className="h-3" />
        </div>

        {/* Status Message */}
        <div className={`mt-4 p-3 rounded-lg ${
          dailyProgress.capReached 
            ? 'bg-orange-900/30 border border-orange-500/30' 
            : 'bg-cyan-900/30 border border-cyan-500/30'
        }`}>
          <div className="flex items-start space-x-2">
            {dailyProgress.capReached ? (
              <>
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-400">Daily XP Cap Reached!</p>
                  <p className="text-xs text-gray-300 mt-1">
                    You've earned the maximum 300 XP today. Come back tomorrow to earn more! 🌙
                  </p>
                </div>
              </>
            ) : (
              <>
                <Target className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-cyan-400">Keep Earning!</p>
                  <p className="text-xs text-gray-300 mt-1">
                    You have {dailyProgress.remaining} XP remaining today. Complete courses, submit bounties, or engage on the social feed!
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        {showRecent && recentActivities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Recent Activities
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentActivities.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between text-sm bg-slate-700/30 rounded p-2"
                >
                  <span className="text-gray-300 truncate flex-1">{activity.reason}</span>
                  <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400 ml-2">
                    +{activity.xpAmount} XP
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-4 pt-4 border-t border-slate-600 text-center">
          <p className="text-xs text-gray-500">
            💡 Daily cap encourages consistent engagement over time
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

