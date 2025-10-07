'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Wallet, 
  Activity, 
  TrendingUp, 
  Clock, 
  Award,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { userDataSync, UserProfile, UserStats } from '@/lib/user-data-sync';
import { walletTracker } from '@/lib/wallet-connection-tracker';
import { supabase } from '@/lib/supabase';

interface WalletUserInsightsProps {
  className?: string;
}

interface UserInsight {
  wallet_address: string;
  display_name: string;
  squad: string | null;
  profile_completed: boolean;
  last_active: string | null;
  total_xp: number;
  level: number;
  connection_count: number;
  last_connection: string | null;
  profile_completion: number;
  admin_status: boolean;
}

export default function WalletUserInsights({ className = '' }: WalletUserInsightsProps) {
  const [users, setUsers] = useState<UserInsight[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('last_active');
  const [selectedUser, setSelectedUser] = useState<UserInsight | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalConnections: 0,
    averageXP: 0,
    profileCompletionRate: 0
  });

  // Fetch users with wallet connection data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('last_active', { ascending: false });

      if (usersError) throw usersError;

      // Get user XP data
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('*');

      if (xpError) throw xpError;

      // Get wallet connection counts
      const { data: connections, error: connError } = await supabase
        .from('wallet_connections')
        .select('wallet_address, connection_timestamp')
        .order('connection_timestamp', { ascending: false });

      if (connError) throw connError;

      // Process data
      const userInsights: UserInsight[] = users.map(user => {
        const userXP = xpData?.find(xp => xp.wallet_address === user.wallet_address);
        const userConnections = connections?.filter(conn => conn.wallet_address === user.wallet_address) || [];
        
        return {
          wallet_address: user.wallet_address,
          display_name: user.display_name || `User ${user.wallet_address.slice(0, 6)}...`,
          squad: user.squad,
          profile_completed: user.profile_completed,
          last_active: user.last_active,
          total_xp: userXP?.total_xp || 0,
          level: userXP?.level || 1,
          connection_count: userConnections.length,
          last_connection: userConnections[0]?.connection_timestamp || null,
          profile_completion: calculateProfileCompletion(user),
          admin_status: user.is_admin
        };
      });

      setUsers(userInsights);
      setFilteredUsers(userInsights);

      // Calculate stats
      const totalUsers = userInsights.length;
      const activeUsers = userInsights.filter(u => {
        if (!u.last_active) return false;
        const lastActive = new Date(u.last_active);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastActive > oneDayAgo;
      }).length;
      
      const totalConnections = connections?.length || 0;
      const averageXP = userInsights.reduce((sum, u) => sum + u.total_xp, 0) / totalUsers || 0;
      const profileCompletionRate = userInsights.reduce((sum, u) => sum + u.profile_completion, 0) / totalUsers || 0;

      setStats({
        totalUsers,
        activeUsers,
        totalConnections,
        averageXP: Math.round(averageXP),
        profileCompletionRate: Math.round(profileCompletionRate)
      });

    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (user: any): number => {
    let completed = 0;
    const total = 4;

    if (user.display_name && user.display_name !== `User ${user.wallet_address.slice(0, 6)}...`) completed++;
    if (user.squad) completed++;
    if (user.bio) completed++;
    if (user.profile_picture) completed++;

    return Math.round((completed / total) * 100);
  };

  // Filter and search users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.squad && user.squad.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Squad filter
    if (squadFilter !== 'all') {
      filtered = filtered.filter(user => user.squad === squadFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'last_active':
          return new Date(b.last_active || 0).getTime() - new Date(a.last_active || 0).getTime();
        case 'xp':
          return b.total_xp - a.total_xp;
        case 'connections':
          return b.connection_count - a.connection_count;
        case 'profile_completion':
          return b.profile_completion - a.profile_completion;
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, squadFilter, sortBy]);

  // Get user details
  const fetchUserDetails = async (walletAddress: string) => {
    try {
      const details = await userDataSync.getUserDataForAdmin(walletAddress);
      setUserDetails(details);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Get unique squads for filter
  const uniqueSquads = Array.from(new Set(users.map(u => u.squad).filter(Boolean)));

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-slate-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading user insights...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-green-500">{stats.activeUsers}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Connections</p>
                <p className="text-2xl font-bold text-purple-500">{stats.totalConnections}</p>
              </div>
              <Wallet className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg XP</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.averageXP}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Profile Completion</p>
                <p className="text-2xl font-bold text-cyan-500">{stats.profileCompletionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Wallet-Based User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name, wallet, or squad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={squadFilter}
              onChange={(e) => setSquadFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Squads</option>
              {uniqueSquads.map(squad => (
                <option key={squad} value={squad}>{squad}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last_active">Last Active</option>
              <option value="xp">XP</option>
              <option value="connections">Connections</option>
              <option value="profile_completion">Profile Completion</option>
            </select>

            <Button
              onClick={fetchUsers}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Wallet</th>
                  <th className="text-left p-3">Squad</th>
                  <th className="text-left p-3">XP / Level</th>
                  <th className="text-left p-3">Connections</th>
                  <th className="text-left p-3">Profile</th>
                  <th className="text-left p-3">Last Active</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.wallet_address} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.display_name}</p>
                          {user.admin_status && (
                            <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <code className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                        {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
                      </code>
                    </td>
                    <td className="p-3">
                      {user.squad ? (
                        <Badge variant="outline">{user.squad}</Badge>
                      ) : (
                        <span className="text-slate-400">No Squad</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 font-medium">{user.total_xp}</span>
                        <Badge variant="secondary" className="text-xs">
                          Lv.{user.level}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Wallet className="w-4 h-4 text-slate-400" />
                        <span>{user.connection_count}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${user.profile_completion}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{user.profile_completion}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-300">
                          {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Button
                        onClick={() => fetchUserDetails(user.wallet_address)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showDetails && selectedUser && userDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Details: {selectedUser.display_name}</span>
                <Button
                  onClick={() => setShowDetails(false)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="connections">Connections</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400">Wallet Address</label>
                      <p className="text-white font-mono text-sm">{userDetails.user?.wallet_address}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Display Name</label>
                      <p className="text-white">{userDetails.user?.display_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Squad</label>
                      <p className="text-white">{userDetails.user?.squad || 'No Squad'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Admin Status</label>
                      <p className="text-white">{userDetails.user?.is_admin ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <div className="space-y-2">
                    {userDetails.activities?.map((activity: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{activity.activity_type}</p>
                          <p className="text-slate-400 text-sm">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{activity.metadata?.source || 'General'}</Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="connections" className="space-y-4">
                  <div className="space-y-2">
                    {userDetails.connections?.map((connection: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium capitalize">{connection.connection_type}</p>
                          <p className="text-slate-400 text-sm">
                            {new Date(connection.connection_timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{connection.session_data?.provider || 'Unknown'}</Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-sm">Total XP</p>
                      <p className="text-2xl font-bold text-yellow-500">{userDetails.userXP?.total_xp || 0}</p>
                    </div>
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-sm">Level</p>
                      <p className="text-2xl font-bold text-blue-500">{userDetails.userXP?.level || 1}</p>
                    </div>
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-sm">Bounty Submissions</p>
                      <p className="text-2xl font-bold text-green-500">{userDetails.bountySubmissions?.length || 0}</p>
                    </div>
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-sm">Course Completions</p>
                      <p className="text-2xl font-bold text-purple-500">{userDetails.courseCompletions?.length || 0}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
