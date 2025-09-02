'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Course, CourseProgress } from '@/types/course';
import { supabase } from '@/utils/supabase/client';

interface CoursesPageClientProps {
  initialCourses: Course[];
}

export default function CoursesPageClient({ initialCourses }: CoursesPageClientProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [userProgress, setUserProgress] = useState<{ [courseId: string]: CourseProgress }>({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Check authentication status and set up real-time subscriptions
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Fetch user's progress for all courses
        fetchUserProgress();
      }
    };
    
    checkUser();

    // Set up real-time subscription for course changes
    const coursesSubscription = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        (payload: any) => {
          console.log('Course change detected:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedCourse = payload.new as Course;
            const oldCourse = payload.old as Course;
            
            // Check if visibility or published status changed
            if (oldCourse.is_visible !== updatedCourse.is_visible || 
                oldCourse.is_published !== updatedCourse.is_published) {
              
              setCourses(prevCourses => {
                // If course is no longer visible or published, remove it
                if (!updatedCourse.is_visible || !updatedCourse.is_published) {
                  return prevCourses.filter(c => c.id !== updatedCourse.id);
                }
                
                // If course became visible and published, add it
                if (updatedCourse.is_visible && updatedCourse.is_published) {
                  const exists = prevCourses.find(c => c.id === updatedCourse.id);
                  if (!exists) {
                    return [...prevCourses, updatedCourse].sort((a, b) => {
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    });
                  }
                }
                
                // Update existing course
                return prevCourses.map(c => 
                  c.id === updatedCourse.id ? updatedCourse : c
                );
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedCourse = payload.old as Course;
            setCourses(prevCourses => 
              prevCourses.filter(c => c.id !== deletedCourse.id)
            );
          } else if (payload.eventType === 'INSERT') {
            const newCourse = payload.new as Course;
            if (newCourse.is_visible && newCourse.is_published) {
              setCourses(prevCourses => {
                const exists = prevCourses.find(c => c.id === newCourse.id);
                if (!exists) {
                  return [...prevCourses, newCourse].sort((a, b) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  });
                }
                return prevCourses;
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      coursesSubscription.unsubscribe();
    };
  }, []);

  // Fetch user progress for all courses
  const fetchUserProgress = async () => {
    if (!user) return;
    
    try {
      const progressMap: { [courseId: string]: CourseProgress } = {};
      
      // Fetch progress for each course
      for (const course of courses) {
        try {
          const response = await fetch(`/api/courses/${course.id}/progress`);
          if (response.ok) {
            const progress = await response.json();
            if (progress) {
              progressMap[course.id] = progress;
            }
          }
        } catch (error) {
          console.error(`Error fetching progress for course ${course.id}:`, error);
        }
      }
      
      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  // Update course progress
  const updateProgress = async (courseId: string, percent: number, isCompleted: boolean = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent, is_completed: isCompleted })
      });

      if (response.ok) {
        const progress = await response.json();
        setUserProgress(prev => ({
          ...prev,
          [courseId]: progress
        }));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark course as complete
  const markComplete = async (courseId: string) => {
    await updateProgress(courseId, 100, true);
  };

  // Navigate to course
  const navigateToCourse = (course: Course) => {
    if (course.slug) {
      router.push(`/courses/${course.slug}`);
    } else {
      router.push(`/courses/${course.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            📚 Academy Courses
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Master Web3, NFTs, and crypto trading with our comprehensive course library. 
            From beginners to advanced traders, we have something for everyone.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const progress = userProgress[course.id];
            const isCompleted = progress?.is_completed || false;
            const progressPercent = progress?.percent || 0;
            
            return (
              <Card 
                key={course.id} 
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer"
                onClick={() => navigateToCourse(course)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl">{course.emoji || '📚'}</div>
                    {isCompleted && (
                      <Badge className="bg-green-600 text-white">
                        ✅ Completed
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl text-white">{course.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {course.description}
                  </p>
                  
                  {/* Progress Bar */}
                  {user && progress && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  )}
                  
                  {/* Course Metadata */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {course.level}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {course.access}
                    </Badge>
                    {course.category && (
                      <Badge variant="outline" className="text-xs">
                        {course.category}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToCourse(course);
                      }}
                    >
                      {isCompleted ? 'Review Course' : 'Start Learning'}
                    </Button>
                    
                    {user && progress && !isCompleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markComplete(course.id);
                        }}
                        disabled={loading}
                        className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                  
                  {/* Progress Controls (for testing) */}
                  {user && progress && !isCompleted && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProgress(course.id, Math.max(0, progressPercent - 25));
                        }}
                        disabled={loading}
                        className="text-xs"
                      >
                        -25%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProgress(course.id, Math.min(100, progressPercent + 25));
                        }}
                        disabled={loading}
                        className="text-xs"
                      >
                        +25%
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {courses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Courses Available</h2>
            <p className="text-gray-400">
              Check back soon for new courses, or contact an admin to add courses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
