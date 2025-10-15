'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface XPDisplayProps {
  walletAddress?: string;
  variant?: 'full' | 'compact' | 'minimal' | 'badge-only';
  showLevel?: boolean;
  showProgress?: boolean;
  showNextLevel?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UserXP {
  wallet_address: string;
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  progress_in_level: number;
  display_name?: string;
  exists: boolean;
}

export function XPDisplay({
  walletAddress,
  variant = 'full',
  showLevel = true,
  showProgress = true,
  showNextLevel = true,
  autoRefresh = true,
  refreshInterval = 60000 // 60 seconds
}: XPDisplayProps) {
  const [xpData, setXpData] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousXP, setPreviousXP] = useState(0);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    fetchXP();

    if (autoRefresh) {
      const interval = setInterval(fetchXP, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [walletAddress, autoRefresh, refreshInterval]);

  const fetchXP = async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`/api/xp/award-auto?wallet=${walletAddress}`);
      const data = await response.json();
      
      if (data.success && data.xp) {
        // Check if XP changed
        if (xpData && data.xp.total_xp !== xpData.total_xp) {
          setPreviousXP(xpData.total_xp);
        }
        setXpData(data.xp);
      }
    } catch (error) {
      console.error('Error fetching XP:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {variant === 'full' ? (
          <div className="h-24 bg-gray-800 rounded"></div>
        ) : (
          <div className="h-8 w-24 bg-gray-800 rounded"></div>
        )}
      </div>
    );
  }

  if (!walletAddress || !xpData) {
    return variant === 'badge-only' ? null : (
      <div className="text-gray-500 text-sm">No XP data</div>
    );
  }

  const xpChanged = previousXP > 0 && xpData.total_xp !== previousXP;

  // Badge Only variant
  if (variant === 'badge-only') {
    return (
      <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-0">
        <Zap className="w-3 h-3 mr-1" />
        {xpData.total_xp.toLocaleString()} XP
      </Badge>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-gray-300">
          {xpData.total_xp.toLocaleString()} XP
        </span>
        {showLevel && (
          <Badge variant="outline" className="text-xs">
            Lvl {xpData.level}
          </Badge>
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Total XP</div>
                <motion.div 
                  className="text-2xl font-bold text-yellow-400"
                  animate={xpChanged ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {xpData.total_xp.toLocaleString()}
                </motion.div>
              </div>
            </div>
            {showLevel && (
              <Badge className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-lg px-4 py-2">
                Level {xpData.level}
              </Badge>
            )}
          </div>
          {showProgress && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Progress to Level {xpData.level + 1}</span>
                <span className="text-xs text-gray-400">{xpData.progress_in_level.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 h-2 rounded-full transition-all duration-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpData.progress_in_level}%` }}
                />
              </div>
              {showNextLevel && (
                <div className="text-xs text-gray-500 mt-1">
                  {xpData.xp_to_next_level} XP to next level
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Card className="bg-gradient-to-br from-yellow-900/20 via-orange-900/20 to-yellow-900/20 border-yellow-500/30">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Total Experience</div>
              <motion.div 
                className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400"
                animate={xpChanged ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {xpData.total_xp.toLocaleString()} XP
              </motion.div>
            </div>
          </div>
          {showLevel && (
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Current Level</div>
              <Badge className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-2xl px-6 py-2">
                <Award className="w-5 h-5 mr-2" />
                {xpData.level}
              </Badge>
            </div>
          )}
        </div>

        {showProgress && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Progress to Level {xpData.level + 1}</span>
              </span>
              <span className="text-sm font-semibold text-yellow-400">
                {xpData.progress_in_level.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpData.progress_in_level}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            {showNextLevel && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {((xpData.level - 1) * 1000).toLocaleString()} XP
                </span>
                <span className="text-xs text-gray-400">
                  {xpData.xp_to_next_level} XP needed
                </span>
                <span className="text-xs text-gray-500">
                  {(xpData.level * 1000).toLocaleString()} XP
                </span>
              </div>
            )}
          </div>
        )}

        {/* Level-up celebration */}
        {xpChanged && xpData.total_xp > previousXP && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center"
          >
            <span className="text-green-400 font-semibold">
              +{xpData.total_xp - previousXP} XP Earned! 🎉
            </span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Inline XP badge for headers/navbars
export function XPBadge({ walletAddress }: { walletAddress?: string }) {
  return <XPDisplay walletAddress={walletAddress} variant="badge-only" />;
}

// Compact XP card for dashboards
export function XPCard({ walletAddress }: { walletAddress?: string }) {
  return <XPDisplay walletAddress={walletAddress} variant="compact" />;
}

// Minimal XP display for lists
export function XPMinimal({ walletAddress }: { walletAddress?: string }) {
  return <XPDisplay walletAddress={walletAddress} variant="minimal" showProgress={false} />;
}

