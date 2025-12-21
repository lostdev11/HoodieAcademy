'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Flame, Target } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/onchain-trials';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/onchain-trials/leaderboard');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const formatSuccessRate = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <Card className="bg-slate-800/50 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Trophy className="w-5 h-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <p>{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
            >
              Retry
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No leaderboard data yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/20">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Player</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Best Score</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Success Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-400" />}
                        {index === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                        {index === 2 && <Trophy className="w-4 h-4 text-orange-400" />}
                        <span className="text-sm font-medium text-gray-300">
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-cyan-400">
                          {entry.username || formatWallet(entry.wallet)}
                        </span>
                        {entry.username && (
                          <span className="text-xs text-gray-500 font-mono">
                            {formatWallet(entry.wallet)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-gray-300">{entry.best_score}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-gray-300">
                        {formatSuccessRate(entry.success_rate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-gray-300">{entry.streak}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

