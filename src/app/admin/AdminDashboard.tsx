'use client';

import { useEffect, useState } from 'react';
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
  Database, Activity, Zap, Globe, X, Image as ImageIcon
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
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { DBAnnouncement, DBEvent, DBBounty } from '@/types/database';
import { Course } from '@/types/course';
import { SubmissionsManager } from '@/components/admin/SubmissionsManager';
import { UsersManager } from '@/components/admin/UsersManager';
import { EnhancedUsersManager } from '@/components/admin/EnhancedUsersManager';
import { ImageModerationPanel } from '@/components/admin/ImageModerationPanel';
import { simpleUserSync } from '@/lib/simple-user-sync';
import { robustUserSync } from '@/lib/robust-user-sync';
import WalletUserInsights from '@/components/admin/WalletUserInsights';
import RealtimeUserMonitor from '@/components/admin/RealtimeUserMonitor';
import UserProfileManager from '@/components/admin/UserProfileManager';
import WalletAnalytics from '@/components/admin/WalletAnalytics';
import UserConnectionTest from '@/components/admin/UserConnectionTest';
import UserTrackingDashboard from '@/components/admin/UserTrackingDashboard';
import SimpleWalletTracker from '@/components/admin/SimpleWalletTracker';
import TrackingSystemTest from '@/components/admin/TrackingSystemTest';

// Type for file-based courses (from JSON files)
interface CourseFile {
  id: string;
  title: string;
  description: string;
  emoji: string;
  badge?: string;
  squad?: string;
  level?: string;
  access?: string;
  category?: string;
  pathType?: string;
  totalLessons?: number;
  modules?: any[];
  [key: string]: any; // Allow additional properties
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
  availableCourseFiles?: CourseFile[];
  initialAnnouncements: DBAnnouncement[];
  initialEvents: DBEvent[];
  initialBounties: DBBounty[];
  initialSubmissions: any[];
  initialGlobalSettings?: any;
  initialFeatureFlags?: any[];
}

export default function AdminDashboard({
  initialCourses = [],
  availableCourseFiles: initialAvailableCourseFiles = [],
  initialAnnouncements = [],
  initialEvents = [],
  initialBounties = [],
  initialSubmissions = [],
  initialGlobalSettings = {},
  initialFeatureFlags = [],
}: AdminDashboardProps) {
  console.log('AdminDashboard props:', {
    initialCourses: initialCourses.length,
    availableCourseFiles: initialAvailableCourseFiles.length,
    initialAnnouncements: initialAnnouncements.length,
    initialEvents: initialEvents.length,
    initialBounties: initialBounties.length,
    initialSubmissions: initialSubmissions.length
  });
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [courseCompletions, setCourseCompletions] = useState<CourseCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  
  // Wallet connection
  const { wallet: walletAddress, isAdmin, connectWallet, loading: walletLoading, error: walletError } = useWalletSupabase();
  
  // Form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showBountyForm, setShowBountyForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DBEvent | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<DBAnnouncement | null>(null);
  const [editingBounty, setEditingBounty] = useState<DBBounty | null>(null);


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
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(initialCourses);
  const [courseManagementLoading, setCourseManagementLoading] = useState(false);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [availableCourseFiles, setAvailableCourseFiles] = useState<CourseFile[]>(initialAvailableCourseFiles || []);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [showCourseStats, setShowCourseStats] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [showCourseViewModal, setShowCourseViewModal] = useState(false);







  // Course management functions
  const handleToggleCourseVisibility = async (courseId: string, nextVisible: boolean) => {
    setCourseManagementLoading(true);
    try {
      await setCourseVisibility(courseId, nextVisible);
      // Optimistic UI (optional): update local state immediately
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_visible: nextVisible } : c));
      setFilteredCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_visible: nextVisible } : c));
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
      setFilteredCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_published: nextPublished } : c));
      // Refresh course stats after status change
      fetchCourseStats();
    } catch (error) {
      console.error("Error toggling published:", error);
    } finally {
      setCourseManagementLoading(false);
    }
  };

  const handleBulkImportCourses = async () => {
    if (!confirm('This will import all courses from the public/courses directory. Continue?')) {
      return;
    }

    setBulkImportLoading(true);
    try {
      // Convert course files to the format expected by the database
      const coursesToImport = availableCourseFiles.map(courseFile => ({
        id: courseFile.id,
        title: courseFile.title,
        emoji: courseFile.emoji || '📚',
        description: courseFile.description || '',
        squad: courseFile.squad || null,
        level: courseFile.level || 'beginner',
        access: courseFile.access || 'free',
        category: courseFile.category || '',
        slug: courseFile.id,
        total_lessons: courseFile.totalLessons || 0,
        is_visible: true,
        is_published: false, // Start as draft so admin can review
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      if (coursesToImport.length === 0) {
        alert('No course files found to import. Please refresh the files first.');
        return;
      }

      // Check if user is connected and is admin
      if (!walletAddress) {
        alert('Please connect your wallet first.');
        return;
      }

      if (!isAdmin) {
        alert('Admin access required. Please connect with an admin wallet.');
        return;
      }

      // Start the actual import process
      const importResponse = await fetch('/api/admin/bulk-import-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courses: coursesToImport,
          walletAddress: walletAddress
        })
      });

      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await importResponse.json();
      
      // Refresh the courses list - fetch all courses for admin
      const refreshResponse = await fetch('/api/admin/courses');
      if (refreshResponse.ok) {
        const updatedCourses = await refreshResponse.json();
        setCourses(updatedCourses);
        setFilteredCourses(updatedCourses);
      } else {
        // Fallback: try to refresh from the current page data
        window.location.reload();
      }

      // Refresh course stats after bulk import
      fetchCourseStats();

      alert(`Import completed! ${result.data?.length || 0} courses imported successfully.`);
      
    } catch (error) {
      console.error('Bulk import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBulkImportLoading(false);
    }
  };

  const handleRefreshCourseFiles = async () => {
    try {
      const response = await fetch('/api/admin/course-files');
      if (response.ok) {
        const courseFiles = await response.json();
        setAvailableCourseFiles(courseFiles);
        console.log(`Refreshed course files: ${courseFiles.length} files found`);
      } else {
        console.error('Failed to refresh course files');
        alert('Failed to refresh course files. Please try again.');
      }
    } catch (error) {
      console.error('Error refreshing course files:', error);
      alert('Error refreshing course files. Please try again.');
    }
  };

  // Fetch course statistics
  const fetchCourseStats = async () => {
    try {
      const response = await fetch('/api/admin/course-stats');
      if (response.ok) {
        const stats = await response.json();
        setCourseStats(stats);
      }
    } catch (error) {
      console.error('Error fetching course stats:', error);
    }
  };

  // Course viewing functions
  const handleViewCourse = (course: Course) => {
    setViewingCourse(course);
    setShowCourseViewModal(true);
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

  // Initialize courses state with initialCourses
  useEffect(() => {
    setCourses(initialCourses);
    setFilteredCourses(initialCourses);
  }, [initialCourses]);

  // Refresh function for manual data refresh
  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Try to refresh users using the simplified API endpoint first
      let usersData = [];
      
      try {
        const usersResponse = await fetch('/api/admin/users-robust');
        if (usersResponse.ok) {
          const usersApiData = await usersResponse.json();
          usersData = usersApiData.users || [];
          console.log('🔄 Refreshed users from simplified API:', usersData.length);
        } else {
          console.warn('Simplified API failed during refresh, trying simple sync service');
          usersData = await robustUserSync.getAllUsers();
          console.log('🔄 Refreshed users from simple sync service:', usersData.length);
        }
      } catch (apiError) {
        console.warn('API endpoint failed during refresh, trying simple sync service:', apiError);
        try {
          usersData = await robustUserSync.getAllUsers();
          console.log('🔄 Refreshed users from simple sync service:', usersData.length);
        } catch (syncError) {
          console.warn('Simple sync service failed during refresh, trying direct fetch:', syncError);
          usersData = await fetchAllUsers();
          console.log('🔄 Refreshed users from direct fetch:', usersData.length);
        }
      }

      // Fetch course completions
      const completionsData = await fetchAllCourseCompletions();
      
      setUsers(usersData);
      setCourseCompletions(completionsData);
      
      // Recalculate stats
      const squadDistribution: { [squad: string]: number } = {};
      usersData.forEach((user: any) => {
        if (user.squad) {
          squadDistribution[user.squad] = (squadDistribution[user.squad] || 0) + 1;
        }
      });

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsers = usersData.filter((u: any) => {
        if (!u.last_active && !u.last_seen) return false;
        const lastActive = u.last_active ? new Date(u.last_active) : new Date(u.last_seen);
        return lastActive > oneDayAgo;
      }).length;
      
      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length,
        activeUsers: activeUsers,
        completedCourses: completionsData.filter(c => c.status === 'completed').length,
        pendingApprovals: completionsData.filter(c => c.status === 'pending').length,
        totalExamsTaken: completionsData.filter(c => c.status === 'completed').length,
        placementTestsCompleted: usersData.filter((u: any) => u.placement_test_completed).length,
        squadDistribution
      }));
      
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch course stats on mount
  useEffect(() => {
    fetchCourseStats();
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Try to fetch users using the simplified API endpoint first
        let usersData = [];
        
        try {
          const usersResponse = await fetch('/api/admin/users-robust');
          if (usersResponse.ok) {
            const usersApiData = await usersResponse.json();
            usersData = usersApiData.users || [];
            console.log('📊 Loaded users from simplified API:', usersData.length);
          } else {
            console.warn('Simplified API failed, trying simple sync service');
            usersData = await robustUserSync.getAllUsers();
            console.log('📊 Loaded users from simple sync service:', usersData.length);
          }
        } catch (apiError) {
          console.warn('API endpoint failed, trying simple sync service:', apiError);
          try {
            usersData = await robustUserSync.getAllUsers();
            console.log('📊 Loaded users from simple sync service:', usersData.length);
          } catch (syncError) {
            console.warn('Simple sync service failed, trying direct fetch:', syncError);
            usersData = await fetchAllUsers();
            console.log('📊 Loaded users from direct fetch:', usersData.length);
          }
        }

        // Fetch course completions
        const completionsData = await fetchAllCourseCompletions();
        
        setUsers(usersData);
        setCourseCompletions(completionsData);
        
        // Debug: Log bounty data
        console.log('Admin Dashboard - Initial Bounties data:', initialBounties);
        console.log('Admin Dashboard - Initial Bounties count:', initialBounties.length);
        console.log('Admin Dashboard - Submissions data:', initialSubmissions);
        console.log('Admin Dashboard - Submissions count:', initialSubmissions.length);
        
        // Calculate stats
        const squadDistribution: { [squad: string]: number } = {};
        usersData.forEach((user: any) => {
          if (user.squad) {
            squadDistribution[user.squad] = (squadDistribution[user.squad] || 0) + 1;
          }
        });

        // Calculate active users (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsers = usersData.filter((u: any) => {
          if (!u.last_active && !u.last_seen) return false;
          const lastActive = u.last_active ? new Date(u.last_active) : new Date(u.last_seen);
          return lastActive > oneDayAgo;
        }).length;
        
        setStats({
          totalUsers: usersData.length,
          activeUsers: activeUsers,
          completedCourses: completionsData.filter(c => c.status === 'completed').length,
          pendingApprovals: completionsData.filter(c => c.status === 'pending').length,
          totalExamsTaken: completionsData.filter(c => c.status === 'completed').length,
          placementTestsCompleted: usersData.filter((u: any) => u.placement_test_completed).length,
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Admin Access Required</h1>
          <p className="text-slate-400 mb-6">
            This wallet ({walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}) does not have admin privileges.
          </p>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

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
              <p className="text-slate-400 text-sm lg:text-base">
                Live user tracking and management
                {stats.totalUsers > 0 && (
                  <span className="ml-2 text-green-400">
                    • {stats.totalUsers} users • {stats.activeUsers} active
                  </span>
                )}
              </p>
              
              {/* Wallet Connection Status */}
              <div className="mt-2 flex items-center gap-2">
                {walletLoading ? (
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    🔄 Connecting wallet...
                  </Badge>
                ) : !walletAddress ? (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                    ⚠️ Wallet not connected
                  </Badge>
                ) : !isAdmin ? (
                  <Badge variant="outline" className="border-red-500 text-red-400">
                    ❌ Non-admin wallet: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-500 text-green-400">
                    ✅ Admin wallet: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </Badge>
                )}
                {!walletAddress && !walletLoading && (
                  <Button 
                    size="sm" 
                    onClick={connectWallet}
                    className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1"
                  >
                    Connect Wallet
                  </Button>
                )}
                {walletError && (
                  <Badge variant="outline" className="border-red-500 text-red-400">
                    ❌ Error: {walletError}
                  </Badge>
                )}
              </div>
              
              {courses.length === 0 && availableCourseFiles.length > 0 && (
                <div className="mt-2 p-2 bg-orange-500/10 rounded border border-orange-500/30">
                  <p className="text-xs text-orange-400">
                    📁 <strong>{availableCourseFiles.length} course files</strong> are available to connect. 
                    Use the "Connect Course Files" button below to sync them to the database.
                  </p>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="text-slate-400">
                  📚 {courses.length} courses in database ({courses.filter(c => c.is_visible).length} visible, {courses.filter(c => c.is_published).length} live)
                </span>
                {availableCourseFiles.length > 0 && (
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    📁 {availableCourseFiles.length} course files available
                  </Badge>
                )}
                {courses.length === 0 && availableCourseFiles.length > 0 && (
                  <Badge variant="outline" className="border-orange-500 text-orange-400">
                    ⚠️ Database empty - {availableCourseFiles.length} files ready to sync
                  </Badge>
                )}
                {courses.filter(c => !c.is_visible || !c.is_published).length > 0 && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                    ⚠️ {courses.filter(c => !c.is_visible || !c.is_published).length} hidden/draft
                  </Badge>
                )}
              </div>
              
              {/* Refresh Button */}
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={refreshData}
                  disabled={refreshing}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:gap-4">
            <Badge variant="outline" className="border-green-500 text-green-400 w-fit">
              <Shield className="w-4 h-4 mr-2" />
              Admin Access
            </Badge>
            <div className="flex gap-2">
              {courses.length === 0 && availableCourseFiles.length > 0 && (
                <Button 
                  onClick={handleBulkImportCourses}
                  disabled={bulkImportLoading || !walletAddress || !isAdmin}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                  title={!walletAddress ? "Connect wallet first" : !isAdmin ? "Admin access required" : "Connect course files to database"}
                >
                  {bulkImportLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {bulkImportLoading ? 'Connecting...' : 'Connect Course Files'}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={() => setShowAddCourseForm(!showAddCourseForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Quick Add Course
              </Button>
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 lg:gap-6 mb-8">
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

          <Card className="bg-slate-800/50 border-emerald-500/30">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-sm text-slate-400">Visible Courses</p>
                  <p className="text-2xl font-bold">{courses.filter(c => c.is_visible).length}</p>
                  <p className="text-xs text-slate-400">of {courses.length} total</p>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <p className="text-slate-400">Users</p>
              <p className="text-xl font-bold text-blue-400">{stats.totalUsers}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Courses</p>
              <p className="text-xl font-bold text-purple-400">{courses.length}</p>
              <p className="text-xs text-slate-400">
                {courses.filter(c => c.is_visible).length} visible
                {availableCourseFiles.length > 0 && (
                  <span className="block text-blue-400">+{availableCourseFiles.length} file-based</span>
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Bounties</p>
              <p className="text-xl font-bold text-orange-400">{initialBounties.length}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Submissions</p>
              <p className="text-xl font-bold text-indigo-400">{initialSubmissions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Published</p>
              <p className="text-xl font-bold text-green-400">{courses.filter(c => c.is_published).length}</p>
              <p className="text-xs text-slate-400">courses live</p>
            </div>
          </div>
          
          {/* Import Status */}
          {courses.length === 0 && availableCourseFiles.length > 0 && (
            <div className="mt-4 p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <h4 className="text-sm font-medium mb-2 text-orange-400 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Course Files Ready to Connect ({availableCourseFiles.length})
              </h4>
              <p className="text-sm text-orange-300 mb-3">
                You have {availableCourseFiles.length} course files in the courses directory that can be connected to the database for management.
                These files contain course definitions, modules, and lessons that are ready to be synced.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleBulkImportCourses}
                  disabled={bulkImportLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {bulkImportLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {bulkImportLoading ? 'Connecting...' : 'Connect All Courses'}
                </Button>
                <Button 
                  onClick={() => setActiveTab("course-files")}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Course Files
                </Button>
              </div>
            </div>
          )}
          
          {/* Quick Course Visibility Status */}
          {courses.filter(c => !c.is_visible || !c.is_published).length > 0 && (
            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
              <h4 className="text-sm font-medium mb-2 text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Hidden/Draft Courses ({courses.filter(c => !c.is_visible || !c.is_published).length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {courses.filter(c => !c.is_visible).map(course => (
                  <div key={course.id} className="flex items-center justify-between p-2 bg-slate-600/30 rounded">
                    <span className="text-slate-300">{course.title}</span>
                    <Badge variant="outline" className="border-red-500 text-red-400 text-xs">
                      Hidden
                    </Badge>
                  </div>
                ))}
                {courses.filter(c => !c.is_published && c.is_visible).map(course => (
                  <div key={course.id} className="flex items-center justify-between p-2 bg-slate-600/30 rounded">
                    <span className="text-slate-300">{course.title}</span>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400 text-xs">
                      Draft
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-3 text-xs text-slate-400 text-center">
            All data is fetched from the database and synchronized across all tabs. Use the refresh button to get the latest data.
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-12">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="wallet-insights" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Wallet Insights
            </TabsTrigger>
            <TabsTrigger value="user-tracking" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              User Tracking
            </TabsTrigger>
            <TabsTrigger value="wallet-tracker" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Wallet Tracker
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Debug
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="course-files" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Course Files
            </TabsTrigger>
            <TabsTrigger value="bounties" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Bounties
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Images
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

            <EnhancedUsersManager 
              walletAddress={walletAddress}
              onViewUserSubmissions={(user) => {
                // Switch to submissions tab and filter by user
                setActiveTab('submissions');
                console.log('Viewing submissions for user:', user.displayName);
              }}
            />
          </TabsContent>

          {/* Wallet Insights Tab */}
          <TabsContent value="wallet-insights" className="space-y-6">
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="insights">User Insights</TabsTrigger>
                <TabsTrigger value="monitor">Real-time Monitor</TabsTrigger>
                <TabsTrigger value="profiles">Profile Manager</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="insights" className="space-y-6">
                <WalletUserInsights />
              </TabsContent>
              
              <TabsContent value="monitor" className="space-y-6">
                <RealtimeUserMonitor />
              </TabsContent>
              
              <TabsContent value="profiles" className="space-y-6">
                <UserProfileManager />
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-6">
                <WalletAnalytics />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* User Tracking Tab */}
          <TabsContent value="user-tracking" className="space-y-6">
            <UserTrackingDashboard />
          </TabsContent>

          {/* Wallet Tracker Tab */}
          <TabsContent value="wallet-tracker" className="space-y-6">
            <SimpleWalletTracker />
          </TabsContent>

          {/* Debug Tab - Temporary for testing */}
          <TabsContent value="debug" className="space-y-6">
            <TrackingSystemTest />
            <UserConnectionTest />
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Course Management
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowCourseStats(!showCourseStats)}
                      variant="outline"
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {showCourseStats ? 'Hide Stats' : 'View Stats'}
                    </Button>
                    <Button 
                      onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Quick Add Course
                    </Button>
                    <Button 
                      onClick={handleBulkImportCourses}
                      disabled={bulkImportLoading}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {bulkImportLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {bulkImportLoading ? 'Importing...' : 'Bulk Import Courses'}
                    </Button>
                    <Link href="/admin/courses">
                      <Button className="bg-cyan-600 hover:bg-cyan-700">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Full Course Management
                      </Button>
                    </Link>
                  </div>
                </CardTitle>
                <p className="text-sm text-slate-400 mt-2">
                  Quick course management with visibility toggles. Use the full course management interface for detailed editing.
                  {availableCourseFiles.length > 0 && (
                    <span className="block mt-1 text-blue-400">
                      💡 {availableCourseFiles.length} course files are available in the courses directory and can be connected to the database.
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  <strong>Current Data:</strong> Showing {courses.length} courses with {courseStats.reduce((total, stat) => total + stat.total_learners, 0)} total learners and {courseStats.reduce((total, stat) => total + stat.completed_learners, 0)} completions.
                </p>
                {courses.length === 0 && availableCourseFiles.length > 0 && (
                  <div className="mt-3 p-3 bg-orange-500/10 rounded border border-orange-500/30">
                    <p className="text-sm text-orange-400 mb-2">
                      📁 <strong>{availableCourseFiles.length} courses</strong> are available for import from the courses directory.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleBulkImportCourses}
                        disabled={bulkImportLoading}
                        className="bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        {bulkImportLoading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {bulkImportLoading ? 'Importing...' : 'Bulk Import All Courses'}
                      </Button>
                      <Button 
                        onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Single Course
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="border-green-500 text-green-400">
                    {courses.filter(c => c.is_visible).length} Visible
                  </Badge>
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    {courses.filter(c => c.is_published).length} Published
                  </Badge>
                  <Badge variant="outline" className="border-red-500 text-red-400">
                    {courses.filter(c => !c.is_visible).length} Hidden
                  </Badge>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                    {courses.filter(c => !c.is_published && c.is_visible).length} Draft
                  </Badge>
                </div>
              </CardHeader>
              
              {/* Course Statistics */}
              {showCourseStats && (
                <div className="px-6 pb-4">
                  <Card className="bg-slate-700/50 border-blue-500/30">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-blue-400">
                          <BarChart3 className="w-5 h-5" />
                          Course Completion Statistics
                        </span>
                        <Button 
                          onClick={fetchCourseStats}
                          variant="outline"
                          size="sm"
                          className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Stats
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {courseStats.map((stat) => {
                          const course = courses.find(c => c.id === stat.course_id);
                          const completionRate = stat.total_learners > 0 
                            ? Math.round((stat.completed_learners / stat.total_learners) * 100)
                            : 0;
                          
                          return (
                            <div key={stat.course_id} className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg border border-slate-500/30">
                              <div>
                                <h4 className="font-semibold text-sm">{course?.title || 'Unknown Course'}</h4>
                                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                                  <span>Total Learners: {stat.total_learners}</span>
                                  <span>Completed: {stat.completed_learners}</span>
                                  <span>Avg Progress: {stat.avg_percent}%</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-400">{completionRate}%</div>
                                <div className="text-xs text-gray-400">Completion Rate</div>
                              </div>
                            </div>
                          );
                        })}
                        {courseStats.length === 0 && (
                          <div className="text-center text-gray-400 py-4">
                            <p className="text-sm">No course statistics available yet.</p>
                            <p className="text-xs text-gray-500 mt-1">Statistics will appear as users complete courses.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <CardContent>
                {/* Quick Add Course Form */}
                {showAddCourseForm && (
                  <div className="mb-6 p-4 border border-slate-600 rounded-lg bg-slate-700/40">
                    <form action={async (formData: FormData) => {
                      const slug = String(formData.get("slug") || "");
                      const title = String(formData.get("title") || "");
                      const description = String(formData.get("description") || "");
                      const emoji = String(formData.get("emoji") || "📚");
                      const level = String(formData.get("level") || "beginner");
                      const access = String(formData.get("access") || "free");
                      const squad = String(formData.get("squad") || "");
                      const sort_order = parseInt(String(formData.get("sort_order") || "0"));
                      
                      try {
                        const response = await fetch('/api/courses', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            slug,
                            title,
                            description,
                            emoji,
                            level,
                            access,
                            squad,
                            sort_order,
                            is_published: false,
                            is_visible: true
                          })
                        });
                        
                        if (response.ok) {
                          const newCourse = await response.json();
                          setCourses(prev => [newCourse, ...prev]);
                          setFilteredCourses(prev => [newCourse, ...prev]);
                          setShowAddCourseForm(false);
                          // Refresh course stats after adding new course
                          fetchCourseStats();
                        }
                      } catch (error) {
                        console.error('Error adding course:', error);
                      }
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input name="slug" placeholder="course-slug" required />
                        <Input name="title" placeholder="Course Title" required />
                        <Input name="emoji" placeholder="📚" />
                        <select name="level" className="w-full p-3 rounded-md border border-slate-600 bg-slate-700 text-white">
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                        <select name="access" className="w-full p-3 rounded-md border border-slate-600 bg-slate-700 text-white">
                          <option value="free">Free</option>
                          <option value="hoodie">Hoodie Holder</option>
                          <option value="dao">DAO Member</option>
                        </select>
                        <Input name="squad" placeholder="Squad (optional)" />
                        <Input name="sort_order" type="number" placeholder="Sort Order" defaultValue="0" />
                        <textarea 
                          name="description" 
                          placeholder="Course description..." 
                          className="md:col-span-2 w-full p-3 rounded-md border border-slate-600 bg-slate-700 text-white min-h-[80px]" 
                        />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">Add Course</Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddCourseForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Course Search and Filters */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="Search courses..." 
                    className="flex-1 bg-slate-700 border-slate-600 text-white"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      if (searchTerm === '') {
                        setFilteredCourses(courses);
                      } else {
                        const filtered = courses.filter(course => 
                          course.title.toLowerCase().includes(searchTerm) ||
                          course.description.toLowerCase().includes(searchTerm) ||
                          course.slug?.toLowerCase().includes(searchTerm) ||
                          course.squad?.toLowerCase().includes(searchTerm)
                        );
                        setFilteredCourses(filtered);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilteredCourses(courses.filter(c => c.is_visible))}
                      className="border-green-500 text-green-400 hover:bg-green-500/10"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Visible Only
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilteredCourses(courses.filter(c => !c.is_visible))}
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      Hidden Only
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilteredCourses(courses)}
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      All Courses
                    </Button>
                  </div>
                </div>

                {/* Course List with Quick Actions */}
                <div className="grid gap-4">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{course.emoji || '📚'}</span>
                            <h3 className="font-semibold text-lg">{course.title}</h3>
                            <Badge variant="outline" className="border-blue-500 text-blue-400">
                              {course.slug || course.id}
                            </Badge>
                            <Badge variant="outline" className="border-green-500 text-green-400">
                              {course.level}
                            </Badge>
                            <Badge variant="outline" className="border-purple-500 text-purple-400">
                              {course.access}
                            </Badge>
                            {!course.is_published && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                                Draft
                              </Badge>
                            )}
                            {!course.is_visible && (
                              <Badge variant="outline" className="border-red-500 text-red-400">
                                Hidden
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{course.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Sort Order: {course.sort_order}</span>
                            <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
                            <span>Updated: {new Date(course.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {/* Quick Action Buttons */}
                        <div className="flex flex-col gap-2 ml-4">
                          {/* Status Indicators */}
                          <div className="flex items-center gap-1 text-xs">
                            <div className={`w-2 h-2 rounded-full ${course.is_visible ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className={course.is_visible ? 'text-green-400' : 'text-red-400'}>
                              {course.is_visible ? 'Visible' : 'Hidden'}
                            </span>
                            <div className={`w-2 h-2 rounded-full ml-2 ${course.is_published ? 'bg-blue-400' : 'bg-yellow-400'}`}></div>
                            <span className={course.is_published ? 'text-blue-400' : 'text-yellow-400'}>
                              {course.is_published ? 'Live' : 'Draft'}
                            </span>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewCourse(course)}
                              className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                              title="View course details"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant={course.is_visible ? "default" : "outline"}
                              onClick={() => handleToggleCourseVisibility(course.id, !course.is_visible)}
                              disabled={courseManagementLoading}
                              className={course.is_visible ? "bg-green-600 hover:bg-green-700" : "border-red-500 text-red-400"}
                              title={course.is_visible ? "Hide course" : "Show course"}
                            >
                              {course.is_visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant={course.is_published ? "default" : "outline"}
                              onClick={() => handleToggleCoursePublished(course.id, !course.is_published)}
                              disabled={courseManagementLoading}
                              className={course.is_published ? "bg-blue-600 hover:bg-blue-700" : "border-yellow-500 text-yellow-400"}
                              title={course.is_published ? "Unpublish course" : "Publish course"}
                            >
                              {course.is_published ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            </Button>
                            
                            <Link href={`/admin/courses`}>
                              <Button size="sm" variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10" title="Full Course Management">
                                <Edit className="w-3 h-3" />
                              </Button>
                            </Link>
                            <Link href={`/courses/${course.slug || course.id}`} target="_blank">
                              <Button size="sm" variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10" title="View Course Page">
                                <Globe className="w-3 h-3" />
                              </Button>
                            </Link>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
                                  try {
                                    const response = await fetch(`/api/courses/${course.id}`, {
                                      method: 'DELETE'
                                    });
                                    
                                    if (response.ok) {
                                      setCourses(prev => prev.filter(c => c.id !== course.id));
                                      setFilteredCourses(prev => prev.filter(c => c.id !== course.id));
                                      // Refresh course stats after deleting course
                                      fetchCourseStats();
                                    } else {
                                      alert('Failed to delete course');
                                    }
                                  } catch (error) {
                                    console.error('Error deleting course:', error);
                                    alert('Error deleting course');
                                  }
                                }
                              }}
                              className="border-red-500 text-red-400 hover:bg-red-500/10"
                              title="Delete course"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredCourses.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <div className="mb-4">
                        <p className="text-lg mb-2">No courses found in the database.</p>
                        <p className="text-sm mb-4">
                          {availableCourseFiles.length > 0 
                            ? `You have ${availableCourseFiles.length} course JSON files in the public/courses directory that can be connected to the database for management.`
                            : 'No course files found in the courses directory.'
                          }
                        </p>
                      </div>
                      {availableCourseFiles.length > 0 && (
                        <>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
                            <Button 
                              onClick={handleBulkImportCourses}
                              disabled={bulkImportLoading}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              {bulkImportLoading ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              {bulkImportLoading ? 'Importing Courses...' : 'Bulk Import All Courses'}
                            </Button>
                            <Button 
                              onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                              variant="outline"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Single Course
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">
                            Bulk import will import all {availableCourseFiles.length} course files from the courses directory.
                          </p>
                        </>
                      )}
                      {availableCourseFiles.length === 0 && (
                        <div className="text-center">
                          <p className="text-sm text-slate-500 mb-3">
                            To add courses, either:
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button 
                              onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Single Course
                            </Button>
                            <Button 
                              onClick={() => window.location.reload()}
                              variant="outline"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh Page
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Files Tab */}
          <TabsContent value="course-files" className="space-y-6">
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Course Files Management
                  </span>
                  <div className="flex gap-2">
                    {!walletAddress ? (
                      <Button 
                        onClick={connectWallet}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleBulkImportCourses}
                        disabled={bulkImportLoading || !isAdmin}
                        className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      >
                        {bulkImportLoading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {bulkImportLoading ? 'Importing...' : 'Sync All to Database'}
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={handleRefreshCourseFiles}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Files
                    </Button>
                  </div>
                </CardTitle>
                <p className="text-sm text-slate-400 mt-2">
                  View and manage course files from the public/courses directory. These files contain course definitions that can be synced to the database.
                  {availableCourseFiles.length > 0 && (
                    <span className="block mt-1 text-blue-400">
                      📁 Found {availableCourseFiles.length} course files in the courses directory.
                    </span>
                  )}
                  {!walletAddress && (
                    <span className="block mt-1 text-yellow-400">
                      ⚠️ Please connect your wallet to sync courses to the database.
                    </span>
                  )}
                  {walletAddress && !isAdmin && (
                    <span className="block mt-1 text-red-400">
                      ❌ Admin access required. Current wallet is not an admin.
                    </span>
                  )}
                  {walletAddress && isAdmin && (
                    <span className="block mt-1 text-green-400">
                      ✅ Admin wallet connected: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    {availableCourseFiles.length} Total Files
                  </Badge>
                  <Badge variant="outline" className="border-green-500 text-green-400">
                    {availableCourseFiles.filter(f => f.squad).length} Squad-Specific
                  </Badge>
                  <Badge variant="outline" className="border-purple-500 text-purple-400">
                    {availableCourseFiles.filter(f => f.level).length} Level-Defined
                  </Badge>
                  <Badge variant="outline" className="border-orange-500 text-orange-400">
                    {availableCourseFiles.filter(f => f.access).length} Access-Defined
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {availableCourseFiles.map((courseFile) => (
                    <div key={courseFile.id} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{courseFile.emoji || '📚'}</span>
                            <h3 className="font-semibold text-lg">{courseFile.title}</h3>
                            <Badge variant="outline" className="border-blue-500 text-blue-400">
                              {courseFile.id}
                            </Badge>
                            {courseFile.squad && (
                              <Badge variant="outline" className="border-green-500 text-green-400">
                                {courseFile.squad}
                              </Badge>
                            )}
                            {courseFile.level && (
                              <Badge variant="outline" className="border-purple-500 text-purple-400">
                                {courseFile.level}
                              </Badge>
                            )}
                            {courseFile.access && (
                              <Badge variant="outline" className="border-orange-500 text-orange-400">
                                {courseFile.access}
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                              File-Based
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{courseFile.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {courseFile.pathType && (
                              <span>Path: {courseFile.pathType}</span>
                            )}
                            {courseFile.category && (
                              <span>Category: {courseFile.category}</span>
                            )}
                            {courseFile.totalLessons && (
                              <span>Lessons: {courseFile.totalLessons}</span>
                            )}
                            {courseFile.badge && (
                              <span>Badge: {courseFile.badge}</span>
                            )}
                          </div>
                          {courseFile.modules && courseFile.modules.length > 0 && (
                            <div className="mt-3 p-3 bg-slate-700/50 rounded border border-slate-600">
                              <h4 className="text-sm font-medium mb-2 text-blue-400">Course Structure:</h4>
                              <div className="space-y-2">
                                {courseFile.modules.map((module: any, moduleIndex: number) => (
                                  <div key={moduleIndex} className="text-xs">
                                    <div className="font-medium text-slate-300">📚 {module.title}</div>
                                    {module.lessons && module.lessons.map((lesson: any, lessonIndex: number) => (
                                      <div key={lessonIndex} className="ml-4 text-slate-400">
                                        • {lesson.title}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Show course file content in a modal or expandable section
                                alert(`Course File: ${courseFile.title}\n\nDescription: ${courseFile.description}\n\nThis is a file-based course that can be synced to the database.`);
                              }}
                              className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                              title="View course details"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            
                                                  <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // TODO: Implement individual course sync
                          alert('Individual course sync coming soon!');
                        }}
                        disabled={!walletAddress || !isAdmin}
                        className="border-green-500 text-green-400 hover:bg-green-500/10 disabled:opacity-50"
                        title={!walletAddress ? "Connect wallet first" : !isAdmin ? "Admin access required" : "Sync this course to database"}
                      >
                        <Upload className="w-3 h-3" />
                      </Button>
                            
                            <Link href={`/courses/${courseFile.id}`} target="_blank">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                                title="View course page"
                              >
                                <Globe className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                          
                          <div className="text-xs text-slate-400 text-center">
                            File-based
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {availableCourseFiles.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <p className="text-lg mb-2">No course files found.</p>
                      <p className="text-sm mb-4">
                        Course files should be located in the public/courses directory.
                      </p>
                      <Button 
                        onClick={handleRefreshCourseFiles}
                        variant="outline"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Files
                      </Button>
                    </div>
                  )}
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
                  <Button onClick={() => setShowBountyForm(!showBountyForm)}>
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
              
              {/* Bounty Creation Form */}
              {showBountyForm && (
                <div className="px-6 pb-4">
                  <div className="border border-slate-600 rounded-lg p-4 bg-slate-700/40">
                    <h3 className="text-lg font-semibold mb-4 text-green-400">Create New Bounty</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      
                      const bountyData = {
                        title: String(formData.get('title') || ''),
                        short_desc: String(formData.get('short_desc') || ''),
                        squad_tag: String(formData.get('squad_tag') || ''),
                        reward: String(formData.get('reward') || ''),
                        deadline: String(formData.get('deadline') || ''),
                        status: 'active' as const,
                        hidden: false,
                        walletAddress: walletAddress
                      };
                      
                      try {
                        const response = await fetch('/api/bounties', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(bountyData)
                        });
                        
                        if (response.ok) {
                          const newBounty = await response.json();
                          setBounties(prev => [newBounty, ...prev]);
                          setShowBountyForm(false);
                          // Reset form
                          e.currentTarget.reset();
                        } else {
                          alert('Failed to create bounty');
                        }
                      } catch (error) {
                        console.error('Error creating bounty:', error);
                        alert('Error creating bounty');
                      }
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                          name="title" 
                          placeholder="Bounty Title" 
                          required 
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <Input 
                          name="short_desc" 
                          placeholder="Short Description" 
                          required 
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <Input 
                          name="squad_tag" 
                          placeholder="Squad Tag (optional)" 
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <Input 
                          name="reward" 
                          placeholder="Reward (e.g., 1000 XP)" 
                          required 
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <Input 
                          name="deadline" 
                          type="datetime-local" 
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                          Create Bounty
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowBountyForm(false)}
                          className="border-slate-500 text-slate-300 hover:bg-slate-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              
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
            <SubmissionsManager />
          </TabsContent>

          {/* Image Moderation Tab */}
          <TabsContent value="images" className="space-y-6">
            <Card className="bg-slate-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6" />
                  Image Moderation Dashboard
                </CardTitle>
                <p className="text-gray-400 text-sm mt-2">
                  Review, approve, reject, or delete images uploaded by users for bounty submissions
                </p>
              </CardHeader>
              <CardContent>
                <ImageModerationPanel />
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

                  {/* Import Status Alert */}
                  {courses.length === 0 && availableCourseFiles.length > 0 && (
                    <div className="mb-6 p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                      <h4 className="text-lg font-semibold mb-2 text-orange-400 flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Connection Required: {availableCourseFiles.length} Course Files Available
                      </h4>
                      <p className="text-sm text-orange-300 mb-3">
                        Your courses directory contains {availableCourseFiles.length} course files that can be connected to the database for management.
                        These files contain course definitions, modules, and lessons that are ready to be synced.
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleBulkImportCourses}
                          disabled={bulkImportLoading}
                          className="bg-orange-600 hover:bg-orange-700"
                          size="lg"
                        >
                          {bulkImportLoading ? (
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5 mr-2" />
                          )}
                          {bulkImportLoading ? 'Connecting...' : 'Connect All Courses'}
                        </Button>
                        <Button 
                          onClick={() => setActiveTab("course-files")}
                          variant="outline"
                          size="lg"
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          View Course Files
                        </Button>
                      </div>
                    </div>
                  )}

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
                      <Button
                        variant="outline"
                        onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                        className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Quick Add Course
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleBulkImportCourses}
                        disabled={bulkImportLoading}
                        className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {bulkImportLoading ? 'Importing...' : 'Bulk Import Courses'}
                      </Button>
                    </div>
                  </div>

                  {/* Course Visibility Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Course Visibility Summary
                    </h3>
                    {courses.length === 0 && availableCourseFiles.length > 0 && (
                      <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-orange-400 text-sm">
                          📁 <strong>{availableCourseFiles.length} course files</strong> are available in the courses directory.
                          Use the "Connect All Courses" button above to sync them to the database for management.
                        </p>
                        <div className="mt-2">
                          <Button 
                            onClick={handleBulkImportCourses}
                            disabled={bulkImportLoading}
                            className="bg-orange-600 hover:bg-orange-700"
                            size="sm"
                          >
                            {bulkImportLoading ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {bulkImportLoading ? 'Connecting...' : 'Connect Now'}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <Card className="bg-slate-700/50">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{courses.filter(c => c.is_visible).length}</div>
                            <div className="text-sm text-gray-300">Visible Courses</div>
                            <div className="text-xs text-gray-400">Users can see these</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-700/50">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{courses.filter(c => c.is_published).length}</div>
                            <div className="text-sm text-gray-300">Published Courses</div>
                            <div className="text-xs text-gray-400">Live and accessible</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-700/50">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">{courses.filter(c => !c.is_visible || !c.is_published).length}</div>
                            <div className="text-sm text-gray-300">Hidden/Draft</div>
                            <div className="text-xs text-gray-400">Not visible to users</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Quick Bulk Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Make all courses visible? This will show all courses to users.')) {
                            setCourseManagementLoading(true);
                            try {
                              await Promise.all(
                                courses.filter(c => !c.is_visible).map(course => 
                                  handleToggleCourseVisibility(course.id, true)
                                )
                              );
                              // Refresh both states after bulk operation
                              const refreshResponse = await fetch('/api/admin/courses');
                              if (refreshResponse.ok) {
                                const updatedCourses = await refreshResponse.json();
                                setCourses(updatedCourses);
                                setFilteredCourses(updatedCourses);
                              }
                            } finally {
                              setCourseManagementLoading(false);
                            }
                          }
                        }}
                        disabled={courseManagementLoading || courses.filter(c => !c.is_visible).length === 0}
                        className="border-green-500 text-green-400 hover:bg-green-500/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Show All Courses
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Hide all courses? This will hide all courses from users.')) {
                            setCourseManagementLoading(true);
                            try {
                              await Promise.all(
                                courses.filter(c => c.is_visible).map(course => 
                                  handleToggleCourseVisibility(course.id, false)
                                )
                              );
                              // Refresh both states after bulk operation
                              const refreshResponse = await fetch('/api/admin/courses');
                              if (refreshResponse.ok) {
                                const updatedCourses = await refreshResponse.json();
                                setCourses(updatedCourses);
                                setFilteredCourses(updatedCourses);
                              }
                            } finally {
                              setCourseManagementLoading(false);
                            }
                          }
                        }}
                        disabled={courseManagementLoading || courses.filter(c => c.is_visible).length === 0}
                        className="border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        Hide All Courses
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Publish all visible courses? This will make all visible courses live.')) {
                            setCourseManagementLoading(true);
                            try {
                              await Promise.all(
                                courses.filter(c => c.is_visible && !c.is_published).map(course => 
                                  handleToggleCoursePublished(course.id, true)
                                )
                              );
                              // Refresh both states after bulk operation
                              const refreshResponse = await fetch('/api/admin/courses');
                              if (refreshResponse.ok) {
                                const updatedCourses = await refreshResponse.json();
                                setCourses(updatedCourses);
                                setFilteredCourses(updatedCourses);
                              }
                            } finally {
                              setCourseManagementLoading(false);
                            }
                          }
                        }}
                        disabled={courseManagementLoading || courses.filter(c => c.is_visible && !c.is_published).length === 0}
                        className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Publish All Visible
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Course View Modal */}
        {showCourseViewModal && viewingCourse && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">{viewingCourse.emoji || '📚'}</span>
                    <span>{viewingCourse.title}</span>
                  </span>
                  <Button 
                    onClick={() => setShowCourseViewModal(false)}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-slate-400">Course ID</Label>
                    <p className="font-mono text-xs bg-slate-700 p-2 rounded">{viewingCourse.id}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Slug</Label>
                    <p className="font-mono text-xs bg-slate-700 p-2 rounded">{viewingCourse.slug || 'No slug'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Level</Label>
                    <Badge variant="outline" className="border-purple-500 text-purple-400">
                      {viewingCourse.level}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-slate-400">Access</Label>
                    <Badge variant="outline" className="border-orange-500 text-orange-400">
                      {viewingCourse.access}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-slate-400">Squad</Label>
                    <p>{viewingCourse.squad || 'No squad'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Sort Order</Label>
                    <p>{viewingCourse.sort_order}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-slate-400">Description</Label>
                  <p className="text-sm bg-slate-700 p-3 rounded">{viewingCourse.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Status</Label>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={viewingCourse.is_visible ? "default" : "secondary"} className={viewingCourse.is_visible ? "bg-green-600" : "bg-red-600"}>
                        {viewingCourse.is_visible ? "Visible" : "Hidden"}
                      </Badge>
                      <Badge variant={viewingCourse.is_published ? "default" : "secondary"} className={viewingCourse.is_published ? "bg-blue-600" : "bg-yellow-600"}>
                        {viewingCourse.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400">Dates</Label>
                    <div className="text-xs text-slate-400 mt-1">
                      <p>Created: {new Date(viewingCourse.created_at).toLocaleDateString()}</p>
                      <p>Updated: {new Date(viewingCourse.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Course Statistics */}
                {(() => {
                  const stat = courseStats.find(s => s.course_id === viewingCourse.id);
                  if (stat) {
                    const completionRate = stat.total_learners > 0 
                      ? Math.round((stat.completed_learners / stat.total_learners) * 100)
                      : 0;
                    
                    return (
                      <div className="border-t border-slate-600 pt-4">
                        <Label className="text-slate-400">Course Statistics</Label>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div className="text-center p-3 bg-slate-700 rounded">
                            <div className="text-lg font-bold text-blue-400">{stat.total_learners}</div>
                            <div className="text-xs text-slate-400">Total Learners</div>
                          </div>
                          <div className="text-center p-3 bg-slate-700 rounded">
                            <div className="text-lg font-bold text-green-400">{stat.completed_learners}</div>
                            <div className="text-xs text-slate-400">Completed</div>
                          </div>
                          <div className="text-center p-3 bg-slate-700 rounded">
                            <div className="text-lg font-bold text-purple-400">{completionRate}%</div>
                            <div className="text-xs text-slate-400">Completion Rate</div>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <div className="text-sm text-slate-400">Average Progress: {stat.avg_percent}%</div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="border-t border-slate-600 pt-4">
                      <Label className="text-slate-400">Course Statistics</Label>
                      <p className="text-sm text-slate-400 mt-2">No statistics available for this course yet.</p>
                    </div>
                  );
                })()}

                <div className="flex gap-2 pt-4 border-t border-slate-600">
                  <Link href={`/admin/courses`}>
                    <Button className="bg-cyan-600 hover:bg-cyan-700">
                      <Edit className="w-4 h-4 mr-2" />
                      Full Course Management
                    </Button>
                  </Link>
                  <Link href={`/courses/${viewingCourse.slug || viewingCourse.id}`} target="_blank">
                    <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
                      <Globe className="w-4 h-4 mr-2" />
                      View Course Page
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => setShowCourseViewModal(false)}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
