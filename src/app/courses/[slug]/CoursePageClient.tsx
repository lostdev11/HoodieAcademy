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
  localStorageKey: string;
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
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const { completeCourse } = useUserXP();

  useEffect(() => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem(course.localStorageKey);
    if (savedProgress) {
      setCompletedLessons(JSON.parse(savedProgress));
    }
  }, [course.localStorageKey]);

  // Award XP when course is completed
  useEffect(() => {
    const totalLessons = course?.modules.reduce((total, module) => total + module.lessons.length, 0) || 0;
    const isCompleted = completedLessons.length === totalLessons && totalLessons > 0;
    
    if (isCompleted) {
      // Award XP for course completion
      completeCourse(course.id, 100);
    }
  }, [completedLessons, course, completeCourse]);

  const currentModule = course?.modules[activeModule];
  const currentLesson = currentModule?.lessons[activeLesson];

  const totalLessons = course?.modules.reduce((total, module) => total + module.lessons.length, 0) || 0;
  const completedCount = completedLessons.length;
  const progress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const markLessonComplete = (lessonId: string) => {
    const newCompleted = completedLessons.includes(lessonId)
      ? completedLessons.filter(id => id !== lessonId)
      : [...completedLessons, lessonId];
    
    setCompletedLessons(newCompleted);
    localStorage.setItem(course.localStorageKey, JSON.stringify(newCompleted));
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
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="bg-slate-800/50 border-b border-cyan-500/30 px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push('/courses')}
                  variant="ghost"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Courses
                </Button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400 flex items-center">
                    <span className="mr-2">{course.emoji}</span>
                    {course.title}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-300">{course.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  {course.level}
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {course.squad}
                </Badge>
              </div>
            </div>
          </div>
        </header>

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
      </div>
    </TokenGate>
  );
} 