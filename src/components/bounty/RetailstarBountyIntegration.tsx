'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Gift, Star, Target, Zap } from 'lucide-react';
import { RetailstarRewardCardCompact } from '@/components/retailstar/RetailstarRewardCard';
import { retailstarIncentiveService, RetailstarReward } from '@/services/retailstar-incentive-service';

interface RetailstarBountyIntegrationProps {
  bountyId: string;
  submissionCount: number;
  placement?: 'first' | 'second' | 'third';
  userSquad?: string;
  walletAddress?: string;
}

export const RetailstarBountyIntegration = ({
  bountyId,
  submissionCount,
  placement,
  userSquad,
  walletAddress
}: RetailstarBountyIntegrationProps) => {
  const [availableRewards, setAvailableRewards] = useState<RetailstarReward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userSquad) {
      // Calculate available rewards based on user performance
      const rewards = retailstarIncentiveService.calculateAvailableRewards(
        walletAddress || '',
        userSquad,
        submissionCount,
        placement
      );
      setAvailableRewards(rewards);
    }
    setIsLoading(false);
  }, [userSquad, submissionCount, placement, walletAddress]);

  const handleClaimReward = async (rewardId: string) => {
    if (!walletAddress) {
      console.error('No wallet address available');
      return;
    }

    try {
      const response = await fetch('/api/retailstar-rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          rewardId,
          metadata: {
            bountyId,
            submissionCount,
            placement
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh claimed rewards
        const rewardsResponse = await fetch(`/api/retailstar-rewards/claim?walletAddress=${walletAddress}`);
        const rewardsResult = await rewardsResponse.json();
        if (rewardsResult.success) {
          setClaimedRewards(rewardsResult.rewards);
        }
        
        // Remove from available rewards
        setAvailableRewards(prev => prev.filter(r => r.id !== rewardId));
      } else {
        console.error('Failed to claim reward:', result.error);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  const getTieredBonuses = () => {
    if (!userSquad) return { basic: [], excellent: [], creative: [] };

    let performance: 'basic' | 'excellent' | 'creative' = 'basic';
    
    if (submissionCount >= 3 && placement === 'first') {
      performance = 'creative';
    } else if (submissionCount >= 2 && (placement === 'first' || placement === 'second')) {
      performance = 'excellent';
    }

    return {
      basic: retailstarIncentiveService.getTieredBonuses('basic', userSquad),
      excellent: retailstarIncentiveService.getTieredBonuses('excellent', userSquad),
      creative: retailstarIncentiveService.getTieredBonuses('creative', userSquad),
      currentPerformance: performance
    };
  };

  const tieredBonuses = getTieredBonuses();

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border border-indigo-500/30">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card className="bg-gray-900 border border-indigo-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="w-5 h-5 text-indigo-400" />
            🎯 Bounty Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{submissionCount}</div>
              <div className="text-sm text-gray-400">Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {placement ? `${placement} place` : 'No placement'}
              </div>
              <div className="text-sm text-gray-400">Placement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{availableRewards.length}</div>
              <div className="text-sm text-gray-400">Available Rewards</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Performance Level</span>
              <span className="text-white capitalize">{tieredBonuses.currentPerformance}</span>
            </div>
            <Progress 
              value={
                tieredBonuses.currentPerformance === 'creative' ? 100 :
                tieredBonuses.currentPerformance === 'excellent' ? 66 :
                33
              } 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      {availableRewards.length > 0 && (
        <Card className="bg-gray-900 border border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Gift className="w-5 h-5" />
              🎁 Available Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableRewards.map((reward) => (
                <RetailstarRewardCardCompact
                  key={reward.id}
                  reward={reward}
                  isEligible={true}
                  onClaim={handleClaimReward}
                  className="bg-green-500/10 border-green-500/20"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tiered Bonus System */}
      <Card className="bg-gray-900 border border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Zap className="w-5 h-5" />
            ⚡ Tiered Bonus System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Basic Tier */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  ✅ Basic
                </Badge>
                <span className="text-sm text-gray-400">Meet minimum requirements</span>
              </div>
              <div className="space-y-1">
                {tieredBonuses.basic.map((reward) => (
                  <RetailstarRewardCardCompact
                    key={reward.id}
                    reward={reward}
                    className="bg-green-500/5 border-green-500/10"
                  />
                ))}
              </div>
            </div>

            {/* Excellent Tier */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  🔥 Excellent
                </Badge>
                <span className="text-sm text-gray-400">Go above and beyond</span>
              </div>
              <div className="space-y-1">
                {tieredBonuses.excellent.map((reward) => (
                  <RetailstarRewardCardCompact
                    key={reward.id}
                    reward={reward}
                    className="bg-blue-500/5 border-blue-500/10"
                  />
                ))}
              </div>
            </div>

            {/* Creative Tier */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                  🧠 Creative
                </Badge>
                <span className="text-sm text-gray-400">Show exceptional creativity</span>
              </div>
              <div className="space-y-1">
                {tieredBonuses.creative.map((reward) => (
                  <RetailstarRewardCardCompact
                    key={reward.id}
                    reward={reward}
                    className="bg-purple-500/5 border-purple-500/10"
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Squad-Specific Rewards */}
      {userSquad && (
        <Card className="bg-gray-900 border border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <Star className="w-5 h-5" />
              🎯 {userSquad.charAt(0).toUpperCase() + userSquad.slice(1)} Squad Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-4">
              Special rewards tailored for your squad's mission and expertise.
            </p>
            <div className="space-y-2">
              {retailstarIncentiveService.getSquadRewards(userSquad)
                .filter(reward => !availableRewards.some(ar => ar.id === reward.id))
                .slice(0, 3)
                .map((reward) => (
                  <RetailstarRewardCardCompact
                    key={reward.id}
                    reward={reward}
                    className="bg-orange-500/5 border-orange-500/10"
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 