'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, TrendingUp, Award, Clock } from 'lucide-react';

interface UserXPData {
  walletAddress: string;
  xp: {
    total_xp: number;
    bounty_xp: number;
    course_xp: number;
    streak_xp: number;
  };
  bountySubmissions: Array<{
    id: string;
    bounty_id: string;
    xp_awarded: number;
    placement?: 'first' | 'second' | 'third';
    sol_prize?: number;
    created_at: string;
  }>;
  transactions: Array<{
    id: string;
    xp_amount: number;
    transaction_type: string;
    description: string;
    created_at: string;
  }>;
  breakdown: {
    totalBountyXP: number;
    winnerXP: number;
    participationXP: number;
  };
}

interface BountyXPDisplayProps {
  walletAddress: string;
  className?: string;
}

export const BountyXPDisplay = ({ walletAddress, className = '' }: BountyXPDisplayProps) => {
  const [xpData, setXpData] = useState<UserXPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchXPData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user-xp?wallet=${walletAddress}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch XP data');
        }
        
        const data = await response.json();
        setXpData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load XP data');
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchXPData();
    }
  }, [walletAddress]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-32 bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`bg-red-500/10 border-red-500/30 ${className}`}>
        <CardContent className="p-4">
          <p className="text-red-400 text-sm">Error loading XP data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!xpData) {
    return null;
  }

  const { xp, bountySubmissions, breakdown } = xpData;

  // Calculate stats
  const totalSubmissions = bountySubmissions.length;
  const winningSubmissions = bountySubmissions.filter(sub => sub.placement).length;
  const totalSOLWon = bountySubmissions
    .filter(sub => sub.sol_prize)
    .reduce((total, sub) => total + (sub.sol_prize || 0), 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* XP Overview */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Star className="w-5 h-5 text-yellow-400" />
            Your Bounty XP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{xp.total_xp}</div>
              <div className="text-xs text-gray-400">Total XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{xp.bounty_xp}</div>
              <div className="text-xs text-gray-400">Bounty XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{totalSubmissions}</div>
              <div className="text-xs text-gray-400">Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{totalSOLWon.toFixed(3)}</div>
              <div className="text-xs text-gray-400">SOL Won</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XP Breakdown */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            XP Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Participation XP</span>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
              +{breakdown.participationXP}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Winner Bonuses</span>
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
              +{breakdown.winnerXP}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium">Total Bounty XP</span>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 font-medium">
              {breakdown.totalBountyXP}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      {bountySubmissions.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Award className="w-5 h-5 text-purple-400" />
              Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bountySubmissions.slice(0, 5).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{submission.bounty_id}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {submission.placement && (
                      <Badge 
                        variant="secondary" 
                        className={
                          submission.placement === 'first' ? 'bg-yellow-500/20 text-yellow-400' :
                          submission.placement === 'second' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-orange-500/20 text-orange-400'
                        }
                      >
                        {submission.placement === 'first' ? '🥇' : 
                         submission.placement === 'second' ? '🥈' : '🥉'}
                        {submission.placement}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      +{submission.xp_awarded} XP
                    </Badge>
                    {submission.sol_prize && (
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                        +{submission.sol_prize} SOL
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Bounty Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">{totalSubmissions}</div>
              <div className="text-xs text-gray-400">Total Submissions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">{winningSubmissions}</div>
              <div className="text-xs text-gray-400">Winning Entries</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">
                {totalSubmissions > 0 ? Math.round((winningSubmissions / totalSubmissions) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">{breakdown.totalBountyXP}</div>
              <div className="text-xs text-gray-400">Total Bounty XP</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 