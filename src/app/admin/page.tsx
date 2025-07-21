'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  BookOpen, 
  Trophy, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Upload, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  User,
  Award,
  Target,
  TrendingUp,
  BarChart3,
  Megaphone,
  Bell,
  Clock,
  FileText,
  CheckSquare,
  XSquare,
  ArrowLeft,
  LogOut,
  Shield,
  AlertCircle,
  Lock,
  Key
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getUserRank, getUserScore, isCurrentUserAdmin, isAdminPassword, setAdminAuthenticated, 
  DEMO_WALLET, removeDemoWalletAdminAccess, getConnectedWallet,
  Announcement, Event, getAnnouncements, getEvents, saveAnnouncements, saveEvents,
  updateAnnouncement, deleteAnnouncement as deleteAnnouncementUtil,
  toggleAnnouncementActive as toggleAnnouncementUtil, debugAnnouncements, addAnnouncement,
  getScheduledAnnouncements, getAllActiveAnnouncements,
  addEvent, updateEvent, deleteEvent as deleteEventUtil
} from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Admin authentication is now password-based

interface User {
  walletAddress: string;
  displayName: string;
  squad: string;
  profileCompleted: boolean;
  squadTestCompleted: boolean;
  courses: {
    [courseName: string]: {
      progress: Array<'locked' | 'unlocked' | 'completed'>;
      finalExam?: {
        taken: boolean;
        score: number;
        totalQuestions: number;
        passed: boolean;
        approved: boolean;
        submittedAt: string;
      };
    };
  };
  createdAt: string;
  lastActive: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  completedCourses: number;
  pendingApprovals: number;
  totalExamsTaken: number;
  placementTestsCompleted: number;
  squadDistribution: {
    [squad: string]: number;
  };
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    completedCourses: 0,
    pendingApprovals: 0,
    totalExamsTaken: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isDemoWallet, setIsDemoWallet] = useState(false);
  const router = useRouter();

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Badge management state
  const [showBadgeResetConfirm, setShowBadgeResetConfirm] = useState(false);
  const [badgeResetTarget, setBadgeResetTarget] = useState<string | null>(null); // 'all' or wallet address

  useEffect(() => {
    checkAdminAccess();
    checkDemoWallet();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleAnnouncementsUpdate = () => {
      console.log('Admin: announcementsUpdated event received');
      setAnnouncements(getAnnouncements());
    };

    const handleEventsUpdate = () => {
      console.log('Admin: eventsUpdated event received');
      setEvents(getEvents());
    };

    console.log('Admin: Setting up event listeners');
    window.addEventListener('announcementsUpdated', handleAnnouncementsUpdate);
    window.addEventListener('eventsUpdated', handleEventsUpdate);
    
    return () => {
      console.log('Admin: Cleaning up event listeners');
      window.removeEventListener('announcementsUpdated', handleAnnouncementsUpdate);
      window.removeEventListener('eventsUpdated', handleEventsUpdate);
    };
  }, []);

  const checkAdminAccess = () => {
    setCheckingAuth(true);
    try {
      const isAdminUser = isCurrentUserAdmin();
      
      if (!isAdminUser) {
        setIsAdmin(false);
        setCheckingAuth(false);
        setShowPasswordInput(true);
        return;
      }

      setIsAdmin(true);
      loadUsers();
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
      setShowPasswordInput(true);
    } finally {
      setCheckingAuth(false);
    }
  };

  const checkDemoWallet = () => {
    const connectedWallet = getConnectedWallet();
    if (connectedWallet && connectedWallet.toLowerCase() === DEMO_WALLET.toLowerCase()) {
      setIsDemoWallet(true);
      // Automatically remove admin access for demo wallet
      removeDemoWalletAdminAccess();
    }
  };

  const handlePasswordSubmit = () => {
    if (isAdminPassword(password)) {
      setAdminAuthenticated(true);
      setIsAdmin(true);
      setPasswordError("");
      setShowPasswordInput(false);
      loadUsers();
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAdmin(false);
    setShowPasswordInput(true);
    setPassword("");
    setPasswordError("");
  };

  // Helper function to get all placement test completions
  const getAllPlacementTestCompletions = () => {
    const completions: Array<{
      walletAddress: string;
      squad: string;
      displayName?: string;
      completedAt: string;
    }> = [];

    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('placement_completed_')) {
        const walletAddress = key.replace('placement_completed_', '');
        const placementCompleted = localStorage.getItem(key);
        
        if (placementCompleted === 'true') {
          // Get squad information for this wallet
          const userSquad = localStorage.getItem('userSquad');
          const displayName = localStorage.getItem('userDisplayName');
          
          let squad = 'Unknown Squad';
          if (userSquad) {
            try {
              const squadData = JSON.parse(userSquad);
              squad = squadData.name || squadData.id || userSquad;
            } catch (error) {
              squad = userSquad;
            }
          }

          // Get completion timestamp
          const placementTestCompleted = localStorage.getItem('placementTestCompleted');
          const completedAt = placementTestCompleted ? new Date().toISOString() : new Date().toISOString();

          completions.push({
            walletAddress,
            squad,
            displayName: displayName || undefined,
            completedAt
          });
        }
      }
    }

    // Also check for general placement test completion flags
    const placementTestCompleted = localStorage.getItem('placementTestCompleted');
    const walletAddress = localStorage.getItem('walletAddress');
    const userSquad = localStorage.getItem('userSquad');
    const displayName = localStorage.getItem('userDisplayName');

    if (placementTestCompleted === 'true' && walletAddress) {
      let squad = 'Unknown Squad';
      if (userSquad) {
        try {
          const squadData = JSON.parse(userSquad);
          squad = squadData.name || squadData.id || userSquad;
        } catch (error) {
          squad = userSquad;
        }
      }

      // Check if this wallet is already in completions
      const existingCompletion = completions.find(c => c.walletAddress === walletAddress);
      if (!existingCompletion) {
        completions.push({
          walletAddress,
          squad,
          displayName: displayName || undefined,
          completedAt: new Date().toISOString()
        });
      }
    }

    return completions;
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      let users: User[] = [];
      
      // Method 1: Load from userProgress and userProfiles (existing method)
      const userProgress = localStorage.getItem('userProgress');
      const userProfiles = localStorage.getItem('userProfiles');
      
      if (userProgress) {
        const progress = JSON.parse(userProgress);
        const profiles = userProfiles ? JSON.parse(userProfiles) : {};
        
        // Convert progress data to User objects
        Object.entries(progress).forEach(([walletAddress, userData]: [string, any]) => {
          const profile = profiles[walletAddress] || {};
          const user: User = {
            walletAddress,
            displayName: profile.displayName || `User ${walletAddress.slice(0, 6)}...`,
            squad: profile.squad || 'Unassigned',
            profileCompleted: profile.profileCompleted || false,
            squadTestCompleted: profile.squadTestCompleted || false,
            courses: userData.courses || {},
            createdAt: profile.createdAt || new Date().toISOString(),
            lastActive: profile.lastActive || new Date().toISOString()
          };
          users.push(user);
        });
      }

      // Method 2: Load from leaderboard service (for users who completed onboarding)
      const leaderboardService = (await import('@/services/leaderboard-service')).leaderboardService;
      const leaderboardData = leaderboardService.getLeaderboard();
      
      leaderboardData.forEach((leaderboardUser: any) => {
        // Check if this user is already in the list
        const existingUser = users.find(u => u.walletAddress === leaderboardUser.walletAddress);
        if (!existingUser) {
          // Create user from leaderboard data
          const user: User = {
            walletAddress: leaderboardUser.walletAddress,
            displayName: leaderboardUser.displayName || `User ${leaderboardUser.walletAddress.slice(0, 6)}...`,
            squad: leaderboardUser.squad || 'Unassigned',
            profileCompleted: true, // If they're in leaderboard, they completed profile
            squadTestCompleted: true, // If they're in leaderboard, they completed squad test
            courses: {}, // Will be populated from other sources
            createdAt: leaderboardUser.joinDate || new Date().toISOString(),
            lastActive: leaderboardUser.lastActive || new Date().toISOString()
          };
          users.push(user);
        }
      });

      // Method 3: Load from individual localStorage keys (wallet address, display name, squad)
      const walletAddress = localStorage.getItem('walletAddress');
      const displayName = localStorage.getItem('userDisplayName');
      const squadResult = localStorage.getItem('userSquad');
      
      if (walletAddress && !users.find(u => u.walletAddress === walletAddress)) {
        let squad = 'Unassigned';
        if (squadResult) {
          try {
            const squadData = JSON.parse(squadResult);
            squad = squadData.name || squadData.id || squadResult;
          } catch (error) {
            squad = squadResult;
          }
        }
        
        const user: User = {
          walletAddress,
          displayName: displayName || `User ${walletAddress.slice(0, 6)}...`,
          squad,
          profileCompleted: !!displayName,
          squadTestCompleted: !!squadResult,
          courses: {}, // Will be populated from other sources
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        users.push(user);
      }

      // Method 4: Load placement test completions from all wallets
      const placementTestCompletions = getAllPlacementTestCompletions();
      placementTestCompletions.forEach(completion => {
        const existingUser = users.find(u => u.walletAddress === completion.walletAddress);
        if (existingUser) {
          existingUser.squadTestCompleted = true;
          existingUser.squad = completion.squad;
          existingUser.lastActive = completion.completedAt;
        } else {
          // Create new user entry for placement test completion
          const user: User = {
            walletAddress: completion.walletAddress,
            displayName: completion.displayName || `User ${completion.walletAddress.slice(0, 6)}...`,
            squad: completion.squad,
            profileCompleted: !!completion.displayName,
            squadTestCompleted: true,
            courses: {},
            createdAt: completion.completedAt,
            lastActive: completion.completedAt
          };
          users.push(user);
        }
      });

      // Method 5: Load course progress from individual course localStorage keys
      users.forEach(user => {
        // Check for wallet wizardry progress
        const walletWizardryProgress = localStorage.getItem('walletWizardryProgress');
        if (walletWizardryProgress) {
          try {
            const progress = JSON.parse(walletWizardryProgress);
            user.courses['wallet-wizardry'] = {
              progress: progress,
              finalExam: undefined
            };
          } catch (error) {
            console.error('Error parsing wallet wizardry progress:', error);
          }
        }

        // Check for final exam results
        const finalExamResult = localStorage.getItem('walletWizardryFinalExam');
        if (finalExamResult && user.courses['wallet-wizardry']) {
          try {
            const examData = JSON.parse(finalExamResult);
            user.courses['wallet-wizardry'].finalExam = examData;
          } catch (error) {
            console.error('Error parsing final exam result:', error);
          }
        }
      });

      // Remove demo user if we have real users
      if (users.length > 1) {
        users = users.filter(user => user.walletAddress !== "0x1234567890abcdef1234567890abcdef12345678");
      }
      
      // Add demo users if no real users exist
      if (users.length === 0) {
        users = [
          {
            walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
            displayName: "CryptoHoodie",
            squad: "Vault Keepers",
            profileCompleted: true,
            squadTestCompleted: true,
            courses: {
              "wallet-wizardry": {
                progress: ['completed', 'completed', 'completed', 'completed'],
                finalExam: {
                  taken: true,
                  score: 85,
                  totalQuestions: 20,
                  passed: true,
                  approved: false,
                  submittedAt: "2024-01-15T10:30:00Z"
                }
              }
            },
            createdAt: "2024-01-01T00:00:00Z",
            lastActive: "2024-01-15T12:00:00Z"
          }
        ];
      }

      setUsers(users);
      calculateStats(users);
      loadAnnouncements();
      loadEvents();
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userList: User[]) => {
    const totalUsers = userList.length;
    const activeUsers = userList.filter(user => 
      new Date(user.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    const completedCourses = userList.reduce((total, user) => {
      return total + Object.values(user.courses).filter(course => 
        course.progress.every(p => p === 'completed')
      ).length;
    }, 0);

    const pendingApprovals = userList.reduce((total, user) => {
      return total + Object.values(user.courses).filter(course => 
        course.finalExam?.taken && !course.finalExam?.approved
      ).length;
    }, 0);

    const totalExamsTaken = userList.reduce((total, user) => {
      return total + Object.values(user.courses).filter(course => 
        course.finalExam?.taken
      ).length;
    }, 0);

    // Calculate placement test statistics
    const placementTestsCompleted = userList.filter(user => user.squadTestCompleted).length;
    
    // Calculate squad distribution
    const squadDistribution: { [squad: string]: number } = {};
    userList.forEach(user => {
      if (user.squadTestCompleted && user.squad) {
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

  const approveExam = async (walletAddress: string, courseName: string) => {
    try {
      // Update user's exam approval status in localStorage
      const userProgress = localStorage.getItem('userProgress');
      if (userProgress) {
        const progress = JSON.parse(userProgress);
        if (progress[walletAddress] && progress[walletAddress].courses[courseName]) {
          progress[walletAddress].courses[courseName].finalExam.approved = true;
          localStorage.setItem('userProgress', JSON.stringify(progress));
        }
      }
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.walletAddress === walletAddress && user.courses[courseName]) {
            return {
              ...user,
              courses: {
                ...user.courses,
                [courseName]: {
                  ...user.courses[courseName],
                  finalExam: {
                    ...user.courses[courseName].finalExam!,
                    approved: true
                  }
                }
              }
            };
          }
          return user;
        })
      );
      
      // Recalculate stats
      calculateStats(users);
    } catch (error) {
      console.error('Error approving exam:', error);
    }
  };

  const rejectExam = async (walletAddress: string, courseName: string) => {
    try {
      // Reset user's exam status in localStorage
      const userProgress = localStorage.getItem('userProgress');
      if (userProgress) {
        const progress = JSON.parse(userProgress);
        if (progress[walletAddress] && progress[walletAddress].courses[courseName]) {
          delete progress[walletAddress].courses[courseName].finalExam;
          localStorage.setItem('userProgress', JSON.stringify(progress));
        }
      }
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.walletAddress === walletAddress && user.courses[courseName]) {
            return {
              ...user,
              courses: {
                ...user.courses,
                [courseName]: {
                  ...user.courses[courseName],
                  finalExam: undefined
                }
              }
            };
          }
          return user;
        })
      );
      
      // Recalculate stats
      calculateStats(users);
    } catch (error) {
      console.error('Error rejecting exam:', error);
    }
  };

  const confirmCourseCompletion = async (walletAddress: string, courseName: string) => {
    try {
      // Mark course as admin-confirmed
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.walletAddress === walletAddress && user.courses[courseName]) {
            return {
              ...user,
              courses: {
                ...user.courses,
                [courseName]: {
                  ...user.courses[courseName],
                  adminConfirmed: true
                }
              }
            };
          }
          return user;
        })
      );
      
      // Recalculate stats
      loadUsers();
    } catch (error) {
      console.error('Error confirming course completion:', error);
    }
  };

  const resetCourses = (walletAddress: string, courseName: string) => {
    if (confirm(`Are you sure you want to reset ${courseName} for ${walletAddress}?`)) {
      // Reset course progress
      const userProgress = localStorage.getItem('userProgress');
      if (userProgress) {
        const progress = JSON.parse(userProgress);
        if (progress[walletAddress] && progress[walletAddress].courses) {
          delete progress[walletAddress].courses[courseName];
          localStorage.setItem('userProgress', JSON.stringify(progress));
        }
      }
      
      // Reset leaderboard data
      const leaderboardService = (async () => {
        const { leaderboardService } = await import('@/services/leaderboard-service');
        leaderboardService.resetUserCourse(walletAddress, courseName);
      })();
      
      loadUsers();
      alert(`Course ${courseName} has been reset for ${walletAddress}`);
    }
  };

  // Badge reset functions
  const resetUserBadges = (walletAddress: string) => {
    setBadgeResetTarget(walletAddress);
    setShowBadgeResetConfirm(true);
  };

  const resetAllBadges = () => {
    setBadgeResetTarget('all');
    setShowBadgeResetConfirm(true);
  };

  const confirmBadgeReset = () => {
    if (badgeResetTarget === 'all') {
      // Reset badges for all users
      const userProgress = localStorage.getItem('userProgress');
      if (userProgress) {
        const progress = JSON.parse(userProgress);
        Object.keys(progress).forEach(walletAddress => {
          if (progress[walletAddress].badges) {
            progress[walletAddress].badges = [];
          }
        });
        localStorage.setItem('userProgress', JSON.stringify(progress));
      }
      
      // Reset leaderboard badges
      const leaderboardService = (async () => {
        const { leaderboardService } = await import('@/services/leaderboard-service');
        leaderboardService.resetAllBadges();
      })();
      
      alert('All user badges have been reset');
    } else if (badgeResetTarget) {
      // Reset badges for specific user
      const userProgress = localStorage.getItem('userProgress');
      if (userProgress) {
        const progress = JSON.parse(userProgress);
        if (progress[badgeResetTarget] && progress[badgeResetTarget].badges) {
          progress[badgeResetTarget].badges = [];
          localStorage.setItem('userProgress', JSON.stringify(progress));
        }
      }
      
      // Reset leaderboard badges for specific user
      const leaderboardService = (async () => {
        const { leaderboardService } = await import('@/services/leaderboard-service');
        leaderboardService.resetUserBadges(badgeResetTarget);
      })();
      
      alert(`Badges have been reset for ${badgeResetTarget}`);
    }
    
    setShowBadgeResetConfirm(false);
    setBadgeResetTarget(null);
    loadUsers();
  };

  const loadAnnouncements = () => {
    try {
      setAnnouncements(getAnnouncements());
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const loadEvents = () => {
    try {
      setEvents(getEvents());
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const saveAnnouncement = (announcement: Announcement) => {
    try {
      console.log('Admin: Saving announcement:', announcement);
      if (editingAnnouncement) {
        console.log('Admin: Updating existing announcement');
        updateAnnouncement(announcement.id, announcement);
      } else {
        console.log('Admin: Adding new announcement');
        addAnnouncement(announcement);
      }
      
      // Refresh the announcements list
      setAnnouncements(getAnnouncements());
      
      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  const deleteAnnouncement = (announcementId: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      try {
        console.log('Admin: Deleting announcement:', announcementId);
        deleteAnnouncementUtil(announcementId);
        setAnnouncements(getAnnouncements());
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const toggleAnnouncementActive = (announcementId: string) => {
    try {
      console.log('Admin: Toggling announcement active status:', announcementId);
      toggleAnnouncementUtil(announcementId);
      setAnnouncements(getAnnouncements());
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const saveEvent = (event: Event) => {
    try {
      console.log('Admin: Saving event:', event);
      if (editingEvent) {
        console.log('Admin: Updating existing event');
        updateEvent(event.id, event);
      } else {
        console.log('Admin: Adding new event');
        addEvent(event);
      }
      setEvents(getEvents());
      setShowEventForm(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const deleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        console.log('Admin: Deleting event:', eventId);
        deleteEventUtil(eventId);
        setEvents(getEvents());
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const toggleEventActive = (eventId: string) => {
    try {
      console.log('Admin: Toggling event active status:', eventId);
      const currentEvent = events.find(e => e.id === eventId);
      if (currentEvent) {
        const updatedEvent = { ...currentEvent, isActive: !currentEvent.isActive };
        updateEvent(eventId, updatedEvent);
        setEvents(getEvents());
      }
    } catch (error) {
      console.error('Error toggling event:', error);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !showPasswordInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8">
          <Card className="bg-slate-800/60 border-red-500/30">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-red-400 mb-2">Admin Access Required</h1>
                <p className="text-gray-300 mb-4">
                  You need to authenticate with the admin password to access the dashboard.
                </p>
                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-2">Password Authentication</h3>
                  <p className="text-xs text-gray-400">
                    Enter the admin password to access the dashboard.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => setShowPasswordInput(true)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Enter Password
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-gray-500/30 text-gray-400 hover:text-gray-300"
                >
                  <Link href="/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showPasswordInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8">
          <Card className="bg-slate-800/60 border-cyan-500/30">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Key className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-cyan-400 mb-2">Admin Authentication</h1>
                <p className="text-gray-300 mb-4">
                  Enter the admin password to access the dashboard.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    className="w-full bg-slate-700/50 border-cyan-500/30 text-white placeholder-gray-400"
                  />
                  {passwordError && (
                    <p className="text-red-400 text-sm mt-2">{passwordError}</p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handlePasswordSubmit}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPasswordInput(false);
                      setPassword("");
                      setPasswordError("");
                    }}
                    variant="outline"
                    className="border-gray-500/30 text-gray-400 hover:text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative z-10 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-300 text-sm sm:text-base">Manage users, courses, and exam approvals</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button
                asChild
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 w-full sm:w-auto"
              >
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Link>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-red-400 hover:text-red-300 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-300 w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs sm:text-sm">
                  Admin Access
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Wallet Warning Banner */}
        {isDemoWallet && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500/30 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400">Demo Wallet Detected</h3>
                  <p className="text-yellow-200 text-sm">
                    You are using the demo wallet ({DEMO_WALLET.slice(0, 6)}...{DEMO_WALLET.slice(-4)}). 
                    Admin access has been automatically removed to allow live data testing.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                  Demo Mode
                </Badge>
                <Button
                  onClick={() => {
                    // removeDemoWalletAdminAccess(); // This function is no longer imported
                    setIsDemoWallet(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Total Users</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/30">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Active Users</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.activeUsers}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/30">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Completed Courses</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.completedCourses}</p>
                </div>
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-yellow-500/30">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Pending Approvals</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.pendingApprovals}</p>
                </div>
                <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-cyan-500/30">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Exams Taken</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.totalExamsTaken}</p>
                </div>
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-pink-500/30">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Placement Tests</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.placementTestsCompleted}</p>
                </div>
                <Target className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-orange-500/30">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Squads</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{Object.keys(stats.squadDistribution).length}</p>
                </div>
                <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Squad Distribution */}
        {Object.keys(stats.squadDistribution).length > 0 && (
          <Card className="bg-slate-800/50 border-orange-500/30 mb-6 sm:mb-8">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-400" />
                Squad Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {Object.entries(stats.squadDistribution).map(([squad, count]) => (
                  <div key={squad} className="bg-slate-700/50 rounded-lg p-3 sm:p-4 border border-orange-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400">Squad</p>
                        <p className="text-sm sm:text-base lg:text-lg font-semibold text-white">{squad}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-gray-400">Members</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400">{count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-slate-800/50 gap-1 sm:gap-2">
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm p-2 sm:p-3">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm p-2 sm:p-3">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Exam Approvals</span>
              <span className="sm:hidden">Exams</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm p-2 sm:p-3">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Course Management</span>
              <span className="sm:hidden">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm p-2 sm:p-3">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Badge Management</span>
              <span className="sm:hidden">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm p-2 sm:p-3">
              <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Events & Announcements</span>
              <span className="sm:hidden">Events</span>
            </TabsTrigger>
            <TabsTrigger value="debug" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm p-2 sm:p-3">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Debug</span>
              <span className="sm:hidden">Debug</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4 sm:mt-6">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-white text-lg sm:text-xl">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {users.map((user) => (
                    <div key={user.walletAddress} className="bg-slate-700/50 p-3 sm:p-4 rounded-lg border border-slate-600">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="font-semibold text-white text-sm sm:text-base">{user.displayName}</h3>
                            <Badge variant="outline" className="border-cyan-500 text-cyan-400 text-xs">
                              {user.squad}
                            </Badge>
                            {user.profileCompleted && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-2">
                            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-300">
                            <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                            <span>Last Active: {new Date(user.lastActive).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="border-purple-500 text-purple-400 hover:bg-purple-500/10 w-full sm:w-auto"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">Details</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exam Approvals Tab */}
          <TabsContent value="exams" className="mt-6">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Final Exam Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.flatMap(user => 
                    Object.entries(user.courses)
                      .filter(([_, course]) => course.finalExam?.taken)
                      .map(([courseName, course]) => (
                        <div key={`${user.walletAddress}-${courseName}`} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-white">{user.displayName}</h3>
                                <Badge variant="outline" className="border-purple-500 text-purple-400">
                                  {courseName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                <Badge variant={course.finalExam!.passed ? "default" : "destructive"}>
                                  {course.finalExam!.passed ? "Passed" : "Failed"}
                                </Badge>
                                {course.finalExam!.approved && (
                                  <Badge variant="outline" className="border-green-500 text-green-400">
                                    Approved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mb-2">
                                Score: {course.finalExam!.score}/{course.finalExam!.totalQuestions} ({Math.round(course.finalExam!.score / course.finalExam!.totalQuestions * 100)}%)
                              </p>
                              <p className="text-sm text-gray-300">
                                Submitted: {new Date(course.finalExam!.submittedAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {!course.finalExam!.approved && course.finalExam!.passed && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => approveExam(user.walletAddress, courseName)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectExam(user.walletAddress, courseName)}
                                  >
                                    <XSquare className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                  {users.flatMap(user => Object.entries(user.courses)).filter(([_, course]) => course.finalExam?.taken).length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No exams submitted for approval</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Management Tab */}
          <TabsContent value="courses" className="mt-6">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Course Management</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to reset ALL courses for ALL users? This action cannot be undone.')) {
                        users.forEach(user => {
                          Object.keys(user.courses).forEach(courseName => {
                            resetCourses(user.walletAddress, courseName);
                          });
                        });
                      }
                    }}
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset All Users
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.flatMap(user => 
                    Object.entries(user.courses)
                      .filter(([_, course]) => course.progress.every(p => p === 'completed'))
                      .map(([courseName, course]) => (
                        <div key={`${user.walletAddress}-${courseName}`} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-white">{user.displayName}</h3>
                                <Badge variant="outline" className="border-green-500 text-green-400">
                                  {courseName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </div>
                              <p className="text-sm text-gray-400">
                                All tiers completed • {course.progress.filter(p => p === 'completed').length}/{course.progress.length} tiers
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmCourseCompletion(user.walletAddress, courseName)}
                              className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                            >
                              <Award className="w-4 h-4 mr-2" />
                              Confirm Completion
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => resetCourses(user.walletAddress, courseName)}
                              className="border-red-500 text-red-400 hover:bg-red-500/10"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reset
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                  {users.flatMap(user => Object.entries(user.courses)).filter(([_, course]) => course.progress.every(p => p === 'completed')).length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No completed courses to manage</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badge Management Tab */}
          <TabsContent value="badges" className="mt-6">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Badge Management</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={resetAllBadges}
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset All Badges
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => {
                    // Simple badge display without async operations
                    const userBadges: any[] = []; // Will be populated by leaderboard service
                    
                    return (
                      <div key={user.walletAddress} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-white">{user.displayName}</h3>
                              <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                                {user.squad}
                              </Badge>
                              <Badge variant="outline" className="border-purple-500 text-purple-400">
                                Badge Management
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm text-gray-500">Badges will be reset when you click the button below</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => resetUserBadges(user.walletAddress)}
                            className="border-red-500 text-red-400 hover:bg-red-500/10"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset Badges
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No users found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Announcements Section */}
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Announcements</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          debugAnnouncements();
                          alert('Check browser console for announcement debug info!');
                        }}
                        variant="outline"
                        size="sm"
                        className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        Debug
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingAnnouncement(null);
                          setShowAnnouncementForm(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Add Announcement
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {announcements.length > 0 ? (
                      announcements.map((announcement) => (
                        <div key={announcement.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-white">{announcement.title}</h4>
                                <Badge 
                                  variant={announcement.isActive ? "default" : "secondary"}
                                  className={announcement.isActive ? "bg-green-600" : "bg-gray-600"}
                                >
                                  {announcement.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`border-${announcement.type === 'important' ? 'red' : announcement.type === 'warning' ? 'yellow' : announcement.type === 'success' ? 'green' : 'blue'}-500 text-${announcement.type === 'important' ? 'red' : announcement.type === 'warning' ? 'yellow' : announcement.type === 'success' ? 'green' : 'blue'}-400`}
                                >
                                  {announcement.type}
                                </Badge>
                                <Badge variant="outline" className="border-purple-500 text-purple-400">
                                  {announcement.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-300 mb-2">{announcement.content}</p>
                              <div className="text-xs text-gray-400 space-y-1">
                                <p>Start: {new Date(announcement.startDate + 'T00:00:00').toLocaleDateString()}</p>
                                {announcement.endDate && (
                                  <p>End: {new Date(announcement.endDate + 'T00:00:00').toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAnnouncementActive(announcement.id)}
                                className={`${announcement.isActive ? 'border-yellow-500 text-yellow-400' : 'border-green-500 text-green-400'}`}
                              >
                                {announcement.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAnnouncement(announcement);
                                  setShowAnnouncementForm(true);
                                }}
                                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteAnnouncement(announcement.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No announcements yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Scheduled Announcements Section */}
              <Card className="bg-slate-800/50 border-blue-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      Scheduled Announcements
                    </CardTitle>
                    <Badge variant="outline" className="border-blue-500 text-blue-400">
                      {getScheduledAnnouncements().length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getScheduledAnnouncements().length > 0 ? (
                      getScheduledAnnouncements().map((announcement) => (
                        <div key={announcement.id} className="bg-slate-700/50 p-4 rounded-lg border border-blue-500/30">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-white">{announcement.title}</h4>
                                <Badge 
                                  variant="outline"
                                  className="border-blue-500 text-blue-400"
                                >
                                  Scheduled
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`border-${announcement.type === 'important' ? 'red' : announcement.type === 'warning' ? 'yellow' : announcement.type === 'success' ? 'green' : 'blue'}-500 text-${announcement.type === 'important' ? 'red' : announcement.type === 'warning' ? 'yellow' : announcement.type === 'success' ? 'green' : 'blue'}-400`}
                                >
                                  {announcement.type}
                                </Badge>
                                <Badge variant="outline" className="border-purple-500 text-purple-400">
                                  {announcement.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-300 mb-2">{announcement.content}</p>
                              <div className="text-xs text-gray-400 space-y-1">
                                <p className="text-blue-400">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  Starts: {new Date(announcement.startDate + 'T00:00:00').toLocaleDateString()}
                                </p>
                                {announcement.endDate && (
                                  <p>Ends: {new Date(announcement.endDate + 'T00:00:00').toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAnnouncement(announcement);
                                  setShowAnnouncementForm(true);
                                }}
                                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteAnnouncement(announcement.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No scheduled announcements</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Events Section */}
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Events</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          debugAnnouncements(); // Reusing debugAnnouncements for now, but ideally a separate debug for events
                          alert('Check browser console for event debug info!');
                        }}
                        variant="outline"
                        className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        Debug
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingEvent(null);
                          setShowEventForm(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.length > 0 ? (
                      events.map((event) => (
                        <div key={event.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-white">{event.title}</h4>
                                <Badge 
                                  variant={event.isActive ? "default" : "secondary"}
                                  className={event.isActive ? "bg-green-600" : "bg-gray-600"}
                                >
                                  {event.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline" className="border-purple-500 text-purple-400">
                                  {event.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                              <div className="text-xs text-gray-400 space-y-1">
                                <p>Date: {new Date(event.date + 'T00:00:00').toLocaleDateString()}</p>
                                {event.time && <p>Time: {event.time}</p>}
                                {event.location && <p>Location: {event.location}</p>}
                                {event.maxParticipants && (
                                  <p>Participants: {event.currentParticipants || 0}/{event.maxParticipants}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleEventActive(event.id)}
                                className={`${event.isActive ? 'border-yellow-500 text-yellow-400' : 'border-green-500 text-green-400'}`}
                              >
                                {event.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingEvent(event);
                                  setShowEventForm(true);
                                }}
                                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteEvent(event.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No events yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Debug Tab */}
          <TabsContent value="debug" className="mt-6">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2">localStorage Keys</h3>
                    <div className="bg-slate-700/50 p-3 rounded text-sm font-mono">
                      {Array.from({ length: localStorage.length }, (_, i) => {
                        const key = localStorage.key(i);
                        const value = key ? localStorage.getItem(key) : null;
                        return (
                          <div key={key} className="mb-2">
                            <div className="text-cyan-400">{key}</div>
                            <div className="text-gray-300 text-xs break-all">
                              {value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : 'null'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">Current Users Data</h3>
                    <div className="bg-slate-700/50 p-3 rounded text-sm font-mono">
                      <pre className="text-gray-300 text-xs overflow-auto">
                        {JSON.stringify(users, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">Connected Wallet</h3>
                    <div className="bg-slate-700/50 p-3 rounded">
                      <p className="text-gray-300">
                        Wallet Address: {localStorage.getItem('walletAddress') || 'Not connected'}
                      </p>
                      <p className="text-gray-300">
                        Display Name: {localStorage.getItem('userDisplayName') || 'Not set'}
                      </p>
                      <p className="text-gray-300">
                        Squad: {localStorage.getItem('userSquad') || 'Not assigned'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        loadUsers();
                        alert('Users data refreshed!');
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Refresh Users
                    </Button>
                    <Button
                      onClick={() => {
                        console.log('localStorage data:', {
                          walletAddress: localStorage.getItem('walletAddress'),
                          displayName: localStorage.getItem('userDisplayName'),
                          squad: localStorage.getItem('userSquad'),
                          userProgress: localStorage.getItem('userProgress'),
                          userProfiles: localStorage.getItem('userProfiles'),
                          leaderboardData: localStorage.getItem('leaderboardData'),
                          walletWizardryProgress: localStorage.getItem('walletWizardryProgress'),
                          finalExam: localStorage.getItem('walletWizardryFinalExam')
                        });
                        alert('Check browser console for detailed localStorage data');
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Log localStorage to Console
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">User Details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="border-gray-600 text-gray-400"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Profile</h3>
                  <div className="bg-slate-700/50 p-3 rounded">
                    <p className="text-sm text-gray-300">Name: {selectedUser.displayName}</p>
                    <p className="text-sm text-gray-300">Squad: {selectedUser.squad}</p>
                    <p className="text-sm text-gray-300">Wallet: {selectedUser.walletAddress}</p>
                    <p className="text-sm text-gray-300">Profile Completed: {selectedUser.profileCompleted ? 'Yes' : 'No'}</p>
                    <p className="text-sm text-gray-300">Squad Test Completed: {selectedUser.squadTestCompleted ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Course Progress</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedUser.courses).map(([courseName, course]) => (
                      <div key={courseName} className="bg-slate-700/50 p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">
                            {courseName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={course.progress.every(p => p === 'completed') ? "default" : "secondary"}>
                              {course.progress.filter(p => p === 'completed').length}/{course.progress.length} Complete
                            </Badge>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => resetCourses(selectedUser.walletAddress, courseName)}
                              className="h-6 px-2 text-xs"
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                        {course.finalExam && (
                          <div className="text-sm text-gray-300">
                            <p>Final Exam: {course.finalExam.score}/{course.finalExam.totalQuestions} ({Math.round(course.finalExam.score / course.finalExam.totalQuestions * 100)}%)</p>
                            <p>Status: {course.finalExam.approved ? 'Approved' : 'Pending Approval'}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Reset All Courses Button */}
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Are you sure you want to reset ALL courses for ${selectedUser.displayName}?`)) {
                          Object.keys(selectedUser.courses).forEach(courseName => {
                            resetCourses(selectedUser.walletAddress, courseName);
                          });
                        }
                      }}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset All Courses for {selectedUser.displayName}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Announcement Form Modal */}
        {showAnnouncementForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <AnnouncementForm
                announcement={editingAnnouncement}
                onSave={saveAnnouncement}
                onCancel={() => {
                  setShowAnnouncementForm(false);
                  setEditingAnnouncement(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Event Form Modal */}
        {showEventForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <EventForm
                event={editingEvent}
                onSave={saveEvent}
                onCancel={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Badge Reset Confirmation Modal */}
        {showBadgeResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
              <div className="text-center">
                <Award className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <h2 className="text-xl font-bold text-white mb-2">
                  Confirm Badge Reset
                </h2>
                <p className="text-gray-300 mb-6">
                  {badgeResetTarget === 'all' 
                    ? 'Are you sure you want to reset ALL badges for ALL users? This action cannot be undone.'
                    : `Are you sure you want to reset badges for user ${badgeResetTarget?.slice(0, 6)}...${badgeResetTarget?.slice(-4)}? This action cannot be undone.`
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={confirmBadgeReset}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Confirm Reset
                  </Button>
                  <Button
                    onClick={() => {
                      setShowBadgeResetConfirm(false);
                      setBadgeResetTarget(null);
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-400"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Announcement Form Component
const AnnouncementForm = ({ announcement, onSave, onCancel }: { 
  announcement: Announcement | null; 
  onSave: (announcement: Announcement) => void; 
  onCancel: () => void; 
}) => {
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    type: announcement?.type || 'info' as 'info' | 'warning' | 'success' | 'important',
    priority: announcement?.priority || 'medium' as 'low' | 'medium' | 'high',
    startDate: announcement?.startDate || new Date().toISOString().split('T')[0], // Today's date
    endDate: announcement?.endDate || '',
    isActive: announcement?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnnouncement: Announcement = {
      id: announcement?.id || Date.now().toString(),
      ...formData,
      endDate: formData.endDate || undefined,
      createdBy: 'Admin',
      createdAt: announcement?.createdAt || new Date().toISOString()
    };
    onSave(newAnnouncement);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          {announcement ? 'Edit Announcement' : 'Add New Announcement'}
        </h2>
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-600 text-gray-400">
          ×
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-slate-700/50 border-slate-600 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="important">Important</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
          <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="bg-slate-700/50 border-slate-600 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">End Date (Optional)</label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-slate-600 bg-slate-700"
          />
          <label htmlFor="isActive" className="text-sm text-gray-300">Active</label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-md p-3 min-h-[150px]"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
          {announcement ? 'Update Announcement' : 'Create Announcement'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-600 text-gray-400">
          Cancel
        </Button>
      </div>
    </form>
  );
}; 

// Event Form Component
const EventForm = ({ event, onSave, onCancel }: { 
  event: Event | null; 
  onSave: (event: Event) => void; 
  onCancel: () => void; 
}) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    type: event?.type || 'event' as 'class' | 'event' | 'workshop' | 'meetup',
    date: event?.date || new Date().toISOString().split('T')[0],
    time: event?.time || '',
    location: event?.location || '',
    maxParticipants: event?.maxParticipants || 0,
    currentParticipants: event?.currentParticipants || 0,
    isActive: event?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: Event = {
      id: event?.id || Date.now().toString(),
      ...formData,
      createdBy: 'Admin',
      createdAt: event?.createdAt || new Date().toISOString()
    };
    onSave(newEvent);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          {event ? 'Edit Event' : 'Add New Event'}
        </h2>
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-600 text-gray-400">
          ×
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-slate-700/50 border-slate-600 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="important">Important</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="bg-slate-700/50 border-slate-600 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Time (Optional)</label>
          <Input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Location (Optional)</label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Max Participants (Optional)</label>
          <Input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Current Participants (Optional)</label>
          <Input
            type="number"
            value={formData.currentParticipants}
            onChange={(e) => setFormData({ ...formData, currentParticipants: parseInt(e.target.value) || 0 })}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-slate-600 bg-slate-700"
          />
          <label htmlFor="isActive" className="text-sm text-gray-300">Active</label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-md p-3 min-h-[100px]"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
          {event ? 'Update Event' : 'Create Event'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-600 text-gray-400">
          Cancel
        </Button>
      </div>
    </form>
  );
}; 