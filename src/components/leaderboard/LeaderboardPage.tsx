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
  Calendar,
  Award
} from 'lucide-react';
import { LeaderboardCard } from './LeaderboardCard';
import { getTop20Users, LeaderboardUser, getUserRank } from '@/lib/leaderboardData';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import TokenGate from '@/components/TokenGate';

type SortOption = 'rank' | 'score' | 'courses' | 'badges' | 'recent';
type FilterOption = 'all' | 'top10' | 'top50' | 'recent' | 'achievements';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rank');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUserWallet, setCurrentUserWallet] = useState<string>('');
  const [currentUserRank, setCurrentUserRank] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load leaderboard data
    const leaderboardData = getTop20Users();
    setUsers(leaderboardData);
    setFilteredUsers(leaderboardData);
    setIsLoading(false);

    // Get current user's wallet from localStorage
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      setCurrentUserWallet(walletAddress);
      const rank = getUserRank(walletAddress);
      setCurrentUserRank(rank);
    }
  }, []);

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
        // For demo, we only have 5 users, but this would work with more data
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
    // Simulate refresh
    setTimeout(() => {
      const leaderboardData = getTop20Users();
      setUsers(leaderboardData);
      setIsLoading(false);
    }, 1000);
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
                <p className="text-gray-300">Top performers in the Web3 learning community</p>
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
                      <p className="text-sm text-gray-400">Avg Score</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {Math.round(users.reduce((acc, user) => acc + user.averageQuizScore, 0) / users.length)}%
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

              <Card className="bg-slate-800/50 border-pink-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Award className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Badges</p>
                      <p className="text-2xl font-bold text-pink-400">
                        {users.reduce((acc, user) => acc + user.badgesEarned, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current User Stats */}
            {currentUser && (
              <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Your Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">#{currentUser.rank}</div>
                      <div className="text-sm text-gray-400">Your Rank</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{currentUser.totalScore.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Total Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{currentUser.coursesCompleted}</div>
                      <div className="text-sm text-gray-400">Courses Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-400">{currentUser.badgesEarned}</div>
                      <div className="text-sm text-gray-400">Badges Earned</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters and Search */}
            <Card className="bg-slate-800/50 border-slate-600/30">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, wallet, or squad..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700/50 border-slate-600/30 text-white placeholder-gray-400"
                    />
                  </div>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="rank">Sort by Rank</SelectItem>
                      <SelectItem value="score">Sort by Score</SelectItem>
                      <SelectItem value="courses">Sort by Courses</SelectItem>
                      <SelectItem value="badges">Sort by Badges</SelectItem>
                      <SelectItem value="recent">Sort by Recent</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filter */}
                  <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                    <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="top10">Top 10</SelectItem>
                      <SelectItem value="top50">Top 50</SelectItem>
                      <SelectItem value="recent">Recently Active</SelectItem>
                      <SelectItem value="achievements">With Achievements</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Refresh */}
                  <Button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Top Performers</h2>
                <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                  {filteredUsers.length} users
                </Badge>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading leaderboard...</p>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-600/30">
                  <CardContent className="p-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">No users found</h3>
                    <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <LeaderboardCard
                      key={user.walletAddress}
                      user={user}
                      isCurrentUser={user.walletAddress === currentUserWallet}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </TokenGate>
  );
} 