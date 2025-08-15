'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
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
  AlertCircle
} from 'lucide-react';
import TokenGate from '@/components/TokenGate';
import Link from 'next/link';
import { getActiveAnnouncements, Announcement, getScheduledAnnouncements, getCompletedCoursesCount, getTotalCoursesCount } from '@/lib/utils';
import GlobalBulletinBoard from '@/components/GlobalBulletinBoard';

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
  const [userDisplayName, setUserDisplayName] = useState<string>("Hoodie Scholar");

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

    // Get squad ID for bulletin board
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

    // Load user display name
    const savedDisplayName = typeof window !== 'undefined' ? localStorage.getItem('userDisplayName') : null;
    if (savedDisplayName) {
      setUserDisplayName(savedDisplayName);
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
      <div className="flex min-h-screen relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: "url('/images/Hoodie Dashbaord.png')",
          }}
        />
        
        {/* Background Overlay - Enhanced for Hoodie dashboard theme */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900/75 via-purple-900/65 to-slate-900/75" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_60%_at_50%_20%,rgba(139,92,246,0.18),transparent)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_80%_at_20%_80%,rgba(6,182,212,0.12),transparent)]" />
        
        {/* Sidebar */}
        <DashboardSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-800/40 backdrop-blur-md border-b border-cyan-500/40 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/50 shadow-lg backdrop-blur-sm">
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
                  <h1 className="text-3xl font-bold text-cyan-400 drop-shadow-lg">Dashboard</h1>
                  <p className="text-gray-200">Welcome back, {userDisplayName}!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-300">Current Time</div>
                <div className="text-lg text-cyan-400 font-mono drop-shadow">{currentTime}</div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Profile Suggestions */}
            {showProfileSuggestion && (
              <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-orange-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-orange-400">Complete Your Profile</h3>
                        <p className="text-gray-200">You've completed the squad placement test! Set a display name to personalize your experience.</p>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="bg-orange-600 hover:bg-orange-700 shadow-lg"
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
              <Card className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 border-green-500/40 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-400">Welcome to Hoodie Academy!</h3>
                      <p className="text-gray-200">Your profile setup is complete. Start exploring courses and join your squad community!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* To-Do List */}
            <Card className="bg-slate-800/40 backdrop-blur-md border-green-500/40 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>To-Do List</span>
                  <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-400 border-green-500/40">
                    {completedTodos}/{totalTodos}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {realTodos.length > 0 ? (
                  realTodos.map((todo) => (
                    <div key={todo.id} className={`p-3 rounded-lg border transition-all duration-200 backdrop-blur-sm ${
                      todo.completed 
                        ? 'bg-green-500/15 border-green-500/40' 
                        : 'bg-slate-700/40 border-slate-600/40 hover:border-green-500/40 hover:bg-slate-700/50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-1 rounded ${
                          todo.completed ? 'bg-green-500/25' : 'bg-slate-600/25'
                        }`}>
                          {getTypeIcon(todo.type)}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${
                            todo.completed ? 'text-green-400 line-through' : 'text-white'
                          }`}>
                            {todo.title}
                          </p>
                          <p className="text-sm text-gray-300">{todo.course}</p>
                          {todo.dueDate && (
                            <p className="text-xs text-yellow-400">Due: {todo.dueDate}</p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant={todo.completed ? "outline" : "default"}
                          className={todo.completed ? "border-green-500 text-green-400 backdrop-blur-sm" : "bg-green-600 hover:bg-green-700 shadow-lg"}
                        >
                          {todo.completed ? 'Done' : 'Complete'}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-300 text-sm">No pending tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Global Bulletin Board */}
            <Card className="bg-slate-800/40 backdrop-blur-md border-blue-500/40 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Global Bulletin Board</span>
                  {squadId && (
                    <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400 bg-cyan-500/20">
                      {squadId}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GlobalBulletinBoard squadId={squadId} />
              </CardContent>
            </Card>

            {/* Scheduled Announcements */}
            {getScheduledAnnouncements().length > 0 && (
              <Card className="bg-slate-800/40 backdrop-blur-md border-cyan-500/40 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Upcoming Announcements</span>
                    <Badge variant="outline" className="ml-auto border-cyan-500 text-cyan-400 bg-cyan-500/20">
                      {getScheduledAnnouncements().length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getScheduledAnnouncements().map((announcement) => (
                    <div key={announcement.id} className="p-3 bg-slate-700/40 rounded-lg border border-cyan-500/40 backdrop-blur-sm hover:bg-slate-700/50 transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded ${getPriorityColor(announcement.priority)}`}>
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{announcement.title}</h4>
                          <p className="text-sm text-gray-200 mt-1">{announcement.content}</p>
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
      </div>
    </TokenGate>
  );
} 