'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Lock, Unlock, Gift } from 'lucide-react';
import { RetailstarReward } from '@/services/retailstar-incentive-service';

interface RetailstarRewardCardProps {
  reward: RetailstarReward;
  isEligible?: boolean;
  isAwarded?: boolean;
  userSquad?: string;
  onClaim?: (rewardId: string) => void;
  className?: string;
}

const rarityColors = {
  common: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  uncommon: 'bg-green-500/20 text-green-300 border-green-500/30',
  rare: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  legendary: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
};

const rarityIcons = {
  common: '⭐',
  uncommon: '⭐⭐',
  rare: '⭐⭐⭐',
  epic: '⭐⭐⭐⭐',
  legendary: '⭐⭐⭐⭐⭐'
};

const squadIcons = {
  creators: '🎨',
  speakers: '🎤',
  decoders: '🧠',
  raiders: '⚔️'
};

export const RetailstarRewardCard = ({
  reward,
  isEligible = false,
  isAwarded = false,
  userSquad,
  onClaim,
  className = ''
}: RetailstarRewardCardProps) => {
  const getSquadDisplay = () => {
    return reward.squadAlignment.map(squad => 
      `${squadIcons[squad as keyof typeof squadIcons] || '🎯'} ${squad}`
    ).join(', ');
  };

  const getRequirementsText = () => {
    const reqs = [];
    if (reward.requirements.minSubmissions) {
      reqs.push(`${reward.requirements.minSubmissions}+ submissions`);
    }
    if (reward.requirements.minPlacement) {
      reqs.push(`${reward.requirements.minPlacement} place+`);
    }
    if (reward.requirements.specialCriteria) {
      reqs.push(`${reward.requirements.specialCriteria}`);
    }
    return reqs.join(' • ');
  };

  return (
    <Card className={`bg-gray-900 border border-indigo-500/30 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            {reward.name}
            {isAwarded && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                <Gift className="w-3 h-3 mr-1" />
                Awarded
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <span className="text-sm">{rarityIcons[reward.rarity]}</span>
            <Badge variant="secondary" className={rarityColors[reward.rarity]}>
              {reward.rarity}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-gray-300 text-sm">{reward.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-indigo-300 text-sm">🎯 Squad Alignment</span>
            <span className="text-white text-sm">{getSquadDisplay()}</span>
          </div>
          
          {reward.requirements && Object.keys(reward.requirements).length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-indigo-300 text-sm">📋 Requirements</span>
              <span className="text-white text-sm">{getRequirementsText()}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-indigo-300 text-sm">🎁 Type</span>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
              {reward.type.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        {!isAwarded && (
          <div className="pt-2">
            {isEligible ? (
              <Button 
                onClick={() => onClaim?.(reward.id)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Claim Reward
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                <Lock className="w-4 h-4" />
                Requirements not met
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compact variant for use in lists
export const RetailstarRewardCardCompact = ({
  reward,
  isEligible = false,
  isAwarded = false,
  onClaim,
  className = ''
}: {
  reward: RetailstarReward;
  isEligible?: boolean;
  isAwarded?: boolean;
  onClaim?: (rewardId: string) => void;
  className?: string;
}) => {
  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-800/70 transition-colors ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{reward.name.split(' ')[0]}</span>
          <span className="text-sm text-gray-400">{reward.name.split(' ').slice(1).join(' ')}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={rarityColors[reward.rarity]}>
            {rarityIcons[reward.rarity]}
          </Badge>
          
          {isAwarded ? (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
              <Gift className="w-3 h-3 mr-1" />
              Awarded
            </Badge>
          ) : isEligible ? (
            <Button 
              size="sm"
              onClick={() => onClaim?.(reward.id)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              Claim
            </Button>
          ) : (
            <Lock className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}; 