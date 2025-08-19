'use client';

import { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { RightSidebar } from '@/components/dashboard/RightSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Bell, 
  CheckCircle, 
  Play, 
  TrendingUp,
  Award,
  BookOpen,
  Video,
  AlertCircle,
  Users,
  Target,
  Brain,
  Mic,
  Palette,
  Trophy,
  Calendar,
  FileText,
  Sparkles
} from 'lucide-react';
import TokenGate from '@/components/TokenGate';
import Link from 'next/link';
import { getActiveAnnouncements, Announcement, getScheduledAnnouncements, getCompletedCoursesCount, getTotalCoursesCount } from '@/lib/utils';
import GlobalBulletinBoard from '@/components/GlobalBulletinBoard';
import { squadTracks, SquadTrack } from '@/lib/squadData';
import { useUserXP } from '@/hooks/useUserXP';
import { retailstarIncentiveService } from '@/services/retailstar-incentive-service';
// import { RetailstarRewardCard } from '@/components/retailstar/RetailstarRewardCard';

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

interface WeeklyAssignment {
  id: string;
  title: string;
  description: string;
  type: 'meme' | 'summary' | 'onboarding' | 'content' | 'research';
  dueDate: string;
  squad: string;
  points: number;
  completed: boolean;
}

interface SquadActivity {
  squad: string;
  icon: string;
  color: string;
  activities: string[];
  memberCount: number;
  activeThisWeek: number;
}

// Real data functions
const getRealTodos = (walletAddress: string): TodoItem[] => {
  if (!walletAddress) return [];
  
  const todos: TodoItem[] = [];
  
  // Check course progress and create todos based on incomplete items
  const userProgress = localStorage.getItem('userProgress');
  if (userProgress) {
    try {
      const progress = JSON.parse(userProgress);
      const userData = progress[walletAddress];
      
      if (userData && userData.courses) {
        Object.entries(userData.courses).forEach(([courseId, courseData]: [string, any]) => {
          if (courseData.progress) {
            const incompleteLessons = courseData.progress.filter((p: string) => p !== 'completed');
            incompleteLessons.forEach((status: string, index: number) => {
              if (status === 'unlocked') {
                todos.push({
                  id: `${courseId}-lesson-${index}`,
                  title: `Complete ${courseId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Lesson ${index + 1}`,
                  type: 'lesson',
                  course: courseId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  completed: false
                });
              }
            });
            
            // Check for incomplete final exams
            if (courseData.finalExam && courseData.finalExam.taken && !courseData.finalExam.approved) {
              todos.push({
                id: `${courseId}-exam`,
                title: `Final Exam Pending Approval`,
                type: 'quiz',
                course: courseId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                completed: false
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error parsing user progress:', error);
    }
  }
  
  return todos;
};

const getRealUpcomingClasses = (): UpcomingClass[] => {
  // For now, return empty array - classes would come from backend
  return [];
};

const getWeeklyAssignments = (userSquad: string | null): WeeklyAssignment[] => {
  const assignments: WeeklyAssignment[] = [];
  
  if (!userSquad) return assignments;
  
  // Squad-specific assignments
  const squadAssignments = {
    creators: [
      {
        id: 'creators-meme-1',
        title: 'Design Hoodie Academy Meme',
        description: 'Create a meme that captures the "Class Is In Session" vibe. Focus on cyberpunk aesthetics and educational themes.',
        type: 'meme' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        squad: 'creators',
        points: 50,
        completed: false
      },
      {
        id: 'creators-content-1',
        title: 'Draft Lesson Summary',
        description: 'Create a visual summary of any completed lesson. Include key points, diagrams, and actionable takeaways.',
        type: 'content' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        squad: 'creators',
        points: 75,
        completed: false
      }
    ],
    decoders: [
      {
        id: 'decoders-research-1',
        title: 'Market Analysis Report',
        description: 'Research and document 3 current market trends. Include data sources, analysis, and potential implications.',
        type: 'research' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        squad: 'decoders',
        points: 100,
        completed: false
      },
      {
        id: 'decoders-summary-1',
        title: 'Technical Analysis Cheat Sheet',
        description: 'Create a comprehensive cheat sheet for technical analysis concepts covered in your track.',
        type: 'summary' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        squad: 'decoders',
        points: 75,
        completed: false
      }
    ],
    speakers: [
      {
        id: 'speakers-onboarding-1',
        title: 'Host Community Check-in',
        description: 'Host or co-host a 15-minute community check-in. Focus on welcoming new members and sharing insights.',
        type: 'onboarding' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        squad: 'speakers',
        points: 75,
        completed: false
      },
      {
        id: 'speakers-content-1',
        title: 'Create Squad Newsletter',
        description: 'Draft a weekly newsletter for your squad highlighting achievements, upcoming events, and key learnings.',
        type: 'content' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        squad: 'speakers',
        points: 50,
        completed: false
      }
    ],
    raiders: [
      {
        id: 'raiders-research-1',
        title: 'Meta Trend Analysis',
        description: 'Identify and document 2 emerging meta trends. Include entry/exit strategies and risk assessment.',
        type: 'research' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        squad: 'raiders',
        points: 100,
        completed: false
      },
      {
        id: 'raiders-summary-1',
        title: 'Trading Psychology Notes',
        description: 'Document key psychological principles from your NFT trading psychology course with real examples.',
        type: 'summary' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        squad: 'raiders',
        points: 75,
        completed: false
      }
    ],
    rangers: [
      {
        id: 'rangers-content-1',
        title: 'Cross-Squad Collaboration',
        description: 'Work with members from 2 different squads on a joint project or knowledge sharing session.',
        type: 'content' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        squad: 'rangers',
        points: 100,
        completed: false
      },
      {
        id: 'rangers-summary-1',
        title: 'Multi-Track Summary',
        description: 'Create a summary connecting concepts from at least 2 different course tracks.',
        type: 'summary' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        squad: 'rangers',
        points: 75,
        completed: false
      }
    ]
  };
  
  return squadAssignments[userSquad as keyof typeof squadAssignments] || [];
};

const getSquadActivity = (): SquadActivity[] => {
  return [
    {
      squad: 'creators',
      icon: '🎨',
      color: 'text-yellow-400',
      activities: ['2 memes dropped', '1 lesson summary created', '3 pixel art pieces shared'],
      memberCount: 24,
      activeThisWeek: 8
    },
    {
      squad: 'decoders',
      icon: '🧠',
      color: 'text-gray-300',
      activities: ['1 cheat sheet in progress', '2 market analyses completed', '1 alpha thread started'],
      memberCount: 31,
      activeThisWeek: 12
    },
    {
      squad: 'speakers',
      icon: '🎤',
      color: 'text-red-400',
      activities: ['1 Space hosted', '2 community check-ins', '1 newsletter drafted'],
      memberCount: 18,
      activeThisWeek: 6
    },
    {
      squad: 'raiders',
      icon: '⚔️',
      color: 'text-blue-400',
      activities: ['3 meta analyses shared', '1 raid coordinated', '2 trading strategies posted'],
      memberCount: 27,
      activeThisWeek: 9
    },
    {
      squad: 'rangers',
      icon: '🦅',
      color: 'text-purple-400',
      activities: ['2 cross-squad collaborations', '1 multi-track summary', '3 knowledge shares'],
      memberCount: 15,
      activeThisWeek: 5
    }
  ];
};

const getSquadIcon = (squadId: string) => {
  switch (squadId) {
    case 'creators': return <Palette className="w-5 h-5" />;
    case 'decoders': return <Brain className="w-5 h-5" />;
    case 'speakers': return <Mic className="w-5 h-5" />;
    case 'raiders': return <Target className="w-5 h-5" />;
    case 'rangers': return <Award className="w-5 h-5" />;
    default: return <Users className="w-5 h-5" />;
  }
};

const getAssignmentIcon = (type: string) => {
  switch (type) {
    case 'meme': return <Sparkles className="w-4 h-4" />;
    case 'summary': return <FileText className="w-4 h-4" />;
    case 'onboarding': return <Users className="w-4 h-4" />;
    case 'content': return <BookOpen className="w-4 h-4" />;
    case 'research': return <Brain className="w-4 h-4" />;
    default: return <CheckCircle className="w-4 h-4" />;
  }
};

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [overallProgress, setOverallProgress] = useState(0);
  const [showProfileSuggestion, setShowProfileSuggestion] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [realTodos, setRealTodos] = useState<TodoItem[]>([]);
  const [realAnnouncements, setRealAnnouncements] = useState<Announcement[]>([]);
  const [realUpcomingClasses, setRealUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [profileImage, setProfileImage] = useState<string>("🧑‍🎓");
  const [squadId, setSquadId] = useState<string | null>(null);
  const [completedCoursesCount, setCompletedCoursesCount] = useState(0);
  const [totalCoursesCount, setTotalCoursesCount] = useState(6);
  const [weeklyAssignments, setWeeklyAssignments] = useState<WeeklyAssignment[]>([]);
  const [squadActivity, setSquadActivity] = useState<SquadActivity[]>([]);
  const [userSquadInfo, setUserSquadInfo] = useState<SquadTrack | null>(null);
  const [claimedRewards, setClaimedRewards] = useState<any[]>([]);
  
  // XP System
  const { totalXP, completedCourses, streak, completeCourse, badges } = useUserXP();

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    // Check for profile suggestions and onboarding status
    const suggestDisplayName = typeof window !== 'undefined' ? localStorage.getItem('suggestDisplayName') : null;
    const onboardingCompleted = typeof window !== 'undefined' ? localStorage.getItem('onboardingCompleted') : null;
    const placementTestCompleted = typeof window !== 'undefined' ? localStorage.getItem('placementTestCompleted') : null;
    
    setShowProfileSuggestion(suggestDisplayName === 'true');
    setHasCompletedOnboarding(onboardingCompleted === 'true');
    
    // Clear the suggestion flag if user has set a display name
    const displayName = typeof window !== 'undefined' ? localStorage.getItem('userDisplayName') : null;
    if (displayName && suggestDisplayName === 'true' && typeof window !== 'undefined') {
      localStorage.removeItem('suggestDisplayName');
      setShowProfileSuggestion(false);
    }

    // Get wallet address and load real data
    const storedWallet = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null;
    if (storedWallet) {
      setWalletAddress(storedWallet);
      setRealTodos(getRealTodos(storedWallet));
      
      // Debug announcements
      console.log('Dashboard: Loading announcements...');
      const announcements = getActiveAnnouncements();
      console.log('Dashboard: Active announcements:', announcements);
      setRealAnnouncements(announcements);
      
      setRealUpcomingClasses(getRealUpcomingClasses());
    }

    // Get squad ID for bulletin board and assignments
    const squadResult = typeof window !== 'undefined' ? localStorage.getItem('userSquad') : null;
    if (squadResult) {
      try {
        const result = JSON.parse(squadResult);
        let userSquadName: string;
        
        // Handle both object and string formats
        if (typeof result === 'object' && result.name) {
          userSquadName = result.name;
        } else if (typeof result === 'string') {
          userSquadName = result;
        } else {
          throw new Error('Invalid squad result format');
        }
        
        // Normalize squad name to get squad ID
        const normalized = userSquadName.replace(/^[🎨🧠🎤⚔️🦅🏦]+\s*/, '').toLowerCase().trim();
        const squadMapping: { [key: string]: string } = {
          'hoodie creators': 'creators',
          'hoodie decoders': 'decoders', 
          'hoodie speakers': 'speakers',
          'hoodie raiders': 'raiders',
          'hoodie rangers': 'rangers',
          'treasury builders': 'treasury'
        };
        const squadId = squadMapping[normalized] || normalized;
        setSquadId(squadId);
        
        // Set user squad info for display
        const squadInfo = squadTracks.find(s => s.id === squadId);
        setUserSquadInfo(squadInfo || null);
        
        // Load weekly assignments for this squad
        setWeeklyAssignments(getWeeklyAssignments(squadId));
      } catch (error) {
        console.error('Error parsing squad result:', error);
        setSquadId(null);
      }
    }

    // Load saved profile image
    const savedProfileImage = typeof window !== 'undefined' ? localStorage.getItem('userProfileImage') : null;
    if (savedProfileImage) {
      setProfileImage(savedProfileImage);
    }

    // Calculate completed courses count
    const completedCount = getCompletedCoursesCount();
    const totalCount = getTotalCoursesCount();
    setCompletedCoursesCount(completedCount);
    setTotalCoursesCount(totalCount);
    
    // Calculate overall progress based on completed courses
    const progressPercentage = Math.round((completedCount / totalCount) * 100);
    setOverallProgress(progressPercentage);
    
    console.log('Dashboard: Course completion stats:', {
      completed: completedCount,
      total: totalCount,
      percentage: progressPercentage
    });
    
            // Load squad activity
        setSquadActivity(getSquadActivity());

        // Load claimed retailstar rewards
        if (storedWallet) {
          // retailstarIncentiveService.fetchClaimedRewards(storedWallet).then(setClaimedRewards);
        }
      }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleAnnouncementsUpdate = () => {
      console.log('Dashboard: announcementsUpdated event received');
      const newAnnouncements = getActiveAnnouncements();
      console.log('Dashboard: new announcements:', newAnnouncements);
      console.log('Dashboard: Setting realAnnouncements state to:', newAnnouncements);
      setRealAnnouncements(newAnnouncements);
    };

    console.log('Dashboard: Setting up event listeners');
    window.addEventListener('announcementsUpdated', handleAnnouncementsUpdate);
    
    return () => {
      console.log('Dashboard: Cleaning up event listeners');
      window.removeEventListener('announcementsUpdated', handleAnnouncementsUpdate);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <CheckCircle className="w-4 h-4" />;
      case 'lesson': return <Play className="w-4 h-4" />;
      case 'assignment': return <BookOpen className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const completedTodos = realTodos.filter(todo => todo.completed).length;
  const totalTodos = realTodos.length;

  return (
    <TokenGate>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Left Sidebar */}
        <DashboardSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-800/50 border-b border-cyan-500/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/30 shadow-lg">
                    {profileImage && profileImage !== '🧑‍🎓' ? (
                      <img 
                        src={profileImage} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-cyan-400 to-pink-400 flex items-center justify-center text-xl ${profileImage && profileImage !== '🧑‍🎓' ? 'hidden' : ''}`}>
                      🧑‍🎓
                    </div>
                  </div>
                  {profileImage && profileImage !== '🧑‍🎓' && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✨</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-cyan-400">Dashboard</h1>
                  <p className="text-gray-300">Welcome back, Hoodie Scholar!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Current Time</div>
                <div className="text-lg text-cyan-400 font-mono">{currentTime}</div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Profile Suggestions */}
            {showProfileSuggestion && (
              <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-orange-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-orange-400">Complete Your Profile</h3>
                        <p className="text-gray-300">You've completed the squad placement test! Set a display name to personalize your experience.</p>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Link href="/profile">
                        Set Display Name
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Welcome Message for New Users */}
            {hasCompletedOnboarding && !showProfileSuggestion && (
              <Card className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-400">Welcome to Hoodie Academy!</h3>
                      <p className="text-gray-300">Your profile setup is complete. Start exploring courses and join your squad community!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* XP Progress & Stats */}
            <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>XP Progress & Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total XP */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{totalXP}</div>
                    <div className="text-sm text-gray-400">Total XP</div>
                  </div>
                  
                  {/* Courses Completed */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">{completedCourses.length}</div>
                    <div className="text-sm text-gray-400">Courses Completed</div>
                  </div>
                  
                  {/* Streak */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400 mb-2">{streak}</div>
                    <div className="text-sm text-gray-400">Day Streak</div>
                  </div>
                </div>
                
                {/* XP Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Level Progress</span>
                    <span>{totalXP} / 1000 XP</span>
                  </div>
                  <Progress value={(totalXP % 1000) / 10} className="h-3" />
                  <div className="text-xs text-gray-500 mt-1">
                    Level {Math.floor(totalXP / 1000) + 1} • {totalXP % 1000} XP to next level
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges Section */}
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Achievements & Badges</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`text-center p-4 rounded-lg border-2 transition-all duration-300 ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border-yellow-400/50 shadow-lg'
                          : 'bg-gray-800/50 border-gray-600/30 opacity-50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <div className={`text-sm font-semibold ${
                        badge.unlocked ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {badge.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {badge.description}
                      </div>
                      {badge.unlocked && (
                        <div className="text-xs text-green-400 mt-2">✓ Unlocked</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Course Progress Section */}
            <Card className="bg-slate-800/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Course Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedCourses.map((courseSlug) => {
                    const progress = 100; // Completed courses
                    return (
                      <div key={courseSlug} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-200 capitalize">
                            {courseSlug.replace(/-/g, ' ')}
                          </div>
                          <div className="text-xs text-gray-400">Completed</div>
                        </div>
                        <div className="text-sm text-green-400 font-semibold">100%</div>
                      </div>
                    );
                  })}
                  {completedCourses.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No courses completed yet.</p>
                      <p className="text-sm">Start your learning journey!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Squad Affiliation & Track Progress */}
            {userSquadInfo && (
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center space-x-2">
                    {getSquadIcon(userSquadInfo.id)}
                    <span>Squad Affiliation & Track Progress</span>
                    <Badge variant="outline" className={`ml-auto ${userSquadInfo.color} border-current`}>
                      {userSquadInfo.name}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Squad Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${userSquadInfo.bgColor} border ${userSquadInfo.borderColor} flex items-center justify-center text-2xl`}>
                          {userSquadInfo.icon}
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold ${userSquadInfo.color}`}>
                            {userSquadInfo.name}
                          </h3>
                          <p className="text-sm text-gray-300">{userSquadInfo.description}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Current Level</span>
                          <span className="text-cyan-400 font-semibold">Level 100</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Track Progress</span>
                          <span className="text-cyan-400 font-semibold">{overallProgress}%</span>
                        </div>
                        <Progress value={overallProgress} className="h-2 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-purple-500" />
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Track Statistics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                          <div className="text-2xl font-bold text-cyan-400">{completedCoursesCount}</div>
                          <div className="text-xs text-gray-400">Courses Completed</div>
                        </div>
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                          <div className="text-2xl font-bold text-green-400">15</div>
                          <div className="text-xs text-gray-400">Lessons Finished</div>
                        </div>
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-400">8</div>
                          <div className="text-xs text-gray-400">Quizzes Passed</div>
                        </div>
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                          <div className="text-2xl font-bold text-pink-400">5</div>
                          <div className="text-xs text-gray-400">NFT Badges</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Assignments */}
            {weeklyAssignments.length > 0 && (
              <Card className="bg-slate-800/50 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Weekly Assignments</span>
                    <Badge variant="outline" className="ml-auto border-green-500 text-green-400">
                      {weeklyAssignments.length} Active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {weeklyAssignments.map((assignment) => (
                      <div key={assignment.id} className={`p-4 rounded-lg border transition-all duration-200 ${
                        assignment.completed 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-slate-700/30 border-slate-600/30 hover:border-green-500/30'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded ${
                              assignment.completed ? 'bg-green-500/20' : 'bg-slate-600/20'
                            }`}>
                              {getAssignmentIcon(assignment.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className={`font-semibold ${
                                  assignment.completed ? 'text-green-400 line-through' : 'text-white'
                                }`}>
                                  {assignment.title}
                                </h4>
                                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                                  {assignment.points} pts
                                </Badge>
                              </div>
                              <p className={`text-sm ${
                                assignment.completed ? 'text-green-300' : 'text-gray-300'
                              }`}>
                                {assignment.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                <span>Type: {assignment.type}</span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant={assignment.completed ? "outline" : "default"}
                            className={assignment.completed ? "border-green-500 text-green-400" : "bg-green-600 hover:bg-green-700"}
                          >
                            {assignment.completed ? 'Completed' : 'Submit Work'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Global Announcements */}
            <Card className="bg-slate-800/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Global Announcements</span>
                  {squadId && (
                    <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                      {squadId}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GlobalBulletinBoard squadId={squadId} />
              </CardContent>
            </Card>

            {/* Retailstar Rewards - Temporarily Disabled */}
            {/* <Card className="bg-slate-800/50 border-indigo-500/30">
              <CardHeader>
                <CardTitle className="text-indigo-400 flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Retailstar Rewards</span>
                  <Badge variant="outline" className="ml-auto border-indigo-500 text-indigo-400">
                    {claimedRewards.length} Claimed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {claimedRewards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {claimedRewards.slice(0, 6).map((userReward) => {
                      const reward = retailstarIncentiveService.getRewardById(userReward.reward_id);
                      if (!reward) return null;
                      
                      return (
                        <RetailstarRewardCard
                          key={userReward.id}
                          reward={reward}
                          isAwarded={true}
                          userSquad={squadId || undefined}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No rewards claimed yet</p>
                    <p className="text-xs text-gray-500 mt-1">Complete tasks to earn rewards!</p>
                    <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                      <Link href="/retailstar-incentives">
                        View Available Rewards
                      </Link>
                    </Button>
                  </div>
                )}
                {claimedRewards.length > 6 && (
                  <div className="text-center mt-4">
                    <Button asChild variant="outline" className="border-indigo-500 text-indigo-400">
                      <Link href="/retailstar-incentives">
                        View All Rewards ({claimedRewards.length})
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card> */}

            {/* Squad Activity Summary */}
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Squad Activity Summary</span>
                  <Badge variant="outline" className="ml-auto border-purple-500 text-purple-400">
                    This Week
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {squadActivity.map((squad) => (
                    <div key={squad.squad} className={`p-4 rounded-lg border transition-all duration-200 ${
                      squad.squad === squadId 
                        ? 'bg-purple-500/10 border-purple-500/30' 
                        : 'bg-slate-700/30 border-slate-600/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{squad.icon}</div>
                          <div>
                            <h4 className={`font-semibold capitalize ${squad.color}`}>
                              {squad.squad} Squad
                            </h4>
                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                              <span>{squad.memberCount} members</span>
                              <span>{squad.activeThisWeek} active this week</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300 mb-1">Recent Activity:</div>
                          <ul className="text-xs text-gray-400 space-y-1">
                            {squad.activities.slice(0, 2).map((activity, index) => (
                              <li key={index} className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>
                                {activity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* To-Do List */}
            <Card className="bg-slate-800/50 border-green-500/30">
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
                {realTodos.length > 0 ? (
                  realTodos.map((todo) => (
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
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No pending tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scheduled Announcements */}
            {getScheduledAnnouncements().length > 0 && (
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Upcoming Announcements</span>
                    <Badge variant="outline" className="ml-auto border-cyan-500 text-cyan-400">
                      {getScheduledAnnouncements().length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>
            )}
          </main>
        </div>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </TokenGate>
  );
} 