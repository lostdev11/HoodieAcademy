'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  RefreshCw,
  Crown,
  Star,
  Zap,
  Target
} from 'lucide-react';
import TokenGate from '@/components/TokenGate';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MobileNavigation } from '@/components/dashboard/MobileNavigation';
import { getSquadName } from '@/utils/squad-storage';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';

interface LeaderboardUser {
  wallet_address: string;
  display_name: string;
  total_xp: number;
  level: number;
  squad?: string;
  rank: number;
  xpToNextLevel: number;
  progressToNextLevel: number;
  profile_picture?: string | null;
}

export default function LeaderboardPageClient() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterSquad, setFilterSquad] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'all-time' | 'monthly' | 'weekly'>('all-time');

  useEffect(() => {
    const wallet = localStorage.getItem('walletAddress');
    if (wallet) {
      setWalletAddress(wallet);
    }

    const squad = getSquadName();
    if (squad) {
      setUserSquad(squad);
    }

    fetchLeaderboard();
  }, [filterSquad, timeframe]);

  useEffect(() => {
    if (walletAddress) {
      fetchUserRank();
    }
  }, [walletAddress, filterSquad]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        timeframe
      });

      if (filterSquad) {
        params.append('squad', filterSquad);
      }

      const response = await fetch(`/api/leaderboard?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.leaderboard) {
        // Ensure all required fields are present
        const sanitizedLeaderboard = data.leaderboard.map((user: any) => ({
          wallet_address: user.wallet_address || '',
          display_name: user.display_name || `${user.wallet_address?.slice(0, 6)}...${user.wallet_address?.slice(-4)}` || 'Unknown',
          total_xp: user.total_xp || 0,
          level: user.level || Math.floor((user.total_xp || 0) / 1000) + 1,
          squad: user.squad || undefined,
          rank: user.rank || 0,
          xpToNextLevel: user.xpToNextLevel || 1000,
          progressToNextLevel: user.progressToNextLevel || 0,
          profile_picture: user.profile_picture || null
        }));
        
        // Sort by rank to ensure correct order
        sanitizedLeaderboard.sort((a: any, b: any) => a.rank - b.rank);
        
        setLeaderboard(sanitizedLeaderboard);
      } else {
        console.error('API returned unsuccessful response:', data);
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    if (!walletAddress) return;
    
    try {
      const params = new URLSearchParams({
        wallet: walletAddress
      });

      if (filterSquad) {
        params.append('squad', filterSquad);
      }

      const response = await fetch(`/api/leaderboard?${params}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User not found in leaderboard
          setCurrentUserRank(null);
          return;
        }
        throw new Error(`Failed to fetch user rank: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.user) {
        // Ensure all required fields are present
        const sanitizedUser = {
          wallet_address: data.user.wallet_address || walletAddress,
          display_name: data.user.display_name || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          total_xp: data.user.total_xp || 0,
          level: data.user.level || Math.floor((data.user.total_xp || 0) / 1000) + 1,
          squad: data.user.squad || undefined,
          rank: data.user.rank || 0,
          xpToNextLevel: data.user.xpToNextLevel || 1000,
          progressToNextLevel: data.user.progressToNextLevel || 0,
          profile_picture: data.user.profile_picture || null
        };
        
        setCurrentUserRank(sanitizedUser);
      } else {
        setCurrentUserRank(null);
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
      setCurrentUserRank(null);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500 to-yellow-600 border-yellow-400';
    if (rank === 2) return 'from-gray-300 to-gray-400 border-gray-300';
    if (rank === 3) return 'from-orange-500 to-orange-600 border-orange-400';
    if (rank <= 10) return 'from-cyan-500 to-purple-600 border-cyan-400';
    return 'from-slate-600 to-slate-700 border-slate-500';
  };

  const squads = ['Creators', 'Decoders', 'Speakers', 'Raiders', 'Rangers'];

  return (
    <TokenGate>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <DashboardSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-800/50 border-b border-cyan-500/30 px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <MobileNavigation userSquad={userSquad} isAdmin={false} />
                <div>
                  <h1 className="text-3xl font-bold text-cyan-400">🏆 Leaderboard</h1>
                  <p className="text-gray-300">Top XP earners in the academy</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full space-y-6">
            {/* Current User Rank Card */}
            {currentUserRank && (
              <Card className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-cyan-500/50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                        #{currentUserRank.rank}
                      </div>
                      <ProfileAvatar pfpUrl={currentUserRank.profile_picture} size={64} />
                      <div>
                        <p className="text-sm text-gray-400">Your Rank</p>
                        <p className="text-2xl font-bold text-white">{currentUserRank.display_name}</p>
                        <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400 mt-1">
                          Level {currentUserRank.level}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-sm text-gray-400">Total XP</p>
                      <p className="text-3xl font-bold text-cyan-400">{currentUserRank.total_xp.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {currentUserRank.xpToNextLevel} XP to level {currentUserRank.level + 1}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={currentUserRank.progressToNextLevel} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-2">
                <Button
                  variant={timeframe === 'all-time' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('all-time')}
                  className={timeframe === 'all-time' ? 'bg-cyan-600' : ''}
                >
                  All Time
                </Button>
                <Button
                  variant={timeframe === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('monthly')}
                  className={timeframe === 'monthly' ? 'bg-cyan-600' : ''}
                >
                  This Month
                </Button>
                <Button
                  variant={timeframe === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('weekly')}
                  className={timeframe === 'weekly' ? 'bg-cyan-600' : ''}
                >
                  This Week
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={!filterSquad ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSquad(null)}
                  className={!filterSquad ? 'bg-purple-600' : ''}
                >
                  <Users className="w-4 h-4 mr-1" />
                  All Squads
                </Button>
                {squads.map(squad => (
                  <Button
                    key={squad}
                    variant={filterSquad === squad ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterSquad(squad)}
                    className={filterSquad === squad ? 'bg-purple-600' : ''}
                  >
                    {squad}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchLeaderboard();
                  fetchUserRank();
                }}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>

            {/* Leaderboard */}
            {loading ? (
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardContent className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                  <p className="text-gray-400">Loading leaderboard...</p>
                </CardContent>
              </Card>
            ) : leaderboard.length === 0 ? (
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No users found</h3>
                  <p className="text-gray-500">Be the first to earn XP!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {leaderboard.map(user => (
                  <Card
                    key={user.wallet_address}
                    className={`${
                      user.wallet_address === walletAddress
                        ? 'bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-cyan-400'
                        : 'bg-slate-800/50 border-slate-600/50'
                    } hover:border-cyan-500/50 transition-colors`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Rank */}
                          <div
                            className={`w-14 h-14 bg-gradient-to-br ${getRankColor(
                              user.rank
                            )} border-2 rounded-full flex items-center justify-center flex-shrink-0`}
                          >
                            {getRankIcon(user.rank) || (
                              <span className="text-xl font-bold text-white">#{user.rank}</span>
                            )}
                          </div>

                          <ProfileAvatar pfpUrl={user.profile_picture} size={56} />

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-lg font-semibold text-white truncate">
                                {user.display_name || `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`}
                              </p>
                              {user.wallet_address === walletAddress && (
                                <Badge className="bg-cyan-600 text-xs">You</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                                Level {user.level}
                              </Badge>
                              {user.squad && (
                                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                                  {user.squad}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* XP */}
                          <div className="text-right">
                            <p className="text-2xl font-bold text-cyan-400">
                              {user.total_xp.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">XP</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </TokenGate>
  );
}
