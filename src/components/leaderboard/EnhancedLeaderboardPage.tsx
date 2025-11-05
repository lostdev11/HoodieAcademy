'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Trophy, 
  TrendingUp, 
  Users, 
  Target,
  RefreshCw,
  Calendar,
  Award,
  Crown,
  Star,
  Zap,
  Home,
  ArrowLeft
} from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import TokenGate from '@/components/TokenGate';
import CryptoPriceTicker from '@/components/CryptoPriceTicker';
import { 
  EnhancedLeaderboardService, 
  LeaderboardUser, 
  LeaderboardStats 
} from '@/services/enhanced-leaderboard-service';

type SortOption = 'completion' | 'courses' | 'quizzes' | 'badges' | 'level' | 'xp';
type SquadFilter = 'all' | 'creators' | 'coders' | 'strategists' | 'connectors' | 'rangers';

export default function EnhancedLeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    totalParticipants: 0,
    avgCompletion: 0,
    activeLearners: 0,
    userRank: -1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('completion');
  const [squadFilter, setSquadFilter] = useState<SquadFilter>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUserWallet, setCurrentUserWallet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const leaderboardService = EnhancedLeaderboardService.getInstance();

  useEffect(() => {
    // Get current user's wallet from localStorage
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      setCurrentUserWallet(walletAddress);
    }

    loadLeaderboardData();

    // Set up real-time updates (polling every 30 seconds)
    const interval = setInterval(loadLeaderboardData, 30000);

    // Set up comprehensive refresh system
    const componentId = 'leaderboard-page';
    
    // 1. Register for global refresh (if available)
    try {
      const { registerForRefresh, unregisterFromRefresh } = require('@/utils/globalRefresh');
      registerForRefresh(componentId, () => {
        console.log('🔄 [Leaderboard] Global refresh triggered');
        loadLeaderboardData();
      });
    } catch (error) {
      console.log('Global refresh system not available');
    }

    // 2. Set up force refresh listener
    const { setupXpRefreshListener, checkForXpRefresh } = require('@/utils/forceRefresh');
    
    // Check if refresh is needed on mount
    if (checkForXpRefresh()) {
      console.log('🔄 [Leaderboard] XP refresh required on mount');
      loadLeaderboardData();
    }
    
    // Set up listener for future refreshes
    const cleanup = setupXpRefreshListener(() => {
      console.log('🔄 [Leaderboard] Force refresh triggered');
      loadLeaderboardData();
    });

    // 3. Register for leaderboard-specific refresh
    const { registerLeaderboardRefresh } = require('@/utils/leaderboardRefresh');
    const leaderboardCleanup = registerLeaderboardRefresh(() => {
      console.log('🔄 [Leaderboard] Leaderboard-specific refresh triggered');
      loadLeaderboardData();
    });

    return () => {
      clearInterval(interval);
      try {
        const { unregisterFromRefresh } = require('@/utils/globalRefresh');
        unregisterFromRefresh(componentId);
      } catch (error) {
        // Ignore if global refresh not available
      }
      cleanup();
      leaderboardCleanup();
    };
  }, []);

  const loadLeaderboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load leaderboard data
      const leaderboardData = await leaderboardService.getLeaderboard();
      setUsers(leaderboardData);
      setFilteredUsers(leaderboardData);
      
      // Load stats
      const leaderboardStats = await leaderboardService.getLeaderboardStats(currentUserWallet);
      setStats(leaderboardStats);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.squad.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply squad filter
    if (squadFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.squad && (
          user.squad.toLowerCase().includes(squadFilter.toLowerCase()) ||
          user.squad.toLowerCase() === squadFilter.toLowerCase()
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'completion':
          return b.completion - a.completion;
        case 'courses':
          return b.courses - a.courses;
        case 'quizzes':
          return b.quizzes - a.quizzes;
        case 'badges':
          return b.badges - a.badges;
        case 'level':
          return b.level - a.level;
        case 'xp':
          return (b.totalXP || 0) - (a.totalXP || 0);
        default:
          return b.completion - a.completion;
      }
    });

    // Reassign ranks after filtering and sorting
    filtered = filtered.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    setFilteredUsers(filtered);
  }, [users, searchTerm, sortBy, squadFilter]);

  const handleRefresh = async () => {
    await loadLeaderboardData();
  };

  const getCurrentUserStats = () => {
    if (stats.userRank === -1) return null;
    return users.find(user => user.walletAddress === currentUserWallet);
  };

  const currentUser = getCurrentUserStats();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getSquadColor = (squad: string) => {
    const colors: Record<string, string> = {
      'decoder': 'text-blue-400',
      'creator': 'text-purple-400',
      'speaker': 'text-green-400',
      'raider': 'text-red-400',
      'ranger': 'text-yellow-400',
      'unassigned': 'text-gray-400'
    };
    return colors[squad.toLowerCase()] || 'text-gray-400';
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
          <CryptoPriceTicker />
          {/* Header */}
          <header className="bg-slate-800/50 border-b border-cyan-500/30 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-cyan-400 flex items-center gap-2">
                    <Trophy className="w-8 h-8" />
                    Hoodie Academy Leaderboard
                  </h1>
                  <p className="text-gray-300">Live rankings based on 100-level course completion and engagement</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Last Updated</div>
                <div className="text-lg text-cyan-400 font-mono">
                  {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Users className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Participants</p>
                      <p className="text-2xl font-bold text-yellow-400">{stats.totalParticipants}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Avg Completion</p>
                      <p className="text-2xl font-bold text-purple-400">{stats.avgCompletion}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Zap className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Active Learners</p>
                      <p className="text-2xl font-bold text-green-400">{stats.activeLearners}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Target className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Your Rank</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {stats.userRank > 0 ? `#${stats.userRank}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current User Stats */}
            {currentUser && (
              <Card className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-cyan-500/50">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Completion</p>
                      <p className="text-xl font-bold text-cyan-400">{currentUser.completion}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Level</p>
                      <p className="text-xl font-bold text-purple-400">{currentUser.level}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Courses</p>
                      <p className="text-xl font-bold text-green-400">{currentUser.courses}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Badges</p>
                      <p className="text-xl font-bold text-yellow-400">{currentUser.badges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, wallet, or squad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-cyan-500/30 text-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={squadFilter} onValueChange={(value: SquadFilter) => setSquadFilter(value)}>
                  <SelectTrigger className="w-32 bg-slate-800/50 border-cyan-500/30 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Squads</SelectItem>
                    <SelectItem value="creators">🎨 Creators</SelectItem>
                    <SelectItem value="coders">💻 Coders</SelectItem>
                    <SelectItem value="strategists">📊 Strategists</SelectItem>
                    <SelectItem value="connectors">🤝 Connectors</SelectItem>
                    <SelectItem value="rangers">🦅 Rangers</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-32 bg-slate-800/50 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completion">% Completion</SelectItem>
                    <SelectItem value="xp">Total XP</SelectItem>
                    <SelectItem value="courses">Courses</SelectItem>
                    <SelectItem value="quizzes">Quizzes</SelectItem>
                    <SelectItem value="badges">Badges</SelectItem>
                    <SelectItem value="level">Level</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleRefresh} 
                  disabled={isLoading}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Leaderboard Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mr-3" />
                <span className="text-cyan-400">Loading leaderboard...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Users Found</h3>
                  <p className="text-gray-400">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'Be the first to join the leaderboard!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="rounded-md border border-cyan-500/30 max-h-[600px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-800/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Squad</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3">XP</th>
                      <th className="px-4 py-3">Completion</th>
                      <th className="px-4 py-3">Courses</th>
                      <th className="px-4 py-3">Quizzes</th>
                      <th className="px-4 py-3">Badges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.walletAddress} 
                        className={`border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
                          user.walletAddress === currentUserWallet ? 'bg-cyan-900/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-bold">
                          <span className="flex items-center gap-2">
                            {getRankIcon(user.rank)}
                            {user.rank <= 3 && (
                              <Crown className={`w-4 h-4 ${
                                user.rank === 1 ? 'text-yellow-400' : 
                                user.rank === 2 ? 'text-gray-400' : 'text-orange-600'
                              }`} />
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-slate-700 text-cyan-400">
                                {user.displayName[1]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-white">{user.displayName}</div>
                              <div className="text-xs text-gray-400">{user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge 
                            variant="outline" 
                            className={`${getSquadColor(user.squad)} border-current`}
                          >
                            {user.squad}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="font-medium">{user.level}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span className="font-medium text-cyan-400">
                              {user.totalXP?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full transition-all"
                                style={{ width: `${user.completion}%` }}
                              />
                            </div>
                            <span className="font-medium">{user.completion}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{user.courses}</td>
                        <td className="px-4 py-3 font-medium">{user.quizzes}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-yellow-400" />
                            <span className="font-medium">{user.badges}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </main>
        </div>
      </div>
    </TokenGate>
  );
} 