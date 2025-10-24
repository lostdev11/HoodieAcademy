'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, Users, Award, CheckCircle, AlertCircle
} from 'lucide-react';

interface BountyXPManagerProps {
  walletAddress: string | null;
}

export default function BountyXPManager({ walletAddress }: BountyXPManagerProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [xpAmount, setXpAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute for users

  // Fetch users for XP management
  const fetchUsers = useCallback(async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users?wallet=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !walletAddress) return;

    console.log('Setting up auto-refresh for users with interval:', refreshInterval);
    const interval = setInterval(() => {
      console.log('Auto-refreshing users...');
      fetchUsers();
    }, refreshInterval);

    return () => {
      console.log('Clearing users auto-refresh interval');
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchUsers]);

  const handleAwardXP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !selectedUser || !xpAmount || !reason) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Use the new XP bounty service
      const { xpBountyService } = await import('@/services/xp-bounty-service');
      
      const result = await xpBountyService.awardXP({
        targetWallet: selectedUser,
        xpAmount: parseInt(xpAmount),
        reason: reason,
        awardedBy: walletAddress,
        bountyType: 'admin',
        metadata: {
          adminAward: true,
          timestamp: new Date().toISOString()
        }
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to award XP');
      }

      console.log('✅ XP Award successful:', result);

      // Add a small delay to ensure DB has fully committed
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh users data with cache-busting
      const usersResponse = await fetch(
        `/api/admin/users?wallet=${walletAddress}&t=${Date.now()}`,
        { cache: 'no-store' }
      );
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);

      // Also register this component for global refresh (in case other admins award XP)
      const componentId = `admin-xp-manager-${walletAddress}`;
      const { registerForRefresh } = await import('@/utils/globalRefresh');
      registerForRefresh(componentId, async () => {
        console.log('🔄 [AdminXPManager] Global refresh triggered');
        const refreshResponse = await fetch(
          `/api/admin/users?wallet=${walletAddress}&t=${Date.now()}`,
          { cache: 'no-store' }
        );
        const refreshData = await refreshResponse.json();
        setUsers(refreshData.users || []);
      });

      // Reset form
      setSelectedUser(null);
      setXpAmount('');
      setReason('');
      setSuccess(`Successfully awarded ${xpAmount} XP! New total: ${result.newTotalXP} XP (Level ${result.user?.level || 'N/A'})`);

      // Force refresh all components with multiple approaches
      
      // 1. Use the direct force refresh system
      const { forceRefreshAllXpComponents } = await import('@/utils/forceRefresh');
      forceRefreshAllXpComponents();

      // 2. Trigger global refresh system (if available)
      try {
        const { triggerXpRefresh } = await import('@/utils/globalRefresh');
        triggerXpRefresh({
          targetWallet: selectedUser,
          newTotalXP: result.newTotalXP,
          xpAwarded: xpAmount,
          awardedBy: walletAddress,
          reason: reason
        });
      } catch (error) {
        console.log('Global refresh system not available');
      }

      // 3. Trigger leaderboard refresh
      try {
        const { triggerLeaderboardRefresh } = await import('@/utils/leaderboardRefresh');
        triggerLeaderboardRefresh();
        console.log('🔄 [BountyXPManager] Leaderboard refresh triggered');
      } catch (error) {
        console.log('Leaderboard refresh system not available');
      }

      // 3. Show immediate feedback and offer refresh
      setTimeout(() => {
        const refreshAll = window.confirm(
          `🎉 XP Awarded Successfully!\n\n` +
          `User: ${selectedUser.slice(0, 8)}...\n` +
          `Amount: ${xpAmount} XP\n` +
          `New Total: ${result.newTotalXP} XP\n\n` +
          `Refresh all pages to see the updates?`
        );
        
        if (refreshAll) {
          // Refresh current page
          window.location.reload();
        }
      }, 1000);

    } catch (err) {
      console.error('❌ XP Award failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to award XP');
    } finally {
      setLoading(false);
    }
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getPlacementIcon = (placement?: string) => {
    switch (placement) {
      case 'first': return '🥇';
      case 'second': return '🥈';
      case 'third': return '🥉';
      default: return '📝';
    }
  };

  const getPlacementColor = (placement?: string) => {
    switch (placement) {
      case 'first': return 'text-yellow-400';
      case 'second': return 'text-gray-400';
      case 'third': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading users...</p>
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
            <Trophy className="w-6 h-6 text-yellow-400" />
            XP Management
          </h2>
          <p className="text-slate-400">Award XP points to users manually</p>
        </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-slate-400">Auto-refresh:</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-sm"
              disabled={!autoRefresh}
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
              <option value={600000}>10m</option>
            </select>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : "border-slate-600 text-slate-300"}
            >
              {autoRefresh ? "ON" : "OFF"}
            </Button>
            {autoRefresh && (
              <div className="flex items-center space-x-1 text-green-400 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            )}
          </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-900/20 border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* XP Award Form */}
      <Card className="bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="w-5 h-5" />
            Award XP to User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAwardXP} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userSelect" className="text-white">Select User</Label>
                <Select
                  value={selectedUser || ''}
                  onValueChange={(value) => setSelectedUser(value)}
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
                            {user.displayName || formatWalletAddress(user.wallet_address)}
                          </span>
                          <span className="text-sm text-gray-400 ml-2">
                            {user.total_xp || 0} XP
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
                  value={xpAmount}
                  onChange={(e) => setXpAmount(e.target.value)}
                  placeholder="Enter XP amount"
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                  required
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason" className="text-white">Reason</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for XP award"
                className="mt-1 bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading || !selectedUser || !xpAmount || !reason}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {loading ? 'Awarding...' : 'Award XP'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No Users Found</h3>
              <p className="text-slate-500">Users will appear here once they join the academy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users
                .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
                .map((user, index) => (
                <div key={user.wallet_address} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {user.displayName || formatWalletAddress(user.wallet_address)}
                        </h4>
                        <p className="text-sm text-slate-400">
                          Level {user.level || 1} • {user.submissionStats?.total || 0} submissions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-400">
                        {(user.total_xp || 0).toLocaleString()} XP
                      </div>
                      <div className="text-sm text-slate-400">
                        {user.squad || 'No Squad'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

