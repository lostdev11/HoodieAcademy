'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Star, Trophy, Users, ShoppingBag, Crown } from 'lucide-react';
import { RetailstarRewardCard, RetailstarRewardCardCompact } from '@/components/retailstar/RetailstarRewardCard';
import { retailstarIncentiveService, RetailstarReward } from '@/services/retailstar-incentive-service';

export default function RetailstarIncentivesPage() {
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [availableRewards, setAvailableRewards] = useState<RetailstarReward[]>([]);
  const [userRewards, setUserRewards] = useState<any[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Get user squad and wallet from localStorage
    const squadResult = localStorage.getItem('userSquad');
    const wallet = localStorage.getItem('walletAddress') || sessionStorage.getItem('walletAddress');
    setWalletAddress(wallet);

    if (squadResult) {
      try {
        const result = JSON.parse(squadResult);
        const squad = typeof result === 'object' && result.name ? result.name : result;
        const normalized = squad.replace(/^[🎨🧠🎤⚔️🦅🏦]+\s*/, '').toLowerCase().trim();
        const squadMapping: { [key: string]: string } = {
          'hoodie creators': 'creators',
          'hoodie decoders': 'decoders', 
          'hoodie speakers': 'speakers',
          'hoodie raiders': 'raiders',
          'treasury builders': 'treasury'
        };
        const squadId = squadMapping[normalized] || normalized;
        setUserSquad(squadId);
        
        // Load available rewards for this squad
        const squadRewards = retailstarIncentiveService.getSquadRewards(squadId);
        setAvailableRewards(squadRewards);

        // Load user's claimed rewards if wallet is available - temporarily disabled
        // if (wallet) {
        //   retailstarIncentiveService.fetchClaimedRewards(wallet).then(setUserRewards);
        // }
      } catch (error) {
        console.error('Error parsing squad result:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const handleClaimReward = async (rewardId: string) => {
    // Temporarily disabled - retailstar rewards not ready yet
    alert('Retailstar rewards are temporarily disabled. Coming soon!');
    return;
    
    // if (!walletAddress) {
    //   alert('Please connect your wallet to claim rewards');
    //   return;
    // }

    // try {
    //   const response = await fetch('/api/retailstar-rewards/claim', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       walletAddress,
    //       rewardId,
    //       metadata: {
    //         claimedAt: new Date().toISOString()
    //       }
    //     })
    //   });

    //   if (response.ok) {
    //     const data = await response.json();
    //     alert(`Reward claimed successfully! ${data.message}`);
        
    //     // Refresh user rewards
    //     const updatedRewards = await retailstarIncentiveService.fetchClaimedRewards(walletAddress);
    //     setUserRewards(updatedRewards);
    //   } else {
    //     const error = await response.json();
    //     alert(`Failed to claim reward: ${error.error}`);
    //   }
    // } catch (error) {
    //   console.error('Error claiming reward:', error);
    //   alert('Failed to claim reward. Please try again.');
    // }
  };

  const filteredRewards = availableRewards.filter(reward => {
    if (selectedRarity !== 'all' && reward.rarity !== selectedRarity) return false;
    if (selectedType !== 'all' && reward.type !== selectedType) return false;
    return true;
  });

  const getRewardsByRarity = (rarity: string) => {
    return availableRewards.filter(reward => reward.rarity === rarity);
  };

  const getRewardsByType = (type: string) => {
    return availableRewards.filter(reward => reward.type === type);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              🛍️ Retailstar Incentive System
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Reward squad members who go above and beyond—without cash payouts. 
            Use lore-backed, utility-rich incentives that build the universe while reinforcing commitment.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border border-indigo-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Available Rewards</p>
                  <p className="text-2xl font-bold text-white">{availableRewards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-indigo-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Claimed Rewards</p>
                  <p className="text-2xl font-bold text-white">{userRewards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-indigo-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Your Squad</p>
                  <p className="text-2xl font-bold text-white capitalize">{userSquad || 'None'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-indigo-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-400">Rare Rewards</p>
                  <p className="text-2xl font-bold text-white">
                    {getRewardsByRarity('rare').length + getRewardsByRarity('epic').length + getRewardsByRarity('legendary').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <TabsList className="bg-gray-900 border border-gray-700">
              <TabsTrigger value="all" className="text-white">All Rewards</TabsTrigger>
              <TabsTrigger value="available" className="text-white">Available</TabsTrigger>
              <TabsTrigger value="claimed" className="text-white">Claimed</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-32 bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Rarity" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Rarity</SelectItem>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="uncommon">Uncommon</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="retail_ticket">Retail Ticket</SelectItem>
                  <SelectItem value="domain_pfp">Domain PFP</SelectItem>
                  <SelectItem value="landing_page">Landing Page</SelectItem>
                  <SelectItem value="lore_access">Lore Access</SelectItem>
                  <SelectItem value="asset_pack">Asset Pack</SelectItem>
                  <SelectItem value="spotlight">Spotlight</SelectItem>
                  <SelectItem value="role_upgrade">Role Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRewards.map((reward) => (
                <RetailstarRewardCard
                  key={reward.id}
                  reward={reward}
                  userSquad={userSquad || undefined}
                  onClaim={handleClaimReward}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="available" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRewards
                .filter(reward => !userRewards.some(ur => ur.rewardId === reward.id))
                .map((reward) => (
                  <RetailstarRewardCard
                    key={reward.id}
                    reward={reward}
                    userSquad={userSquad || undefined}
                    onClaim={handleClaimReward}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="claimed" className="space-y-6">
            {userRewards.length === 0 ? (
              <Card className="bg-gray-900 border border-gray-700">
                <CardContent className="p-8 text-center">
                  <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Rewards Claimed Yet</h3>
                  <p className="text-gray-400">
                    Complete tasks and meet requirements to unlock rewards!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userRewards.map((userReward) => {
                  const reward = availableRewards.find(r => r.id === userReward.rewardId);
                  if (!reward) return null;
                  
                  return (
                    <RetailstarRewardCard
                      key={userReward.id}
                      reward={reward}
                      isAwarded={true}
                      userSquad={userSquad || undefined}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Tiered Bonus System */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">🎯 Tiered Bonus System</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-900 border border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-400">✅ Basic Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">Meet minimum requirements</p>
                <div className="space-y-2">
                  {retailstarIncentiveService.getTieredBonuses('basic', userSquad || '').map((reward) => (
                    <RetailstarRewardCardCompact
                      key={reward.id}
                      reward={reward}
                      className="bg-green-500/10 border-green-500/20"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-blue-400">🔥 Excellent Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">Go above and beyond</p>
                <div className="space-y-2">
                  {retailstarIncentiveService.getTieredBonuses('excellent', userSquad || '').map((reward) => (
                    <RetailstarRewardCardCompact
                      key={reward.id}
                      reward={reward}
                      className="bg-blue-500/10 border-blue-500/20"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400">🧠 Creative Extra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">Show exceptional creativity</p>
                <div className="space-y-2">
                  {retailstarIncentiveService.getTieredBonuses('creative', userSquad || '').map((reward) => (
                    <RetailstarRewardCardCompact
                      key={reward.id}
                      reward={reward}
                      className="bg-purple-500/10 border-purple-500/20"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 