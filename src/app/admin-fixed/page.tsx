'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, BookOpen, Trophy, Settings, Plus, Edit, Trash2, Search, Filter,
  RefreshCw, Download, Upload, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle,
  Info, User, Award, Target, TrendingUp, BarChart3, Megaphone, Bell, Clock,
  FileText, CheckSquare, XSquare, ArrowLeft, LogOut, Shield, AlertCircle, Lock, Key, CalendarDays,
  Database, Activity, Zap, Globe, X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { DBBounty } from '@/types/database';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  completedCourses: number;
  pendingApprovals: number;
  totalExamsTaken: number;
  placementTestsCompleted: number;
  squadDistribution: { [squad: string]: number };
  totalBounties: number;
  activeBounties: number;
  hiddenBounties: number;
  totalSubmissions: number;
}

export default function AdminDashboardFixed() {
  const { wallet: walletAddress, isAdmin, connectWallet, loading: walletLoading } = useWalletSupabase();
  
  // Hardcoded admin check to bypass RLS issues
  const [isAdminHardcoded, setIsAdminHardcoded] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = () => {
      const adminWallets = [
        'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
        'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
        '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
        '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
      ];
      
      if (walletAddress) {
        const adminStatus = adminWallets.includes(walletAddress);
        setIsAdminHardcoded(adminStatus);
      } else {
        setIsAdminHardcoded(false);
      }
    };
    
    checkAdminStatus();
  }, [walletAddress]);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("users");
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    completedCourses: 0,
    pendingApprovals: 0,
    totalExamsTaken: 0,
    placementTestsCompleted: 0,
    squadDistribution: {},
    totalBounties: 0,
    activeBounties: 0,
    hiddenBounties: 0,
    totalSubmissions: 0
  });

  // Simple state - no realtime complexity
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [bounties, setBounties] = useState<DBBounty[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  // Ensure bounties is always an array
  const safeBounties = Array.isArray(bounties) ? bounties : [];
  
  // Form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showBountyForm, setShowBountyForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [editingBounty, setEditingBounty] = useState<DBBounty | null>(null);

  // Initialize data on component mount - SIMPLIFIED
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Initializing admin data...');
        
        // Simple data fetching without complex dependencies
        const [usersResponse, bountiesResponse] = await Promise.all([
          fetch('/api/admin/users').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
          fetch('/api/bounties').catch(() => ({ ok: false, json: () => Promise.resolve([]) }))
        ]);
        
        // Parse responses safely
        let usersData = [];
        let bountiesData = [];
        
        try {
          usersData = usersResponse.ok ? await usersResponse.json() : [];
        } catch (e) {
          console.warn('Failed to parse users data:', e);
          usersData = [];
        }
        
        try {
          bountiesData = bountiesResponse.ok ? await bountiesResponse.json() : [];
        } catch (e) {
          console.warn('Failed to parse bounties data:', e);
          bountiesData = [];
        }
        
        // Ensure data is always an array
        const safeUsersData = Array.isArray(usersData) ? usersData : [];
        const safeBountiesData = Array.isArray(bountiesData) ? bountiesData : [];
        
        console.log(`📊 Loaded ${safeUsersData.length} users and ${safeBountiesData.length} bounties`);
        
        setUsers(safeUsersData);
        setBounties(safeBountiesData);
        
        // Calculate basic stats
        const squadDistribution: { [squad: string]: number } = {};
        safeUsersData.forEach((user: any) => {
          if (user.squad) {
            squadDistribution[user.squad] = (squadDistribution[user.squad] || 0) + 1;
          }
        });
        
        setStats({
          totalUsers: safeUsersData.length,
          activeUsers: safeUsersData.length,
          completedCourses: 0,
          pendingApprovals: 0,
          totalExamsTaken: 0,
          placementTestsCompleted: 0,
          squadDistribution,
          totalBounties: safeBountiesData.length,
          activeBounties: safeBountiesData.filter((b: DBBounty) => b.status === 'active').length,
          hiddenBounties: safeBountiesData.filter((b: DBBounty) => b.hidden).length,
          totalSubmissions: 0
        });
        
        console.log('✅ Admin data initialization complete');
        setLoading(false);
      } catch (error) {
        console.error('❌ Error initializing admin data:', error);
        setLoading(false);
      }
    };
    
    if (isAdminHardcoded) {
      initializeData();
    }
  }, [isAdminHardcoded]); // Only depend on admin status

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
            <User className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdminHardcoded) {
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

  const handleEditBounty = (bounty: DBBounty) => {
    setEditingBounty(bounty);
    setShowBountyForm(true);
  };

  const handleSaveBounty = async (bountyData: Partial<DBBounty>) => {
    try {
      const url = editingBounty ? `/api/bounties/${editingBounty.id}` : '/api/bounties';
      const method = editingBounty ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bountyData, walletAddress })
      });

      if (!response.ok) {
        throw new Error('Failed to save bounty');
      }

      const savedBounty = await response.json();
      
      if (editingBounty) {
        setBounties((prevBounties) => (prevBounties || []).map(b => b.id === editingBounty.id ? savedBounty : b));
      } else {
        setBounties((prevBounties) => [savedBounty, ...(prevBounties || [])]);
      }

      setShowBountyForm(false);
      setEditingBounty(null);
    } catch (error) {
      console.error('Error saving bounty:', error);
      alert('Failed to save bounty');
    }
  };

  const handleDeleteBounty = async (bountyId: string) => {
    if (!confirm('Are you sure you want to delete this bounty?')) return;

    try {
      const response = await fetch(`/api/bounties/${bountyId}?walletAddress=${walletAddress}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete bounty');
      }

      setBounties((prevBounties) => (prevBounties || []).filter(b => b.id !== bountyId));
    } catch (error) {
      console.error('Error deleting bounty:', error);
      alert('Failed to delete bounty');
    }
  };

  const handleToggleHidden = async (bounty: DBBounty) => {
    try {
      console.log('🔄 [BOUNTY TOGGLE] Toggling bounty visibility:', bounty.id, 'from', bounty.hidden, 'to', !bounty.hidden);
      console.log('🔑 [BOUNTY TOGGLE] Using wallet address:', walletAddress);
      
      const response = await fetch(`/api/bounties/${bounty.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Wallet-Address': walletAddress  // ← Send wallet address for admin check
        },
        body: JSON.stringify({ 
          hidden: !bounty.hidden  // ← Only send the field we want to update
        })
      });
      
      console.log('📊 [BOUNTY TOGGLE] Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to update bounty');
      }

      const updatedBounty = await response.json();
      setBounties((prevBounties) => (prevBounties || []).map(b => b.id === bounty.id ? updatedBounty : b));
    } catch (error) {
      console.error('Error updating bounty:', error);
      alert('Failed to update bounty');
    }
  };

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
      <ErrorBoundary>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="bounties" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Bounties</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                  <p className="text-xs text-slate-500">Registered users</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Bounties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalBounties}</div>
                  <p className="text-xs text-slate-500">Active bounties</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Active Bounties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{stats.activeBounties}</div>
                  <p className="text-xs text-slate-500">Currently active</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Hidden Bounties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">{stats.hiddenBounties}</div>
                  <p className="text-xs text-slate-500">Not visible to public</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bounties Tab */}
          <TabsContent value="bounties" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Bounty Management</h2>
                <p className="text-slate-400">Create and manage bounties for your community</p>
              </div>
              <Button 
                onClick={() => setShowBountyForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Bounty
              </Button>
            </div>

            {/* Bounty Form */}
            {showBountyForm && (
              <Card className="bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-green-400">
                    {editingBounty ? 'Edit Bounty' : 'Create New Bounty'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    
                    const bountyData = {
                      title: String(formData.get('title') || ''),
                      short_desc: String(formData.get('short_desc') || ''),
                      reward: String(formData.get('reward') || ''),
                      reward_type: String(formData.get('reward_type') || 'XP') as 'XP' | 'SOL',
                      start_date: String(formData.get('start_date') || ''),
                      deadline: String(formData.get('deadline') || ''),
                      squad_tag: String(formData.get('squad_tag') || ''),
                      status: String(formData.get('status') || 'active') as "active" | "completed" | "expired",
                      hidden: formData.get('hidden') === 'on'
                    };
                    
                    await handleSaveBounty(bountyData);
                  }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="title">Bounty Title *</Label>
                        <Input
                          name="title"
                          defaultValue={editingBounty?.title || ''}
                          required
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="short_desc">Description *</Label>
                        <Input
                          name="short_desc"
                          defaultValue={editingBounty?.short_desc || ''}
                          required
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Input
                          name="reward"
                          placeholder="Reward Amount (e.g., 1000)"
                          defaultValue={editingBounty?.reward || ''}
                          required
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <select
                          name="reward_type"
                          defaultValue={editingBounty?.reward_type || 'XP'}
                          className="bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-md"
                        >
                          <option value="XP">XP</option>
                          <option value="SOL">SOL</option>
                        </select>
                      </div>

                      <Input
                        name="start_date"
                        type="date"
                        defaultValue={editingBounty?.start_date ? new Date(editingBounty.start_date).toISOString().slice(0, 10) : ''}
                        className="bg-slate-700 border-slate-600 text-white"
                      />

                      <Input
                        name="deadline"
                        type="date"
                        defaultValue={editingBounty?.deadline ? new Date(editingBounty.deadline).toISOString().slice(0, 10) : ''}
                        className="bg-slate-700 border-slate-600 text-white"
                      />

                      <Input
                        name="squad_tag"
                        placeholder="Squad Tag (optional)"
                        defaultValue={editingBounty?.squad_tag || ''}
                        className="bg-slate-700 border-slate-600 text-white"
                      />

                      <select
                        name="status"
                        defaultValue={editingBounty?.status || 'active'}
                        className="bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-md"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="expired">Expired</option>
                      </select>

                      <div className="md:col-span-2 flex items-center space-x-2">
                        <input
                          id="hidden"
                          name="hidden"
                          type="checkbox"
                          defaultChecked={editingBounty?.hidden || false}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="hidden">Hide this bounty from public view</Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowBountyForm(false);
                          setEditingBounty(null);
                        }}
                        className="border-slate-600 text-slate-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {editingBounty ? 'Update Bounty' : 'Create Bounty'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Bounties List */}
            <div className="grid gap-4">
              {safeBounties.length === 0 ? (
                <Card className="bg-slate-800">
                  <CardContent className="pt-6 text-center">
                    <Target className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">No Bounties Yet</h3>
                    <p className="text-slate-500">Create your first bounty to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                safeBounties.map((bounty) => (
                  <Card key={bounty.id} className="bg-slate-800">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{bounty.title}</h3>
                            {bounty.hidden && (
                              <Badge variant="secondary" className="bg-yellow-900 text-yellow-300">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hidden
                              </Badge>
                            )}
                            <Badge className={`${
                              bounty.status === 'active' ? 'bg-green-500' :
                              bounty.status === 'completed' ? 'bg-blue-500' :
                              'bg-red-500'
                            } text-white`}>
                              {bounty.status}
                            </Badge>
                          </div>
                          
                          <p className="text-slate-300 mb-3">{bounty.short_desc}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3">
                            <div>
                              <span className="text-slate-400">Reward:</span>
                              <div className="font-medium text-green-400">{bounty.reward} {bounty.reward_type || 'XP'}</div>
                            </div>

                            <div>
                              <span className="text-slate-400">Start Date:</span>
                              <div className="font-medium">
                                {bounty.start_date ? new Date(bounty.start_date).toLocaleDateString() : 'No start date'}
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-400">End Date:</span>
                              <div className="font-medium">
                                {bounty.deadline ? new Date(bounty.deadline).toLocaleDateString() : 'No deadline'}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400">Submissions:</span>
                              <div className="font-medium text-blue-400">{bounty.submissions || 0}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleHidden(bounty)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            {bounty.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditBounty(bounty)}
                            className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBounty(bounty.id!)}
                            className="border-red-500 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">User management features coming soon...</p>
                <div className="mt-4">
                  <p className="text-sm text-slate-500">Total Users: {stats.totalUsers}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Admin Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">Admin settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </ErrorBoundary>
    </div>
  );
}
