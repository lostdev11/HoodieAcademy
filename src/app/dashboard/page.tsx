'use client';

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
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Video,
  AlertCircle
} from 'lucide-react';
import TokenGate from '@/components/TokenGate';
import Link from 'next/link';
import CalendarComponent from '@/components/Calendar';
import { getActiveAnnouncements, Announcement } from '@/lib/utils';

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
  const [overallProgress, setOverallProgress] = useState(65);
  const [showProfileSuggestion, setShowProfileSuggestion] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [realTodos, setRealTodos] = useState<TodoItem[]>([]);
  const [realAnnouncements, setRealAnnouncements] = useState<Announcement[]>([]);
  const [realUpcomingClasses, setRealUpcomingClasses] = useState<UpcomingClass[]>([]);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    // Check for profile suggestions and onboarding status
    const suggestDisplayName = localStorage.getItem('suggestDisplayName');
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    const placementTestCompleted = localStorage.getItem('placementTestCompleted');
    
    setShowProfileSuggestion(suggestDisplayName === 'true');
    setHasCompletedOnboarding(onboardingCompleted === 'true');
    
    // Clear the suggestion flag if user has set a display name
    const displayName = localStorage.getItem('userDisplayName');
    if (displayName && suggestDisplayName === 'true') {
      localStorage.removeItem('suggestDisplayName');
      setShowProfileSuggestion(false);
    }

    // Get wallet address and load real data
    const storedWallet = localStorage.getItem('walletAddress');
    if (storedWallet) {
      setWalletAddress(storedWallet);
      setRealTodos(getRealTodos(storedWallet));
      setRealAnnouncements(getActiveAnnouncements());
      setRealUpcomingClasses(getRealUpcomingClasses());
    }
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleAnnouncementsUpdate = () => {
      setRealAnnouncements(getActiveAnnouncements());
    };

    window.addEventListener('announcementsUpdated', handleAnnouncementsUpdate);
    
    return () => {
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
              <div>
                <h1 className="text-3xl font-bold text-cyan-400">Dashboard</h1>
                <p className="text-gray-300">Welcome back, Hoodie Scholar!</p>
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

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              <Card className="bg-slate-800/50 border-pink-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Video className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Hours Watched</p>
                      <p className="text-2xl font-bold text-pink-400">12.5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar & Events */}
              <div className="lg:col-span-1">
                <CalendarComponent />
              </div>

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

              {/* Announcements */}
              <Card className="bg-slate-800/50 border-pink-500/30 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-pink-400 flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Announcements</span>
                  </CardTitle>
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
  );
} 