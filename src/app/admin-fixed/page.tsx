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
  
  // XP Awarding state
  const [showXpAwardModal, setShowXpAwardModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [xpAmount, setXpAmount] = useState('');
  const [xpReason, setXpReason] = useState('');
  const [awardingXp, setAwardingXp] = useState(false);

  // XP Management state
  const [selectedUserForXp, setSelectedUserForXp] = useState<string>('');
  const [xpManagementAmount, setXpManagementAmount] = useState('');
  const [xpManagementReason, setXpManagementReason] = useState('');
  const [xpAwarding, setXpAwarding] = useState(false);
  const [userXpHistory, setUserXpHistory] = useState<any[]>([]);
  const [loadingXpHistory, setLoadingXpHistory] = useState(false);
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

  // XP Awarding functions
  const handleAwardXp = (user: any) => {
    console.log('🎯 Award XP button clicked for user:', user);
    setSelectedUser(user);
    setXpAmount('');
    setXpReason('');
    setShowXpAwardModal(true);
  };

  const handleSubmitXpAward = async () => {
    if (!selectedUser || !xpAmount || !xpReason) {
      alert('Please fill in all fields');
      return;
    }

    const amount = parseInt(xpAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid XP amount');
      return;
    }

    // Get current admin wallet from localStorage
    const currentAdminWallet = typeof window !== 'undefined' 
      ? localStorage.getItem('walletAddress') || localStorage.getItem('hoodie_academy_wallet') || walletAddress
      : walletAddress;

    setAwardingXp(true);
    try {
      console.log('🎯 Awarding XP:', {
        targetWallet: selectedUser.wallet_address,
        xpAmount: amount,
        reason: xpReason,
        awardedBy: currentAdminWallet
      });

      const response = await fetch('/api/admin/xp/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetWallet: selectedUser.wallet_address,
          xpAmount: amount,
          reason: xpReason,
          awardedBy: currentAdminWallet
        }),
      });

      console.log('📥 XP Award Response:', response.status, response.statusText);
      const result = await response.json();
      console.log('📥 XP Award Result:', result);

      if (response.ok) {
        alert(`Successfully awarded ${amount} XP to ${selectedUser.display_name || 'User'}!`);
        setShowXpAwardModal(false);
        setSelectedUser(null);
        setXpAmount('');
        setXpReason('');
        // Refresh users data
        fetchUsers();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
      alert('Failed to award XP. Please try again.');
    } finally {
      setAwardingXp(false);
    }
  };

  // XP Management functions
  const handleUserSelect = async (userId: string) => {
    setSelectedUserForXp(userId);
    if (userId) {
      await fetchUserXpHistory(userId);
    } else {
      setUserXpHistory([]);
    }
  };

  const fetchUserXpHistory = async (userId: string) => {
    setLoadingXpHistory(true);
    try {
      const response = await fetch(`/api/admin/xp/history?userId=${userId}`);
      if (response.ok) {
        const history = await response.json();
        setUserXpHistory(history);
      } else {
        console.error('Failed to fetch XP history');
        setUserXpHistory([]);
      }
    } catch (error) {
      console.error('Error fetching XP history:', error);
      setUserXpHistory([]);
    } finally {
      setLoadingXpHistory(false);
    }
  };

  const handleXpManagementAward = async () => {
    if (!selectedUserForXp || !xpManagementAmount || !xpManagementReason) {
      alert('Please fill in all fields');
      return;
    }

    const amount = parseInt(xpManagementAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid XP amount');
      return;
    }

    const selectedUserData = users.find(u => u.id === selectedUserForXp);
    if (!selectedUserData) {
      alert('Selected user not found');
      return;
    }

    // Get current admin wallet from localStorage
    const currentAdminWallet = typeof window !== 'undefined' 
      ? localStorage.getItem('walletAddress') || localStorage.getItem('hoodie_academy_wallet') || walletAddress
      : walletAddress;

    setXpAwarding(true);
    try {
      console.log('🎯 XP Management - Awarding XP:', {
        targetWallet: selectedUserData.wallet_address,
        xpAmount: amount,
        reason: xpManagementReason,
        awardedBy: currentAdminWallet
      });

      const response = await fetch('/api/admin/xp/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetWallet: selectedUserData.wallet_address,
          xpAmount: amount,
          reason: xpManagementReason,
          awardedBy: currentAdminWallet
        }),
      });

      console.log('📥 XP Management - Award Response:', response.status, response.statusText);
      const result = await response.json();
      console.log('📥 XP Management - Award Result:', result);

      if (response.ok) {
        alert(`Successfully awarded ${amount} XP to ${selectedUserData.display_name || 'User'}!`);
        setXpManagementAmount('');
        setXpManagementReason('');
        // Refresh users data and XP history
        fetchUsers();
        if (selectedUserForXp) {
          await fetchUserXpHistory(selectedUserForXp);
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
      alert('Failed to award XP. Please try again.');
    } finally {
      setXpAwarding(false);
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
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
            <TabsTrigger value="xp-management" className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>XP Management</span>
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
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-2">User</th>
                        <th className="text-left p-2">Squad</th>
                        <th className="text-left p-2">XP</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-700/50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium">{user.display_name || 'Anonymous'}</p>
                                <p className="text-xs text-slate-400">{user.wallet_address?.slice(0, 8)}...{user.wallet_address?.slice(-6)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline">{user.squad || 'No Squad'}</Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-yellow-400" />
                              <span className="font-medium text-yellow-400">{user.total_xp || 0}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant={user.is_admin ? "default" : "secondary"}>
                              {user.is_admin ? 'Admin' : 'User'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAwardXp(user)}
                                className="border-green-500 text-green-400 hover:bg-green-500/10"
                                title="Award XP to this user"
                              >
                                <Award className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* XP Management Tab */}
          <TabsContent value="xp-management" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* XP Award Form */}
              <Card className="bg-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Award className="w-5 h-5" />
                    Award XP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* User Selection */}
                  <div>
                    <Label htmlFor="user-select" className="text-sm text-gray-300">
                      Select User
                    </Label>
                    <Select value={selectedUserForXp} onValueChange={handleUserSelect}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Choose a user to award XP to..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id} className="text-white hover:bg-slate-600">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3" />
                              </div>
                              <div>
                                <div className="font-medium">{user.display_name || 'Anonymous'}</div>
                                <div className="text-xs text-slate-400">
                                  {user.wallet_address?.slice(0, 8)}...{user.wallet_address?.slice(-6)} • {user.total_xp || 0} XP
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* XP Amount */}
                  <div>
                    <Label htmlFor="xp-amount-management" className="text-sm text-gray-300">
                      XP Amount
                    </Label>
                    <Input
                      id="xp-amount-management"
                      type="number"
                      value={xpManagementAmount}
                      onChange={(e) => setXpManagementAmount(e.target.value)}
                      placeholder="Enter XP amount"
                      className="bg-slate-700 border-slate-600 text-white"
                      min="1"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <Label htmlFor="xp-reason-management" className="text-sm text-gray-300">
                      Reason
                    </Label>
                    <Input
                      id="xp-reason-management"
                      value={xpManagementReason}
                      onChange={(e) => setXpManagementReason(e.target.value)}
                      placeholder="Enter reason for awarding XP"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {/* Award Button */}
                  <Button
                    onClick={handleXpManagementAward}
                    disabled={xpAwarding || !selectedUserForXp || !xpManagementAmount || !xpManagementReason}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {xpAwarding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Awarding XP...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4 mr-2" />
                        Award XP
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* XP History */}
              <Card className="bg-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5" />
                    XP History
                    {selectedUserForXp && (
                      <Badge variant="outline" className="ml-auto">
                        {users.find(u => u.id === selectedUserForXp)?.display_name || 'Selected User'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedUserForXp ? (
                    <div className="text-center py-8 text-slate-400">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a user to view their XP history</p>
                    </div>
                  ) : loadingXpHistory ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-400">Loading XP history...</p>
                    </div>
                  ) : userXpHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No XP history found for this user</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userXpHistory.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                              <Award className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">+{entry.xp_amount} XP</p>
                              <p className="text-sm text-slate-400">{entry.reason}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(entry.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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

      {/* XP Award Modal */}
      {showXpAwardModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Award XP to {selectedUser.display_name || 'User'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="xp-amount" className="text-sm text-gray-300">
                  XP Amount
                </Label>
                <Input
                  id="xp-amount"
                  type="number"
                  value={xpAmount}
                  onChange={(e) => setXpAmount(e.target.value)}
                  placeholder="Enter XP amount"
                  className="bg-slate-700 border-slate-600 text-white"
                  min="1"
                />
              </div>
              
              <div>
                <Label htmlFor="xp-reason" className="text-sm text-gray-300">
                  Reason
                </Label>
                <Input
                  id="xp-reason"
                  value={xpReason}
                  onChange={(e) => setXpReason(e.target.value)}
                  placeholder="Enter reason for awarding XP"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmitXpAward}
                  disabled={awardingXp || !xpAmount || !xpReason}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {awardingXp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Awarding...
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 mr-2" />
                      Award XP
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowXpAwardModal(false)}
                  variant="outline"
                  disabled={awardingXp}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
