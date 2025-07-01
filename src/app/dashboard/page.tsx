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

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [overallProgress, setOverallProgress] = useState(65);

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
  );
} 