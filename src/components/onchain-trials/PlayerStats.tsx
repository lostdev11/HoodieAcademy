'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Flame, Award } from 'lucide-react';
import type { PlayerStats as PlayerStatsType } from '@/types/onchain-trials';

interface PlayerStatsProps {
  stats: PlayerStatsType | null;
  loading?: boolean;
}

export default function PlayerStats({ stats, loading }: PlayerStatsProps) {
  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400">Player Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400">Player Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <p>Connect your wallet to see your stats</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Award className="w-5 h-5" />
          Your Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/50 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-400">Best Score</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">
              {stats.bestScoreMs !== null ? `${stats.bestScoreMs}ms` : 'N/A'}
            </p>
          </div>

          <div className="p-4 bg-slate-700/50 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.successRate.toFixed(1)}%</p>
          </div>

          <div className="p-4 bg-slate-700/50 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">Current Streak</span>
            </div>
            <p className="text-2xl font-bold text-orange-400">{stats.currentStreak}</p>
          </div>

          <div className="p-4 bg-slate-700/50 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Total Wins</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.totalWins}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700/50 space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Total Games:</span>
            <span className="text-cyan-400 font-medium">{stats.totalGames}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Longest Streak:</span>
            <span className="text-cyan-400 font-medium">{stats.longestStreak}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

