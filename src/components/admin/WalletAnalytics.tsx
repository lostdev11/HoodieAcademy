'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Wallet, 
  Activity, 
  Award,
  Clock,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Eye
} from 'lucide-react';
import { walletTracker } from '@/lib/wallet-connection-tracker';
import { userDataSync } from '@/lib/user-data-sync';
import { supabase } from '@/lib/supabase';

interface WalletAnalyticsProps {
  className?: string;
}

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalConnections: number;
  uniqueWallets: number;
  averageXP: number;
  profileCompletionRate: number;
  connectionSuccessRate: number;
  mostUsedProvider: string;
  dailyConnections: { date: string; connections: number }[];
  weeklyConnections: { week: string; connections: number }[];
  monthlyConnections: { month: string; connections: number }[];
  providerBreakdown: { provider: string; count: number; percentage: number }[];
  squadDistribution: { squad: string; count: number; percentage: number }[];
  xpDistribution: { range: string; count: number; percentage: number }[];
  recentActivity: any[];
}

export default function WalletAnalytics({ className = '' }: WalletAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('connections');

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Get wallet analytics
      const walletAnalytics = await walletTracker.getWalletAnalytics(timeRange);

      // Get user data
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      // Get user XP data
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('*');

      if (xpError) throw xpError;

      // Get recent activities
      const { data: activities, error: activityError } = await supabase
        .from('user_activity')
        .select(`
          *,
          users!inner(display_name, squad)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activityError) throw activityError;

      // Calculate user metrics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const activeUsers = users?.filter(user => {
        if (!user.last_active) return false;
        return new Date(user.last_active) > oneDayAgo;
      }).length || 0;

      const averageXP = xpData?.reduce((sum, xp) => sum + (xp.total_xp || 0), 0) / (xpData?.length || 1) || 0;

      const profileCompletionRate = users?.reduce((sum, user) => {
        let completed = 0;
        const total = 4;
        if (user.display_name && user.display_name !== `User ${user.wallet_address.slice(0, 6)}...`) completed++;
        if (user.squad) completed++;
        if (user.bio) completed++;
        if (user.profile_picture) completed++;
        return sum + (completed / total) * 100;
      }, 0) / (users?.length || 1) || 0;

      // Squad distribution
      const squadCounts: { [key: string]: number } = {};
      users?.forEach(user => {
        if (user.squad) {
          squadCounts[user.squad] = (squadCounts[user.squad] || 0) + 1;
        }
      });

      const squadDistribution = Object.entries(squadCounts).map(([squad, count]) => ({
        squad,
        count,
        percentage: (count / (users?.length || 1)) * 100
      })).sort((a, b) => b.count - a.count);

      // XP distribution
      const xpRanges = [
        { range: '0-100', min: 0, max: 100 },
        { range: '101-500', min: 101, max: 500 },
        { range: '501-1000', min: 501, max: 1000 },
        { range: '1001-2500', min: 1001, max: 2500 },
        { range: '2500+', min: 2501, max: Infinity }
      ];

      const xpDistribution = xpRanges.map(range => {
        const count = xpData?.filter(xp => 
          (xp.total_xp || 0) >= range.min && (xp.total_xp || 0) <= range.max
        ).length || 0;
        return {
          range: range.range,
          count,
          percentage: (count / (xpData?.length || 1)) * 100
        };
      });

      const analyticsData: AnalyticsData = {
        totalUsers: users?.length || 0,
        activeUsers,
        totalConnections: walletAnalytics.total_connections,
        uniqueWallets: walletAnalytics.unique_wallets,
        averageXP: Math.round(averageXP),
        profileCompletionRate: Math.round(profileCompletionRate),
        connectionSuccessRate: walletAnalytics.connection_success_rate,
        mostUsedProvider: walletAnalytics.most_used_provider,
        dailyConnections: walletAnalytics.connection_trends.daily,
        weeklyConnections: walletAnalytics.connection_trends.weekly,
        monthlyConnections: walletAnalytics.connection_trends.monthly,
        providerBreakdown: walletAnalytics.provider_breakdown,
        squadDistribution,
        xpDistribution,
        recentActivity: activities?.map(activity => ({
          ...activity,
          user_display_name: activity.users?.display_name,
          user_squad: activity.users?.squad
        })) || []
      };

      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-slate-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading analytics...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-slate-800/50">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">Failed to load analytics data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Wallet-Based Analytics
            </span>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <Button
                onClick={fetchAnalytics}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{formatNumber(analytics.totalUsers)}</p>
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
                <p className="text-2xl font-bold text-green-500">{formatNumber(analytics.activeUsers)}</p>
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
                <p className="text-2xl font-bold text-purple-500">{formatNumber(analytics.totalConnections)}</p>
              </div>
              <Wallet className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-cyan-500">{formatPercentage(analytics.connectionSuccessRate)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Breakdown */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-lg">Wallet Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.providerBreakdown.map((provider, index) => (
                    <div key={provider.provider} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                        <span className="text-sm text-slate-300 capitalize">{provider.provider}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">{provider.count}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatPercentage(provider.percentage)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Squad Distribution */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-lg">Squad Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.squadDistribution.slice(0, 5).map((squad, index) => (
                    <div key={squad.squad} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
                        <span className="text-sm text-slate-300">{squad.squad}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">{squad.count}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatPercentage(squad.percentage)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* XP Distribution */}
          <Card className="bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-lg">XP Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {analytics.xpDistribution.map((range, index) => (
                  <div key={range.range} className="text-center p-4 bg-slate-700 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-500">{range.count}</p>
                    <p className="text-sm text-slate-400">{range.range} XP</p>
                    <p className="text-xs text-slate-500">{formatPercentage(range.percentage)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Connections */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-lg">Daily Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.dailyConnections.slice(-7).map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (day.connections / Math.max(...analytics.dailyConnections.map(d => d.connections))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-300 w-8 text-right">{day.connections}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Connections */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-lg">Weekly Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.weeklyConnections.slice(-4).map((week, index) => (
                    <div key={week.week} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{week.week}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (week.connections / Math.max(...analytics.weeklyConnections.map(w => w.connections))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-300 w-8 text-right">{week.connections}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Stats */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-lg">User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Users</span>
                    <span className="text-white font-semibold">{analytics.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Active Users (24h)</span>
                    <span className="text-green-500 font-semibold">{analytics.activeUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Average XP</span>
                    <span className="text-yellow-500 font-semibold">{analytics.averageXP}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Profile Completion</span>
                    <span className="text-cyan-500 font-semibold">{formatPercentage(analytics.profileCompletionRate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Stats */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-lg">Connection Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Connections</span>
                    <span className="text-white font-semibold">{analytics.totalConnections}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Unique Wallets</span>
                    <span className="text-purple-500 font-semibold">{analytics.uniqueWallets}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Success Rate</span>
                    <span className="text-green-500 font-semibold">{formatPercentage(analytics.connectionSuccessRate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Most Used Provider</span>
                    <span className="text-blue-500 font-semibold capitalize">{analytics.mostUsedProvider}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-white font-medium capitalize">
                          {activity.activity_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {activity.user_display_name || `User ${activity.wallet_address.slice(0, 6)}...`}
                          <span className="mx-2">•</span>
                          <code className="text-xs bg-slate-600 px-1 py-0.5 rounded">
                            {activity.wallet_address.slice(0, 8)}...{activity.wallet_address.slice(-6)}
                          </code>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.user_squad || 'No Squad'}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
