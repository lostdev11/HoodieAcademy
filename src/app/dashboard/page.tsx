'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  BookOpen, 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  Star, 
  Award,
  Calendar,
  MessageCircle,
  Bell,
  CheckCircle,
  Play,
  Zap,
  Home,
  BarChart3,
  User,
  Settings,
  Video,
  MessageSquare,
  Heart,
  Sparkles,
  Crown,
  Medal,
  Gem,
  Fire,
  Lightning,
  Shield,
  Sword,
  Bow,
  Wand,
  Hammer,
  Anvil,
  Scroll,
  Book,
  GraduationCap,
  Brain,
  Eye,
  Ear,
  Hand,
  Foot,
  Heart as HeartIcon,
  Star as StarIcon,
  Zap as ZapIcon,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  MessageCircle as MessageCircleIcon,
  Bell as BellIcon,
  CheckCircle as CheckCircleIcon,
  Play as PlayIcon,
  Zap as ZapIcon2,
  Home as HomeIcon,
  BarChart3 as BarChart3Icon,
  User as UserIcon,
  Settings as SettingsIcon,
  Video as VideoIcon,
  MessageSquare as MessageSquareIcon,
  Heart as HeartIcon2,
  Sparkles as SparklesIcon,
  Crown as CrownIcon,
  Medal as MedalIcon,
  Gem as GemIcon,
  Fire as FireIcon,
  Lightning as LightningIcon,
  Shield as ShieldIcon,
  Sword as SwordIcon,
  Bow as BowIcon,
  Wand as WandIcon,
  Hammer as HammerIcon,
  Anvil as AnvilIcon,
  Scroll as ScrollIcon,
  Book as BookIcon,
  GraduationCap as GraduationCapIcon,
  Brain as BrainIcon,
  Eye as EyeIcon,
  Ear as EarIcon,
  Hand as HandIcon,
  Foot as FootIcon
} from "lucide-react";
import TokenGate from "@/components/TokenGate";
import { useUserXP } from "@/components/xp";
import { squadTracks } from "@/lib/squadData";

import { getDisplayNameWithSNS } from "@/services/sns-resolver";
import PageLayout from "@/components/layouts/PageLayout";
import { CardFeedLayout, CardFeedItem, CardFeedSection, CardFeedGrid, InfoCard, ActionCard } from "@/components/layouts/CardFeedLayout";
import { dashboardNavigation } from "@/components/layouts/NavigationDrawer";

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

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  timestamp: string;
  squad?: string;
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

const getSquadActivity = (userSquad: string | null): SquadActivity[] => {
  if (!userSquad) return [];

  const activities: SquadActivity[] = [];

  switch (userSquad) {
    case 'creators':
      activities.push({
        squad: 'creators',
        icon: '🎨',
        color: 'text-yellow-400',
        activities: ['2 memes dropped', '1 lesson summary created', '3 pixel art pieces shared'],
        memberCount: 24,
        activeThisWeek: 8
      });
      break;
    case 'decoders':
      activities.push({
        squad: 'decoders',
        icon: '🧠',
        color: 'text-gray-300',
        activities: ['1 cheat sheet in progress', '2 market analyses completed', '1 alpha thread started'],
        memberCount: 31,
        activeThisWeek: 12
      });
      break;
    case 'speakers':
      activities.push({
        squad: 'speakers',
        icon: '🎤',
        color: 'text-red-400',
        activities: ['1 Space hosted', '2 community check-ins', '1 newsletter drafted'],
        memberCount: 18,
        activeThisWeek: 6
      });
      break;
    case 'raiders':
      activities.push({
        squad: 'raiders',
        icon: '⚔️',
        color: 'text-blue-400',
        activities: ['3 meta analyses shared', '1 raid coordinated', '2 trading strategies posted'],
        memberCount: 27,
        activeThisWeek: 9
      });
      break;
    case 'rangers':
      activities.push({
        squad: 'rangers',
        icon: '🦅',
        color: 'text-purple-400',
        activities: ['2 cross-squad collaborations', '1 multi-track summary', '3 knowledge shares'],
        memberCount: 15,
        activeThisWeek: 5
      });
      break;
    default:
      break;
  }

  return activities;
};

// Add missing function definitions
const getActiveAnnouncements = (): Announcement[] => {
  // For now, return empty array - announcements would come from backend
  return [];
};

const getClaimedRewards = (): any[] => {
  // For now, return empty array - claimed rewards would come from backend
  return [];
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
  const [userDisplayName, setUserDisplayName] = useState<string>("");
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

      // Load user display name and SNS domain
      const displayName = localStorage.getItem('userDisplayName');
      if (displayName) {
        setUserDisplayName(displayName);
      } else {
        // Try to resolve SNS domain if no display name is set
        const resolveSnsDomain = async () => {
          try {
            const { getDisplayNameWithSNS } = await import('@/services/sns-resolver');
            const resolvedName = await getDisplayNameWithSNS(storedWallet);
            console.log('Dashboard: Resolved SNS name:', resolvedName);
            setUserDisplayName(resolvedName);
          } catch (error) {
            console.error('Dashboard: Error resolving SNS domain:', error);
            // Fallback to formatted wallet address
            setUserDisplayName(`${storedWallet.slice(0, 6)}...${storedWallet.slice(-4)}`);
          }
        };
        
        resolveSnsDomain();
      }
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
        
        // Find squad info for display
        const squadInfo = squadTracks.find(s => s.id === squadId);
        if (squadInfo) {
          setUserSquadInfo(squadInfo);
        }
        
        // Load squad-specific data
        setWeeklyAssignments(getWeeklyAssignments(squadId));
        setSquadActivity(getSquadActivity(squadId));
        
      } catch (error) {
        console.error('Dashboard: Error parsing squad data:', error);
        setSquadId(null);
      }
    }

    // Load other data
    setClaimedRewards(getClaimedRewards());
    
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
      <PageLayout
        title="🎯 Academy Dashboard"
        subtitle="Track your progress, manage tasks, and stay connected with your squad"
        showHomeButton={true}
        showBackButton={false}
        backgroundImage={undefined}
        backgroundOverlay={false}
        navigationSections={dashboardNavigation}
        navigationDrawerTitle="Dashboard Navigation"
        navigationDrawerSubtitle="Quick access to dashboard features"
      >
        {/* Current Time Display */}
        <CardFeedItem
          title="Current Time"
          subtitle="Real-time clock for your learning sessions"
          badge={currentTime}
          badgeVariant="outline"
        >
          <div className="text-center">
            <div className="text-3xl font-mono text-cyan-400 mb-2">
              {currentTime}
            </div>
            <p className="text-sm text-gray-400">
              Keep track of your study time and maintain consistent learning habits
            </p>
          </div>
        </CardFeedItem>

        {/* Profile Section */}
        <CardFeedSection
          title="Your Profile"
          subtitle="Manage your identity and track your progress"
        >
          <CardFeedGrid cols={2}>
            <InfoCard
              title="Profile Information"
              icon={<User className="w-5 h-5" />}
              variant="default"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profileImage} />
                  <AvatarFallback className="text-2xl">{profileImage}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {userDisplayName || "Hoodie Scholar"}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Wallet not connected"}
                  </p>
                  {userSquadInfo && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl">{userSquadInfo.icon}</span>
                      <span className="text-cyan-400 text-sm">{userSquadInfo.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </InfoCard>

            <InfoCard
              title="Learning Progress"
              icon={<TrendingUp className="w-5 h-5" />}
              variant="success"
            >
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Overall Progress</span>
                    <span className="text-cyan-400">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-slate-700/30 rounded">
                    <div className="text-cyan-400 font-semibold">{completedCoursesCount}</div>
                    <div className="text-gray-400 text-xs">Completed</div>
                  </div>
                  <div className="text-center p-2 bg-slate-700/30 rounded">
                    <div className="text-purple-400 font-semibold">{totalCoursesCount}</div>
                    <div className="text-gray-400 text-xs">Total</div>
                  </div>
                </div>
              </div>
            </InfoCard>
          </CardFeedGrid>
        </CardFeedSection>

        {/* XP and Achievements */}
        <CardFeedSection
          title="Experience & Achievements"
          subtitle="Track your growth and unlock rewards"
        >
          <CardFeedGrid cols={3}>
            <InfoCard
              title="Total XP"
              icon={<Star className="w-5 h-5" />}
              variant="default"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {totalXP.toLocaleString()}
                </div>
                <p className="text-sm text-gray-400">Experience Points</p>
              </div>
            </InfoCard>

            <InfoCard
              title="Learning Streak"
              icon={<Fire className="w-5 h-5" />}
              variant="warning"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {streak}
                </div>
                <p className="text-sm text-gray-400">Days in a Row</p>
              </div>
            </InfoCard>

            <InfoCard
              title="Badges Earned"
              icon={<Award className="w-5 h-5" />}
              variant="success"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {badges.length}
                </div>
                <p className="text-sm text-gray-400">Achievements</p>
              </div>
            </InfoCard>
          </CardFeedGrid>
        </CardFeedSection>

        {/* Quick Actions */}
        <ActionCard
          title="Quick Actions"
          subtitle="Jump into your next learning activity"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-slate-700/30 hover:bg-slate-600/30">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <span className="text-sm">Continue Course</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-slate-700/30 hover:bg-slate-600/30">
              <Target className="w-6 h-6 text-purple-400" />
              <span className="text-sm">Take Quiz</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-slate-700/30 hover:bg-slate-600/30">
              <Users className="w-6 h-6 text-pink-400" />
              <span className="text-sm">Squad Chat</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-slate-700/30 hover:bg-slate-600/30">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span className="text-sm">Leaderboard</span>
            </Button>
          </div>
        </ActionCard>

        {/* Tasks and Announcements */}
        <CardFeedSection
          title="Tasks & Updates"
          subtitle="Stay on top of your assignments and announcements"
        >
          <CardFeedGrid cols={2}>
            <InfoCard
              title="Your Tasks"
              icon={<CheckCircle className="w-5 h-5" />}
              variant="default"
            >
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Progress</span>
                  <span className="text-cyan-400">{completedTodos}/{totalTodos}</span>
                </div>
                <Progress value={(completedTodos / totalTodos) * 100} className="h-2" />
                {realTodos.slice(0, 3).map((todo, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${todo.completed ? 'text-green-400' : 'text-gray-500'}`} />
                    <span className={todo.completed ? 'text-gray-400 line-through' : 'text-white'}>
                      {todo.title}
                    </span>
                  </div>
                ))}
              </div>
            </InfoCard>

            <InfoCard
              title="Recent Announcements"
              icon={<Bell className="w-5 h-5" />}
              variant="default"
            >
              <div className="space-y-2">
                {realAnnouncements.slice(0, 3).map((announcement, index) => (
                  <div key={index} className="p-2 bg-slate-700/30 rounded text-sm">
                    <div className="font-semibold text-white">{announcement.title}</div>
                    <div className="text-gray-400 text-xs">{announcement.content}</div>
                  </div>
                ))}
              </div>
            </InfoCard>
          </CardFeedGrid>
        </CardFeedSection>

        {/* Squad Activity */}
        {userSquadInfo && (
          <CardFeedSection
            title="Squad Activity"
            subtitle={`What's happening in ${userSquadInfo.name}`}
          >
            <CardFeedGrid cols={2}>
              <InfoCard
                title="Weekly Assignments"
                icon={<Calendar className="w-5 h-5" />}
                variant="default"
              >
                <div className="space-y-2">
                  {weeklyAssignments.slice(0, 3).map((assignment, index) => (
                    <div key={index} className="p-2 bg-slate-700/30 rounded text-sm">
                      <div className="font-semibold text-white">{assignment.title}</div>
                      <div className="text-gray-400 text-xs">Due: {assignment.dueDate}</div>
                    </div>
                  ))}
                </div>
              </InfoCard>

              <InfoCard
                title="Recent Squad Activity"
                icon={<MessageCircle className="w-5 h-5" />}
                variant="default"
              >
                <div className="space-y-2">
                  {squadActivity.slice(0, 3).map((activity, index) => (
                    <div key={index} className="p-2 bg-slate-700/30 rounded text-sm">
                      <div className="font-semibold text-white">{activity.user}</div>
                      <div className="text-gray-400 text-xs">{activity.action}</div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </CardFeedGrid>
          </CardFeedSection>
        )}

        {/* Upcoming Classes */}
        {realUpcomingClasses.length > 0 && (
          <CardFeedSection
            title="Upcoming Classes"
            subtitle="Don't miss these scheduled learning sessions"
          >
            <CardFeedGrid cols={3}>
              {realUpcomingClasses.slice(0, 3).map((classItem, index) => (
                <InfoCard
                  key={index}
                  title={classItem.title}
                  icon={<Clock className="w-5 h-5" />}
                  variant="default"
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white mb-2">
                      {classItem.title}
                    </div>
                    <div className="text-sm text-gray-400">
                      {classItem.date} at {classItem.time}
                    </div>
                    <div className="text-xs text-cyan-400 mt-2">
                      {classItem.instructor}
                    </div>
                  </div>
                </InfoCard>
              ))}
            </CardFeedGrid>
          </CardFeedSection>
        )}
      </PageLayout>
    </TokenGate>
  );
} 