'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import BountyManagerSimple from '@/components/admin/BountyManagerSimple';
import BountyXPManager from '@/components/admin/BountyXPManager';
import SubmissionApproval from '@/components/admin/SubmissionApproval';
import XPManagement from '@/components/admin/XPManagement';
import { EnhancedUsersManager } from '@/components/admin/EnhancedUsersManager';
import { 
  Users, BookOpen, Trophy, Settings, Shield, BarChart3, 
  Target, Megaphone, Bell, Database, Activity, Zap, 
  FileText, Star, CheckCircle
} from 'lucide-react';

interface Bounty {
  id?: string;
  title: string;
  short_desc: string;
  reward: string;
  reward_type: 'XP' | 'SOL' | 'NFT';
  start_date?: string;
  deadline?: string;
  status: 'active' | 'completed' | 'expired';
  hidden: boolean;
  squad_tag?: string;
  submissions?: number;
  nft_prize?: string;
  nft_prize_image?: string;
  nft_prize_description?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminDashboardPage() {
  const { wallet: walletAddress, isAdmin, connectWallet, loading: walletLoading } = useWalletSupabase();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');


  // Fetch bounties on component mount
  useEffect(() => {
    const fetchBounties = async () => {
      try {
        const response = await fetch('/api/bounties');
        if (response.ok) {
          const data = await response.json();
          setBounties(data);
        }
      } catch (error) {
        console.error('Error fetching bounties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();
  }, []);

  // Client-side admin protection
  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            Please connect your wallet to access the admin dashboard.
          </p>
          <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Admin Access Required</h1>
          <p className="text-slate-400 mb-6">
            This wallet ({walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}) does not have admin privileges.
          </p>
          <div className="space-y-2">
            <Button onClick={() => window.location.href = '/admin-force'} className="w-full">
              Try Admin Force Page
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-slate-400">Manage your academy</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline" 
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeTab === "overview" ? "default" : "outline"}
              onClick={() => setActiveTab("overview")}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </Button>
            <Button
              variant={activeTab === "bounties" ? "default" : "outline"}
              onClick={() => setActiveTab("bounties")}
              className="flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Bounties</span>
            </Button>
            <Button
              variant={activeTab === "submissions" ? "default" : "outline"}
              onClick={() => setActiveTab("submissions")}
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Submissions</span>
            </Button>
            <Button
              variant={activeTab === "bounty-xp" ? "default" : "outline"}
              onClick={() => setActiveTab("bounty-xp")}
              className="flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Bounty XP</span>
            </Button>
            <Button
              variant={activeTab === "xp-management" ? "default" : "outline"}
              onClick={() => setActiveTab("xp-management")}
              className="flex items-center space-x-2"
            >
              <Star className="w-4 h-4" />
              <span>XP Management</span>
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "outline"}
              onClick={() => setActiveTab("users")}
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "outline"}
              onClick={() => setActiveTab("settings")}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Bounties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{bounties.length}</div>
                  <p className="text-xs text-slate-500">Active bounties</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Active Bounties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    {bounties.filter(b => b.status === 'active').length}
                  </div>
                  <p className="text-xs text-slate-500">Currently active</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Hidden Bounties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">
                    {bounties.filter(b => b.hidden).length}
                  </div>
                  <p className="text-xs text-slate-500">Not visible to public</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">
                    {bounties.reduce((sum, b) => sum + (b.submissions || 0), 0)}
                  </div>
                  <p className="text-xs text-slate-500">Across all bounties</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Bounty XP System</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-400">+10 XP</div>
                  <p className="text-xs text-slate-500">Per submission</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setActiveTab('bounties')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Manage Bounties
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('submissions')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Review Submissions
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('bounty-xp')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Bounty XP Management
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('xp-management')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    XP Management
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/admin-bounties'} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Bounty Manager
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/admin-force'} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Force Page
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bounties.slice(0, 3).map((bounty) => (
                      <div key={bounty.id} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                        <div>
                          <p className="text-sm font-medium text-white">{bounty.title}</p>
                          <p className="text-xs text-slate-400">{bounty.reward} {bounty.reward_type}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          bounty.status === 'active' ? 'bg-green-900 text-green-300' :
                          bounty.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {bounty.status}
                        </span>
                      </div>
                    ))}
                    {bounties.length === 0 && (
                      <p className="text-slate-400 text-sm">No bounties yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bounties Tab */}
          <TabsContent value="bounties">
            <BountyManagerSimple 
              bounties={bounties} 
              onBountiesChange={setBounties}
              walletAddress={walletAddress}
            />
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <SubmissionApproval walletAddress={walletAddress} />
          </TabsContent>

          {/* Bounty XP Tab */}
          <TabsContent value="bounty-xp">
            <BountyXPManager walletAddress={walletAddress} />
          </TabsContent>

          {/* XP Management Tab */}
          <TabsContent value="xp-management">
            <XPManagement walletAddress={walletAddress} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <EnhancedUsersManager 
              walletAddress={walletAddress}
              onViewUserSubmissions={(user) => {
                // Switch to submissions tab and filter by user
                setActiveTab('submissions');
                // You could add a filter mechanism here to show only this user's submissions
                console.log('Viewing submissions for user:', user.displayName);
              }}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Admin Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">Admin settings coming soon...</p>
                <Button 
                  onClick={() => window.location.href = '/admin-force'} 
                  className="mt-4"
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Go to Admin Force Page
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
