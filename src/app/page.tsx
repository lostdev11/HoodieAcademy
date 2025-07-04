"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Clock, 
  Bell, 
  CheckCircle, 
  Play, 
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Video,
  AlertCircle,
  Trophy,
  LogOut,
  User,
  Users,
  Shield
} from "lucide-react"
import Link from "next/link"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import TokenGate from "@/components/TokenGate"
import SquadBadge from "@/components/SquadBadge"
import { getUserRank, getUserScore, isCurrentUserAdmin } from '@/lib/utils'

interface Announcement {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success';
  priority: 'low' | 'medium' | 'high';
}

interface TodoItem {
  id: string;
  title: string;
  type: 'quiz' | 'lesson' | 'assignment';
  dueDate?: string;
  course: string;
  completed: boolean;
}

interface UpcomingClass {
  id: string;
  title: string;
  course: string;
  startTime: string;
  duration: string;
  instructor: string;
  type: 'live' | 'recorded';
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'New Course: Advanced DeFi Strategies',
    content: 'Learn advanced DeFi protocols and yield farming strategies. Course starts next week!',
    timestamp: '2 hours ago',
    type: 'info',
    priority: 'medium'
  },
  {
    id: '2',
    title: 'System Maintenance Tonight',
    content: 'Hoodie Academy will be offline for maintenance from 2-4 AM UTC.',
    timestamp: '4 hours ago',
    type: 'warning',
    priority: 'high'
  },
  {
    id: '3',
    title: 'Congratulations to Graduates!',
    content: '50 new Hoodie Scholars have completed their first course this week!',
    timestamp: '1 day ago',
    type: 'success',
    priority: 'low'
  }
];

const mockTodos: TodoItem[] = [
  {
    id: '1',
    title: 'Complete Wallet Security Quiz',
    type: 'quiz',
    dueDate: 'Today',
    course: 'Wallet Wizardry',
    completed: false
  },
  {
    id: '2',
    title: 'Watch NFT Creation Video',
    type: 'lesson',
    course: 'NFT Mastery',
    completed: false
  },
  {
    id: '3',
    title: 'Submit Meme Coin Analysis',
    type: 'assignment',
    dueDate: 'Tomorrow',
    course: 'Meme Coin Mania',
    completed: true
  }
];

const mockUpcomingClasses: UpcomingClass[] = [
  {
    id: '1',
    title: 'Live Q&A: Technical Analysis',
    course: 'Technical Analysis Tactics',
    startTime: 'Today, 3:00 PM',
    duration: '45 min',
    instructor: 'Hoodie Sensei',
    type: 'live'
  },
  {
    id: '2',
    title: 'Community Building Workshop',
    course: 'Community Strategy',
    startTime: 'Tomorrow, 2:00 PM',
    duration: '60 min',
    instructor: 'Hoodie Speaker',
    type: 'live'
  }
];

export default function HoodieAcademy() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [overallProgress, setOverallProgress] = useState(65);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [userRank, setUserRank] = useState<number>(-1);
  const [userScore, setUserScore] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get wallet address from localStorage
    const storedWallet = localStorage.getItem('walletAddress');
    if (storedWallet) {
      setWalletAddress(storedWallet);
    }

    // Check if user is admin
    setIsAdmin(isCurrentUserAdmin());

    // Get squad placement result
    const squadResult = localStorage.getItem('userSquad');
    if (squadResult) {
      try {
        const result = JSON.parse(squadResult);
        setUserSquad(result.name);
      } catch (error) {
        console.error('Error parsing squad result:', error);
      }
    }

    // Check if user needs to complete onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    const hasDisplayName = localStorage.getItem('userDisplayName');
    
    if (storedWallet && (!hasCompletedOnboarding || !hasDisplayName)) {
      // Redirect to onboarding if wallet is connected but onboarding is not complete
      window.location.href = '/onboarding';
    }
    
    // Show welcome message for new users who just completed onboarding
    const justCompletedOnboarding = sessionStorage.getItem('justCompletedOnboarding');
    if (justCompletedOnboarding === 'true') {
      setShowWelcomeMessage(true);
      sessionStorage.removeItem('justCompletedOnboarding');
      // Hide welcome message after 5 seconds
      setTimeout(() => setShowWelcomeMessage(false), 5000);
    }

    // Load leaderboard data for current user
    if (storedWallet) {
      const rank = getUserRank(storedWallet);
      const score = getUserScore(storedWallet);
      setUserRank(rank);
      setUserScore(score);
    }
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <CheckCircle className="w-4 h-4" />;
      case 'lesson': return <Play className="w-4 h-4" />;
      case 'assignment': return <BookOpen className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const completedTodos = mockTodos.filter(todo => todo.completed).length;
  const totalTodos = mockTodos.length;

  const handleDisconnect = () => {
    // Clear wallet data from storage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    sessionStorage.removeItem('wifhoodie_verification_session');
    
    // Disconnect from wallet providers
    if (window.solana?.disconnect) {
      window.solana.disconnect();
    }
    
    // Clear the wallet address state to trigger re-render
    setWalletAddress("");
    
    // Redirect to home page to show connection screen
    window.location.href = '/';
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <TokenGate>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Sidebar */}
        <DashboardSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-800/50 border-b border-cyan-500/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <h1 className="text-3xl font-bold text-cyan-400">Welcome to Hoodie Academy</h1>
                  <p className="text-gray-300">Your Web3 learning journey starts here!</p>
                </div>
                
                {/* Squad Badge */}
                {userSquad && (
                  <div className="hidden md:block">
                    <SquadBadge squad={userSquad.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, '')} />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {/* Wallet Info */}
                {walletAddress && (
                  <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-2 rounded-lg border border-cyan-500/30">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-cyan-400 font-mono">
                      {formatWalletAddress(walletAddress)}
                    </span>
                  </div>
                )}
                
                {/* Disconnect Button */}
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
                
                {/* Time */}
                <div className="text-right">
                  <div className="text-sm text-gray-400">Current Time</div>
                  <div className="text-lg text-cyan-400 font-mono">{currentTime}</div>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Welcome Message for New Users */}
            {showWelcomeMessage && (
              <Card className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-500/20 rounded-full">
                      <Trophy className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-400 mb-2">
                        Welcome to Hoodie Academy! 🎉
                      </h3>
                      <p className="text-gray-300">
                        Your profile is set up and you're ready to start your Web3 learning journey. 
                        Explore the courses below and begin your path to becoming a Hoodie Scholar!
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowWelcomeMessage(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ×
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <BookOpen className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Courses Completed</p>
                      <p className="text-2xl font-bold text-cyan-400">3/6</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Award className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">NFT Badges</p>
                      <p className="text-2xl font-bold text-green-400">5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Overall Progress</p>
                      <p className="text-2xl font-bold text-purple-400">{overallProgress}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Your Rank</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {userRank > 0 ? `#${userRank}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-pink-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Video className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Score</p>
                      <p className="text-2xl font-bold text-pink-400">{userScore.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Dashboard Access */}
            {isAdmin && (
              <Card className="bg-slate-800/50 border-purple-500/30 mb-6">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Admin Dashboard</span>
                    <Badge variant="outline" className="ml-auto text-purple-400 border-purple-500/30">
                      Admin Access
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 mb-2">
                        Manage users, approve exams, and monitor course progress.
                      </p>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-purple-400">Full admin privileges</span>
                      </div>
                    </div>
                    <Button asChild className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                      <Link href="/admin">
                        <Shield className="w-4 h-4 mr-2" />
                        Access Dashboard
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Squad Placement Test */}
            <Card className="bg-slate-800/50 border-cyan-500/30 mb-6">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Find Your Squad</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 mb-2">
                      Take our personality test to discover which Hoodie squad aligns with your skills and interests!
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">🎨 Creators</Badge>
                      <Badge variant="outline" className="text-gray-300 border-gray-500/30">🧠 Decoders</Badge>
                      <Badge variant="outline" className="text-red-400 border-red-500/30">🎤 Speakers</Badge>
                      <Badge variant="outline" className="text-blue-400 border-blue-500/30">⚔️ Raiders</Badge>
                      <Badge variant="outline" className="text-purple-400 border-purple-500/30">🦅 Rangers</Badge>
                    </div>
                  </div>
                  <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                    <Link href="/placement/squad-test">Take Test</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Squad Chat */}
            {userSquad && (
              <Card className="bg-slate-800/50 border-green-500/30 mb-6">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Your Squad Chat</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 mb-2">
                        Connect with your {userSquad} squad members in real-time.
                      </p>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-400">Live messaging</span>
                      </div>
                    </div>
                    <Button asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                      <Link href={`/squads/${userSquad}/chat`}>
                        <Users className="w-4 h-4 mr-2" />
                        Join Chat
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leaderboard Preview */}
              <Card className="bg-slate-800/50 border-yellow-500/30 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Top Performers</span>
                    <Button size="sm" variant="outline" asChild className="ml-auto text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10">
                      <Link href="/leaderboard">View All</Link>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">HoodieScholar</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-400">2,850</div>
                      <div className="text-xs text-gray-400">pts</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-500/10 rounded border border-gray-500/20">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-gray-300" />
                      <span className="text-sm font-medium text-white">CryptoNinja</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-300">2,720</div>
                      <div className="text-xs text-gray-400">pts</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-amber-500/10 rounded border border-amber-500/20">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-white">Web3Wizard</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-600">2,580</div>
                      <div className="text-xs text-gray-400">pts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Classes */}
              <Card className="bg-slate-800/50 border-cyan-500/30 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Upcoming Classes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockUpcomingClasses.map((classItem) => (
                    <div key={classItem.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{classItem.title}</h4>
                          <p className="text-sm text-gray-400">{classItem.course}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-cyan-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {classItem.startTime}
                            </span>
                            <Badge variant={classItem.type === 'live' ? 'default' : 'secondary'} className="text-xs">
                              {classItem.type}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* To-Do List */}
              <Card className="bg-slate-800/50 border-green-500/30 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>To-Do List</span>
                    <Badge variant="secondary" className="ml-auto">
                      {completedTodos}/{totalTodos}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockTodos.map((todo) => (
                    <div key={todo.id} className={`p-3 rounded-lg border transition-all duration-200 ${
                      todo.completed 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-slate-700/30 border-slate-600/30 hover:border-green-500/30'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-1 rounded ${
                          todo.completed ? 'bg-green-500/20' : 'bg-slate-600/20'
                        }`}>
                          {getTypeIcon(todo.type)}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${
                            todo.completed ? 'text-green-400 line-through' : 'text-white'
                          }`}>
                            {todo.title}
                          </p>
                          <p className="text-sm text-gray-400">{todo.course}</p>
                          {todo.dueDate && (
                            <p className="text-xs text-yellow-400">Due: {todo.dueDate}</p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant={todo.completed ? "outline" : "default"}
                          className={todo.completed ? "border-green-500 text-green-400" : "bg-green-600 hover:bg-green-700"}
                        >
                          {todo.completed ? 'Done' : 'Complete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Announcements */}
              <Card className="bg-slate-800/50 border-pink-500/30 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-pink-400 flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Announcements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded ${getPriorityColor(announcement.priority)}`}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{announcement.title}</h4>
                          <p className="text-sm text-gray-300 mt-1">{announcement.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{announcement.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Progress Overview */}
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400">Overall Academy Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-purple-400">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-3 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-cyan-400">3</p>
                      <p className="text-sm text-gray-400">Courses Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">15</p>
                      <p className="text-sm text-gray-400">Lessons Finished</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">8</p>
                      <p className="text-sm text-gray-400">Quizzes Passed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-pink-400">5</p>
                      <p className="text-sm text-gray-400">NFT Badges</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </TokenGate>
  )
}