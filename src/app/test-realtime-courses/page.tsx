'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/utils/supabase/client';

interface Course {
  id: string;
  title: string;
  description: string;
  badge: string;
  emoji: string;
  squad: string;
  level: string;
  access: string;
  category: string;
  totalLessons: number;
  is_visible: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function TestRealtimeCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('Never');

  useEffect(() => {
    fetchCourses();

    // Set up real-time subscription for course changes
    const coursesSubscription = supabase
      .channel('test-courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        (payload: any) => {
          console.log('Test page course change detected:', payload);
          setLastUpdate(new Date().toLocaleTimeString());
          
          if (payload.eventType === 'UPDATE') {
            const updatedCourse = payload.new as Course;
            setCourses(prev => prev.map(course => 
              course.id === updatedCourse.id ? updatedCourse : course
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedCourse = payload.old as Course;
            setCourses(prev => 
              prev.filter(course => course.id !== deletedCourse.id)
            );
          } else if (payload.eventType === 'INSERT') {
            const newCourse = payload.new as Course;
            setCourses(prev => {
              const exists = prev.find(c => c.id === newCourse.id);
              if (!exists) {
                return [...prev, newCourse];
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      coursesSubscription.unsubscribe();
    };
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('Fetching courses from API...');
      const response = await fetch('/api/courses');
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Courses fetched successfully:', data.length);
        setCourses(data);
      } else {
        console.error('API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCourses = () => {
    fetchCourses();
    setLastUpdate(new Date().toLocaleTimeString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Testing Real-time Course Updates</h1>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <span className="ml-2">Loading courses...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Testing Real-time Course Updates</h1>
            <p className="text-gray-400 mt-2">
              This page demonstrates real-time updates when admins change course visibility or published status.
            </p>
          </div>
          <div className="text-right">
            <Button onClick={refreshCourses} className="bg-cyan-600 hover:bg-cyan-700">
              Refresh Courses
            </Button>
            <p className="text-sm text-gray-400 mt-1">
              Last update: {lastUpdate}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Real-time Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-400">{courses.length}</div>
                  <div className="text-sm text-gray-400">Total Courses</div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {courses.filter(c => c.is_published).length}
                  </div>
                  <div className="text-sm text-gray-400">Published</div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {courses.filter(c => c.is_visible).length}
                  </div>
                  <div className="text-sm text-gray-400">Visible</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">All Courses (Real-time)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{course.emoji || '📚'}</div>
                      <div>
                        <h3 className="font-semibold text-white">{course.title}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {course.level || 'beginner'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {course.squad || 'No Squad'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {course.totalLessons || 0} lessons
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${course.is_visible ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm text-gray-400">
                          {course.is_visible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${course.is_published ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
                        <span className="text-sm text-gray-400">
                          {course.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {courses.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No courses found. Try refreshing or check if courses exist in the database.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">How to Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-2">1. Open Admin Dashboard</h4>
                  <p>Go to <code className="bg-slate-700 px-2 py-1 rounded">/admin</code> in another tab</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">2. Toggle Course Visibility</h4>
                  <p>Use the eye icon toggle to hide/show courses</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">3. Toggle Course Published Status</h4>
                  <p>Use the globe/lock icon toggle to publish/unpublish courses</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">4. Watch Real-time Updates</h4>
                  <p>Changes should appear immediately on this page without refreshing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
