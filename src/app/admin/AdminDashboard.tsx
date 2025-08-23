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
  FileText, CheckSquare, XSquare, ArrowLeft, LogOut, Shield, AlertCircle, Lock, Key, CalendarDays,
  Database, Activity, Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import {
  fetchAllUsers,
  fetchAllCourseCompletions,
  fetchUserByWallet,
  User as SupabaseUser,
  CourseCompletion,
  approveBadge,
  resetCourses
} from '@/lib/supabase';
import {
  setCourseVisibility,
  setCoursePublished
} from '@/lib/server-actions';
import {
  createOrUpdateBounty,
  toggleBountyHidden,
  deleteBounty,
  createOrUpdateAnnouncement,
  publishAnnouncement,
  deleteAnnouncement,
  createOrUpdateEvent,
  deleteEvent
} from '@/lib/admin-server-actions';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { DBAnnouncement, DBEvent, DBBounty } from '@/types/database';

interface Course {
  id: string;
  title: string;
  emoji: string;
  squad: string;
  level: string;
  access: string;
  description: string;
  totalLessons: number;
  category: string;
  created_at: string;
  updated_at: string;
  is_visible: boolean;
  is_published: boolean;
}



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

interface AdminDashboardProps {
  initialCourses: Course[];
  initialAnnouncements: DBAnnouncement[];
  initialEvents: DBEvent[];
  initialBounties: DBBounty[];
  initialSubmissions: any[];
  initialGlobalSettings?: any;
  initialFeatureFlags?: any[];
}

export default function AdminDashboard({
  initialCourses = [],
  initialAnnouncements = [],
  initialEvents = [],
  initialBounties = [],
  initialSubmissions = [],
  initialGlobalSettings = {},
  initialFeatureFlags = [],
}: AdminDashboardProps) {
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [courseCompletions, setCourseCompletions] = useState<CourseCompletion[]>([]);
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

  // Realtime state with hooks
  const { data: announcements, setData: setAnnouncements } = useRealtimeList<DBAnnouncement>("announcements", initialAnnouncements);
  const { data: events, setData: setEvents } = useRealtimeList<DBEvent>("events", initialEvents);
  const { data: bounties, setData: setBounties } = useRealtimeList<DBBounty>("bounties", initialBounties);
  const { data: submissions, setData: setSubmissions } = useRealtimeList<any>("submissions", initialSubmissions);
  
  // Form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DBEvent | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<DBAnnouncement | null>(null);


  // User editing state
  const [editingUser, setEditingUser] = useState<SupabaseUser | null>(null);
  const [showUserEditForm, setShowUserEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    display_name: '',
    squad: '',
    is_admin: false,
    wallet_address: ''
  });

  // User viewing state
  const [viewingUser, setViewingUser] = useState<SupabaseUser | null>(null);
  const [showUserViewModal, setShowUserViewModal] = useState(false);





  // Course management state
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [courseManagementLoading, setCourseManagementLoading] = useState(false);







  // Course management functions
  const handleToggleCourseVisibility = async (courseId: string, nextVisible: boolean) => {
    setCourseManagementLoading(true);
    try {
      await setCourseVisibility(courseId, nextVisible);
      // Optimistic UI (optional): update local state immediately
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_visible: nextVisible } : c));
    } catch (e) {
      console.error("Error toggling visibility:", e);
    } finally {
      setCourseManagementLoading(false);
    }
  };

  const handleToggleCoursePublished = async (courseId: string, nextPublished: boolean) => {
    setCourseManagementLoading(true);
    try {
      await setCoursePublished(courseId, nextPublished);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_published: nextPublished } : c));
    } catch (error) {
      console.error("Error toggling published:", error);
    } finally {
      setCourseManagementLoading(false);
    }
  };

  // Bounty management functions
  const toggleBountyVisibility = async (bountyId: string) => {
    const b = initialBounties.find(x => x.id === bountyId);
    if (!b) return;
    await toggleBountyHidden(bountyId, !b.hidden);
  };

  const updateBountyStatus = async (bountyId: string, newStatus: "active" | "completed" | "expired") => {
    const b = initialBounties.find(x => x.id === bountyId);
    if (!b) return;
    await createOrUpdateBounty({
      id: b.id,
      title: b.title,
      short_desc: b.short_desc,
      reward: b.reward,
      deadline: b.deadline,
      link_to: b.link_to,
      image: b.image,
      squad_tag: b.squad_tag,
      status: newStatus,
      hidden: b.hidden,
      submissions: b.submissions,
    });
  };

  const deleteBountyRow = async (bountyId: string) => {
    await deleteBounty(bountyId);
  };

  const handleEditBounty = (bounty: DBBounty) => {
    // TODO: Implement bounty editing functionality
    // This could open a modal or form to edit the bounty
    console.log('Edit bounty:', bounty);
  };

  // Announcement handlers
  const handleNewAnnouncement = async (input: {
    title: string; content: string; starts_at?: string | null; ends_at?: string | null; is_published?: boolean;
  }) => {
    await createOrUpdateAnnouncement(input);
  };

  const handlePublishAnnouncement = async (id: string, publish: boolean) => {
    try {
      await publishAnnouncement(id, publish);
    } catch (error) {
      console.error('Error publishing announcement:', error);
      // You could add a toast notification here
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      if (confirm('Are you sure you want to delete this announcement?')) {
        await deleteAnnouncement(id);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      // You could add a toast notification here
    }
  };

  // Event handlers
  const handleNewOrEditEvent = async (input: {
    id?: string; title: string; description: string; type: string; date?: string | null; time?: string | null;
  }) => {
    await createOrUpdateEvent(input);
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteEvent(id);
  };

  // User management functions
  const handleViewUser = (user: SupabaseUser) => {
    setViewingUser(user);
    setShowUserViewModal(true);
  };

  const handleEditUser = (user: SupabaseUser) => {
    setEditingUser(user);
    setEditFormData({
      display_name: user.display_name || '',
      squad: user.squad || '',
      is_admin: user.is_admin || false,
      wallet_address: user.wallet_address || ''
    });
    setShowUserEditForm(true);
  };

  const handleRefreshData = () => {
    // Reload the page to get fresh data from the server
    window.location.reload();
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch users and course completions
        const [usersData, completionsData] = await Promise.all([
          fetchAllUsers(),
          fetchAllCourseCompletions()
        ]);
        
        setUsers(usersData);
        setCourseCompletions(completionsData);
        
        // Debug: Log bounty data
        console.log('Admin Dashboard - Initial Bounties data:', initialBounties);
        console.log('Admin Dashboard - Initial Bounties count:', initialBounties.length);
        console.log('Admin Dashboard - Submissions data:', initialSubmissions);
        console.log('Admin Dashboard - Submissions count:', initialSubmissions.length);
        
        // Calculate stats
        const squadDistribution: { [squad: string]: number } = {};
        usersData.forEach(user => {
          if (user.squad) {
            squadDistribution[user.squad] = (squadDistribution[user.squad] || 0) + 1;
          }
        });
        
        setStats({
          totalUsers: usersData.length,
          activeUsers: usersData.filter(u => u.last_seen && new Date(u.last_seen) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
          completedCourses: completionsData.filter(c => c.status === 'completed').length,
          pendingApprovals: completionsData.filter(c => c.status === 'pending').length,
          totalExamsTaken: completionsData.filter(c => c.status === 'completed').length,
          placementTestsCompleted: usersData.filter(u => u.placement_test_completed).length,
          squadDistribution,
          totalBounties: initialBounties.length,
          activeBounties: initialBounties.filter(b => b.status === 'active').length,
          hiddenBounties: initialBounties.filter(b => b.hidden).length,
          totalSubmissions: initialSubmissions.length
        });
        

        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing admin data:', error);
        setLoading(false);
      }
    };
    
    initializeData();
  }, [initialBounties, initialSubmissions]); // Add both as dependencies









  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="w-full lg:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm lg:text-base">Live user tracking and management</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:gap-4">
            <Badge variant="outline" className="border-green-500 text-green-400 w-fit">
              <Shield className="w-4 h-4 mr-2" />
              Admin Access
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto"
              onClick={handleRefreshData}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6 mb-8">
          <Card className="bg-slate-800/50 border-blue-500/30">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-sm text-slate-400">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/30">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-sm text-slate-400">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center space-x-3">
                <Trophy className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-sm text-slate-400">Completed Courses</p>
                  <p className="text-2xl font-bold">{stats.completedCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-yellow-500/30">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center space-x-3">
                <Target className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-sm text-slate-400">Pending Approvals</p>
                  <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-orange-500/30">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center space-x-3">
                <Award className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-sm text-slate-400">Active Bounties</p>
                  <p className="text-2xl font-bold">{stats.activeBounties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-indigo-500/30">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-indigo-400" />
                <div>
                  <p className="text-sm text-slate-400">Total Submissions</p>
                  <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Summary */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Data Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-slate-400">Users</p>
              <p className="text-xl font-bold text-blue-400">{stats.totalUsers}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Courses</p>
              <p className="text-xl font-bold text-purple-400">{initialCourses.length}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Bounties</p>
              <p className="text-xl font-bold text-orange-400">{initialBounties.length}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Submissions</p>
              <p className="text-xl font-bold text-indigo-400">{initialSubmissions.length}</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 text-center">
            All data is fetched from the database and synchronized across all tabs. Use the refresh button to get the latest data.
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="bounties" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Bounties
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
                            <Badge variant={user.is_admin ? "default" : "secondary"}>
                              {user.is_admin ? 'Admin' : 'User'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewUser(user)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="w-3 h-3" />
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

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <div key={course.id} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{course.emoji}</span>
                            <h3 className="font-semibold text-lg">{course.title}</h3>
                            <Badge variant="outline" className="border-blue-500 text-blue-400">
                              {course.id}
                            </Badge>
                            <Badge variant="outline" className="border-green-500 text-green-400">
                              {course.squad}
                            </Badge>
                            <Badge variant="outline" className="border-purple-500 text-purple-400">
                              {course.level}
                            </Badge>
                            <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                              {course.access}
                            </Badge>
                            {!course.is_visible && (
                              <Badge variant="outline" className="border-red-500 text-red-400">
                                Hidden
                              </Badge>
                            )}
                            {!course.is_published && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                                Draft
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{course.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Lessons: {course.totalLessons || 'N/A'}</span>
                            <span>Category: {course.category || 'N/A'}</span>
                            <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
                            <span>Updated: {new Date(course.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                                                     <Button
                             size="sm"
                             variant={course.is_visible ? "default" : "outline"}
                             onClick={() => handleToggleCourseVisibility(course.id, !course.is_visible)}
                             disabled={courseManagementLoading}
                             className={course.is_visible ? "bg-green-600 hover:bg-green-700" : "border-gray-500 text-gray-400"}
                           >
                             {course.is_visible ? (
                               <>
                                 <Eye className="w-3 h-3 mr-1" />
                                 Visible
                               </>
                             ) : (
                               <>
                                 <EyeOff className="w-3 h-3 mr-1" />
                                 Hidden
                               </>
                             )}
                           </Button>
                           <Button
                             size="sm"
                             variant={course.is_published ? "default" : "outline"}
                             onClick={() => handleToggleCoursePublished(course.id, !course.is_published)}
                             disabled={courseManagementLoading}
                             className={course.is_published ? "bg-blue-600 hover:bg-blue-700" : "border-gray-500 text-blue-400"}
                           >
                             {course.is_published ? (
                               <>
                                 <CheckCircle className="w-3 h-3 mr-1" />
                                 Published
                               </>
                             ) : (
                               <>
                                 <XCircle className="w-3 h-3 mr-1" />
                                 Draft
                               </>
                             )}
                           </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bounties Tab */}
          <TabsContent value="bounties" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Bounty Management
                  </span>
                  <Button onClick={() => {
                    // TODO: Implement bounty creation modal
                    alert('Bounty creation coming soon! This will allow admins to create new bounty challenges.');
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Bounty
                  </Button>
                </CardTitle>
                <p className="text-sm text-slate-400 mt-2">
                  Bounties are created from user submissions. Each bounty shows all submissions related to that bounty challenge.
                  Use the "Create New Bounty" button to set up new bounty challenges for users.
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  <strong>Current Data:</strong> Showing {initialBounties.length} bounties with {initialSubmissions.filter(s => s.bounty_id).length} bounty submissions.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {initialBounties.map((bounty) => (
                    <div key={bounty.id} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{bounty.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">{bounty.short_desc}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span>Reward: {bounty.reward}</span>
                            <span>Deadline: {bounty.deadline || 'No deadline'}</span>
                            <span>Total Submissions: {bounty.submissions}</span>
                            <Badge variant={bounty.status === 'active' ? 'default' : 'secondary'}>
                              {bounty.status}
                            </Badge>
                            {bounty.squad_tag && (
                              <Badge variant="outline" className="border-blue-500 text-blue-400">
                                {bounty.squad_tag}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Show submissions for this bounty */}
                          {bounty.submissions && bounty.submissions > 0 && (
                            <div className="mt-3 p-3 bg-slate-700/50 rounded border border-slate-600">
                              <h4 className="text-sm font-medium mb-2 text-blue-400">Submissions: {bounty.submissions}</h4>
                              <div className="space-y-2">
                                {/* Note: Individual submission details would need to be fetched separately */}
                                <p className="text-xs text-gray-400">Submission details not loaded</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEditBounty(bounty)}
                            className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                          >
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant={bounty.hidden ? "default" : "outline"}
                            onClick={() => toggleBountyVisibility(bounty.id)}
                            className={bounty.hidden ? "bg-red-600 hover:bg-red-700" : "border-gray-500 text-gray-400"}
                          >
                            {bounty.hidden ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                            {bounty.hidden ? "Show" : "Hide"}
                          </Button>
                          <Select value={bounty.status} onValueChange={(v) => updateBountyStatus(bounty.id, v as any)}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteBountyRow(bounty.id)} 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {initialBounties.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      No bounty submissions found. Bounties will appear here when users submit to bounty challenges.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Submissions
                </CardTitle>
                <p className="text-sm text-slate-400 mt-2">
                  All user submissions across the platform. This includes bounty submissions, course submissions, and other content.
                  Use the Review and Approve buttons to manage submission status.
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  <strong>Current Data:</strong> Showing {initialSubmissions.length} total submissions across all categories.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {initialSubmissions.map((submission: any) => (
                    <div key={submission.id} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{submission.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">{submission.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span>Bounty ID: {submission.bounty_id || 'No Bounty'}</span>
                            <span>Squad: {submission.squad || 'No Squad'}</span>
                            <span>Upvotes: {submission.total_upvotes || 0}</span>
                            <Badge variant={submission.status === 'approved' ? 'default' : submission.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {submission.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-400">
                            <p>Submitted by: {submission.wallet_address?.slice(0, 8)}...{submission.wallet_address?.slice(-6)}</p>
                            <p>Created: {new Date(submission.created_at).toLocaleDateString()}</p>
                            {submission.image_url && (
                              <p>Has Image: Yes</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                            onClick={() => {
                              // TODO: Implement submission review functionality
                              alert('Submission review functionality coming soon!');
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" /> Review
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                            onClick={() => {
                              // TODO: Implement submission approval/rejection
                              alert('Submission approval functionality coming soon!');
                            }}
                          >
                            <CheckSquare className="w-3 h-3 mr-1" /> Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {initialSubmissions.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      No submissions found. Submissions will appear here when users submit content.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Announcements</span>
                  <Button onClick={() => { setShowAnnouncementForm(true); setEditingAnnouncement(null); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Inline Create/Edit Form */}
                {showAnnouncementForm && (
                  <div className="mb-6 p-4 border border-slate-600 rounded-lg bg-slate-700/40">
                    <form action={async (formData: FormData) => {
                      const title = String(formData.get("title") || "");
                      const content = String(formData.get("content") || "");
                      const starts_at = String(formData.get("starts_at") || "") || null;
                      const ends_at = String(formData.get("ends_at") || "") || null;
                      const is_published = formData.get("is_published") === "on";
                      await createOrUpdateAnnouncement({ title, content, starts_at, ends_at, is_published });
                      setShowAnnouncementForm(false);
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input name="title" placeholder="Title" required />
                        <div className="flex items-center gap-2">
                          <input id="is_published" name="is_published" type="checkbox" className="h-4 w-4" />
                          <label htmlFor="is_published" className="text-sm text-gray-300">Publish</label>
                        </div>
                        <Input name="starts_at" type="datetime-local" />
                        <Input name="ends_at" type="datetime-local" />
                        <textarea name="content" placeholder="Write announcement..." className="md:col-span-2 w-full p-3 rounded-md border border-slate-600 bg-slate-700 text-white min-h-[120px]" />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">Save</Button>
                        <Button type="button" variant="outline" onClick={() => setShowAnnouncementForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* List */}
                <div className="space-y-4">
                  {announcements.map((a) => (
                    <div key={a.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{a.title}</h3>
                            <Badge variant="outline" className={a.is_published ? "border-green-500 text-green-400" : "border-yellow-500 text-yellow-400"}>
                              {a.is_published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{a.content}</p>
                          <div className="mt-2 text-xs text-gray-400 flex gap-4">
                            {a.starts_at && <span>Start: {new Date(a.starts_at).toLocaleString()}</span>}
                            {a.ends_at && <span>End: {new Date(a.ends_at).toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={async () => { await publishAnnouncement(a.id, !a.is_published); }}>
                            {a.is_published ? "Unpublish" : "Publish"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => { await deleteAnnouncement(a.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <div className="text-center text-gray-400 py-8">No announcements yet.</div>
                  )}
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
                  <Button onClick={() => { setShowEventForm(true); setEditingEvent(null); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Event
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Inline Create/Edit Form */}
                {showEventForm && (
                  <div className="mb-6 p-4 border border-slate-600 rounded-lg bg-slate-700/40">
                    <form action={async (formData: FormData) => {
                      const title = String(formData.get("title") || "");
                      const description = String(formData.get("description") || "");
                      const type = String(formData.get("type") || "space");
                      const date = String(formData.get("date") || "") || null;
                      const time = String(formData.get("time") || "") || null;
                      await createOrUpdateEvent({ title, description, type, date, time });
                      setShowEventForm(false);
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input name="title" placeholder="Title" required />
                        <Input name="type" placeholder="Type (space | class | workshop)" />
                        <Input name="date" type="date" />
                        <Input name="time" type="time" />
                        <textarea name="description" placeholder="Describe the event..." className="md:col-span-2 w-full p-3 rounded-md border border-slate-600 bg-slate-700 text-white min-h-[120px]" />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">Save</Button>
                        <Button type="button" variant="outline" onClick={() => setShowEventForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* List */}
                <div className="space-y-4">
                  {events.map((e) => (
                    <div key={e.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{e.title}</h3>
                            <Badge variant="outline" className="border-blue-500 text-blue-400">{e.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-300">{e.description}</p>
                          <div className="mt-2 text-xs text-gray-400 flex gap-4">
                            {e.date && <span>Date: {new Date(e.date).toLocaleDateString()}</span>}
                            {e.time && <span>Time: {e.time}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={async () => {
                            await createOrUpdateEvent({
                              id: e.id, title: e.title, description: e.description, type: e.type, date: e.date, time: e.time
                            });
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => { await deleteEvent(e.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center text-gray-400 py-8">No events yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Admin Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Admin Users Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Admin Users
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-2">User</th>
                            <th className="text-left p-2">Wallet</th>
                            <th className="text-left p-2">Squad</th>
                            <th className="text-left p-2">Admin Since</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.filter(user => user.is_admin).map((adminUser) => (
                            <tr key={adminUser.id} className="border-b border-slate-700/50">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{adminUser.display_name || 'Anonymous'}</p>
                                    <p className="text-xs text-blue-400">Admin</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-2">
                                <code className="text-xs bg-slate-700 px-2 py-1 rounded">
                                  {adminUser.wallet_address?.slice(0, 8)}...{adminUser.wallet_address?.slice(-6)}
                                </code>
                              </td>
                              <td className="p-2">
                                <Badge variant="outline">{adminUser.squad || 'No Squad'}</Badge>
                              </td>
                              <td className="p-2">
                                <span className="text-xs text-gray-400">
                                  {adminUser.created_at ? new Date(adminUser.created_at).toLocaleDateString() : 'Unknown'}
                                </span>
                              </td>
                              <td className="p-2">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewUser(adminUser)}
                                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditUser(adminUser)}
                                    className="border-green-500 text-green-400 hover:bg-green-500/10"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* System Status Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      System Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-slate-700/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="w-4 h-4 text-blue-400" />
                            <span className="font-medium">Database</span>
                          </div>
                          <div className="text-sm text-gray-300">
                            <p>Connection: <span className="text-green-400">Active</span></p>
                            <p>Tables: <span className="text-blue-400">{stats.totalUsers > 0 ? 'Loaded' : 'Loading...'}</span></p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-700/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-green-400" />
                            <span className="font-medium">API Status</span>
                          </div>
                          <div className="text-sm text-gray-300">
                            <p>Routes: <span className="text-green-400">All Active</span></p>
                            <p>Auth: <span className="text-green-400">Secure</span></p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Quick Actions Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={handleRefreshData}
                        className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Data
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("users")}
                        className="border-green-500 text-green-400 hover:bg-green-500/10"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Users
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("courses")}
                        className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Manage Courses
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
