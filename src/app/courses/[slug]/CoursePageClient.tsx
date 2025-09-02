"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  BookOpen, 
  Users, 
  Target,
  CheckCircle,
  Circle,
  Award,
  Clock
} from 'lucide-react';
import TokenGate from "@/components/TokenGate";
import { useUserXP } from '@/hooks/useUserXP';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import VideoPlayer from '@/components/VideoPlayer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

interface Lesson {
  id: string;
  title: string;
  content: string;
  video?: string;
  quiz?: any[];
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  badge: string;
  emoji: string;
  pathType: string;
  href: string;
  totalLessons: number;
  squad: string;
  category: string;
  level: string;
  access: string;
  modules: Module[];
}

interface CoursePageClientProps {
  course: Course;
}

export default function CoursePageClient({ course }: CoursePageClientProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { completeCourse } = useUserXP();

  // Debug logging
  useEffect(() => {
    console.log('CoursePageClient: Component mounted with course:', course);
    console.log('CoursePageClient: Course modules:', course?.modules);
    console.log('CoursePageClient: Supabase client:', supabase);
    
    // Validate course data immediately
    if (!course) {
      console.error('CoursePageClient: No course data provided');
      setError('No course data available');
      setIsInitialized(true);
      return;
    }
    
    if (!course.modules || !Array.isArray(course.modules)) {
      console.error('CoursePageClient: Invalid course structure - missing modules');
      setError('Course structure is invalid - missing modules');
      setIsInitialized(true);
      return;
    }
    
    if (course.modules.length === 0) {
      console.error('CoursePageClient: Course has no modules');
      setError('Course has no content modules');
      setIsInitialized(true);
      return;
    }
    
    // Validate each module has lessons
    for (let i = 0; i < course.modules.length; i++) {
      const module = course.modules[i];
      if (!module.lessons || !Array.isArray(module.lessons) || module.lessons.length === 0) {
        console.error(`CoursePageClient: Module ${i} has no lessons:`, module);
        setError(`Module "${module.title}" has no content`);
        setIsInitialized(true);
        return;
      }
    }
    
    console.log('CoursePageClient: Course validation passed');
    setIsInitialized(true);
    
    // Reset to first module/lesson if current indices are invalid
    if (activeModule >= course.modules.length) {
      setActiveModule(0);
    }
    
    const currentModule = course.modules[activeModule];
    if (currentModule && activeLesson >= currentModule.lessons.length) {
      setActiveLesson(0);
    }
  }, [course, activeModule, activeLesson]);

  useEffect(() => {
    let mounted = true;
    console.log('CoursePageClient: Loading course progress...');
    
    // Check if course has required data
    if (!course?.id) {
      console.error('CoursePageClient: Course has no ID, cannot load progress');
      setLoadingProgress(false);
      setError('Course data is incomplete - missing ID');
      return;
    }
    
    // Check if course has valid modules
    if (!course.modules || course.modules.length === 0) {
      console.error('CoursePageClient: Course has no modules, cannot load progress');
      setLoadingProgress(false);
      setError('Course has no content modules');
      return;
    }
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('CoursePageClient: Loading timeout reached, setting loading to false');
        setLoadingProgress(false);
        setError('Loading timeout - please refresh the page');
      }
    }, 10000); // 10 second timeout
    
    (async () => {
      try {
        setLoadingProgress(true);
        console.log('CoursePageClient: Getting user from Supabase...');
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('CoursePageClient: Error getting user:', userError);
        }
        
        if (!user) { 
          console.log('CoursePageClient: No user found, setting empty completed lessons');
          setCompletedLessons([]); 
          setLoadingProgress(false); 
          clearTimeout(timeoutId);
          return; 
        }

        console.log('CoursePageClient: User found:', user.id);
        console.log('CoursePageClient: Fetching progress for course:', course.id);

        const { data, error } = await supabase
          .from("course_progress")
          .select("completed_lessons")
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .maybeSingle();

        if (!mounted) return;
        
        if (error) {
          console.error("CoursePageClient: Load progress error:", error);
          setCompletedLessons([]);
        } else {
          console.log('CoursePageClient: Progress data loaded:', data);
          setCompletedLessons(Array.isArray(data?.completed_lessons) ? data!.completed_lessons : []);
        }
      } catch (err) {
        console.error('CoursePageClient: Unexpected error loading progress:', err);
        setCompletedLessons([]);
        setError(`Error loading course progress: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        if (mounted) {
          setLoadingProgress(false);
          clearTimeout(timeoutId);
          console.log('CoursePageClient: Progress loading completed');
        }
      }
    })();
    
    return () => { 
      mounted = false; 
      clearTimeout(timeoutId);
    };
  }, [course?.id, course?.modules, supabase]);

  // Real-time subscription for course progress
  useEffect(() => {
    if (!course?.id || !course?.modules || course.modules.length === 0) {
      console.log('CoursePageClient: Skipping real-time subscription - no valid course data');
      return;
    }
    
    let channel = supabase
      .channel("course-progress")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "course_progress",
        filter: `course_id=eq.${course.id}`
      }, (payload: any) => {
        const row = payload.new as { user_id: string; course_id: string; completed_lessons: string[] };
        // Only update if it's this user; otherwise ignore
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
          if (user && row.user_id === user.id) {
            setCompletedLessons(Array.isArray(row.completed_lessons) ? row.completed_lessons : []);
          }
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [course?.id, supabase]);

  // Award XP when course is completed
  useEffect(() => {
    if (!course?.modules || course.modules.length === 0) {
      console.log('CoursePageClient: Skipping XP award - no valid course modules');
      return;
    }
    
    const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
    const isCompleted = completedLessons.length === totalLessons && totalLessons > 0;
    
    if (isCompleted) {
      // Award XP for course completion
      completeCourse(course.id, 100);
    }
  }, [completedLessons, course, completeCourse]);

  const currentModule = course?.modules?.[activeModule];
  const currentLesson = currentModule?.lessons?.[activeLesson];

  const totalLessons = course?.modules?.reduce((total, module) => total + module.lessons.length, 0) || 0;
  const completedCount = completedLessons.length;
  const progress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const markLessonComplete = async (lessonId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return; }

    const newCompleted = completedLessons.includes(lessonId)
      ? completedLessons.filter(id => id !== lessonId)
      : [...completedLessons, lessonId];

    setCompletedLessons(newCompleted); // optimistic UI

    // Upsert into course_progress
    const { error } = await supabase
      .from("course_progress")
      .upsert({
        user_id: user.id,
        course_id: course.id,
        completed_lessons: newCompleted,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("save progress error:", error);
      // Optional: rollback UI if you want
      // setCompletedLessons(prev => completedLessons);
    }
  };

  const goToPrevious = () => {
    if (activeLesson > 0) {
      setActiveLesson(activeLesson - 1);
    } else if (activeModule > 0) {
      setActiveModule(activeModule - 1);
      setActiveLesson(course!.modules[activeModule - 1].lessons.length - 1);
    }
  };

  const goToNext = () => {
    if (currentModule && activeLesson < currentModule.lessons.length - 1) {
      setActiveLesson(activeLesson + 1);
    } else if (course && activeModule < course.modules.length - 1) {
      setActiveModule(activeModule + 1);
      setActiveLesson(0);
    }
  };

  const canGoPrevious = activeModule > 0 || activeLesson > 0;
  const canGoNext = course && (
    activeModule < course.modules.length - 1 || 
    (activeModule === course.modules.length - 1 && activeLesson < currentModule!.lessons.length - 1)
  );

  return (
    <>
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
          <div>Error: {error || 'None'}</div>
          <div>Initialized: {isInitialized ? 'Yes' : 'No'}</div>
          <div>Loading: {loadingProgress ? 'Yes' : 'No'}</div>
          <div>Course: {course ? 'Yes' : 'No'}</div>
          <div>Course ID: {course?.id || 'None'}</div>
          <div>Course Title: {course?.title || 'None'}</div>
          <div>Modules: {course?.modules?.length || 0}</div>
          <div>Active Module: {activeModule}</div>
          <div>Active Lesson: {activeLesson}</div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Always show header with navigation buttons - moved to top */}
        <header className="bg-slate-800/50 border-b border-cyan-500/30 px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Left side - Navigation buttons */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => router.push('/')}
                  variant="default"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 shadow-lg"
                >
                  🏠 Home
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-4 py-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
              
              {/* Center - Course title and description */}
              <div className="flex-1 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400 flex items-center justify-center">
                  <span className="mr-2">{course?.emoji || '📚'}</span>
                  {course?.title || 'Loading Course...'}
                </h1>
                <p className="text-sm sm:text-base text-gray-300 mt-1">{course?.description || 'Course description loading...'}</p>
              </div>
              
              {/* Right side - Course badges */}
              <div className="flex items-center space-x-4">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  {course?.level || 'Loading...'}
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {course?.squad || 'Loading...'}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Card className="bg-red-900/20 border-red-500/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-red-400 mb-2">Course Loading Error</h2>
                  <p className="text-red-300 mb-4">{error}</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => window.location.reload()} variant="outline">
                      Refresh Page
                    </Button>
                    <Button onClick={() => router.push('/courses')} variant="outline">
                      Back to Courses
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State - Only show after initialization */}
        {!error && !isInitialized && (
          <LoadingSpinner message="Initializing course..." />
        )}

        {/* Loading State - Show progress loading only after initialization */}
        {!error && isInitialized && loadingProgress && (
          <LoadingSpinner 
            message="Loading course progress..."
            showCancelButton={true}
            onCancel={() => {
              setLoadingProgress(false);
              setError('Loading was cancelled. Please refresh the page to try again.');
            }}
          />
        )}

        {/* Course Content - Only show if no errors, initialized, and course data is valid */}
        {!error && isInitialized && course && course.modules && course.modules.length > 0 && !loadingProgress && (
          <>
            <div className="max-w-7xl mx-auto px-4 py-6">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Course Progress</span>
                  <span className="text-sm text-cyan-400">{completedCount} / {totalLessons} lessons</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Module Navigation */}
                <div className="lg:col-span-1">
                  <Card className="bg-slate-800/50 border-cyan-500/30">
                    <CardHeader>
                      <CardTitle className="text-cyan-400 flex items-center">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Modules
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {course.modules.map((module, moduleIndex) => (
                          <div key={module.id} className="space-y-1">
                            <div 
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                moduleIndex === activeModule 
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                              }`}
                              onClick={() => {
                                setActiveModule(moduleIndex);
                                setActiveLesson(0);
                              }}
                            >
                              <div className="font-medium">{module.title}</div>
                              {module.description && (
                                <div className="text-xs text-gray-400 mt-1">{module.description}</div>
                              )}
                            </div>
                            
                            {/* Lessons within module */}
                            {moduleIndex === activeModule && (
                              <div className="ml-4 space-y-1">
                                {module.lessons.map((lesson, lessonIndex) => (
                                  <div
                                    key={lesson.id}
                                    className={`p-2 rounded cursor-pointer transition-colors ${
                                      lessonIndex === activeLesson
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'bg-slate-600/30 text-gray-400 hover:bg-slate-500/30'
                                    }`}
                                    onClick={() => setActiveLesson(lessonIndex)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm">{lesson.title}</span>
                                      {completedLessons.includes(lesson.id) ? (
                                        <CheckCircle className="h-3 w-3 text-green-400" />
                                      ) : (
                                        <Circle className="h-3 w-3 text-gray-500" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                  {currentLesson && (
                    <Card className="bg-slate-800/50 border-cyan-500/30">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <CardTitle className="text-cyan-400">{currentLesson.title}</CardTitle>
                            <p className="text-sm text-gray-400 mt-1">
                              Module {activeModule + 1} • Lesson {activeLesson + 1} of {currentModule!.lessons.length}
                            </p>
                          </div>
                          <Button
                            onClick={() => markLessonComplete(currentLesson.id)}
                            variant={completedLessons.includes(currentLesson.id) ? "outline" : "default"}
                            className={`${
                              completedLessons.includes(currentLesson.id) 
                                ? "border-green-500 text-green-400 hover:bg-green-500/10" 
                                : "bg-green-600 hover:bg-green-700"
                            } w-full sm:w-auto min-h-[44px]`}
                          >
                            {completedLessons.includes(currentLesson.id) ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Completed
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Complete
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                                                              {/* Video Player */}
                         {currentLesson.video && (
                           <VideoPlayer 
                             videoUrl={currentLesson.video}
                             title={currentLesson.title}
                             className="mb-6"
                           />
                         )}

                        {/* Lesson Content */}
                        <div className="prose prose-invert max-w-none">
                          <div className="text-gray-300 leading-relaxed">
                            <ReactMarkdown 
                              components={{
                                h1: ({children}) => <h1 className="text-2xl font-bold text-cyan-400 mb-4">{children}</h1>,
                                h2: ({children}) => <h2 className="text-xl font-semibold text-cyan-300 mb-3">{children}</h2>,
                                h3: ({children}) => <h3 className="text-lg font-medium text-cyan-200 mb-2">{children}</h3>,
                                p: ({children}) => <p className="mb-4 text-gray-300">{children}</p>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                                li: ({children}) => <li className="text-gray-300">{children}</li>,
                                strong: ({children}) => <strong className="font-semibold text-cyan-200">{children}</strong>,
                                hr: () => <hr className="border-cyan-500/30 my-6" />
                              }}
                            >
                              {currentLesson.content}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Quiz Section */}
                        {currentLesson.quiz && currentLesson.quiz.length > 0 && (
                          <div className="border-t border-cyan-500/30 pt-6">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Quiz</h3>
                            <p className="text-gray-400 text-sm">Quiz functionality coming soon...</p>
                          </div>
                        )}

                                         {/* Assignment Submission */}
                         {activeModule === course.modules.length - 1 && activeLesson === currentModule!.lessons.length - 1 && (
                           <div className="border-t border-cyan-500/30 pt-6">
                             <h3 className="text-lg font-semibold text-cyan-400 mb-4">🎯 Course Assignment</h3>
                             <p className="text-gray-400 text-sm mb-4">
                               🔥 You finished {course.title}. Now it's time to show the world.
                             </p>
                             <Button
                               onClick={() => router.push(`/courses/${course.id}/submit`)}
                               className="bg-green-600 hover:bg-green-700 text-white"
                             >
                               Submit Assignment
                             </Button>
                           </div>
                         )}

                        {/* Linked Bounties Section */}
                        {activeModule === course.modules.length - 1 && activeLesson === currentModule!.lessons.length - 1 && (
                          <div className="border-t border-purple-500/30 pt-6">
                            <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                              <Target className="w-5 h-5" />
                              📎 Linked Bounties
                            </h3>
                                                 <p className="text-gray-400 text-sm mb-4">
                               🎨 Create. Submit. Win SOL. Your squad is counting on you.
                             </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Sample linked bounties based on course */}
                              {course.squad === 'Creators' && (
                                <>
                                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-semibold text-white">🎨 Create a Hoodie Visual</h4>
                                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                        Creators
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-3">
                                      Create a unique Hoodie Academy-themed image featuring WifHoodie-style characters
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                      <div className="flex items-center gap-1">
                                        <Award className="w-3 h-3" />
                                        <span>0.05 SOL (1st)</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>Due: Mar 15</span>
                                      </div>
                                    </div>
                                    <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                                      <Link href="/bounties/hoodie-visual">
                                        View Bounty
                                      </Link>
                                    </Button>
                                  </div>

                                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-semibold text-white">Hoodie Academy Logo Redesign</h4>
                                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                        Creators
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-3">
                                      Create a modern, pixel-art inspired logo that captures the essence of Hoodie Academy
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                      <div className="flex items-center gap-1">
                                        <Award className="w-3 h-3" />
                                        <span>2.5 SOL</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>Due: Feb 15</span>
                                      </div>
                                    </div>
                                    <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                                      <Link href="/bounties/logo-redesign">
                                        View Bounty
                                      </Link>
                                    </Button>
                                  </div>
                                </>
                              )}

                              {course.squad === 'Decoders' && (
                                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-white">Technical Analysis Tutorial Video</h4>
                                    <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                                      Decoders
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400 mb-3">
                                    Create a 5-minute tutorial on support and resistance levels
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                    <div className="flex items-center gap-1">
                                      <Award className="w-3 h-3" />
                                      <span>3.2 SOL</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>Due: Feb 25</span>
                                    </div>
                                  </div>
                                  <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                                    <Link href="/bounties/ta-tutorial">
                                      View Bounty
                                    </Link>
                                  </Button>
                                </div>
                              )}

                              {course.squad === 'Speakers' && (
                                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-white">Community Onboarding Guide</h4>
                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                      Speakers
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400 mb-3">
                                    Write a comprehensive guide for new Hoodie Academy members
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                    <div className="flex items-center gap-1">
                                      <Award className="w-3 h-3" />
                                      <span>2.0 SOL</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>Due: Feb 18</span>
                                    </div>
                                  </div>
                                  <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                                    <Link href="/bounties/onboarding-guide">
                                      View Bounty
                                    </Link>
                                  </Button>
                                </div>
                              )}

                              {course.squad === 'Raiders' && (
                                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-white">NFT Market Analysis Report</h4>
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                      Raiders
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400 mb-3">
                                    Analyze current NFT market trends and provide actionable insights
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                    <div className="flex items-center gap-1">
                                      <Award className="w-3 h-3" />
                                      <span>4.0 SOL</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>Due: Feb 22</span>
                                    </div>
                                  </div>
                                  <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                                    <Link href="/bounties/market-analysis">
                                      View Bounty
                                    </Link>
                                  </Button>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 text-center">
                              <Button asChild variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                                <Link href="/bounties">
                                  View All Bounties
                                </Link>
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                    <Button
                      onClick={goToPrevious}
                      disabled={!canGoPrevious}
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50 w-full sm:w-auto min-h-[44px]"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    <div className="text-sm text-gray-400 text-center">
                      {activeModule + 1} of {course.modules.length} modules
                    </div>

                    <Button
                      onClick={goToNext}
                      disabled={!canGoNext}
                      className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 w-full sm:w-auto min-h-[44px]"
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
} 