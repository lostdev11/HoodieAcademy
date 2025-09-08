'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Star, Target, Users, Award, TrendingUp, 
  CheckCircle, Clock, AlertCircle, Zap, Medal, Crown,
  BarChart3, Activity, Gift, Coins
} from 'lucide-react';
import { bountyXPService } from '@/services/bounty-xp-service';

interface BountySubmission {
  id: string;
  wallet_address: string;
  bounty_id: string;
  submission_id: string;
  xp_awarded: number;
  placement?: 'first' | 'second' | 'third';
  sol_prize: number;
  created_at: string;
  updated_at: string;
  bounty?: {
    id: string;
    title: string;
    short_desc: string;
    reward: string;
    reward_type: 'XP' | 'SOL';
    status: 'active' | 'completed' | 'expired';
    squad_tag?: string;
  };
  submission?: {
    id: string;
    title: string;
    description: string;
    image_url?: string;
    created_at: string;
  };
}

interface BountyXPStats {
  totalSubmissions: number;
  totalXP: number;
  totalSOL: number;
  wins: number;
  pendingSubmissions: number;
  averageXPPerSubmission: number;
  topPerformers: Array<{
    wallet_address: string;
    totalXP: number;
    totalSOL: number;
    submissions: number;
    wins: number;
  }>;
}

interface BountyXPManagerProps {
  walletAddress: string | null;
}

export default function BountyXPManager({ walletAddress }: BountyXPManagerProps) {
  const [submissions, setSubmissions] = useState<BountySubmission[]>([]);
  const [stats, setStats] = useState<BountyXPStats>({
    totalSubmissions: 0,
    totalXP: 0,
    totalSOL: 0,
    wins: 0,
    pendingSubmissions: 0,
    averageXPPerSubmission: 0,
    topPerformers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBounty, setSelectedBounty] = useState<string | null>(null);

  // Get XP rules from service
  const xpRules = bountyXPService.getXPRules();

  // Fetch all bounty submissions and calculate stats
  useEffect(() => {
    const fetchBountyData = async () => {
      if (!walletAddress) return;
      
      setLoading(true);
      setError(null);

      try {
        // Fetch user bounty data (this will get all submissions for admin view)
        const response = await fetch(`/api/admin/bounty-submissions?wallet=${walletAddress}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch bounty submissions');
        }

        const data = await response.json();
        setSubmissions(data.submissions || []);

        // Calculate comprehensive stats
        const calculatedStats = calculateBountyStats(data.submissions || []);
        setStats(calculatedStats);

      } catch (err) {
        console.error('Error fetching bounty data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch bounty data');
      } finally {
        setLoading(false);
      }
    };

    fetchBountyData();
  }, [walletAddress]);

  const calculateBountyStats = (submissions: BountySubmission[]): BountyXPStats => {
    const totalSubmissions = submissions.length;
    const totalXP = submissions.reduce((sum, sub) => sum + sub.xp_awarded, 0);
    const totalSOL = submissions.reduce((sum, sub) => sum + sub.sol_prize, 0);
    const wins = submissions.filter(sub => sub.placement).length;
    const pendingSubmissions = submissions.filter(sub => !sub.placement).length;
    const averageXPPerSubmission = totalSubmissions > 0 ? totalXP / totalSubmissions : 0;

    // Calculate top performers
    const performerMap = new Map<string, {
      wallet_address: string;
      totalXP: number;
      totalSOL: number;
      submissions: number;
      wins: number;
    }>();

    submissions.forEach(sub => {
      const wallet = sub.wallet_address;
      if (!performerMap.has(wallet)) {
        performerMap.set(wallet, {
          wallet_address: wallet,
          totalXP: 0,
          totalSOL: 0,
          submissions: 0,
          wins: 0
        });
      }

      const performer = performerMap.get(wallet)!;
      performer.totalXP += sub.xp_awarded;
      performer.totalSOL += sub.sol_prize;
      performer.submissions += 1;
      if (sub.placement) performer.wins += 1;
    });

    const topPerformers = Array.from(performerMap.values())
      .sort((a, b) => b.totalXP - a.totalXP)
      .slice(0, 10);

    return {
      totalSubmissions,
      totalXP,
      totalSOL,
      wins,
      pendingSubmissions,
      averageXPPerSubmission,
      topPerformers
    };
  };

  const handleAwardWinner = async (submissionId: string, placement: 'first' | 'second' | 'third') => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const response = await fetch('/api/submissions/award-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          placement,
          walletAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to award winner');
      }

      // Refresh data
      const updatedSubmissions = submissions.map(sub => 
        sub.id === submissionId 
          ? { ...sub, placement, xp_awarded: sub.xp_awarded + xpRules.winnerBonuses[placement].xp, sol_prize: sub.sol_prize + xpRules.winnerBonuses[placement].sol }
          : sub
      );
      setSubmissions(updatedSubmissions);
      setStats(calculateBountyStats(updatedSubmissions));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award winner');
    } finally {
      setLoading(false);
    }
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getPlacementIcon = (placement?: string) => {
    switch (placement) {
      case 'first': return '🥇';
      case 'second': return '🥈';
      case 'third': return '🥉';
      default: return '📝';
    }
  };

  const getPlacementColor = (placement?: string) => {
    switch (placement) {
      case 'first': return 'text-yellow-400';
      case 'second': return 'text-gray-400';
      case 'third': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading bounty XP data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Bounty XP Management
          </h2>
          <p className="text-slate-400">Track and manage bounty XP rewards and winner bonuses</p>
        </div>
      </div>

      {/* XP System Rules Display */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-400 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Bounty XP System Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400">+{xpRules.participationXP} XP</div>
              <div className="text-sm text-gray-400">Per Submission</div>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{xpRules.maxSubmissionsPerBounty}</div>
              <div className="text-sm text-gray-400">Max Submissions</div>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{xpRules.participationXP * xpRules.maxSubmissionsPerBounty} XP</div>
              <div className="text-sm text-gray-400">Max Participation</div>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{xpRules.winnerBonuses.first.xp} XP</div>
              <div className="text-sm text-gray-400">1st Place Bonus</div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <div className="text-lg font-bold text-yellow-400">🥇 1st Place</div>
              <div className="text-sm text-yellow-300">+{xpRules.winnerBonuses.first.xp} XP + {xpRules.winnerBonuses.first.sol} SOL</div>
            </div>
            <div className="text-center p-3 bg-gray-500/10 rounded-lg border border-gray-500/30">
              <div className="text-lg font-bold text-gray-400">🥈 2nd Place</div>
              <div className="text-sm text-gray-300">+{xpRules.winnerBonuses.second.xp} XP + {xpRules.winnerBonuses.second.sol} SOL</div>
            </div>
            <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <div className="text-lg font-bold text-orange-400">🥉 3rd Place</div>
              <div className="text-sm text-orange-300">+{xpRules.winnerBonuses.third.xp} XP + {xpRules.winnerBonuses.third.sol} SOL</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.totalSubmissions}</div>
            <p className="text-xs text-slate-500">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total XP Awarded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.totalXP.toLocaleString()}</div>
            <p className="text-xs text-slate-500">XP distributed</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total SOL Awarded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.totalSOL.toFixed(3)}</div>
            <p className="text-xs text-slate-500">SOL distributed</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Winner Awards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.wins}</div>
            <p className="text-xs text-slate-500">Winners awarded</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="winners">Winners</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">All Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">No Submissions Yet</h3>
                  <p className="text-slate-500">Bounty submissions will appear here once users start participating.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            submission.placement 
                              ? 'bg-yellow-500/20' 
                              : 'bg-blue-500/20'
                          }`}>
                            <span className="text-2xl">{getPlacementIcon(submission.placement)}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {submission.bounty?.title || 'Unknown Bounty'}
                            </h4>
                            <p className="text-sm text-gray-400">
                              Submitted by {formatWalletAddress(submission.wallet_address)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(submission.created_at).toLocaleDateString()}
                            </p>
                            {submission.bounty?.squad_tag && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs mt-1">
                                {submission.bounty.squad_tag}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`font-semibold ${getPlacementColor(submission.placement)}`}>
                              {submission.placement ? `${submission.placement.charAt(0).toUpperCase() + submission.placement.slice(1)} Place` : 'Pending Review'}
                            </span>
                            {!submission.placement && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleAwardWinner(submission.id, 'first')}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-xs px-2 py-1"
                                >
                                  🥇
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAwardWinner(submission.id, 'second')}
                                  className="bg-gray-600 hover:bg-gray-700 text-xs px-2 py-1"
                                >
                                  🥈
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAwardWinner(submission.id, 'third')}
                                  className="bg-orange-600 hover:bg-orange-700 text-xs px-2 py-1"
                                >
                                  🥉
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="text-sm">
                            <p className="text-green-400">+{submission.xp_awarded} XP</p>
                            {submission.sol_prize > 0 && (
                              <p className="text-green-400">+{submission.sol_prize} SOL</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Winners Tab */}
        <TabsContent value="winners" className="space-y-4">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Awarded Winners</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.filter(sub => sub.placement).length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">No Winners Yet</h3>
                  <p className="text-slate-500">Award winners by clicking the medal buttons in the submissions tab.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions
                    .filter(sub => sub.placement)
                    .sort((a, b) => {
                      const order = { first: 1, second: 2, third: 3 };
                      return (order[a.placement!] || 999) - (order[b.placement!] || 999);
                    })
                    .map((submission) => (
                    <div key={submission.id} className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{getPlacementIcon(submission.placement)}</div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {submission.bounty?.title || 'Unknown Bounty'}
                            </h4>
                            <p className="text-sm text-gray-400">
                              Winner: {formatWalletAddress(submission.wallet_address)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Awarded {new Date(submission.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-yellow-400">
                            {submission.placement ? submission.placement.charAt(0).toUpperCase() + submission.placement.slice(1) + ' Place' : 'Unknown Place'}
                          </div>
                          <div className="text-sm">
                            <p className="text-green-400">+{submission.xp_awarded} XP</p>
                            {submission.sol_prize > 0 && (
                              <p className="text-green-400">+{submission.sol_prize} SOL</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topPerformers.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">No Data Yet</h3>
                  <p className="text-slate-500">Leaderboard will populate as users participate in bounties.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topPerformers.map((performer, index) => (
                    <div key={performer.wallet_address} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {formatWalletAddress(performer.wallet_address)}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {performer.submissions} submission{performer.submissions !== 1 ? 's' : ''} • {performer.wins} win{performer.wins !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-400">
                            {performer.totalXP.toLocaleString()} XP
                          </div>
                          {performer.totalSOL > 0 && (
                            <div className="text-sm text-green-400">
                              {performer.totalSOL.toFixed(3)} SOL
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
