'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, TrendingUp } from 'lucide-react';

interface VotingPowerCardProps {
  walletAddress?: string;
}

interface VotingPower {
  wallet_address: string;
  hood_balance: number;
  xp_amount: number;
  voting_power: number;
  hood_contribution: number;
  xp_contribution: number;
}

export function VotingPowerCard({ walletAddress }: VotingPowerCardProps) {
  const [votingPower, setVotingPower] = useState<VotingPower | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const fetchVotingPower = async () => {
      try {
        const response = await fetch(`/api/governance/voting-power?wallet=${walletAddress}`);
        const data = await response.json();
        
        if (data.success) {
          setVotingPower(data.voting_power);
        }
      } catch (error) {
        console.error('Error fetching voting power:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVotingPower();
  }, [walletAddress]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Your Voting Power</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-12 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!walletAddress || !votingPower) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Your Voting Power</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Connect wallet to see your voting power</p>
        </CardContent>
      </Card>
    );
  }

  const hoodPercentage = votingPower && votingPower.voting_power > 0 
    ? (votingPower.hood_contribution / votingPower.voting_power) * 100 
    : 50;
  const xpPercentage = 100 - hoodPercentage;

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span>Your Voting Power</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Power */}
        <div className="text-center p-4 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-lg border border-purple-500/30">
          <div className="text-sm text-gray-400 mb-1">Total Voting Power</div>
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            {votingPower?.voting_power?.toLocaleString() || '0'}
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          {/* HOOD Contribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>$HOOD Balance</span>
              </span>
              <span className="text-sm font-semibold text-purple-400">
                {votingPower?.hood_contribution?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${hoodPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {votingPower?.hood_balance?.toLocaleString() || '0'} HOOD × 40% = {votingPower?.hood_contribution?.toLocaleString() || '0'}
            </div>
          </div>

          {/* XP Contribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span>XP Amount</span>
              </span>
              <span className="text-sm font-semibold text-cyan-400">
                {votingPower?.xp_contribution?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {votingPower?.xp_amount?.toLocaleString() || '0'} XP × 0.002 × 60% = {votingPower?.xp_contribution?.toLocaleString() || '0'}
            </div>
          </div>
        </div>

        {/* Formula Info */}
        <div className="text-xs text-gray-500 p-3 bg-gray-900/50 rounded border border-gray-700">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-3 h-3" />
            <span className="font-semibold">Voting Power Formula:</span>
          </div>
          <code className="text-gray-400">
            (HOOD × 0.4) + (XP × 0.002 × 0.6)
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

