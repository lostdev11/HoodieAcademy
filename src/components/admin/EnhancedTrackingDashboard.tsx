'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Activity, 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock, 
  Award,
  BarChart3,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { getDashboardStats, getAllUsersWithTracking, getBountyStats } from '@/lib/admin-queries';
import { DashboardStats, UserTrackingData } from '@/types/tracking';

interface EnhancedTrackingDashboardProps {
  className?: string;
}

export function EnhancedTrackingDashboard({ className }: EnhancedTrackingDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<Array<{
    user: any;
    stats: {
      total_xp: number;
      total_submissions: number;
      approved_submissions: number;
      pending_submissions: number;
      rejected_submissions: number;
      last_active: string | null;
    };
  }>>([]);
  const [bountyStats, setBountyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserTrackingData | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [statsData, usersData, bountyStatsData] = await Promise.all([
        getDashboardStats(),
        getAllUsersWithTracking(),
        getBountyStats()
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setBountyStats(bountyStatsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  const handleUserClick = async (userId: string) => {
    try {
      // This would need to be implemented as an API route
      // For now, we'll just show basic user info
      const user = users.find(u => u.user.id === userId);
      if (user) {
        setSelectedUser({
          user: user.user,
          stats: user.stats,
          recent_events: [],
          submissions: [],
          xp_events: []
        });
        setShowUserDetails(true);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Enhanced Tracking Dashboard</h2>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} active (7d)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.liveUsers}</div>
              <p className="text-xs text-muted-foreground">
                Active in last 5 minutes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalXP.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bounty Stats */}
      {bountyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bounties</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bountyStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {bountyStats.open} open, {bountyStats.draft} draft
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bountyStats.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                {bountyStats.approvedSubmissions} approved, {bountyStats.pendingSubmissions} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Wallets (24h)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.newWallets24h || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.newWallets7d || 0} in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.inactiveUsers.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                No activity in 7+ days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="bounties">Bounties</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map(({ user, stats }) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.display_name || 'Anonymous User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.wallet_address}
                        </div>
                        {user.squad && (
                          <Badge variant="secondary" className="mt-1">
                            {user.squad}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-bold">{stats.total_xp}</div>
                        <div className="text-xs text-muted-foreground">XP</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold">{stats.total_submissions}</div>
                        <div className="text-xs text-muted-foreground">Submissions</div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {stats.approved_submissions > 0 && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {stats.approved_submissions}
                          </Badge>
                        )}
                        {stats.pending_submissions > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {stats.pending_submissions}
                          </Badge>
                        )}
                        {stats.rejected_submissions > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            {stats.rejected_submissions}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm">
                          {stats.last_active 
                            ? new Date(stats.last_active).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">Last Active</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bounties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bounty Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Bounty management interface would go here. This would include:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Create and edit bounties</li>
                <li>Review and moderate submissions</li>
                <li>Track bounty performance</li>
                <li>Manage XP rewards</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics dashboard would go here. This would include:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Daily/Weekly/Monthly active users</li>
                <li>Course completion rates</li>
                <li>Bounty engagement metrics</li>
                <li>XP distribution charts</li>
                <li>User retention analysis</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
