"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Circle
} from 'lucide-react';
import TokenGate from "@/components/TokenGate";

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

export default function DynamicCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const slug = params?.slug as string;

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/courses/${slug}.json`);
        
        if (!response.ok) {
          throw new Error(`Course not found: ${slug}`);
        }
        
        const courseData: Course = await response.json();
        setCourse(courseData);
        
        // Load progress from localStorage
        const savedProgress = localStorage.getItem(courseData.localStorageKey);
        if (savedProgress) {
          setCompletedLessons(JSON.parse(savedProgress));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadCourse();
    }
  }, [slug]);

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
    if (course) {
      localStorage.setItem(course.localStorageKey, JSON.stringify(newCompleted));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Course Not Found</h2>
          <p className="text-gray-300 mb-6">{error || 'The requested course could not be loaded.'}</p>
          <Button onClick={() => router.push('/courses')} className="bg-cyan-600 hover:bg-cyan-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="bg-slate-800/50 border-b border-cyan-500/30 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
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
                  <h1 className="text-2xl font-bold text-cyan-400 flex items-center">
                    <span className="mr-2">{course.emoji}</span>
                    {course.title}
                  </h1>
                  <p className="text-gray-300 text-sm">{course.description}</p>
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

        <div className="max-w-7xl mx-auto p-6">
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-cyan-400">{currentLesson.title}</CardTitle>
                        <p className="text-sm text-gray-400 mt-1">
                          Module {activeModule + 1} • Lesson {activeLesson + 1} of {currentModule!.lessons.length}
                        </p>
                      </div>
                      <Button
                        onClick={() => markLessonComplete(currentLesson.id)}
                        variant={completedLessons.includes(currentLesson.id) ? "outline" : "default"}
                        className={completedLessons.includes(currentLesson.id) 
                          ? "border-green-500 text-green-400 hover:bg-green-500/10" 
                          : "bg-green-600 hover:bg-green-700"
                        }
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
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video 
                          controls 
                          className="w-full h-full"
                          poster="/images/video-placeholder.jpg"
                        >
                          <source src={currentLesson.video} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {/* Lesson Content */}
                    <div className="prose prose-invert max-w-none">
                      <div className="text-gray-300 leading-relaxed">
                        {currentLesson.content}
                      </div>
                    </div>

                    {/* Quiz Section */}
                    {currentLesson.quiz && currentLesson.quiz.length > 0 && (
                      <div className="border-t border-cyan-500/30 pt-6">
                        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Quiz</h3>
                        <p className="text-gray-400 text-sm">Quiz functionality coming soon...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-6">
                <Button
                  onClick={goToPrevious}
                  disabled={!canGoPrevious}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <div className="text-sm text-gray-400">
                  {activeModule + 1} of {course.modules.length} modules
                </div>

                <Button
                  onClick={goToNext}
                  disabled={!canGoNext}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
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