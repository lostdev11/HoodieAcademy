'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Lock, Play, ArrowLeft, Shield, AlertTriangle, Clock, Users, Trophy } from 'lucide-react';
import courseData from '../../../../public/courses/s120-cold-truths-self-custody.json';

export default function ColdTruthsSelfCustodyPage() {
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const router = useRouter();

  const localStorageKey = courseData.localStorageKey;

  useEffect(() => {
    const savedProgress = localStorage.getItem(localStorageKey);
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setProgress(parsed.progress || 0);
      setCompletedLessons(parsed.completedLessons || []);
      setCurrentModule(parsed.currentModule || 0);
      setCurrentLesson(parsed.currentLesson || 0);
    }
  }, [localStorageKey]);

  const saveProgress = (newProgress: number, newCompletedLessons: string[], newModule: number, newLesson: number) => {
    const progressData = {
      progress: newProgress,
      completedLessons: newCompletedLessons,
      currentModule: newModule,
      currentLesson: newLesson,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(localStorageKey, JSON.stringify(progressData));
  };

  const markLessonComplete = (moduleIndex: number, lessonIndex: number) => {
    const lessonId = courseData.modules[moduleIndex].lessons[lessonIndex].id;
    const newCompletedLessons = [...completedLessons, lessonId];
    setCompletedLessons(newCompletedLessons);
    
    const totalLessons = courseData.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    const newProgress = (newCompletedLessons.length / totalLessons) * 100;
    setProgress(newProgress);
    
    saveProgress(newProgress, newCompletedLessons, currentModule, currentLesson);
  };

  const isLessonCompleted = (moduleIndex: number, lessonIndex: number) => {
    const lessonId = courseData.modules[moduleIndex].lessons[lessonIndex].id;
    return completedLessons.includes(lessonId);
  };

  const getCurrentLesson = () => {
    if (currentModule < courseData.modules.length && currentLesson < courseData.modules[currentModule].lessons.length) {
      return courseData.modules[currentModule].lessons[currentLesson];
    }
    return null;
  };

  const nextLesson = () => {
    if (currentModule < courseData.modules.length) {
      if (currentLesson < courseData.modules[currentModule].lessons.length - 1) {
        setCurrentLesson(currentLesson + 1);
      } else if (currentModule < courseData.modules.length - 1) {
        setCurrentModule(currentModule + 1);
        setCurrentLesson(0);
      }
    }
    saveProgress(progress, completedLessons, currentModule, currentLesson);
  };

  const prevLesson = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    } else if (currentModule > 0) {
      setCurrentModule(currentModule - 1);
      setCurrentLesson(courseData.modules[currentModule - 1].lessons.length - 1);
    }
    saveProgress(progress, completedLessons, currentModule, currentLesson);
  };

  const currentLessonData = getCurrentLesson();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/courses">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <h1 className="text-3xl font-bold text-cyan-400">{courseData.title}</h1>
            </div>
          </div>
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
            {courseData.badge}
          </Badge>
        </div>

        {/* Course Overview */}
        <Card className="bg-slate-800/50 border-cyan-500/30 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{courseData.emoji}</div>
                <div>
                  <CardTitle className="text-cyan-400 text-2xl">{courseData.title}</CardTitle>
                  <p className="text-gray-300 mt-2">{courseData.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Progress</div>
                <div className="text-2xl font-bold text-cyan-400">{Math.round(progress)}%</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{courseData.totalLessons} Lessons</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{courseData.squad} Squad</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{courseData.level} Level</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Course Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseData.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">
                          Module {moduleIndex + 1}: {module.title}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={`${
                            moduleIndex === currentModule 
                              ? 'border-cyan-500/50 text-cyan-400' 
                              : 'border-gray-500/30 text-gray-400'
                          }`}
                        >
                          {module.lessons.length} lessons
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{module.description}</p>
                      <div className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                              moduleIndex === currentModule && lessonIndex === currentLesson
                                ? 'bg-cyan-500/20 border border-cyan-500/30'
                                : 'bg-slate-700/30 hover:bg-slate-700/50'
                            }`}
                            onClick={() => {
                              setCurrentModule(moduleIndex);
                              setCurrentLesson(lessonIndex);
                              saveProgress(progress, completedLessons, moduleIndex, lessonIndex);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              {isLessonCompleted(moduleIndex, lessonIndex) ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <Play className="w-5 h-5 text-gray-400" />
                              )}
                              <span className={`text-sm ${
                                isLessonCompleted(moduleIndex, lessonIndex) 
                                  ? 'text-green-400' 
                                  : 'text-gray-300'
                              }`}>
                                {lesson.title}
                              </span>
                            </div>
                            {isLessonCompleted(moduleIndex, lessonIndex) && (
                              <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                                Complete
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lesson Content */}
          <div className="lg:col-span-2">
            {currentLessonData ? (
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-cyan-400 text-xl">
                        {currentLessonData.title}
                      </CardTitle>
                      <p className="text-gray-400 text-sm mt-1">
                        Module {currentModule + 1}, Lesson {currentLesson + 1}
                      </p>
                    </div>
                    <Button
                      onClick={() => markLessonComplete(currentModule, currentLesson)}
                      variant={isLessonCompleted(currentModule, currentLesson) ? "outline" : "default"}
                      className={isLessonCompleted(currentModule, currentLesson) 
                        ? "border-green-500/30 text-green-400 hover:bg-green-500/10" 
                        : "bg-cyan-600 hover:bg-cyan-700"
                      }
                    >
                      {isLessonCompleted(currentModule, currentLesson) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                      {currentLessonData.content}
                    </div>
                  </div>
                  
                  {/* Video Placeholder */}
                  <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                    <div className="flex items-center space-x-3 mb-3">
                      <Play className="w-5 h-5 text-cyan-400" />
                      <span className="text-cyan-400 font-semibold">Video Lesson</span>
                    </div>
                    <div className="aspect-video bg-slate-600/30 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Video content coming soon</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-600/30">
                    <Button
                      onClick={prevLesson}
                      disabled={currentModule === 0 && currentLesson === 0}
                      variant="outline"
                      className="border-gray-500/30 text-gray-300 hover:bg-gray-500/10"
                    >
                      Previous Lesson
                    </Button>
                    <Button
                      onClick={nextLesson}
                      disabled={currentModule === courseData.modules.length - 1 && 
                               currentLesson === courseData.modules[currentModule].lessons.length - 1}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      Next Lesson
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardContent className="p-8">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Lesson Selected</h3>
                    <p className="text-gray-400">Select a lesson from the module navigation to begin learning.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Course Completion */}
        {progress === 100 && (
          <Card className="bg-green-500/10 border-green-500/30 mt-8">
            <CardContent className="p-6">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-400 mb-2">Course Completed!</h3>
                <p className="text-gray-300 mb-4">
                  Congratulations! You've completed the Cold Truths of Self-Custody course and earned your Survival Badge.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Trophy className="w-4 h-4 mr-2" />
                    View Badge
                  </Button>
                  <Link href="/courses">
                    <Button variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                      Explore More Courses
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 