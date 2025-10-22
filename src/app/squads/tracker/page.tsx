'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Activity,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MobileNavigation } from '@/components/dashboard/MobileNavigation';
import TokenGate from '@/components/TokenGate';
import SquadMembersList from '@/components/squads/SquadMembersList';
import SquadRankingsCard from '@/components/squads/SquadRankingsCard';
import SquadBadge from '@/components/SquadBadge';

const SQUADS = [
  { name: 'Creators', emoji: '🎨', id: 'creators' },
  { name: 'Decoders', emoji: '🧠', id: 'decoders' },
  { name: 'Speakers', emoji: '🎤', id: 'speakers' },
  { name: 'Raiders', emoji: '⚔️', id: 'raiders' },
  { name: 'Rangers', emoji: '🦅', id: 'rangers' }
];

export default function SquadTrackerPage() {
  const [selectedSquad, setSelectedSquad] = useState<string>('Creators');
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Get wallet and squad from localStorage
    const wallet = localStorage.getItem('walletAddress');
    if (wallet) {
      setWalletAddress(wallet);
      fetchUserSquad(wallet);
    }

    // Listen for squad updates
    const handleSquadUpdate = () => {
      if (wallet) fetchUserSquad(wallet);
    };

    window.addEventListener('squadUpdated', handleSquadUpdate);
    window.addEventListener('storage', handleSquadUpdate);

    return () => {
      window.removeEventListener('squadUpdated', handleSquadUpdate);
      window.removeEventListener('storage', handleSquadUpdate);
    };
  }, []);

  const fetchUserSquad = async (wallet: string) => {
    try {
      const response = await fetch(`/api/user-profile?wallet=${wallet}`);
      const data = await response.json();
      
      if (data.success && data.profile?.squad?.name) {
        const squad = data.profile.squad.name;
        setUserSquad(squad);
        setSelectedSquad(squad); // Auto-select user's squad
      }
    } catch (error) {
      console.error('Error fetching user squad:', error);
    }
  };

  return (
    <TokenGate>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Sidebar */}
        <DashboardSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-800/50 border-b border-purple-500/30 px-4 py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <MobileNavigation userSquad={userSquad} isAdmin={false} />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-purple-400">
                    🏆 Squad Tracker
                  </h1>
                  <p className="text-sm text-gray-300">
                    Track squad performance, members, and rankings
                  </p>
                </div>
              </div>
              
              {userSquad && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Your Squad:</span>
                  <SquadBadge squad={userSquad} walletAddress={walletAddress} />
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
            {/* Quick Stats Banner */}
            <Card className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Squad Competition</h2>
                    <p className="text-sm text-gray-300">
                      Real-time tracking of all squads across the academy
                    </p>
                  </div>
                  <Trophy className="w-12 h-12 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="rankings" className="space-y-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-3 w-full md:w-auto bg-slate-800/50">
                <TabsTrigger value="rankings" className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>Rankings</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Members</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </TabsTrigger>
              </TabsList>

              {/* Rankings Tab */}
              <TabsContent value="rankings" className="space-y-4">
                <SquadRankingsCard highlightSquad={userSquad || undefined} />
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-4">
                {/* Squad Selector */}
                <Card className="bg-slate-800/50 border-cyan-500/30">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {SQUADS.map((squad) => (
                        <Button
                          key={squad.id}
                          variant={selectedSquad === squad.name ? 'default' : 'outline'}
                          onClick={() => setSelectedSquad(squad.name)}
                          className={`${
                            selectedSquad === squad.name
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : ''
                          } ${
                            userSquad === squad.name
                              ? 'border-cyan-500/50 border-2'
                              : ''
                          }`}
                        >
                          <span className="mr-2">{squad.emoji}</span>
                          {squad.name}
                          {userSquad === squad.name && (
                            <Badge className="ml-2 bg-cyan-600 text-white text-xs">Your Squad</Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Members List */}
                <SquadMembersList squadName={selectedSquad} maxHeight="600px" />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SQUADS.map((squad) => (
                    <SquadStatsCard key={squad.id} squadName={squad.name} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </TokenGate>
  );
}

// Quick squad stats card for analytics view
function SquadStatsCard({ squadName }: { squadName: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [squadName]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/squads/stats?squad=${squadName}`);
      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching squad stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || !stats.exists) {
    return (
      <Card className="bg-slate-800/50 border-slate-500/30">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 hover:border-purple-400/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-2xl">{stats.emoji}</span>
          <span className="text-purple-400">{stats.squad}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/30 rounded-lg p-3 text-center">
            <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{stats.overview.totalMembers}</p>
            <p className="text-xs text-gray-400">Members</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-3 text-center">
            <Activity className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{stats.overview.activityRate}%</p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
        </div>

        {/* XP Stats */}
        <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total XP</span>
            <span className="text-lg font-bold text-purple-400">
              {stats.xp.totalXP.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Avg per Member</span>
            <span className="text-lg font-bold text-cyan-400">
              {stats.xp.avgXPPerMember}
            </span>
          </div>
        </div>

        {/* Engagement */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Bounties Completed</span>
            <span className="text-white font-semibold">{stats.engagement.completedBounties}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Social Posts</span>
            <span className="text-white font-semibold">{stats.engagement.totalSocialPosts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">New This Week</span>
            <span className="text-green-400 font-semibold">+{stats.growth.newMembersThisWeek}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

