'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Target, 
  Clock, 
  Award, 
  CheckCircle, 
  Play, 
  ChevronRight,
  Calendar,
  Users,
  Trophy,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { MiniBountyPanel } from '@/components/bounty';

interface ActiveCourse {
  id: string;
  title: string;
  progress: number;
  nextLesson: string;
  dueDate?: string;
  squad: string;
}

interface ActiveBounty {
  id: string;
  title: string;
  reward: string;
  deadline: string;
  squadTag?: string;
  submissions: number;
}

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className = '' }: RightSidebarProps) {
  const [activeCourses, setActiveCourses] = useState<ActiveCourse[]>([]);
  const [activeBounties, setActiveBounties] = useState<ActiveBounty[]>([]);
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    // Get wallet address from localStorage
    const storedWallet = localStorage.getItem('walletAddress');
    if (storedWallet) {
      setWalletAddress(storedWallet);
    }

    // Load active courses from user progress
    const loadActiveCourses = () => {
      const userProgress = localStorage.getItem('userProgress');
      if (userProgress && storedWallet) {
        try {
          const progress = JSON.parse(userProgress);
          const userData = progress[storedWallet];
          
          if (userData && userData.courses) {
            const courses: ActiveCourse[] = [];
            
            Object.entries(userData.courses).forEach(([courseId, courseData]: [string, any]) => {
              if (courseData.progress && courseData.progress.some((p: string) => p === 'unlocked')) {
                const completedLessons = courseData.progress.filter((p: string) => p === 'completed').length;
                const totalLessons = courseData.progress.length;
                const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
                
                // Find next unlocked lesson
                const nextLessonIndex = courseData.progress.findIndex((p: string) => p === 'unlocked');
                const nextLesson = nextLessonIndex >= 0 ? `Lesson ${nextLessonIndex + 1}` : 'Complete';
                
                courses.push({
                  id: courseId,
                  title: courseId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  progress: progressPercentage,
                  nextLesson,
                  squad: courseData.squad || 'General'
                });
              }
            });
            
            setActiveCourses(courses.slice(0, 3)); // Show top 3 active courses
          }
        } catch (error) {
          console.error('Error loading active courses:', error);
        }
      }
    };

    // Load active bounties
    const loadActiveBounties = () => {
      // Sample active bounties - in real app this would come from API
      const bounties: ActiveBounty[] = [
        {
          id: '1',
          title: 'Hoodie Academy Logo Redesign',
          reward: '2.5 SOL',
          deadline: '2024-02-15',
          squadTag: 'Creators',
          submissions: 12
        },
        {
          id: '2',
          title: 'Trading Psychology Meme Collection',
          reward: '1.8 SOL',
          deadline: '2024-02-20',
          squadTag: 'Creators',
          submissions: 8
        },
        {
          id: '7',
          title: '🎨 Create a Hoodie Visual',
          reward: '0.05 SOL (1st)',
          deadline: '2024-03-15',
          squadTag: 'Creators',
          submissions: 7
        }
      ];
      
      setActiveBounties(bounties);
    };

    loadActiveCourses();
    loadActiveBounties();
  }, []);

  const getSquadColor = (squad: string) => {
    switch (squad) {
      case 'Creators': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Decoders': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'Speakers': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Raiders': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className={`w-80 bg-slate-900/80 border-l border-cyan-500/30 backdrop-blur-sm p-4 space-y-6 ${className}`}>
      {/* Active Courses Section */}
      <Card className="border border-cyan-500/30 bg-slate-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-cyan-400 flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5" />
            Active Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeCourses.length > 0 ? (
            activeCourses.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-semibold text-sm">{course.title}</h4>
                  <Badge className={getSquadColor(course.squad)}>
                    {course.squad}
                  </Badge>
                </div>
                <Progress value={course.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{course.progress.toFixed(0)}% Complete</span>
                  <span>Next: {course.nextLesson}</span>
                </div>
                <Button 
                  asChild 
                  size="sm" 
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Link href={`/courses/${course.id}`}>
                    Continue Learning
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <BookOpen className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No active courses</p>
              <Button asChild size="sm" className="mt-2 bg-cyan-600 hover:bg-cyan-700">
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Bounties Section */}
      <Card className="border border-purple-500/30 bg-slate-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-400 flex items-center gap-2 text-lg">
            <Target className="w-5 h-5" />
            Active Bounties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeBounties.length > 0 ? (
            activeBounties.map((bounty) => (
              <div key={bounty.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="text-white font-semibold text-sm leading-tight">{bounty.title}</h4>
                  {bounty.squadTag && (
                    <Badge className={`${getSquadColor(bounty.squadTag)} text-xs`}>
                      {bounty.squadTag}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>{bounty.reward}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{bounty.submissions} submissions</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <Clock className="w-3 h-3" />
                  <span>Due: {new Date(bounty.deadline).toLocaleDateString()}</span>
                </div>
                <Button 
                  asChild 
                  size="sm" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Link href={`/bounties/${bounty.id}`}>
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Target className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No active bounties</p>
              <Button asChild size="sm" className="mt-2 bg-purple-600 hover:bg-purple-700">
                <Link href="/bounties">Browse Bounties</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-green-500/30 bg-slate-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild size="sm" variant="outline" className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10">
            <Link href="/courses">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
            <Link href="/bounties">
              <Target className="w-4 h-4 mr-2" />
              View Bounties
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
            <Link href="/leaderboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Leaderboard
            </Link>
          </Button>
        </CardContent>
      </Card>

             {/* Squad Wins Tracker */}
       <Card className="border border-green-500/30 bg-slate-800/50">
         <CardHeader className="pb-3">
           <CardTitle className="text-green-400 flex items-center gap-2 text-lg">
             <Trophy className="w-5 h-5" />
             Squad Wins
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           <div className="flex justify-between items-center">
             <span className="text-gray-300 text-sm">🎨 Creators</span>
             <span className="text-yellow-400 font-semibold">3 wins</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-gray-300 text-sm">🧠 Decoders</span>
             <span className="text-gray-400 font-semibold">2 wins</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-gray-300 text-sm">🎤 Speakers</span>
             <span className="text-red-400 font-semibold">1 win</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-gray-300 text-sm">⚔️ Raiders</span>
             <span className="text-blue-400 font-semibold">1 win</span>
           </div>
         </CardContent>
       </Card>

       {/* Weekly Stats */}
       <Card className="border border-blue-500/30 bg-slate-800/50">
         <CardHeader className="pb-3">
           <CardTitle className="text-blue-400 flex items-center gap-2 text-lg">
             <Calendar className="w-5 h-5" />
             This Week
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           <div className="flex justify-between items-center">
             <span className="text-gray-300 text-sm">Courses Started</span>
             <span className="text-blue-400 font-semibold">{activeCourses.length}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-gray-300 text-sm">Bounties Available</span>
             <span className="text-purple-400 font-semibold">{activeBounties.length}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-gray-300 text-sm">Days Left</span>
             <span className="text-green-400 font-semibold">
               {Math.ceil((new Date().getTime() - new Date().setDate(new Date().getDate() - 7)) / (1000 * 60 * 60 * 24))}
             </span>
           </div>
         </CardContent>
       </Card>
    </div>
  );
} 