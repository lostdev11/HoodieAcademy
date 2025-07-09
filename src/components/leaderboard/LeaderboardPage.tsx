'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Trophy, 
  TrendingUp, 
  Users, 
  Target,
  RefreshCw,
  Award
} from 'lucide-react';
import { LeaderboardCard } from './LeaderboardCard';
import { LeaderboardUser } from '@/lib/leaderboardData';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import TokenGate from '@/components/TokenGate';
import { LeaderboardService } from '@/services/leaderboard-service';

type SortOption = 'rank' | 'completion' | 'score' | 'courses' | 'badges' | 'recent';
type FilterOption = 'all' | 'top10' | 'top50' | 'recent' | 'achievements';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('completion');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUserWallet, setCurrentUserWallet] = useState<string>('');
  const [currentUserRank, setCurrentUserRank] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);

  const leaderboardService = LeaderboardService.getInstance();

  useEffect(() => {
    // Load real-time leaderboard data
    const loadLeaderboardData = () => {
      const leaderboardData = leaderboardService.getLeaderboard();
      setUsers(leaderboardData);
      setFilteredUsers(leaderboardData);
      setIsLoading(false);
    };

    loadLeaderboardData();

    // Get current user's wallet from localStorage
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      setCurrentUserWallet(walletAddress);
      const rank = leaderboardService.getUserRank(walletAddress);
      setCurrentUserRank(rank);
    }

    // Set up real-time updates (polling every 30 seconds)
    const interval = setInterval(loadLeaderboardData, 30000);

    return () => clearInterval(interval);
  }, [leaderboardService]);

  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.squad?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'top10':
        filtered = filtered.slice(0, 10);
        break;
      case 'top50':
        // For demo, we only have limited users, but this would work with more data
        break;
      case 'recent':
        filtered = filtered.filter(user => {
          const lastActive = new Date(user.lastActive);
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return lastActive > oneWeekAgo;
        });
        break;
      case 'achievements':
        filtered = filtered.filter(user => user.achievements.length > 0);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'rank':
        filtered.sort((a, b) => a.rank - b.rank);
        break;
      case 'completion':
        filtered.sort((a, b) => b.overallCompletionPercentage - a.overallCompletionPercentage);
        break;
      case 'score':
        filtered.sort((a, b) => b.totalScore - a.totalScore);
        break;
      case 'courses':
        filtered.sort((a, b) => b.coursesCompleted - a.coursesCompleted);
        break;
      case 'badges':
        filtered.sort((a, b) => b.badgesEarned - a.badgesEarned);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
        break;
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, sortBy, filterBy]);

  const handleRefresh = () => {
    setIsLoading(true);
    // Load fresh data
    const leaderboardData = leaderboardService.getLeaderboard();
    setUsers(leaderboardData);
    setFilteredUsers(leaderboardData);
    
    // Update current user rank
    if (currentUserWallet) {
      const rank = leaderboardService.getUserRank(currentUserWallet);
      setCurrentUserRank(rank);
    }
    
    setIsLoading(false);
  };

  const getCurrentUserStats = () => {
    if (currentUserRank === -1) return null;
    return users.find(user => user.walletAddress === currentUserWallet);
  };

  const currentUser = getCurrentUserStats();

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
          <header className="bg-slate-800/50 border-b border-cyan-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-cyan-400 flex items-center gap-2">
                  <Trophy className="w-8 h-8" />
                  Hoodie Academy Leaderboard
                </h1>
                <p className="text-gray-300">Real-time rankings based on course completion percentage</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Last Updated</div>
                <div className="text-lg text-cyan-400 font-mono">
                  {new Date().toLocaleTimeString()}
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
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Participants</p>
                      <p className="text-2xl font-bold text-yellow-400">{users.length}</p>
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
                      <p className="text-2xl font-bold text-purple-400">
                        {users.length > 0 
                          ? Math.round(users.reduce((acc, user) => acc + user.overallCompletionPercentage, 0) / users.length)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Users className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Active Learners</p>
                      <p className="text-2xl font-bold text-green-400">
                        {users.filter(user => {
                          const lastActive = new Date(user.lastActive);
                          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                          return lastActive > oneWeekAgo;
                        }).length}
                      </p>
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
                        {currentUserRank > 0 ? `#${currentUserRank}` : 'N/A'}
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
                      <p className="text-xl font-bold text-cyan-400">{currentUser.overallCompletionPercentage.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Courses Started</p>
                      <p className="text-xl font-bold text-purple-400">{currentUser.coursesStarted}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Lessons Completed</p>
                      <p className="text-xl font-bold text-green-400">{currentUser.totalLessonsCompleted}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Achievements</p>
                      <p className="text-xl font-bold text-yellow-400">{currentUser.achievements.length}</p>
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
                <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                  <SelectTrigger className="w-32 bg-slate-800/50 border-cyan-500/30 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="top10">Top 10</SelectItem>
                    <SelectItem value="top50">Top 50</SelectItem>
                    <SelectItem value="recent">Recent Activity</SelectItem>
                    <SelectItem value="achievements">With Achievements</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-32 bg-slate-800/50 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank">By Rank</SelectItem>
                    <SelectItem value="completion">By Completion</SelectItem>
                    <SelectItem value="score">By Score</SelectItem>
                    <SelectItem value="courses">By Courses</SelectItem>
                    <SelectItem value="badges">By Badges</SelectItem>
                    <SelectItem value="recent">By Recent</SelectItem>
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

            {/* Leaderboard */}
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
              <div className="space-y-4">
                {filteredUsers.map((user, index) => (
                  <LeaderboardCard 
                    key={user.walletAddress} 
                    user={user} 
                    isCurrentUser={user.walletAddress === currentUserWallet}
                    highlight={index < 3}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </TokenGate>
  );
} 