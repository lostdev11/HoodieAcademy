'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import TokenGate from '@/components/TokenGate';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MobileNavigation } from '@/components/dashboard/MobileNavigation';
import SquadActivityCard from '@/components/squad/SquadActivityCard';
import {
  Trophy,
  TrendingUp,
  Users,
  Target,
  Award,
  RefreshCw,
  BarChart3
} from 'lucide-react';

export default function SquadAnalyticsPage() {
  const [squads, setSquads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userSquad, setUserSquad] = useState<string | null>(null);

  useEffect(() => {
    const wallet = localStorage.getItem('walletAddress');
    if (wallet) {
      setWalletAddress(wallet);
      fetchUserSquad(wallet);
    }
    fetchSquadLeaderboard();
  }, []);

  const fetchUserSquad = async (wallet: string) => {
    try {
      const response = await fetch(`/api/user-profile?wallet=${wallet}`);
      const data = await response.json();
      
      if (data.success && data.profile) {
        setUserSquad(data.profile.squad?.name || null);
      }
    } catch (error) {
      console.error('Error fetching user squad:', error);
    }
  };

  const fetchSquadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/squad/leaderboard?limit=10&includeMembers=true');
      const data = await response.json();

      if (data.success) {
        setSquads(data.squads || []);
      }
    } catch (error) {
      console.error('Error fetching squad leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <TokenGate>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <DashboardSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-800/50 border-b border-purple-500/30 px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <MobileNavigation userSquad={userSquad} isAdmin={false} />
                <div>
                  <h1 className="text-3xl font-bold text-purple-400">📊 Squad Analytics</h1>
                  <p className="text-gray-300">Track squad performance and rankings</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSquadLeaderboard}
                className="border-purple-500/30 text-purple-400"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <Tabs defaultValue={userSquad || 'all'} className="space-y-6">
                <TabsList className="bg-slate-800/50 border border-purple-500/30">
                  <TabsTrigger value="all">All Squads</TabsTrigger>
                  <TabsTrigger value="Creators">Creators</TabsTrigger>
                  <TabsTrigger value="Decoders">Decoders</TabsTrigger>
                  <TabsTrigger value="Raiders">Raiders</TabsTrigger>
                  <TabsTrigger value="Speakers">Speakers</TabsTrigger>
                  <TabsTrigger value="Rangers">Rangers</TabsTrigger>
                </TabsList>

                {/* All Squads Overview */}
                <TabsContent value="all">
                  <Card className="bg-slate-800/50 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-purple-400 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Squad Rankings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8">
                          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
                          <p className="text-gray-400">Loading squad rankings...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {squads.map((squad, index) => (
                            <div
                              key={squad.name}
                              className={`p-4 rounded-lg border ${
                                squad.name === userSquad
                                  ? 'bg-purple-900/30 border-purple-500'
                                  : 'bg-slate-700/30 border-slate-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="text-3xl">{getRankBadge(squad.rank)}</div>
                                  <div>
                                    <h3 className="text-lg font-bold text-white">{squad.name}</h3>
                                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                                      <span className="flex items-center">
                                        <Users className="w-3 h-3 mr-1" />
                                        {squad.memberCount} members
                                      </span>
                                      <span className="flex items-center">
                                        <Target className="w-3 h-3 mr-1" />
                                        {squad.activeMembers} active
                                      </span>
                                      <span className="text-green-400">
                                        {squad.activeMemberRate}% active rate
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-yellow-400">
                                    {squad.totalXP.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-400">Total XP</p>
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    Avg: {squad.averageXP.toLocaleString()} XP
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Individual Squad Tabs */}
                {['Creators', 'Decoders', 'Raiders', 'Speakers', 'Rangers'].map(squadName => (
                  <TabsContent key={squadName} value={squadName}>
                    <SquadActivityCard squad={squadName} period="week" />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </TokenGate>
  );
}

