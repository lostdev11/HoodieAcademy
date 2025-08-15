'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, BookOpen, Trophy, Settings, Plus, Edit, Trash2, Search, Filter,
  RefreshCw, Download, Upload, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle,
  Info, User, Award, Target, TrendingUp, BarChart3, Megaphone, Bell, Clock,
  FileText, CheckSquare, XSquare, ArrowLeft, LogOut, Shield, AlertCircle, Lock, Key, CalendarDays
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import WalletConnectionsView from '@/components/admin/WalletConnectionsView';
import UserActivityView from '@/components/admin/UserActivityView';
import { logProfileUpdate, logSquadAssignment, logCourseActivity } from '@/lib/activity-logger';
import {
  fetchAllUsers,
  fetchAllCourseCompletions,
  fetchUserByWallet,
  User as SupabaseUser,
  CourseCompletion,
  approveBadge,
  resetCourses,
  approveFinalExam,
  unapproveFinalExam
} from '@/lib/supabase';
import {
  Announcement, Event, getAnnouncements, getEvents
} from '@/lib/utils';
import type { SolanaWallet } from '@/types/wallet';
import type { PhantomProvider } from '@/types/phantom';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  completedCourses: number;
  pendingApprovals: number;
  totalExamsTaken: number;
  placementTestsCompleted: number;
  squadDistribution: { [squad: string]: number };
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [courseCompletions, setCourseCompletions] = useState<CourseCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    completedCourses: 0,
    pendingApprovals: 0,
    totalExamsTaken: 0,
    placementTestsCompleted: 0,
    squadDistribution: {}
  });

  // Announcements & Events State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // User editing state
  const [editingUser, setEditingUser] = useState<SupabaseUser | null>(null);
  const [showUserEditForm, setShowUserEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    display_name: '',
    squad: ''
  });

  // User viewing state
  const [viewingUser, setViewingUser] = useState<SupabaseUser | null>(null);
  const [showUserViewModal, setShowUserViewModal] = useState(false);

  // Squad options
  const squadOptions = [
    { value: "🎤 Hoodie Speakers", label: "🎤 Hoodie Speakers" },
    { value: "🔍 Hoodie Decoders", label: "🔍 Hoodie Decoders" },
    { value: "⚡ Hoodie Raiders", label: "⚡ Hoodie Raiders" },
    { value: "🎯 Hoodie Rangers", label: "🎯 Hoodie Rangers" },
    { value: "🎨 Hoodie Creators", label: "🎨 Hoodie Creators" }
  ];

  const [finalExamLoading, setFinalExamLoading] = useState<string | null>(null);

  // Get wallet address using your existing logic
  useEffect(() => {
    const getWalletAddress = () => {
      const sol =
        (typeof window !== 'undefined' ? window.solana : undefined) as PhantomProvider | undefined;
      
      if (sol?.publicKey) {
        const addr = sol.publicKey.toString(); // OK
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Admin: Found wallet in window.solana:', addr);
        }
        setWalletAddress(addr);
        return addr;
      }
      
      const storedWallet = localStorage.getItem('connectedWallet');
      if (storedWallet) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Admin: Found wallet in localStorage:', storedWallet);
        }
        setWalletAddress(storedWallet);
        return storedWallet;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Admin: No wallet address found');
      }
      setWalletAddress(null);
      return null;
    };

    getWalletAddress();
    const interval = setInterval(getWalletAddress, 1000);
    
    // Fallback: if no wallet is found after 10 seconds, set loading to false
    const timeout = setTimeout(() => {
      if (!walletAddress) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Admin: Timeout reached, no wallet found');
        }
        setLoading(false);
        setIsAdmin(false);
      }
    }, 10000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [walletAddress]);

  // Check admin status
  useEffect(() => {
    if (!walletAddress) {
      console.log('🔍 Admin: No wallet address, skipping admin check');
      return;
    }
    
    console.log('🔍 Admin: Checking admin status for wallet:', walletAddress);
    fetchUserByWallet(walletAddress).then(user => {
      console.log('🔍 Admin: User data from Supabase:', user);
      const adminStatus = user?.is_admin === true;
      console.log('🔍 Admin: Is admin?', adminStatus);
      setIsAdmin(adminStatus);
    }).catch(error => {
      console.error('❌ Admin: Error fetching user:', error);
      setIsAdmin(false);
    });
  }, [walletAddress]);

  // Load dashboard data if admin
  useEffect(() => {
    if (isAdmin !== true) {
      console.log('🔍 Admin: Not admin, not loading data. isAdmin:', isAdmin);
      return;
    }
    
    console.log('🔍 Admin: Loading dashboard data...');
    const load = async () => {
      try {
        const [users, completions] = await Promise.all([
          fetchAllUsers(),
          fetchAllCourseCompletions(),
        ]);
        console.log('✅ Admin: Loaded users:', users.length);
        console.log('✅ Admin: Loaded completions:', completions.length);
        setUsers(users);
        setCourseCompletions(completions);
        calculateStats(users, completions);
        
        // Load announcements and events
        setAnnouncements(getAnnouncements());
        setEvents(getEvents());
      } catch (e) {
        console.error('❌ Admin: Error loading data:', e);
      } finally {
        console.log('✅ Admin: Finished loading, setting loading to false');
        setLoading(false);
      }
    };
    load();
  }, [isAdmin]);

  const calculateStats = (userList: SupabaseUser[], completions: CourseCompletion[]) => {
    const totalUsers = userList.length;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = userList.filter(user => 
      new Date(user.last_active ?? user.created_at ?? 0) > oneWeekAgo
    ).length;
    
    const completedCourses = completions.filter(c => c.completed_at).length;
    const pendingApprovals = completions.filter(c => c.completed_at && !c.approved).length;
    const totalExamsTaken = completions.filter(c => c.completed_at).length;
    
    const placementTestsCompleted = userList.filter(user => user.squad_test_completed).length;
    
    const squadDistribution: { [squad: string]: number } = {};
    userList.forEach(user => {
      if (user.squad_test_completed && user.squad) {
        squadDistribution[user.squad] = (squadDistribution[user.squad] || 0) + 1;
      }
    });

    setStats({
      totalUsers,
      activeUsers,
      completedCourses,
      pendingApprovals,
      totalExamsTaken,
      placementTestsCompleted,
      squadDistribution
    });
  };

  const handleApproveBadge = async (user_id: string, courseId: string) => {
    try {
      await approveBadge(user_id, courseId);
      
      // Log badge approval activity
      await logCourseActivity(user_id, 'course_approval', {
        course_id: courseId,
        course_name: courseId // You might want to get the actual course name
      });
      
      // Refresh data
      const [users, completions] = await Promise.all([
        fetchAllUsers(),
        fetchAllCourseCompletions(),
      ]);
      setUsers(users);
      setCourseCompletions(completions);
      calculateStats(users, completions);
    } catch (error) {
      console.error('Error approving badge:', error);
    }
  };

  const handleResetCourse = async (user_id: string, courseId: string) => {
    try {
      await resetCourses(user_id, courseId);
      // Refresh data
      const [users, completions] = await Promise.all([
        fetchAllUsers(),
        fetchAllCourseCompletions(),
      ]);
      setUsers(users);
      setCourseCompletions(completions);
      calculateStats(users, completions);
    } catch (error) {
      console.error('Error resetting course:', error);
    }
  };

  const handleEditUser = (user: SupabaseUser) => {
    setEditingUser(user);
    setEditFormData({
      display_name: user.display_name || '',
      squad: user.squad || ''
    });
    setShowUserEditForm(true);
  };

  const handleSaveUser = async (updatedUser: Partial<SupabaseUser>) => {
    try {
      // Here you would typically call a function to update the user in Supabase
      console.log('Saving user:', updatedUser);
      
      // Log profile updates for activity tracking
      if (editingUser && updatedUser.display_name !== editingUser.display_name) {
        await logProfileUpdate(editingUser.wallet_address, {
          display_name: updatedUser.display_name,
          squad: updatedUser.squad || editingUser.squad
        });
      }
      
      // Log squad assignments for activity tracking
      if (editingUser && updatedUser.squad !== editingUser.squad) {
        await logSquadAssignment(
          editingUser.wallet_address, 
          updatedUser.squad || '', 
          editingUser.squad
        );
      }
      
      // For now, just close the form
      setShowUserEditForm(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleViewUser = (user: SupabaseUser) => {
    setViewingUser(user);
    setShowUserViewModal(true);
  };

  // Final Exam Approve/Reject handlers
  const handleApproveFinalExam = async (wallet_address: string, course_id: string) => {
    if (!walletAddress) return;
    setFinalExamLoading(wallet_address + course_id + 'approve');
    try {
      await approveFinalExam(wallet_address, course_id, walletAddress);
      
      // Log course approval activity
      await logCourseActivity(wallet_address, 'course_approval', {
        course_id,
        course_name: course_id // You might want to get the actual course name
      });
      
      // Refresh completions
      const completions = await fetchAllCourseCompletions();
      setCourseCompletions(completions);
    } catch (e) {
      console.error('Error approving final exam:', e);
    } finally {
      setFinalExamLoading(null);
    }
  };
  const handleRejectFinalExam = async (wallet_address: string, course_id: string) => {
    setFinalExamLoading(wallet_address + course_id + 'reject');
    try {
      await unapproveFinalExam(wallet_address, course_id);
      // Refresh completions
      const completions = await fetchAllCourseCompletions();
      setCourseCompletions(completions);
    } catch (e) {
      console.error('Error rejecting final exam:', e);
    } finally {
      setFinalExamLoading(null);
    }
  };

  if (isAdmin === null || loading) return <div className="p-8 text-center">Loading...</div>;
  if (isAdmin === false) return (
    <div className="p-8 text-center text-red-600 dark:text-red-400">
      Access denied. You must be an admin to view this page.
      <br />
      <small>Wallet: {walletAddress || 'Not connected'}</small>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-400">Live user tracking and management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-green-500 text-green-400">
              <Shield className="w-4 h-4 mr-2" />
              Admin Access
            </Badge>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-green-400">{stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Courses Completed</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.completedCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pending Approvals</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="finalexams" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Final Exam Approvals
            </TabsTrigger>
            <TabsTrigger value="wallet-connections" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Wallet Connections
            </TabsTrigger>
            <TabsTrigger value="user-activity" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              User Activity
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Events
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Management</span>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Search users..." className="w-64" />
                    <Button size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => {
                    const userCompletions = courseCompletions.filter(
                      (c) => c.wallet_address === user.wallet_address
                    );
                    const coursesStarted = userCompletions.filter((c) => c.started_at).length;
                    const coursesCompleted = userCompletions.filter((c) => c.completed_at).length;
                    const approvedCompletions = userCompletions.filter((c) => c.approved).length;
                    const lastActive = user.last_active
                      ? new Date(user.last_active).toLocaleString()
                      : 'Never';
                    const active = new Date(user.last_active ?? user.created_at ?? 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

                    return (
                      <div
                        key={user.wallet_address}
                        className="bg-slate-700/50 p-4 rounded-lg border border-slate-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{user.display_name || 'Unnamed'}</h3>
                              <Badge variant="outline" className={`border-${active ? 'green' : 'red'}-500 text-${active ? 'green' : 'red'}-400`}>
                                {active ? 'Active' : 'Inactive'}
                              </Badge>
                              {user.squad && (
                                <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                                  {user.squad}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              {user.wallet_address}
                            </p>
                            <div className="flex gap-4 text-sm text-gray-300">
                              <span>Courses: {coursesStarted} started, {coursesCompleted} completed</span>
                              <span>Approved: {approvedCompletions}</span>
                              <span>Last Active: {lastActive}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle>Course Completions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseCompletions.map((completion) => {
                    const user = users.find(u => u.wallet_address === completion.wallet_address);
                    return (
                      <div
                        key={`${completion.wallet_address}-${completion.course_id}`}
                        className="bg-slate-700/50 p-4 rounded-lg border border-slate-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{user?.display_name || 'Unknown User'}</h3>
                              <Badge variant="outline" className="border-blue-500 text-blue-400">
                                {completion.course_id}
                              </Badge>
                              {completion.completed_at && (
                                <Badge variant="outline" className="border-green-500 text-green-400">
                                  Completed
                                </Badge>
                              )}
                              {completion.approved && (
                                <Badge variant="outline" className="border-purple-500 text-purple-400">
                                  Approved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              {completion.wallet_address}
                            </p>
                            <div className="flex gap-4 text-sm text-gray-300">
                              {completion.started_at && (
                                <span>Started: {new Date(completion.started_at).toLocaleDateString()}</span>
                              )}
                              {completion.completed_at && (
                                <span>Completed: {new Date(completion.completed_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {completion.completed_at && !completion.approved && (
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveBadge(completion.wallet_address, completion.course_id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleResetCourse(completion.wallet_address, completion.course_id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Final Exam Approvals Tab */}
          <TabsContent value="finalexams" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle>Wallet Wizardry Final Exam Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Display Name</th>
                        <th className="px-4 py-2 text-left">Wallet Address</th>
                        <th className="px-4 py-2 text-left">Completed At</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseCompletions.filter(c => c.course_id === 'wallet-wizardry-final-exam' && c.completed_at).map((completion) => {
                        const user = users.find(u => u.wallet_address === completion.wallet_address);
                        let statusBadge = null;
                        if (completion.final_exam_approved === true) statusBadge = <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
                        else if (completion.final_exam_approved === false) statusBadge = <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
                        else statusBadge = <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
                        return (
                          <tr key={completion.id || completion.wallet_address + completion.course_id} className="border-b border-slate-700">
                            <td className="px-4 py-2">{user?.display_name || 'Unknown'}</td>
                            <td className="px-4 py-2 font-mono text-xs break-all">{completion.wallet_address}</td>
                            <td className="px-4 py-2">{completion.completed_at ? new Date(completion.completed_at).toLocaleString() : '-'}</td>
                            <td className="px-4 py-2">{statusBadge}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={completion.final_exam_approved === true ? "outline" : "default"}
                                  disabled={completion.final_exam_approved === true || finalExamLoading === completion.wallet_address + completion.course_id + 'approve'}
                                  onClick={() => handleApproveFinalExam(completion.wallet_address, completion.course_id)}
                                >
                                  {finalExamLoading === completion.wallet_address + completion.course_id + 'approve' ? <RefreshCw className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4 mr-1" />} Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant={completion.final_exam_approved === false ? "outline" : "destructive"}
                                  disabled={completion.final_exam_approved === false || finalExamLoading === completion.wallet_address + completion.course_id + 'reject'}
                                  onClick={() => handleRejectFinalExam(completion.wallet_address, completion.course_id)}
                                >
                                  {finalExamLoading === completion.wallet_address + completion.course_id + 'reject' ? <RefreshCw className="animate-spin w-4 h-4" /> : <XCircle className="w-4 h-4 mr-1" />} Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Connections Tab */}
          <TabsContent value="wallet-connections" className="space-y-6">
            <WalletConnectionsView />
          </TabsContent>

          {/* User Activity Tab */}
          <TabsContent value="user-activity" className="space-y-6">
            <UserActivityView />
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Announcements</span>
                  <Button onClick={() => setShowAnnouncementForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="bg-slate-700/50 p-4 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{announcement.title}</h3>
                            <Badge variant="outline" className={`border-${announcement.isActive ? 'green' : 'red'}-500 text-${announcement.isActive ? 'green' : 'red'}-400`}>
                              {announcement.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{announcement.content}</p>
                          <div className="flex gap-4 text-sm text-gray-300">
                            <span>Start: {announcement.startDate}</span>
                            {announcement.endDate && <span>End: {announcement.endDate}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Events</span>
                  <Button onClick={() => setShowEventForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Event
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-slate-700/50 p-4 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{event.title}</h3>
                            <Badge variant="outline" className="border-blue-500 text-blue-400">
                              {event.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{event.description}</p>
                          <div className="flex gap-4 text-sm text-gray-300">
                            <span>Date: {event.date}</span>
                            <span>Time: {event.time}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Activity Tab */}
          <TabsContent value="user-activity" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Activity</span>
                  <Button onClick={() => {/* No specific action for now */}}>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    View All Activity
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserActivityView />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Edit Modal */}
      {showUserEditForm && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <Input 
                  value={editFormData.display_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Enter display name"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Address</label>
                <Input 
                  value={editingUser.wallet_address}
                  disabled
                  className="w-full bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Squad</label>
                <Select 
                  value={editFormData.squad} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, squad: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a squad or leave empty" />
                  </SelectTrigger>
                  <SelectContent>
                    {squadOptions.map((squad) => (
                      <SelectItem key={squad.value} value={squad.value}>
                        {squad.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    setShowUserEditForm(false);
                    setEditingUser(null);
                    setEditFormData({ display_name: '', squad: '' });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSaveUser({ ...editingUser, ...editFormData })}
                  className="flex-1"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User View Modal */}
      {showUserViewModal && viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">User Details</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowUserViewModal(false);
                  setViewingUser(null);
                }}
              >
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-blue-400">Basic Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Display Name</label>
                    <p className="text-white">{viewingUser.display_name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Wallet Address</label>
                    <p className="text-white font-mono text-sm break-all">{viewingUser.wallet_address}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Squad</label>
                    <p className="text-white">{viewingUser.squad || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Profile Completed</label>
                    <Badge variant="outline" className={viewingUser.profile_completed ? "border-green-500 text-green-400" : "border-red-500 text-red-400"}>
                      {viewingUser.profile_completed ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Squad Test Completed</label>
                    <Badge variant="outline" className={viewingUser.squad_test_completed ? "border-green-500 text-green-400" : "border-red-500 text-red-400"}>
                      {viewingUser.squad_test_completed ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Activity Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-green-400">Activity Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Joined</label>
                    <p className="text-white">{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleString() : 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Last Active</label>
                    <p className="text-white">{viewingUser.last_active ? new Date(viewingUser.last_active).toLocaleString() : 'Never'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Status</label>
                    <Badge variant="outline" className={new Date(viewingUser.last_active ?? viewingUser.created_at ?? 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? "border-green-500 text-green-400" : "border-red-500 text-red-400"}>
                      {new Date(viewingUser.last_active ?? viewingUser.created_at ?? 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Progress */}
            <div className="mt-8">
              <h4 className="font-semibold text-purple-400 mb-4">Course Progress</h4>
              <div className="space-y-3">
                {(() => {
                  const userCompletions = courseCompletions.filter(c => c.wallet_address === viewingUser.wallet_address);
                  const coursesStarted = userCompletions.filter(c => c.started_at).length;
                  const coursesCompleted = userCompletions.filter(c => c.completed_at).length;
                  const approvedCompletions = userCompletions.filter(c => c.approved).length;
                  
                  return (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <p className="text-sm text-gray-400">Courses Started</p>
                        <p className="text-2xl font-bold text-blue-400">{coursesStarted}</p>
                      </div>
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <p className="text-sm text-gray-400">Courses Completed</p>
                        <p className="text-2xl font-bold text-green-400">{coursesCompleted}</p>
                      </div>
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <p className="text-sm text-gray-400">Approved</p>
                        <p className="text-2xl font-bold text-purple-400">{approvedCompletions}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Course Details */}
            <div className="mt-6">
              <h4 className="font-semibold text-yellow-400 mb-4">Course Details</h4>
              <div className="space-y-2">
                {courseCompletions
                  .filter(c => c.wallet_address === viewingUser.wallet_address)
                  .map((completion) => (
                    <div key={`${completion.wallet_address}-${completion.course_id}`} className="bg-slate-700/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{completion.course_id}</p>
                          <div className="flex gap-2 mt-1">
                            {completion.started_at && (
                              <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs">
                                Started: {new Date(completion.started_at).toLocaleDateString()}
                              </Badge>
                            )}
                            {completion.completed_at && (
                              <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                                Completed: {new Date(completion.completed_at).toLocaleDateString()}
                              </Badge>
                            )}
                            {completion.approved && (
                              <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                                Approved
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}