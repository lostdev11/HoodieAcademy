'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  Trophy, 
  Users, 
  Target, 
  TrendingUp, 
  Award, 
  Star, 
  CheckCircle, 
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Plus,
  X,
  Edit,
  Trash2,
  Bell,
  Megaphone,
  User, 
  LogOut,
  AlertCircle,
  Video,
  Shield,
  Clock
} from 'lucide-react';
import Link from "next/link"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import TokenGate from "@/components/TokenGate"
import SquadBadge from "@/components/SquadBadge"
import { getUserRank, getUserScore, isCurrentUserAdmin, getConnectedWallet, getActiveAnnouncements, getScheduledAnnouncements, getUpcomingEvents, Announcement, Event } from '@/lib/utils'
import { useRouter } from 'next/navigation';


interface UpcomingClass {
  id: string;
  title: string;
  course: string;
  startTime: string;
  duration: string;
  instructor: string;
  type: 'live' | 'recorded';
}

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

// Real data functions
const getRealAnnouncements = (): Announcement[] => {
  return getActiveAnnouncements();
};

const getRealUpcomingClasses = (): UpcomingClass[] => {
  try {
    const events = getUpcomingEvents();
    return events.map(event => ({
      id: event.id,
      title: event.title,
      course: event.type === 'class' ? 'Academy Session' : event.type,
      startTime: event.time || 'TBD',
      duration: '1 hour',
      instructor: 'Hoodie Academy',
      type: event.type === 'class' ? 'live' : 'recorded'
    }));
  } catch (error) {
    console.error('Error loading upcoming classes:', error);
    return [];
  }
};

export default function HoodieAcademy() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [overallProgress, setOverallProgress] = useState(65);
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [userRank, setUserRank] = useState<number>(-1);
  const [userScore, setUserScore] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemoWallet, setIsDemoWallet] = useState(false);
  const [realAnnouncements, setRealAnnouncements] = useState<Announcement[]>([]);
  const [realUpcomingClasses, setRealUpcomingClasses] = useState<UpcomingClass[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('walletAddress')) {
      router.replace('/connect');
    }
  }, [router]);

  useEffect(() => {
    // Get wallet address from localStorage
    const storedWallet = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null;
    if (storedWallet) {
      setWalletAddress(storedWallet);
    }

    // Check if user is admin (now password-based)
    setIsAdmin(isCurrentUserAdmin());

    // Get squad placement result
    const squadResult = typeof window !== 'undefined' ? localStorage.getItem('userSquad') : null;
    if (squadResult) {
      try {
        const result = JSON.parse(squadResult);
        // Handle both object and string formats
        if (typeof result === 'object' && result.name) {
          setUserSquad(result.name);
        } else if (typeof result === 'string') {
          setUserSquad(result);
        }
      } catch (error) {
        console.error('Error parsing squad result:', error);
        // If parsing fails, treat as string
        setUserSquad(squadResult);
      }
    }

    // Check if user needs to complete onboarding
    const hasCompletedOnboarding = typeof window !== 'undefined' ? localStorage.getItem('onboardingCompleted') : null;
    const hasDisplayName = typeof window !== 'undefined' ? localStorage.getItem('userDisplayName') : null;
    
    if (storedWallet && (!hasCompletedOnboarding || !hasDisplayName)) {
      // Redirect to onboarding if wallet is connected but onboarding is not complete
      if (typeof window !== 'undefined') {
        window.location.href = '/onboarding';
      }
    }
    
    // Show welcome message for new users who just completed onboarding
    const justCompletedOnboarding = typeof window !== 'undefined' ? sessionStorage.getItem('justCompletedOnboarding') : null;
    if (justCompletedOnboarding === 'true') {
      setShowWelcomeMessage(true);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('justCompletedOnboarding');
      }
      // Hide welcome message after 5 seconds
      setTimeout(() => setShowWelcomeMessage(false), 5000);
    }

    // Load leaderboard data for current user
    if (storedWallet) {
      const rank = getUserRank(storedWallet);
      const score = getUserScore(storedWallet);
      setUserRank(rank);
      setUserScore(score);
      

      
      // Load real data
      setRealAnnouncements(getRealAnnouncements());
      setRealUpcomingClasses(getRealUpcomingClasses());
    }
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleAnnouncementsUpdate = () => {
      console.log('Home page: announcementsUpdated event received');
      const newAnnouncements = getRealAnnouncements();
      console.log('Home page: new announcements:', newAnnouncements);
      setRealAnnouncements(newAnnouncements);
    };

    const handleEventsUpdate = () => {
      console.log('Home page: eventsUpdated event received');
      const newEvents = getRealUpcomingClasses();
      console.log('Home page: new events:', newEvents);
      setRealUpcomingClasses(newEvents);
    };

    console.log('Home page: Setting up event listeners');
    window.addEventListener('announcementsUpdated', handleAnnouncementsUpdate);
    window.addEventListener('eventsUpdated', handleEventsUpdate);
    
    return () => {
      console.log('Home page: Cleaning up event listeners');
      window.removeEventListener('announcementsUpdated', handleAnnouncementsUpdate);
      window.removeEventListener('eventsUpdated', handleEventsUpdate);
    };
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

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

  // Helper function to normalize squad names for URL generation
  const normalizeSquadNameForUrl = (name: string): string => {
    // Remove emojis and extra spaces, convert to URL-friendly format
    return name.replace(/^[🎨🧠🎤⚔️🦅🏦]+\s*/, '').toLowerCase().trim().replace(/\s+/g, '-');
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
                  <h1 className="text-3xl font-bold text-cyan-400">Home Tab Dashboard</h1>
                  <p className="text-gray-300">Your Web3 learning journey starts here!</p>
                </div>
                
                {/* Squad Badge */}
                {userSquad && (
                  <div className="hidden md:block">
                    <SquadBadge squad={typeof userSquad === 'string' ? userSquad.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, '') : 'Unknown Squad'} />
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
                    {isDemoWallet && (
                      <Badge variant="outline" className="ml-2 text-yellow-400 border-yellow-500/30 text-xs">
                        DEMO
                      </Badge>
                    )}
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
            {/* Demo Wallet Banner */}
            {isDemoWallet && (
              <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-6 h-6 text-yellow-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-400">Demo Mode Active</h3>
                        <p className="text-yellow-200 text-sm">
                          You are using the demo wallet. Admin access has been disabled to allow live data testing.
                          All progress and interactions will be saved normally.
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                      Demo Wallet
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

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
            {/* Admin Dashboard Access */}
            {isAdmin && !isDemoWallet && (
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
                        <span className="text-sm text-purple-400">Password authenticated</span>
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

            {/* Demo Wallet Admin Access Disabled */}
            {isDemoWallet && (
              <Card className="bg-slate-800/50 border-yellow-500/30 mb-6">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Admin Access Disabled</span>
                    <Badge variant="outline" className="ml-auto text-yellow-400 border-yellow-500/30">
                      Demo Mode
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 mb-2">
                        Admin access is disabled for the demo wallet to allow live data testing.
                        Use a different wallet to access admin features.
                      </p>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-yellow-400">Demo wallet detected</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      disabled
                      className="border-yellow-500/30 text-yellow-400 cursor-not-allowed"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Access Disabled
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
                      <Link href={`/squads/${normalizeSquadNameForUrl(userSquad)}/chat`}>
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
                    <span>Top Hoodies</span>
                    <Button size="sm" variant="outline" asChild className="ml-auto text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10">
                      <Link href="/leaderboard">View All</Link>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userRank > 0 ? (
                    <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-white">Your Rank</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-yellow-400">#{userRank}</div>
                        <div className="text-xs text-gray-400">{userScore.toLocaleString()} pts</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Complete courses to join leaderboard</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Classes */}
              <Card className="bg-slate-800/50 border-cyan-500/30 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Upcoming Classes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {realUpcomingClasses.length > 0 ? (
                    realUpcomingClasses.map((classItem) => (
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
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No upcoming classes scheduled</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Announcements */}
              <Card className="bg-slate-800/50 border-pink-500/30 lg:col-span-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-pink-400 flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Hood Announcements</span>
                    </CardTitle>
                    <Button
                      onClick={() => {
                        console.log('Manual refresh clicked');
                        const newAnnouncements = getRealAnnouncements();
                        console.log('Manual refresh - announcements:', newAnnouncements);
                        setRealAnnouncements(newAnnouncements);
                      }}
                      variant="outline"
                      size="sm"
                      className="border-pink-500 text-pink-400 hover:bg-pink-500/10"
                    >
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {realAnnouncements.length > 0 ? (
                    realAnnouncements.map((announcement) => (
                      <div key={announcement.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                        <div className="flex items-start space-x-3">
                          <div className={`p-1 rounded ${getPriorityColor(announcement.priority)}`}>
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{announcement.title}</h4>
                            <p className="text-sm text-gray-300 mt-1">{announcement.content}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              Active from {new Date(announcement.startDate + 'T00:00:00').toLocaleDateString()}
                              {announcement.endDate && ` to ${new Date(announcement.endDate + 'T00:00:00').toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No announcements</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Scheduled Announcements */}
            {getScheduledAnnouncements().length > 0 && (
              <Card className="bg-slate-800/50 border-cyan-500/30 mb-6">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Upcoming Announcements</span>
                    <Badge variant="outline" className="ml-auto border-cyan-500 text-cyan-400">
                      {getScheduledAnnouncements().length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getScheduledAnnouncements().map((announcement) => (
                      <div key={announcement.id} className="p-3 bg-slate-700/30 rounded-lg border border-cyan-500/30">
                        <div className="flex items-start space-x-3">
                          <div className={`p-1 rounded ${getPriorityColor(announcement.priority)}`}>
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{announcement.title}</h4>
                            <p className="text-sm text-gray-300 mt-1">{announcement.content}</p>
                            <p className="text-xs text-cyan-400 mt-2">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Starts: {new Date(announcement.startDate + 'T00:00:00').toLocaleDateString()}
                              {announcement.endDate && ` • Ends: ${new Date(announcement.endDate + 'T00:00:00').toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Overview */}
            {/* (Removed the Overall Academy Progress card and its contents) */}
          </main>
        </div>
      </div>
    </TokenGate>
  )
}