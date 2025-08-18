'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Award, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { bountyXPService } from '@/services/bounty-xp-service';

interface Submission {
  id: string;
  title: string;
  description: string;
  wallet_address: string;
  squad?: string;
  created_at: string;
  upvotes: any;
  total_upvotes: number;
}

interface WinnerAwardPanelProps {
  submissions: Submission[];
  bountyId: string;
  onWinnerAwarded?: () => void;
  className?: string;
}

export const WinnerAwardPanel = ({ 
  submissions, 
  bountyId, 
  onWinnerAwarded,
  className = '' 
}: WinnerAwardPanelProps) => {
  const [selectedSubmission, setSelectedSubmission] = useState<string>('');
  const [placement, setPlacement] = useState<'first' | 'second' | 'third'>('first');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const xpRules = bountyXPService.getXPRules();

  const getWinnerBonus = (placement: 'first' | 'second' | 'third') => {
    return xpRules.winnerBonuses[placement];
  };

  const handleAwardWinner = async () => {
    if (!selectedSubmission) {
      setError('Please select a submission');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const submission = submissions.find(s => s.id === selectedSubmission);
      if (!submission) {
        throw new Error('Submission not found');
      }

      const bonus = getWinnerBonus(placement);

      const response = await fetch('/api/submissions/award-winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: selectedSubmission,
          walletAddress: submission.wallet_address,
          bountyId,
          placement,
          xpBonus: bonus.xp,
          solPrize: bonus.sol
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to award winner');
      }

      const result = await response.json();
      setSuccess(`Winner awarded! +${bonus.xp} XP + ${bonus.sol} SOL`);
      
      // Reset form
      setSelectedSubmission('');
      setPlacement('first');
      
      // Callback to refresh data
      if (onWinnerAwarded) {
        onWinnerAwarded();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award winner');
    } finally {
      setLoading(false);
    }
  };

  // Sort submissions by upvotes
  const sortedSubmissions = [...submissions].sort((a, b) => b.total_upvotes - a.total_upvotes);

  return (
    <Card className={`bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Award Winners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Winner Bonuses Info */}
        <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            Winner Bonuses
          </h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center p-2 bg-yellow-500/20 rounded">
              <div className="text-yellow-400 font-bold">🥇 1st</div>
              <div className="text-white">+{xpRules.winnerBonuses.first.xp} XP</div>
              <div className="text-blue-400">+{xpRules.winnerBonuses.first.sol} SOL</div>
            </div>
            <div className="text-center p-2 bg-gray-500/20 rounded">
              <div className="text-gray-400 font-bold">🥈 2nd</div>
              <div className="text-white">+{xpRules.winnerBonuses.second.xp} XP</div>
              <div className="text-blue-400">+{xpRules.winnerBonuses.second.sol} SOL</div>
            </div>
            <div className="text-center p-2 bg-orange-500/20 rounded">
              <div className="text-orange-400 font-bold">🥉 3rd</div>
              <div className="text-white">+{xpRules.winnerBonuses.third.xp} XP</div>
              <div className="text-blue-400">+{xpRules.winnerBonuses.third.sol} SOL</div>
            </div>
          </div>
        </div>

        {/* Award Form */}
        <div className="space-y-4">
          <div>
            <label className="text-white text-sm font-medium">Select Submission</label>
            <Select value={selectedSubmission} onValueChange={setSelectedSubmission}>
              <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Choose a submission to award" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {sortedSubmissions.map((submission) => (
                  <SelectItem key={submission.id} value={submission.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{submission.title}</span>
                      <Badge variant="secondary" className="ml-2">
                        {submission.total_upvotes} ⬆️
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-white text-sm font-medium">Placement</label>
            <Select value={placement} onValueChange={(value: 'first' | 'second' | 'third') => setPlacement(value)}>
              <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="first">🥇 1st Place</SelectItem>
                <SelectItem value="second">🥈 2nd Place</SelectItem>
                <SelectItem value="third">🥉 3rd Place</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedSubmission && (
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium">Award Preview</span>
              </div>
              <div className="text-sm text-gray-300">
                <div>XP Bonus: +{getWinnerBonus(placement).xp} XP</div>
                <div>SOL Prize: +{getWinnerBonus(placement).sol} SOL</div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">{success}</span>
            </div>
          )}

          <Button
            onClick={handleAwardWinner}
            disabled={!selectedSubmission || loading}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold"
          >
            {loading ? 'Awarding...' : `Award ${placement} Place`}
          </Button>
        </div>

        {/* Top Submissions List */}
        <div className="mt-6">
          <h4 className="text-white font-medium mb-3">Top Submissions by Upvotes</h4>
          <div className="space-y-2">
            {sortedSubmissions.slice(0, 5).map((submission, index) => (
              <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                  <div>
                    <div className="text-white font-medium">{submission.title}</div>
                    <div className="text-xs text-gray-400">
                      {submission.wallet_address.slice(0, 6)}...{submission.wallet_address.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    {submission.total_upvotes} ⬆️
                  </Badge>
                  {submission.squad && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                      {submission.squad}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 