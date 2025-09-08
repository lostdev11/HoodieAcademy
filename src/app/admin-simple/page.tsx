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
  Database, Activity, Zap, Globe, X
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

import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { DBAnnouncement, DBEvent, DBBounty } from '@/types/database';
import { Course } from '@/types/course';

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

export default function AdminDashboard() {
  // Initialize with empty arrays since we're not getting props
  const initialCourses: Course[] = [];
  const initialAvailableCourseFiles: CourseFile[] = [];
  const initialAnnouncements: DBAnnouncement[] = [];
  const initialEvents: DBEvent[] = [];
  const initialBounties: DBBounty[] = [];
  const initialSubmissions: any[] = [];
  const initialGlobalSettings: any = {};
  const initialFeatureFlags: any[] = [];
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
  const [announcements, setAnnouncements] = useState<DBAnnouncement[]>(initialAnnouncements);
  const [events, setEvents] = useState<DBEvent[]>(initialEvents);
  const [bounties, setBounties] = useState<DBBounty[]>(initialBounties);
  const [submissions, setSubmissions] = useState<any[]>(initialSubmissions);
  
  // Store initial data for filtering
  const [initialBountiesData, setInitialBountiesData] = useState<DBBounty[]>([]);
  const [initialAnnouncementsData, setInitialAnnouncementsData] = useState<DBAnnouncement[]>([]);
  const [initialEventsData, setInitialEventsData] = useState<DBEvent[]>([]);
  const [initialSubmissionsData, setInitialSubmissionsData] = useState<any[]>([]);
  
  // Wallet connection - use hardcoded admin check for reliability
  const { wallet: walletAddress, connectWallet, loading: walletLoading, error: walletError } = useWalletSupabase();
  
  // Hardcoded admin check to bypass RLS issues
  const [isAdmin, setIsAdmin] = useState(false);
  
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
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [walletAddress]);
  
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
    console.log('toggleBountyVisibility called with:', bountyId);
    const b = bounties.find(x => x.id === bountyId);
    if (!b) {
      console.error('Bounty not found:', bountyId);
      return;
    }
    console.log('Found bounty:', b);
    try {
      console.log('Calling toggleBountyHidden with:', bountyId, !b.hidden);
      await toggleBountyHidden(bountyId, !b.hidden);
      console.log('toggleBountyHidden successful');
      // Update local state
      setBounties(prev => prev.map(b => b.id === bountyId ? { ...b, hidden: !b.hidden } : b));
      console.log('Local state updated');
    } catch (error) {
      console.error('Error toggling bounty visibility:', error);
      alert('Failed to update bounty visibility');
    }
  };

  const updateBountyStatus = async (bountyId: string, newStatus: "active" | "completed" | "expired") => {
    const b = bounties.find(x => x.id === bountyId);
    if (!b) return;
    try {
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
      // Update local state
      setBounties(prev => prev.map(b => b.id === bountyId ? { ...b, status: newStatus } : b));
    } catch (error) {
      console.error('Error updating bounty status:', error);
      alert('Failed to update bounty status');
    }
  };

  const deleteBountyRow = async (bountyId: string) => {
    console.log('deleteBountyRow called with:', bountyId);
    if (!confirm('Are you sure you want to delete this bounty? This action cannot be undone.')) {
      return;
    }
    try {
      console.log('Calling deleteBounty with:', bountyId);
      await deleteBounty(bountyId);
      console.log('deleteBounty successful');
      // Update local state
      setBounties(prev => prev.filter(b => b.id !== bountyId));
      console.log('Local state updated');
    } catch (error) {
      console.error('Error deleting bounty:', error);
      alert('Failed to delete bounty');
    }
  };

  const handleEditBounty = (bounty: DBBounty) => {
    setEditingBounty(bounty);
    setShowBountyForm(true);
  };

  const handleSaveBounty = async (bountyData: Partial<DBBounty>) => {
    console.log('handleSaveBounty called with:', bountyData);
    console.log('editingBounty:', editingBounty);
    
    try {
      if (editingBounty) {
        console.log('Updating existing bounty...');
        try {
          // Try server action first
                              const updatedBounty = await createOrUpdateBounty({
                      id: editingBounty.id,
                      title: bountyData.title || editingBounty.title,
                      short_desc: bountyData.short_desc || editingBounty.short_desc,
                      reward: bountyData.reward || editingBounty.reward,
                      reward_type: bountyData.reward_type || editingBounty.reward_type || 'XP',
                      start_date: bountyData.start_date || editingBounty.start_date,
                      deadline: bountyData.deadline || editingBounty.deadline,
                      link_to: bountyData.link_to || editingBounty.link_to,
                      image: bountyData.image || editingBounty.image,
                      squad_tag: bountyData.squad_tag || editingBounty.squad_tag,
                      status: bountyData.status || editingBounty.status,
                      hidden: bountyData.hidden !== undefined ? bountyData.hidden : editingBounty.hidden,
                      submissions: editingBounty.submissions,
                    });
          
          console.log('Bounty updated successfully via server action:', updatedBounty);
          
          // Update local state with the returned data
          setBounties(prev => prev.map(b => 
            b.id === editingBounty.id 
              ? updatedBounty
              : b
          ));
          
          // Refresh bounties data to ensure UI is up to date
          await refreshBounties();
        } catch (serverActionError) {
          console.log('Server action failed, trying API endpoint...', serverActionError);
          
          // Fallback to API endpoint
                              const response = await fetch('/api/bounties', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: editingBounty.id,
                        title: bountyData.title || editingBounty.title,
                        short_desc: bountyData.short_desc || editingBounty.short_desc,
                        reward: bountyData.reward || editingBounty.reward,
                        deadline: bountyData.deadline || editingBounty.deadline,
                        link_to: bountyData.link_to || editingBounty.link_to,
                        image: bountyData.image || editingBounty.image,
                        squad_tag: bountyData.squad_tag || editingBounty.squad_tag,
                        status: bountyData.status || editingBounty.status,
                        hidden: bountyData.hidden !== undefined ? bountyData.hidden : editingBounty.hidden,
                      })
                    });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API update failed');
          }
          
          const updatedBounty = await response.json();
          console.log('Bounty updated successfully via API:', updatedBounty);
          
          // Update local state with the returned data
          setBounties(prev => prev.map(b => 
            b.id === editingBounty.id 
              ? updatedBounty
              : b
          ));
          
          // Refresh bounties data to ensure UI is up to date
          await refreshBounties();
        }
      } else {
        console.log('Creating new bounty...');
        try {
          // Try server action first
          const newBounty = await createOrUpdateBounty({
            title: bountyData.title!,
            short_desc: bountyData.short_desc!,
            reward: bountyData.reward!,
            reward_type: bountyData.reward_type || 'XP',
            start_date: bountyData.start_date,
            deadline: bountyData.deadline,
            image: bountyData.image,
            link_to: bountyData.link_to,
            squad_tag: bountyData.squad_tag,
            status: bountyData.status || 'active',
            hidden: bountyData.hidden || false,
            submissions: 0,
          });
          
          console.log('New bounty created successfully via server action:', newBounty);
          
          // Add the new bounty to local state
          setBounties(prev => [newBounty, ...prev]);
          
          // Refresh bounties data to ensure UI is up to date
          await refreshBounties();
        } catch (serverActionError) {
          console.log('Server action failed, trying API endpoint...', serverActionError);
          
          // Fallback to API endpoint
          const response = await fetch('/api/bounties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: bountyData.title!,
              short_desc: bountyData.short_desc!,
              reward: bountyData.reward!,
              deadline: bountyData.deadline,
              image: bountyData.image,
              link_to: bountyData.link_to,
              squad_tag: bountyData.squad_tag,
              status: bountyData.status || 'active',
              hidden: bountyData.hidden || false,
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API creation failed');
          }
          
          const newBounty = await response.json();
          console.log('New bounty created successfully via API:', newBounty);
          
          // Add the new bounty to local state
          setBounties(prev => [newBounty, ...prev]);
          
          // Refresh bounties data to ensure UI is up to date
          await refreshBounties();
        }
      }
      
      setShowBountyForm(false);
      setEditingBounty(null);
    } catch (error) {
      console.error('Error saving bounty:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      alert('Failed to save bounty. Check console for details.');
      throw error; // Re-throw to be caught by the form
    }
  };

  const handleCancelBountyEdit = () => {
    setShowBountyForm(false);
    setEditingBounty(null);
  };



  // Simple function to refresh bounties data
  const refreshBounties = async () => {
    try {
      const response = await fetch('/api/bounties');
      if (response.ok) {
        const freshBounties = await response.json();
        setBounties(freshBounties);
        console.log('Bounties refreshed successfully:', freshBounties.length);
      }
    } catch (error) {
      console.error('Failed to refresh bounties:', error);
    }
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

  // Fetch course stats on mount
  useEffect(() => {
    fetchCourseStats();
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch all data in parallel
        const [usersData, completionsData, bountiesData, announcementsData, eventsData, submissionsData] = await Promise.all([
          fetchAllUsers(),
          fetchAllCourseCompletions(),
          fetch('/api/bounties').then(res => {
            if (!res.ok) {
              console.error('Failed to fetch bounties:', res.status, res.statusText);
              return [];
            }
            return res.json();
          }),
          fetch('/api/announcements').then(res => {
            if (!res.ok) {
              console.error('Failed to fetch announcements:', res.status, res.statusText);
              return [];
            }
            return res.json();
          }),
          fetch('/api/events').then(res => {
            if (!res.ok) {
              console.error('Failed to fetch events:', res.status, res.statusText);
              return [];
            }
            return res.json();
          }),
          fetch('/api/submissions').then(res => {
            if (!res.ok) {
              console.error('Failed to fetch submissions:', res.status, res.statusText);
              return [];
            }
            return res.json();
          })
        ]);
        
        setUsers(usersData);
        setCourseCompletions(completionsData);
        console.log('Loaded bounties:', bountiesData);
        console.log('Bounties data structure:', bountiesData.map((b: DBBounty) => ({ id: b.id, title: b.title, status: b.status })));
        console.log('Loaded announcements:', announcementsData);
        console.log('Loaded events:', eventsData);
        console.log('Loaded submissions:', submissionsData);
        
        setBounties(bountiesData);
        setAnnouncements(announcementsData);
        setEvents(eventsData);
        setSubmissions(submissionsData);
        
        // Store initial data for filtering
        setInitialBountiesData(bountiesData);
        setInitialAnnouncementsData(announcementsData);
        setInitialEventsData(eventsData);
        setInitialSubmissionsData(submissionsData);
        
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
          totalBounties: bountiesData.length,
          activeBounties: bountiesData.filter((b: DBBounty) => b.status === 'active').length,
          hiddenBounties: bountiesData.filter((b: DBBounty) => b.hidden).length,
          totalSubmissions: submissionsData.length
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing admin data:', error);
        setLoading(false);
      }
    };
    
    initializeData();
  }, []); // Only run once on mount

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

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

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
                                      <p className="text-xl font-bold text-orange-400">{initialBountiesData.length}</p>
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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="course-files" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Course Files
            </TabsTrigger>
            <TabsTrigger 
              value="bounties" 
              className="flex items-center gap-2"
              onClick={() => console.log('Bounties tab clicked, current bounties:', bounties)}
            >
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
                {/* Bounty Search and Filters */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="Search bounties..." 
                    className="flex-1 bg-slate-700 border-slate-600 text-white"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      // You could add search filtering here
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Filter to show only active bounties
                      }}
                      className="border-green-500 text-green-400 hover:bg-green-500/10"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Active Only
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Filter to show only hidden bounties
                      }}
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      Hidden Only
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Show all bounties
                      }}
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      All Bounties
                    </Button>
                  </div>
                </div>

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
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        console.log('Bounty form button clicked, current state:', showBountyForm);
                        setShowBountyForm(!showBountyForm);
                        console.log('Bounty form state set to:', !showBountyForm);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {showBountyForm ? 'Cancel' : 'Create New Bounty'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Refresh bounties data
                        window.location.reload();
                      }}
                      className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        // Test bounty creation
                        try {
                          console.log('Testing bounty creation...');
                          const testBounty = await createOrUpdateBounty({
                            title: 'Test Bounty',
                            short_desc: 'This is a test bounty',
                            reward: '100 XP',
                            status: 'active',
                            hidden: false,
                            submissions: 0,
                          });
                          console.log('Test bounty created:', testBounty);
                          alert('Test bounty created successfully! Check console for details.');
                          // Refresh the page to show the new bounty
                          window.location.reload();
                        } catch (error) {
                          console.error('Test bounty creation failed:', error);
                          alert('Test bounty creation failed. Check console for details.');
                        }
                      }}
                      className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Test Create
                    </Button>
                  </div>
                </CardTitle>
                
                {/* Bounty Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-slate-700/50 rounded border border-slate-600">
                    <div className="text-2xl font-bold text-blue-400">{bounties?.length || 0}</div>
                    <div className="text-sm text-slate-400">Total Bounties</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/50 rounded border border-slate-600">
                    <div className="text-2xl font-bold text-green-400">
                      {bounties?.filter(b => b.status === 'active').length || 0}
                    </div>
                    <div className="text-sm text-slate-400">Active</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/50 rounded border border-slate-600">
                    <div className="text-2xl font-bold text-orange-400">
                      {bounties?.filter(b => b.status === 'completed').length || 0}
                    </div>
                    <div className="text-sm text-slate-400">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/50 rounded border border-slate-600">
                    <div className="text-2xl font-bold text-purple-400">
                      {bounties?.reduce((total, b) => total + b.submissions, 0) || 0}
                    </div>
                    <div className="text-sm text-slate-400">Total Submissions</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="border-green-500 text-green-400">
                    {bounties?.filter(b => b.status === 'active' && !b.hidden).length || 0} Live
                  </Badge>
                  <Badge variant="outline" className="border-red-500 text-red-400">
                    {bounties?.filter(b => b.hidden).length || 0} Hidden
                  </Badge>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                    {bounties?.filter(b => b.status === 'expired').length || 0} Expired
                  </Badge>
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    {bounties?.filter(b => b.squad_tag).length || 0} Squad-Specific
                  </Badge>
                </div>
                
                {/* Quick Bounty Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Bulk action: Make all active bounties visible
                      if (confirm('Make all active bounties visible to users?')) {
                        bounties
                          ?.filter(b => b.status === 'active' && b.hidden)
                          .forEach(b => toggleBountyVisibility(b.id));
                      }
                    }}
                    disabled={!bounties || bounties.filter(b => b.status === 'active' && b.hidden).length === 0}
                    className="border-green-500 text-green-400 hover:bg-green-500/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Show All Active
                  </Button>
                  
                  {/* Bounty Analytics */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Show bounty analytics modal or expand analytics section
                      const analytics = {
                        totalSubmissions: bounties?.reduce((total, b) => total + b.submissions, 0) || 0,
                        avgSubmissionsPerBounty: bounties && bounties.length > 0 ? (bounties.reduce((total, b) => total + b.submissions, 0) / bounties.length).toFixed(1) : 0,
                        mostActiveSquad: bounties
                          ?.filter(b => b.squad_tag)
                          .reduce((acc, b) => {
                            acc[b.squad_tag!] = (acc[b.squad_tag!] || 0) + b.submissions;
                            return acc;
                          }, {} as Record<string, number>) || {},
                        completionRate: bounties && bounties.length > 0 ? ((bounties.filter(b => b.status === 'completed').length / bounties.length) * 100).toFixed(1) : 0
                      };
                      
                      alert(`Bounty Analytics:\n\n` +
                        `Total Submissions: ${analytics.totalSubmissions}\n` +
                        `Avg Submissions/Bounty: ${analytics.avgSubmissionsPerBounty}\n` +
                        `Completion Rate: ${analytics.completionRate}%\n\n` +
                        `Most Active Squad: ${Object.entries(analytics.mostActiveSquad)
                          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}`
                      );
                    }}
                    className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                  
                  {/* Bounty Health Check */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const healthIssues = [];
                      
                      // Check for bounties without descriptions
                      const noDescription = bounties?.filter(b => !b.short_desc || b.short_desc.trim() === '') || [];
                      if (noDescription.length > 0) {
                        healthIssues.push(`${noDescription.length} bounties without descriptions`);
                      }
                      
                      // Check for bounties with very short titles
                      const shortTitles = bounties?.filter(b => b.title.length < 5) || [];
                      if (shortTitles.length > 0) {
                        healthIssues.push(`${shortTitles.length} bounties with very short titles`);
                      }
                      
                      // Check for bounties without rewards
                      const noReward = bounties?.filter(b => !b.reward || b.reward.trim() === '') || [];
                      if (noReward.length > 0) {
                        healthIssues.push(`${noReward.length} bounties without rewards`);
                      }
                      

                      
                      if (healthIssues.length === 0) {
                        alert('✅ All bounties are healthy! No issues found.');
                      } else {
                        alert('⚠️ Bounty Health Issues Found:\n\n' + healthIssues.join('\n'));
                      }
                    }}
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Health Check
                  </Button>
                  
                  {/* Bulk Operations */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const activeBounties = bounties?.filter(b => b.status === 'active') || [];
                      if (activeBounties.length === 0) {
                        alert('No active bounties to operate on.');
                        return;
                      }
                      
                      const action = prompt(
                        `Bulk Operations for ${activeBounties.length} active bounties:\n\n` +
                        `1. hide - Hide all active bounties\n` +
                        `2. show - Show all hidden bounties\n` +
                        `3. complete - Mark all as completed\n` +
                        `4. squad - Set squad tag for all\n\n` +
                        `Enter action (1-4):`
                      );
                      
                      if (action === '1') {
                        if (confirm('Hide all active bounties?')) {
                          activeBounties.forEach(b => toggleBountyHidden(b.id, true));
                          refreshBounties();
                        }
                      } else if (action === '2') {
                        if (confirm('Show all hidden bounties?')) {
                          bounties.filter(b => b.hidden).forEach(b => toggleBountyHidden(b.id, false));
                          refreshBounties();
                        }
                      } else if (action === '3') {
                        if (confirm('Mark all active bounties as completed?')) {
                          activeBounties.forEach(b => 
                            createOrUpdateBounty({ ...b, status: 'completed' })
                          );
                          refreshBounties();
                        }
                      } else if (action === '4') {
                        const squadTag = prompt('Enter squad tag for all bounties:');
                        if (squadTag && confirm(`Set squad tag to "${squadTag}" for all active bounties?`)) {
                          activeBounties.forEach(b => 
                            createOrUpdateBounty({ ...b, squad_tag: squadTag })
                          );
                          refreshBounties();
                        }
                      }
                    }}
                    className="border-violet-500 text-violet-400 hover:bg-violet-500/10"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Bulk Ops
                  </Button>
                  
                  {/* Bounty Templates */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const template = {
                        id: '',
                        title: 'Community Challenge',
                        short_desc: 'Complete this community challenge to earn rewards and recognition.',
                        reward: '500',
                        reward_type: 'XP' as const,
                        start_date: null,
                        deadline: null,
                        link_to: null,
                        image: null,
                        squad_tag: 'community',
                        status: 'active' as const,
                        hidden: false,
                        submissions: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      };
                      setEditingBounty(template);
                      setShowBountyForm(true);
                    }}
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Community Template
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const template = {
                        id: '',
                        title: 'Squad Mission',
                        short_desc: 'Complete this squad-specific mission to strengthen your team.',
                        reward: '1000',
                        reward_type: 'XP' as const,
                        start_date: null,
                        deadline: null,
                        link_to: null,
                        image: null,
                        squad_tag: 'alpha',
                        status: 'active' as const,
                        hidden: false,
                        submissions: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      };
                      setEditingBounty(template);
                      setShowBountyForm(true);
                    }}
                    className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
                  >
                    <Target className="w-4 h-4 mr-1" />
                    Squad Template
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const template = {
                        id: '',
                        title: 'Learning Quest',
                        short_desc: 'Complete this learning quest to expand your knowledge.',
                        reward: '750',
                        reward_type: 'XP' as const,
                        start_date: null,
                        deadline: null,
                        link_to: null,
                        image: null,
                        squad_tag: '',
                        status: 'active' as const,
                        hidden: false,
                        submissions: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      };
                      setEditingBounty(template);
                      setShowBountyForm(true);
                    }}
                    className="border-teal-500 text-teal-400 hover:bg-teal-500/10"
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    Learning Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Bulk action: Complete expired bounties
                      if (confirm('Mark all expired bounties as completed?')) {
                        bounties
                          .filter(b => b.status === 'active' && b.deadline && new Date(b.deadline) < new Date())
                          .forEach(b => updateBountyStatus(b.id, 'expired'));
                      }
                    }}
                    disabled={bounties.filter(b => b.status === 'active' && b.deadline && new Date(b.deadline) < new Date()).length === 0}
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Mark Expired
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Export bounty data
                      const data = bounties.map(b => ({
                        title: b.title,
                        status: b.status,
                        submissions: b.submissions,
                        reward: b.reward,
                        squad: b.squad_tag || 'General',
                        deadline: b.deadline || 'No deadline',
                        created: new Date(b.created_at).toLocaleDateString()
                      }));
                      const csv = [
                        Object.keys(data[0]).join(','),
                        ...data.map(row => Object.values(row).join(','))
                      ].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'bounties-export.csv';
                      a.click();
                    }}
                    className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
                
                <p className="text-sm text-slate-400 mt-3">
                  Manage bounty challenges and track user submissions. Each bounty can be customized with rewards, deadlines, and squad-specific targeting.
                  Use the quick actions to edit, hide/show, or change bounty status.
                </p>
              </CardHeader>
              
              {/* Bounty Search and Filters */}
              <div className="px-6 pb-4">
                <div className="border border-slate-600 rounded-lg p-4 bg-slate-700/40 mb-4">
                  <h4 className="text-md font-semibold mb-3 text-blue-400">Search & Filter Bounties</h4>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input 
                        placeholder="Search bounties by title, description, or squad..."
                        className="bg-slate-600 border-slate-500 text-white"
                        onChange={(e) => {
                          const searchTerm = e.target.value.toLowerCase();
                                                  if (searchTerm === '') {
                          setBounties(initialBountiesData);
                        } else {
                          setBounties(initialBountiesData.filter(bounty => 
                            bounty.title.toLowerCase().includes(searchTerm) ||
                            bounty.short_desc.toLowerCase().includes(searchTerm) ||
                            (bounty.squad_tag && bounty.squad_tag.toLowerCase().includes(searchTerm))
                          ));
                        }
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select onValueChange={(value) => {
                        if (value === 'all') {
                          setBounties(initialBountiesData);
                        } else {
                          setBounties(initialBountiesData.filter(bounty => bounty.status === value));
                        }
                      }}>
                        <SelectTrigger className="w-32 bg-slate-600 border-slate-500 text-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={(value) => {
                        if (value === 'all') {
                          setBounties(initialBountiesData);
                        } else if (value === 'hidden') {
                          setBounties(initialBountiesData.filter(bounty => bounty.hidden));
                        } else if (value === 'visible') {
                          setBounties(initialBountiesData.filter(bounty => !bounty.hidden));
                        }
                      }}>
                        <SelectTrigger className="w-32 bg-slate-600 border-slate-500 text-white">
                          <SelectValue placeholder="Visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="visible">Visible</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        onClick={() => setBounties(initialBountiesData)}
                        className="border-slate-500 text-slate-300 hover:bg-slate-600"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bounty Creation/Edit Form */}
              {showBountyForm && (
                <div className="px-6 pb-4">
                  <div className="border border-slate-600 rounded-lg p-4 bg-slate-700/40">
                    <h3 className="text-lg font-semibold mb-4 text-green-400">
                      {editingBounty ? 'Edit Bounty' : 'Create New Bounty'}
                    </h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      console.log('Form submitted');
                      console.log('Form element:', e.currentTarget);
                      
                      try {
                        const formData = new FormData(e.currentTarget);
                        
                        // Log form data for debugging
                        console.log('Form data entries:');
                        Array.from(formData.entries()).forEach(([key, value]) => {
                          console.log(`${key}:`, value);
                        });
                        
                        // Check if form data is being extracted properly
                        console.log('Form data extraction check:');
                        console.log('Title from form:', formData.get('title'));
                        console.log('Description from form:', formData.get('short_desc'));
                        console.log('Reward from form:', formData.get('reward'));
                        
                        const bountyData = {
                          title: String(formData.get('title') || ''),
                          short_desc: String(formData.get('short_desc') || ''),
                          squad_tag: String(formData.get('squad_tag') || ''),
                          reward: String(formData.get('reward') || ''),
                          reward_type: String(formData.get('reward_type') || 'XP') as 'XP' | 'SOL',
                          start_date: String(formData.get('start_date') || ''),
                          deadline: String(formData.get('deadline') || ''),
                          link_to: String(formData.get('link_to') || ''),
                          image: String(formData.get('image') || ''),
                          status: String(formData.get('status') || 'active') as "active" | "completed" | "expired",
                          hidden: formData.get('hidden') === 'on'
                        };
                        
                        // Validate required fields
                        console.log('Validating bounty data:', bountyData);
                        if (!bountyData.title.trim()) {
                          console.error('Bounty title is empty');
                          throw new Error('Bounty title is required');
                        }
                        if (!bountyData.short_desc.trim()) {
                          console.error('Bounty description is empty');
                          throw new Error('Bounty description is required');
                        }
                        if (!bountyData.reward.trim()) {
                          console.error('Bounty reward is empty');
                          throw new Error('Bounty reward is required');
                        }
                        console.log('Bounty data validation passed');
                        
                        console.log('Submitting bounty data:', bountyData);
                        console.log('Editing bounty:', editingBounty);
                        
                        console.log('About to call handleSaveBounty with:', bountyData);
                        await handleSaveBounty(bountyData);
                        console.log('Bounty saved successfully');
                        
                        // Close form and reset state
                        setShowBountyForm(false);
                        setEditingBounty(null);
                        console.log('Form closed and state reset');
                      } catch (error) {
                        console.error('Error in form submission:', error);
                        console.error('Error details:', {
                          message: error instanceof Error ? error.message : 'Unknown error',
                          stack: error instanceof Error ? error.stack : 'No stack trace'
                        });
                        alert('Failed to save bounty. Check console for details.');
                      }
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                          name="title" 
                          placeholder="Bounty Title" 
                          required 
                          defaultValue={editingBounty?.title || ''}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <Input 
                          name="short_desc" 
                          placeholder="Short Description" 
                          required 
                          defaultValue={editingBounty?.short_desc || ''}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <Input 
                          name="squad_tag" 
                          placeholder="Squad Tag (optional)" 
                          defaultValue={editingBounty?.squad_tag || ''}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <div className="flex gap-2">
                          <Input 
                            name="reward" 
                            placeholder="Reward Amount (e.g., 1000)" 
                            required 
                            defaultValue={editingBounty?.reward || ''}
                            className="bg-slate-600 border-slate-500 text-white"
                          />
                          <select 
                            name="reward_type" 
                            defaultValue={editingBounty?.reward_type || 'XP'}
                            className="bg-slate-600 border border-slate-500 text-white px-3 py-2 rounded-md"
                          >
                            <option value="XP">XP</option>
                            <option value="SOL">SOL</option>
                          </select>
                        </div>

                        <Input 
                          name="start_date" 
                          type="date" 
                          placeholder="Start Date"
                          defaultValue={editingBounty?.start_date ? new Date(editingBounty.start_date).toISOString().slice(0, 10) : ''}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <Input 
                          name="deadline" 
                          type="date" 
                          placeholder="End Date"
                          defaultValue={editingBounty?.deadline ? new Date(editingBounty.deadline).toISOString().slice(0, 10) : ''}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <Input 
                          name="link_to" 
                          placeholder="Link to resources (optional)" 
                          defaultValue={editingBounty?.link_to || ''}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <Input 
                          name="image" 
                          placeholder="Image URL (optional)" 
                          defaultValue={editingBounty?.image || ''}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                        <div className="flex items-center gap-4">
                          <select 
                            name="status" 
                            defaultValue={editingBounty?.status || 'active'}
                            className="bg-slate-600 border border-slate-500 text-white px-3 py-2 rounded-md"
                          >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="expired">Expired</option>
                          </select>
                          <div className="flex items-center gap-2">
                            <input 
                              id="hidden" 
                              name="hidden" 
                              type="checkbox" 
                              defaultChecked={editingBounty?.hidden || false}
                              className="h-4 w-4" 
                            />
                            <label htmlFor="hidden" className="text-sm text-gray-300">Hidden</label>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                          {editingBounty ? 'Update Bounty' : 'Create Bounty'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleCancelBountyEdit}
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

                  {bounties && bounties.length > 0 ? bounties.map((bounty) => {
                    console.log('Rendering bounty:', bounty);
                    // Validate bounty data
                    if (!bounty || !bounty.id) {
                      console.error('Invalid bounty data:', bounty);
                      return null;
                    }
                    
                    return (
                      <div key={bounty.id} className="border border-slate-700 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{bounty.title}</h3>
                              <Badge variant={bounty.status === 'active' ? 'default' : bounty.status === 'completed' ? 'secondary' : 'destructive'}>
                                {bounty.status}
                              </Badge>
                              {bounty.hidden && (
                                <Badge variant="outline" className="border-red-500 text-red-400">
                                  Hidden
                                </Badge>
                              )}
                              {bounty.squad_tag && (
                                <Badge variant="outline" className="border-blue-500 text-blue-400">
                                  {bounty.squad_tag}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-400 mb-3">{bounty.short_desc}</p>
                            
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
                                <div className="font-medium text-blue-400">{bounty.submissions}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-xs text-gray-500 mb-3">
                              <div>
                                <span className="text-slate-400">Created:</span>
                                <div className="font-medium">
                                  {new Date(bounty.created_at).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">Updated:</span>
                                <div className="font-medium">
                                  {bounty.updated_at ? new Date(bounty.updated_at).toLocaleString() : 'Never'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Additional bounty details */}
                            {(bounty.link_to || bounty.image) && (
                              <div className="flex gap-4 text-xs text-gray-400 mb-3">
                                {bounty.link_to && (
                                  <div>
                                    <span className="text-slate-400">Link:</span>
                                    <a 
                                      href={bounty.link_to} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:underline ml-1"
                                    >
                                      View Resources
                                    </a>
                                  </div>
                                )}
                                {bounty.image && (
                                  <div>
                                    <span className="text-slate-400">Image:</span>
                                    <a 
                                      href={bounty.image} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:underline ml-1"
                                    >
                                      View Image
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Bounty Management Actions */}
                            <div className="flex items-center gap-2 mb-3">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditBounty(bounty)}
                                className="border-blue-500 text-blue-400 hover:bg-blue-500/10 text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={async () => {
                                  try {
                                    await toggleBountyHidden(bounty.id, !bounty.hidden);
                                    await refreshBounties();
                                  } catch (error) {
                                    console.error('Error toggling bounty visibility:', error);
                                    alert('Failed to toggle bounty visibility');
                                  }
                                }}
                                className={`border-orange-500 text-orange-400 hover:bg-orange-500/10 text-xs ${bounty.hidden ? 'bg-orange-500/20' : ''}`}
                              >
                                {bounty.hidden ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                                {bounty.hidden ? 'Show' : 'Hide'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete "${bounty.title}"? This action cannot be undone.`)) {
                                    try {
                                      await deleteBounty(bounty.id);
                                      await refreshBounties();
                                    } catch (error) {
                                      console.error('Error deleting bounty:', error);
                                      alert('Failed to delete bounty');
                                    }
                                  }
                                }}
                                className="border-red-500 text-red-400 hover:bg-red-500/10 text-xs"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                              <Select 
                                value={bounty.status} 
                                onValueChange={async (newStatus) => {
                                  try {
                                    await createOrUpdateBounty({
                                      id: bounty.id,
                                      title: bounty.title,
                                      short_desc: bounty.short_desc,
                                      reward: bounty.reward,
                                      deadline: bounty.deadline,
                                      link_to: bounty.link_to,
                                      image: bounty.image,
                                      squad_tag: bounty.squad_tag,
                                      status: newStatus as "active" | "completed" | "expired",
                                      hidden: bounty.hidden,
                                      submissions: bounty.submissions,
                                    });
                                    await refreshBounties();
                                  } catch (error) {
                                    console.error('Error updating bounty status:', error);
                                    alert('Failed to update bounty status');
                                  }
                                }}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs border-slate-600 bg-slate-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Show submissions for this bounty */}
                            {bounty.submissions > 0 && (
                              <div className="mt-3 p-3 bg-slate-700/50 rounded border border-slate-600">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-blue-400">
                                    Submissions: {bounty.submissions}
                                  </h4>
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => {
                                        // Filter submissions tab to show only this bounty's submissions
                                        setActiveTab("submissions");
                                        // You could add a filter state here to show only this bounty's submissions
                                      }}
                                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10 text-xs"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View All
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => {
                                        // Quick review: Approve all pending submissions
                                        const pendingSubmissions = submissions.filter(s => 
                                          s.bounty_id === bounty.id && s.status === 'pending'
                                        );
                                        if (pendingSubmissions.length > 0 && confirm(`Approve all ${pendingSubmissions.length} pending submissions?`)) {
                                          // This would need to be implemented with actual API calls
                                          alert('Bulk approval functionality coming soon!');
                                        }
                                      }}
                                      disabled={submissions.filter(s => s.bounty_id === bounty.id && s.status === 'pending').length === 0}
                                      className="border-green-500 text-green-400 hover:bg-green-500/10 text-xs"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Approve All
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Show recent submissions preview with quick actions */}
                                <div className="space-y-2">
                                  {submissions
                                    .filter(s => s.bounty_id === bounty.id)
                                    .slice(0, 3)
                                    .map((submission: any) => (
                                      <div key={submission.id} className="flex items-center justify-between p-2 bg-slate-600/30 rounded text-xs">
                                        <div className="flex-1">
                                          <div className="font-medium text-slate-300">{submission.title}</div>
                                          <div className="text-slate-400">
                                            by {submission.wallet_address?.slice(0, 8)}...{submission.wallet_address?.slice(-6)}
                                          </div>
                                          <div className="text-xs text-slate-500 mt-1">
                                            {submission.total_upvotes || 0} upvotes • {new Date(submission.created_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Badge variant={submission.status === 'approved' ? 'default' : submission.status === 'rejected' ? 'destructive' : 'secondary'}>
                                            {submission.status}
                                          </Badge>
                                          {submission.status === 'pending' && (
                                            <div className="flex gap-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  // Quick approve
                                                  alert('Quick approval functionality coming soon!');
                                                }}
                                                className="border-green-500 text-green-400 hover:bg-green-500/10 text-xs px-1"
                                                title="Quick Approve"
                                              >
                                                ✓
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  // Quick reject
                                                  alert('Quick rejection functionality coming soon!');
                                                }}
                                                className="border-red-500 text-red-400 hover:bg-red-500/10 text-xs px-1"
                                                title="Quick Reject"
                                              >
                                                ✗
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  
                                  {bounty.submissions > 3 && (
                                    <div className="text-center text-xs text-slate-400">
                                      +{bounty.submissions - 3} more submissions
                                    </div>
                                  )}
                                </div>
                                
                                {/* Submission Summary */}
                                <div className="mt-3 pt-3 border-t border-slate-600">
                                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                                    <div>
                                      <div className="text-green-400 font-medium">
                                        {submissions.filter(s => s.bounty_id === bounty.id && s.status === 'approved').length}
                                      </div>
                                      <div className="text-slate-400">Approved</div>
                                    </div>
                                    <div>
                                      <div className="text-yellow-400 font-medium">
                                        {submissions.filter(s => s.bounty_id === bounty.id && s.status === 'pending').length}
                                      </div>
                                      <div className="text-slate-400">Pending</div>
                                    </div>
                                    <div>
                                      <div className="text-red-400 font-medium">
                                        {submissions.filter(s => s.bounty_id === bounty.id && s.status === 'rejected').length}
                                      </div>
                                      <div className="text-slate-400">Rejected</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditBounty(bounty)}
                                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                                title="Edit bounty"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant={bounty.hidden ? "default" : "outline"}
                                onClick={() => toggleBountyVisibility(bounty.id)}
                                className={bounty.hidden ? "bg-red-600 hover:bg-red-700" : "border-gray-500 text-gray-400"}
                                title={bounty.hidden ? "Show bounty" : "Hide bounty"}
                              >
                                {bounty.hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </Button>
                              <Select 
                                value={bounty.status} 
                                onValueChange={(v) => updateBountyStatus(bounty.id, v as any)}
                              >
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
                                title="Delete bounty"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            {/* Quick actions */}
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setActiveTab("submissions");
                                  // Could add filter for this bounty
                                }}
                                className="border-green-500 text-green-400 hover:bg-green-500/10 text-xs"
                                title="View submissions"
                              >
                                <FileText className="w-3 h-3" />
                                Submissions
                              </Button>
                              {bounty.link_to && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => window.open(bounty.link_to!, '_blank')}
                                  className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 text-xs"
                                  title="View resources"
                                >
                                  <Globe className="w-3 h-3" />
                                  Resources
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }) : null}
              {(!bounties || bounties.length === 0) && (
                <div className="text-center text-gray-400 py-8">
                  <div className="mb-4">
                    <p className="text-lg mb-2">No bounties found.</p>
                    <p className="text-sm text-slate-400">
                      Create your first bounty to start accepting user submissions.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowBountyForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Bounty
                  </Button>
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
                  <strong>Current Data:</strong> Showing {submissions.length} total submissions across all categories.
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-slate-400">Loading submissions...</div>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-slate-400">No submissions found</div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {submissions.map((submission: any) => (
                    <div key={submission.id} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{submission.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">{submission.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span>Bounty ID: {submission.bountyId || 'No Bounty'}</span>
                            <span>Squad: {submission.squad || 'No Squad'}</span>
                            <span>Upvotes: {submission.totalUpvotes || 0}</span>
                            <Badge variant={submission.status === 'approved' ? 'default' : submission.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {submission.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-400">
                            <p>Submitted by: {submission.walletAddress?.slice(0, 8)}...{submission.walletAddress?.slice(-6)}</p>
                            <p>Created: {new Date(submission.timestamp).toLocaleDateString()}</p>
                            {submission.imageUrl && (
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
                  </div>
                )}
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
                
                {/* Bounty Analytics Section */}
                <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <h4 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Bounty Analytics
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Submission Trends */}
                    <div>
                      <h5 className="text-sm font-medium mb-3 text-slate-300">Submission Trends</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">High Activity:</span>
                          <span className="text-green-400">
                            {bounties.filter(b => b.submissions > 5).length} bounties
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Medium Activity:</span>
                          <span className="text-yellow-400">
                            {bounties.filter(b => b.submissions > 0 && b.submissions <= 5).length} bounties
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">No Submissions:</span>
                          <span className="text-red-400">
                            {bounties.filter(b => b.submissions === 0).length} bounties
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Squad Performance */}
                    <div>
                      <h5 className="text-sm font-medium mb-3 text-slate-300">Squad Performance</h5>
                      <div className="space-y-2">
                        {(() => {
                          const squadStats = bounties
                            .filter(b => b.squad_tag)
                            .reduce((acc, b) => {
                              if (!acc[b.squad_tag!]) {
                                acc[b.squad_tag!] = { count: 0, submissions: 0 };
                              }
                              acc[b.squad_tag!].count++;
                              acc[b.squad_tag!].submissions += b.submissions;
                              return acc;
                            }, {} as Record<string, { count: number; submissions: number }>);
                          
                          return Object.entries(squadStats).map(([squad, stats]) => (
                            <div key={squad} className="flex justify-between text-sm">
                              <span className="text-slate-400">{squad}:</span>
                              <span className="text-blue-400">
                                {stats.count} bounties, {stats.submissions} submissions
                              </span>
                            </div>
                          ));
                        })()}
                        {bounties.filter(b => !b.squad_tag).length > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">General:</span>
                            <span className="text-purple-400">
                              {bounties.filter(b => !b.squad_tag).length} bounties
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Export bounty data
                        const data = bounties.map(b => ({
                          title: b.title,
                          status: b.status,
                          submissions: b.submissions,
                          reward: b.reward,
                          squad: b.squad_tag || 'General',
                          created: new Date(b.created_at).toLocaleDateString()
                        }));
                        const csv = [
                          Object.keys(data[0]).join(','),
                          ...data.map(row => Object.values(row).join(','))
                        ].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'bounty-analytics.csv';
                        a.click();
                      }}
                      className="border-green-500 text-green-400 hover:bg-green-500/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Analytics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Show bounty performance insights
                        const insights = [
                          `Total bounties: ${bounties.length}`,
                          `Active bounties: ${bounties.filter(b => b.status === 'active').length}`,
                          `Total submissions: ${bounties.reduce((total, b) => total + b.submissions, 0)}`,
                          `Average submissions per bounty: ${bounties.length > 0 ? (bounties.reduce((total, b) => total + b.submissions, 0) / bounties.length).toFixed(1) : 0}`,
                          `Most active squad: ${(() => {
                            const squadStats = bounties
                              .filter(b => b.squad_tag)
                              .reduce((acc, b) => {
                                if (!acc[b.squad_tag!]) acc[b.squad_tag!] = 0;
                                acc[b.squad_tag!] += b.submissions;
                                return acc;
                              }, {} as Record<string, number>);
                            const maxSquad = Object.entries(squadStats).reduce((max, [squad, count]) => 
                              count > max.count ? { squad, count } : max, { squad: 'None', count: 0 }
                            );
                            return maxSquad.squad;
                          })()}`
                        ];
                        alert('Bounty Performance Insights:\n\n' + insights.join('\n'));
                      }}
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Info className="w-4 h-4 mr-2" />
                      Performance Insights
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Show bounty health check
                        const healthCheck = [
                          `Bounty Health Check:`,
                          ``,
                          `✅ Active & Visible: ${bounties.filter(b => b.status === 'active' && !b.hidden).length}`,
                          `⚠️ Active & Hidden: ${bounties.filter(b => b.status === 'active' && b.hidden).length}`,
                          `⏰ Expired: ${bounties.filter(b => b.status === 'active' && b.deadline && new Date(b.deadline) < new Date()).length}`,
                          `📊 High Engagement: ${bounties.filter(b => b.submissions > 5).length}`,
                          `📉 Low Engagement: ${bounties.filter(b => b.submissions === 0).length}`,
                          ``,
                          `Recommendations:`,
                          bounties.filter(b => b.status === 'active' && b.hidden).length > 0 ? 
                            `• Consider making ${bounties.filter(b => b.status === 'active' && b.hidden).length} hidden bounties visible` : '',
                          bounties.filter(b => b.status === 'active' && b.deadline && new Date(b.deadline) < new Date()).length > 0 ?
                            `• ${bounties.filter(b => b.status === 'active' && b.deadline && new Date(b.deadline) < new Date()).length} bounties have expired deadlines` : '',
                          bounties.filter(b => b.submissions === 0).length > 0 ?
                            `• ${bounties.filter(b => b.submissions === 0).length} bounties have no submissions - consider promoting them` : ''
                        ].filter(Boolean).join('\n');
                        
                        alert(healthCheck);
                      }}
                      className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Health Check
                    </Button>
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

        {/* Bounty View Modal */}
        {editingBounty && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span>{editingBounty.title}</span>
                  </span>
                  <Button 
                    onClick={handleCancelBountyEdit}
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
                    <Label className="text-slate-400">Bounty ID</Label>
                    <p className="font-mono text-xs bg-slate-700 p-2 rounded">{editingBounty.id}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Status</Label>
                    <Badge variant={editingBounty.status === 'active' ? 'default' : editingBounty.status === 'completed' ? 'secondary' : 'destructive'}>
                      {editingBounty.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-slate-400">Squad</Label>
                    <p>{editingBounty.squad_tag || 'General'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Reward</Label>
                    <p className="text-green-400 font-medium">{editingBounty.reward}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Deadline</Label>
                    <p>{editingBounty.deadline ? new Date(editingBounty.deadline).toLocaleDateString() : 'No deadline'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Submissions</Label>
                    <p className="text-blue-400 font-medium">{editingBounty.submissions}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-slate-400">Description</Label>
                  <p className="text-sm bg-slate-700 p-3 rounded">{editingBounty.short_desc}</p>
                </div>

                {(editingBounty.link_to || editingBounty.image) && (
                  <div>
                    <Label className="text-slate-400">Resources</Label>
                    <div className="space-y-2">
                      {editingBounty.link_to && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-400" />
                          <a 
                            href={editingBounty.link_to} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {editingBounty.link_to}
                          </a>
                        </div>
                      )}
                      {editingBounty.image && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-400" />
                          <a 
                            href={editingBounty.image} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-green-400 hover:underline"
                          >
                            {editingBounty.image}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Visibility</Label>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={editingBounty.hidden ? "secondary" : "default"} className={editingBounty.hidden ? "bg-red-600" : "bg-green-600"}>
                        {editingBounty.hidden ? "Hidden" : "Visible"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400">Dates</Label>
                    <div className="text-xs text-slate-400 mt-1">
                      <p>Created: {new Date(editingBounty.created_at).toLocaleDateString()}</p>
                      <p>Updated: {new Date(editingBounty.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Bounty Submissions Preview */}
                {editingBounty.submissions > 0 && (
                  <div className="border-t border-slate-600 pt-4">
                    <Label className="text-slate-400">Recent Submissions</Label>
                    <div className="space-y-2 mt-2">
                      {submissions
                        .filter(s => s.bounty_id === editingBounty.id)
                        .slice(0, 5)
                        .map((submission: any) => (
                          <div key={submission.id} className="flex items-center justify-between p-2 bg-slate-700 rounded text-xs">
                            <div className="flex-1">
                              <div className="font-medium text-slate-300">{submission.title}</div>
                              <div className="text-slate-400">
                                by {submission.wallet_address?.slice(0, 8)}...{submission.wallet_address?.slice(-6)}
                              </div>
                            </div>
                            <Badge variant={submission.status === 'approved' ? 'default' : submission.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {submission.status}
                            </Badge>
                          </div>
                        ))}
                      
                      {editingBounty.submissions > 5 && (
                        <div className="text-center text-xs text-slate-400">
                          +{editingBounty.submissions - 5} more submissions
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-slate-600">
                  <Button 
                    onClick={() => {
                      setShowBountyForm(true);
                      // Keep the editing state
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Bounty
                  </Button>
                  <Button 
                    onClick={() => {
                      setActiveTab("submissions");
                      handleCancelBountyEdit();
                    }}
                    variant="outline" 
                    className="border-green-500 text-green-400 hover:bg-green-500/10"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View All Submissions
                  </Button>
                  <Button 
                    onClick={handleCancelBountyEdit}
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
