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
  Award, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Shield,
  FileText,
  Eye,
  CheckSquare,
  XSquare,
  RefreshCw,
  ArrowLeft,
  Lock,
  AlertCircle,
  Key,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isCurrentUserAdmin, isAdminPassword, setAdminAuthenticated, DEMO_WALLET, removeDemoWalletAdminAccess, getConnectedWallet } from '@/lib/utils';

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

  useEffect(() => {
    checkAdminAccess();
    checkDemoWallet();
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

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Load users from localStorage (replace with actual API call)
      const userProgress = localStorage.getItem('userProgress');
      const userProfiles = localStorage.getItem('userProfiles');
      
      let users: User[] = [];
      
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

    setStats({
      totalUsers,
      activeUsers,
      completedCourses,
      pendingApprovals,
      totalExamsTaken
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
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-300">Manage users, courses, and exam approvals</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300"
              >
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-red-400 hover:text-red-300 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-400" />
                <Badge variant="outline" className="border-purple-500 text-purple-400">
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
                    removeDemoWalletAdminAccess();
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
                </div>
                <Clock className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed Courses</p>
                  <p className="text-2xl font-bold text-white">{stats.completedCourses}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Approvals</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingApprovals}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Exams Taken</p>
                  <p className="text-2xl font-bold text-white">{stats.totalExamsTaken}</p>
                </div>
                <FileText className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="exams" className="data-[state=active]:bg-purple-600">
              <FileText className="w-4 h-4 mr-2" />
              Exam Approvals
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-purple-600">
              <BookOpen className="w-4 h-4 mr-2" />
              Course Management
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.walletAddress} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">{user.displayName}</h3>
                            <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                              {user.squad}
                            </Badge>
                            {user.profileCompleted && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-300">
                            <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                            <span>Last Active: {new Date(user.lastActive).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
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
                <CardTitle className="text-white">Course Management</CardTitle>
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
                          <Badge variant={course.progress.every(p => p === 'completed') ? "default" : "secondary"}>
                            {course.progress.filter(p => p === 'completed').length}/{course.progress.length} Complete
                          </Badge>
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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 