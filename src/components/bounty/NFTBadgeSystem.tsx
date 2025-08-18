'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Star, Crown, Sparkles } from 'lucide-react';

interface NFTBadge {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  imageUrl: string;
  mintAddress?: string;
  awardedAt?: string;
  submissionId?: string;
}

interface NFTBadgeSystemProps {
  walletAddress?: string;
  approvedSubmissions?: number;
  totalSubmissions?: number;
}

const BADGE_TYPES = {
  FIRST_SUBMISSION: {
    name: 'First Steps',
    description: 'Completed your first submission',
    rarity: 'common' as const,
    icon: Star
  },
  APPROVED_SUBMISSION: {
    name: 'Certified Hoodie Builder',
    description: 'Had a submission approved by the community',
    rarity: 'uncommon' as const,
    icon: Trophy
  },
  TOP_SUBMISSION: {
    name: 'Community Favorite',
    description: 'Received 10+ upvotes on a submission',
    rarity: 'rare' as const,
    icon: Crown
  },
  MULTIPLE_APPROVED: {
    name: 'Consistent Creator',
    description: 'Had 5+ submissions approved',
    rarity: 'epic' as const,
    icon: Award
  },
  LEGENDARY_CREATOR: {
    name: 'Legendary Hoodie Master',
    description: 'Had 10+ submissions approved with high engagement',
    rarity: 'legendary' as const,
    icon: Sparkles
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'uncommon': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'rare': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'epic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'legendary': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const NFTBadgeSystem = ({ 
  walletAddress, 
  approvedSubmissions = 0, 
  totalSubmissions = 0 
}: NFTBadgeSystemProps) => {
  const [userBadges, setUserBadges] = useState<NFTBadge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate which badges the user should have
  const calculateEarnedBadges = (): NFTBadge[] => {
    const earnedBadges: NFTBadge[] = [];

    // First submission badge
    if (totalSubmissions >= 1) {
      earnedBadges.push({
        id: 'first-submission',
        name: BADGE_TYPES.FIRST_SUBMISSION.name,
        description: BADGE_TYPES.FIRST_SUBMISSION.description,
        rarity: BADGE_TYPES.FIRST_SUBMISSION.rarity,
        imageUrl: '/badges/first-submission.png',
        awardedAt: new Date().toISOString()
      });
    }

    // Approved submission badge
    if (approvedSubmissions >= 1) {
      earnedBadges.push({
        id: 'approved-submission',
        name: BADGE_TYPES.APPROVED_SUBMISSION.name,
        description: BADGE_TYPES.APPROVED_SUBMISSION.description,
        rarity: BADGE_TYPES.APPROVED_SUBMISSION.rarity,
        imageUrl: '/badges/certified-builder.png',
        awardedAt: new Date().toISOString()
      });
    }

    // Multiple approved submissions badge
    if (approvedSubmissions >= 5) {
      earnedBadges.push({
        id: 'multiple-approved',
        name: BADGE_TYPES.MULTIPLE_APPROVED.name,
        description: BADGE_TYPES.MULTIPLE_APPROVED.description,
        rarity: BADGE_TYPES.MULTIPLE_APPROVED.rarity,
        imageUrl: '/badges/consistent-creator.png',
        awardedAt: new Date().toISOString()
      });
    }

    // Legendary creator badge
    if (approvedSubmissions >= 10) {
      earnedBadges.push({
        id: 'legendary-creator',
        name: BADGE_TYPES.LEGENDARY_CREATOR.name,
        description: BADGE_TYPES.LEGENDARY_CREATOR.description,
        rarity: BADGE_TYPES.LEGENDARY_CREATOR.rarity,
        imageUrl: '/badges/legendary-master.png',
        awardedAt: new Date().toISOString()
      });
    }

    return earnedBadges;
  };

  const handleClaimBadge = async (badge: NFTBadge) => {
    if (!walletAddress) {
      alert('Please connect your wallet to claim badges');
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would mint an NFT badge
      const response = await fetch('/api/badges/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          badgeId: badge.id,
          walletAddress,
          badgeData: badge
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserBadges(prev => [...prev, { ...badge, mintAddress: data.mintAddress }]);
        alert(`🎉 Badge "${badge.name}" claimed successfully!`);
      }
    } catch (error) {
      console.error('Error claiming badge:', error);
      alert('Failed to claim badge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const earnedBadges = calculateEarnedBadges();

  if (!walletAddress) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            NFT Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">
            Connect your wallet to view and claim your earned badges
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          NFT Badges
        </CardTitle>
        <div className="text-sm text-gray-400">
          {approvedSubmissions} approved submissions • {totalSubmissions} total submissions
        </div>
      </CardHeader>
      <CardContent>
        {earnedBadges.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No badges earned yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Submit quality content to earn badges and build your reputation
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{badge.name}</h3>
                      <Badge className={getRarityColor(badge.rarity)}>
                        {badge.rarity}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-4">{badge.description}</p>
                
                {badge.mintAddress ? (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Trophy className="w-4 h-4" />
                    <span>Claimed</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleClaimBadge(badge)}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isLoading ? 'Claiming...' : 'Claim NFT Badge'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h4 className="text-white font-semibold mb-2">Badge Progress</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">First Steps</span>
              <span className={totalSubmissions >= 1 ? 'text-green-400' : 'text-gray-500'}>
                {totalSubmissions >= 1 ? '✓ Earned' : '0/1 submissions'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Certified Builder</span>
              <span className={approvedSubmissions >= 1 ? 'text-green-400' : 'text-gray-500'}>
                {approvedSubmissions >= 1 ? '✓ Earned' : `${approvedSubmissions}/1 approved`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Consistent Creator</span>
              <span className={approvedSubmissions >= 5 ? 'text-green-400' : 'text-gray-500'}>
                {approvedSubmissions >= 5 ? '✓ Earned' : `${approvedSubmissions}/5 approved`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Legendary Master</span>
              <span className={approvedSubmissions >= 10 ? 'text-green-400' : 'text-gray-500'}>
                {approvedSubmissions >= 10 ? '✓ Earned' : `${approvedSubmissions}/10 approved`}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 