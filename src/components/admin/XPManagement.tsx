'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, Star, Trophy, Users, TrendingUp, Award, 
  Plus, Minus, RefreshCw, AlertCircle, CheckCircle,
  BarChart3, Activity, Target, Crown, Medal
} from 'lucide-react';

interface UserXP {
  wallet_address: string;
  total_xp: number;
  level: number;
  completed_courses: number;
  bounty_submissions: number;
  bounty_wins: number;
  last_active: string;
  display_name?: string;
}

interface XPAward {
  id: string;
  wallet_address: string;
  xp_amount: number;
  reason: string;
  awarded_by: string;
  created_at: string;
}

interface XPManagementProps {
  walletAddress: string | null;
}

export default function XPManagement({ walletAddress }: XPManagementProps) {
  const [users, setUsers] = useState<UserXP[]>([]);
  const [xpAwards, setXPAwards] = useState<XPAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [awardForm, setAwardForm] = useState({
    walletAddress: '',
    xpAmount: '',
    reason: ''
  });

  // Fetch users and XP data
  useEffect(() => {
    const fetchXPData = async () => {
      if (!walletAddress) return;
      
      setLoading(true);
      setError(null);

      try {
        const [usersResponse, awardsResponse] = await Promise.all([
          fetch(`/api/admin/xp/users?wallet=${walletAddress}`),
          fetch(`/api/admin/xp/awards?wallet=${walletAddress}`)
        ]);

        if (!usersResponse.ok || !awardsResponse.ok) {
          throw new Error('Failed to fetch XP data');
        }

        const [usersData, awardsData] = await Promise.all([
          usersResponse.json(),
          awardsResponse.json()
        ]);

        setUsers(usersData.users || []);
        setXPAwards(awardsData.awards || []);

      } catch (err) {
        console.error('Error fetching XP data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch XP data');
      } finally {
        setLoading(false);
      }
    };

    fetchXPData();
  }, [walletAddress]);

  const handleAwardXP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !awardForm.walletAddress || !awardForm.xpAmount || !awardForm.reason) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/xp/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWallet: awardForm.walletAddress,
          xpAmount: parseInt(awardForm.xpAmount),
          reason: awardForm.reason,
          awardedBy: walletAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to award XP');
      }

      // Refresh data
      const usersResponse = await fetch(`/api/admin/xp/users?wallet=${walletAddress}`);
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);

      // Reset form
      setAwardForm({ walletAddress: '', xpAmount: '', reason: '' });
      setShowAwardForm(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award XP');
    } finally {
      setLoading(false);
    }
  };

  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 1000) + 1;
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const totalXP = users.reduce((sum, user) => sum + user.total_xp, 0);
  const totalUsers = users.length;
  const averageXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0;
  const topUser = users.length > 0 ? users.reduce((prev, current) => 
    prev.total_xp > current.total_xp ? prev : current
  ) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading XP data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            XP Management
          </h2>
          <p className="text-slate-400">Manage user XP, levels, and rewards</p>
        </div>
        <Button
          onClick={() => setShowAwardForm(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Award XP
        </Button>
      </div>

      {/* XP Award Form Modal */}
      {showAwardForm && (
        <Card className="bg-slate-800">
          <CardHeader>
            <CardTitle className="text-purple-400">Award XP to User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAwardXP} className="space-y-4">
              <div>
                <Label htmlFor="userSelect" className="text-white">Select User</Label>
                <Select
                  value={awardForm.walletAddress}
                  onValueChange={(value) => setAwardForm({ ...awardForm, walletAddress: value })}
                >
                  <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Choose a user to award XP to" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {users.map((user) => (
                      <SelectItem 
                        key={user.wallet_address} 
                        value={user.wallet_address}
                        className="text-white hover:bg-slate-600"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">
                            {user.display_name || `User ${user.wallet_address.slice(0, 6)}...`}
                          </span>
                          <span className="text-sm text-gray-400 ml-2">
                            {user.total_xp} XP (Level {user.level})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="xpAmount" className="text-white">XP Amount</Label>
                <Input
                  id="xpAmount"
                  type="number"
                  value={awardForm.xpAmount}
                  onChange={(e) => setAwardForm({ ...awardForm, xpAmount: e.target.value })}
                  placeholder="Enter XP amount"
                  className="mt-1 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:text-black"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reason" className="text-white">Reason</Label>
                <Input
                  id="reason"
                  value={awardForm.reason}
                  onChange={(e) => setAwardForm({ ...awardForm, reason: e.target.value })}
                  placeholder="Enter reason for XP award"
                  className="mt-1 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:text-black"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAwardForm(false)}
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Awarding...' : 'Award XP'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* XP Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total XP Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{totalXP.toLocaleString()}</div>
            <p className="text-xs text-slate-500">Across all users</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{totalUsers}</div>
            <p className="text-xs text-slate-500">With XP earned</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Average XP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{averageXP.toLocaleString()}</div>
            <p className="text-xs text-slate-500">Per user</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Top User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {topUser ? topUser.total_xp.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-slate-500">
              {topUser ? formatWalletAddress(topUser.wallet_address) : 'No users'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="awards">XP Awards ({xpAwards.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">User XP Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">No Users Found</h3>
                  <p className="text-slate-500">Users will appear here once they start earning XP.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users
                    .sort((a, b) => b.total_xp - a.total_xp)
                    .map((user, index) => (
                    <div key={user.wallet_address} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {user.display_name || formatWalletAddress(user.wallet_address)}
                            </h4>
                            <p className="text-sm text-gray-400">
                              Level {calculateLevel(user.total_xp)} • {user.completed_courses} courses • {user.bounty_submissions} submissions
                            </p>
                            <p className="text-xs text-gray-500">
                              Last active: {new Date(user.last_active).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-400">
                            {user.total_xp.toLocaleString()} XP
                          </div>
                          {user.bounty_wins > 0 && (
                            <div className="text-sm text-yellow-400">
                              {user.bounty_wins} win{user.bounty_wins !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Awards Tab */}
        <TabsContent value="awards" className="space-y-4">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Recent XP Awards</CardTitle>
            </CardHeader>
            <CardContent>
              {xpAwards.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">No XP Awards Yet</h3>
                  <p className="text-slate-500">XP awards will appear here when you award XP to users.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {xpAwards
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((award) => (
                    <div key={award.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Award className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {award.xp_amount.toLocaleString()} XP Awarded
                            </h4>
                            <p className="text-sm text-gray-400">
                              To {formatWalletAddress(award.wallet_address)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {award.reason}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">
                            {new Date(award.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            By {formatWalletAddress(award.awarded_by)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">XP Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Level 1-5</span>
                    <span className="text-sm text-white">
                      {users.filter(u => calculateLevel(u.total_xp) <= 5).length} users
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Level 6-10</span>
                    <span className="text-sm text-white">
                      {users.filter(u => calculateLevel(u.total_xp) > 5 && calculateLevel(u.total_xp) <= 10).length} users
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Level 10+</span>
                    <span className="text-sm text-white">
                      {users.filter(u => calculateLevel(u.total_xp) > 10).length} users
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total Courses</span>
                    <span className="text-sm text-white">
                      {users.reduce((sum, u) => sum + u.completed_courses, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total Submissions</span>
                    <span className="text-sm text-white">
                      {users.reduce((sum, u) => sum + u.bounty_submissions, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total Wins</span>
                    <span className="text-sm text-white">
                      {users.reduce((sum, u) => sum + u.bounty_wins, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
