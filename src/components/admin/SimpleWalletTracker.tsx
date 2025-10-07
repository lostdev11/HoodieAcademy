'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Wallet, 
  Activity, 
  TrendingUp, 
  Clock, 
  Award,
  Eye,
  Search,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { simpleWalletTracker } from '@/lib/simple-wallet-tracker';

interface SimpleUser {
  id: string;
  wallet_address: string;
  display_name: string;
  squad: string | null;
  profile_completed: boolean;
  squad_test_completed: boolean;
  placement_test_completed: boolean;
  is_admin: boolean;
  last_active: string | null;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
  total_xp: number;
  level: number;
}

export default function SimpleWalletTracker() {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalXP: 0,
    averageLevel: 0
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userData = await simpleWalletTracker.getAllUsers();
      setUsers(userData);
      setFilteredUsers(userData);

      // Calculate stats
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const activeUsers = userData.filter(user => {
        if (!user.last_active) return false;
        return new Date(user.last_active) > oneDayAgo;
      }).length;

      const totalXP = userData.reduce((sum, user) => sum + (user.total_xp || 0), 0);
      const averageLevel = userData.length > 0 
        ? userData.reduce((sum, user) => sum + (user.level || 1), 0) / userData.length 
        : 0;

      setStats({
        totalUsers: userData.length,
        activeUsers,
        totalXP,
        averageLevel: Math.round(averageLevel)
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.squad && user.squad.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading wallet tracking data...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <p className="text-sm text-slate-400">Total XP</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.totalXP}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Level</p>
                <p className="text-2xl font-bold text-purple-500">{stats.averageLevel}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet-to-User Tracking
            </span>
            <Button
              onClick={fetchUsers}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by wallet address, name, or squad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Wallet Address</th>
                  <th className="text-left p-3">Squad</th>
                  <th className="text-left p-3">XP / Level</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Last Active</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.display_name}</p>
                          {user.is_admin && (
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
                        <span className="text-yellow-500 font-medium">{user.total_xp || 0}</span>
                        <Badge variant="secondary" className="text-xs">
                          Lv.{user.level || 1}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {user.profile_completed && (
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                            Profile
                          </Badge>
                        )}
                        {user.squad_test_completed && (
                          <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                            Squad Test
                          </Badge>
                        )}
                        {user.placement_test_completed && (
                          <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">
                            Placement
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-300">
                          {formatTimeAgo(user.last_active)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Button
                        onClick={() => {
                          // Future: Open user details modal
                          console.log('View user details:', user.wallet_address);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              {searchTerm ? 'No users found matching your search.' : 'No users tracked yet.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Features Preview */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Ready for Future Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-medium text-white mb-2">XP System</h4>
              <p className="text-sm text-slate-400">Track user progress and achievements</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-medium text-white mb-2">Submissions</h4>
              <p className="text-sm text-slate-400">Approve and manage user submissions</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-medium text-white mb-2">Bounties</h4>
              <p className="text-sm text-slate-400">Create and approve bounty completions</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-medium text-white mb-2">Leaderboard</h4>
              <p className="text-sm text-slate-400">Activity-based rankings and competitions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
