'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Eye, 
  EyeOff, 
  Globe, 
  Lock, 
  Edit, 
  Trash2, 
  Plus,
  Users,
  Trophy,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { setCourseVisibility, setCoursePublished, createCourse, deleteCourse as deleteCourseAction } from '@/lib/server-actions';

interface Course {
  id: string;
  title: string;
  description: string;
  badge: string;
  emoji: string;
  href: string;
  totalLessons: number;
  category: string;
  level: string;
  access: string;
  squad: string;
  created_at: string;
  updated_at: string;
  is_visible: boolean;
  is_published: boolean;
}

interface CourseCompletion {
  courseId: string;
  courseTitle: string;
  completedUsers: number;
  totalUsers: number;
  completionRate: number;
  lastCompleted: string;
}

interface CoursesManagementProps {
  initialCourses?: Course[];
  onCourseUpdate?: (courses: Course[]) => void;
  onCourseVisibilityToggle?: (courseId: string, isVisible: boolean) => void;
  onCoursePublishedToggle?: (courseId: string, isPublished: boolean) => void;
  courseManagementLoading?: boolean;
}

export default function CoursesManagement({
  initialCourses = [],
  onCourseUpdate,
  onCourseVisibilityToggle,
  onCoursePublishedToggle,
  courseManagementLoading = false
}: CoursesManagementProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseCompletions, setCourseCompletions] = useState<CourseCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    badge: '',
    emoji: '',
    level: 'beginner',
    access: 'free',
    squad: '',
    category: '',
    totalLessons: 1
  });

  const supabase = getSupabaseBrowser();

  useEffect(() => {
    if (initialCourses && initialCourses.length > 0) {
      setCourses(initialCourses);
    } else {
      fetchCourses();
    }
    fetchCourseCompletions();

    // Set up real-time subscription for course changes
    const coursesSubscription = supabase
      .channel('admin-courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        (payload: any) => {
          console.log('Admin course change detected:', payload);
          
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
                return [newCourse, ...prev];
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
  }, [initialCourses, supabase]);

  // Notify parent when courses change
  useEffect(() => {
    if (onCourseUpdate && courses.length > 0) {
      onCourseUpdate(courses);
    }
  }, [courses, onCourseUpdate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseCompletions = async () => {
    try {
      // This would fetch from a course_completions table or similar
      // For now, we'll simulate the data
      const mockCompletions: CourseCompletion[] = courses.map(course => ({
        courseId: course.id,
        courseTitle: course.title,
        completedUsers: Math.floor(Math.random() * 50),
        totalUsers: Math.floor(Math.random() * 100) + 50,
        completionRate: Math.floor(Math.random() * 100),
        lastCompleted: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
      setCourseCompletions(mockCompletions);
    } catch (error) {
      console.error('Error fetching course completions:', error);
    }
  };

  const toggleCourseVisibility = async (courseId: string, currentVisibility: boolean) => {
    try {
      if (onCourseVisibilityToggle) {
        // Use parent function if available
        onCourseVisibilityToggle(courseId, !currentVisibility);
        return;
      }

      // Use server action for better real-time updates
      await setCourseVisibility(courseId, !currentVisibility);
      
      // Update local state immediately for better UX
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, is_visible: !currentVisibility }
          : course
      ));
    } catch (error) {
      console.error('Error toggling course visibility:', error);
    }
  };

  const toggleCoursePublished = async (courseId: string, currentPublished: boolean) => {
    try {
      if (onCoursePublishedToggle) {
        // Use parent function if available
        onCoursePublishedToggle(courseId, !currentPublished);
        return;
      }

      // Use server action for better real-time updates
      await setCoursePublished(courseId, !currentPublished);
      
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, is_published: !currentPublished }
          : course
      ));
    } catch (error) {
      console.error('Error toggling course published status:', error);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCourseAction(courseId);
      
      setCourses(prev => prev.filter(course => course.id !== courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const addCourse = async () => {
    try {
      setAddingCourse(true);
      const courseData = {
        ...newCourse,
        id: newCourse.title.toLowerCase().replace(/\s+/g, '-'),
        href: `/courses/${newCourse.title.toLowerCase().replace(/\s+/g, '-')}`,
        is_visible: true,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await createCourse(courseData);

      setCourses(prev => [courseData, ...prev]);
      setShowAddForm(false);
      setNewCourse({
        title: '',
        description: '',
        badge: '',
        emoji: '',
        level: 'beginner',
        access: 'free',
        squad: '',
        category: '',
        totalLessons: 1
      });
    } catch (error) {
      console.error('Error adding course:', error);
    } finally {
      setAddingCourse(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Courses Management</h2>
          <p className="text-gray-400">Manage course visibility, completion tracking, and course data</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </div>

      {/* Add Course Form */}
      {showAddForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Add New Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Course Title"
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={addingCourse}
                />
              </div>
              <div>
                <Label htmlFor="emoji" className="text-white">Emoji</Label>
                <Input
                  id="emoji"
                  value={newCourse.emoji}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, emoji: e.target.value }))}
                  placeholder="📚"
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={addingCourse}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="badge" className="text-white">Badge</Label>
                <Input
                  id="badge"
                  value={newCourse.badge}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, badge: e.target.value }))}
                  placeholder="Course Badge"
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={addingCourse}
                />
              </div>
              <div>
                <Label htmlFor="squad" className="text-white">Squad</Label>
                <select
                  id="squad"
                  value={newCourse.squad}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, squad: e.target.value }))}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  disabled={addingCourse}
                >
                  <option value="">Select Squad</option>
                  <option value="Creators">Creators</option>
                  <option value="Decoders">Decoders</option>
                  <option value="Raiders">Raiders</option>
                  <option value="Rangers">Rangers</option>
                  <option value="Speakers">Speakers</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Input
                id="description"
                value={newCourse.description}
                onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Course description"
                className="bg-slate-700 border-slate-600 text-white"
                disabled={addingCourse}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="level" className="text-white">Level</Label>
                <select
                  id="level"
                  value={newCourse.level}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  disabled={addingCourse}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <Label htmlFor="access" className="text-white">Access</Label>
                <select
                  id="access"
                  value={newCourse.access}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, access: e.target.value }))}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  disabled={addingCourse}
                >
                  <option value="free">Free</option>
                  <option value="hoodie">Hoodie Holder</option>
                  <option value="dao">DAO Member</option>
                </select>
              </div>
              <div>
                <Label htmlFor="totalLessons" className="text-white">Total Lessons</Label>
                <Input
                  id="totalLessons"
                  type="number"
                  value={newCourse.totalLessons}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, totalLessons: parseInt(e.target.value) }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={addingCourse}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category" className="text-white">Category</Label>
              <Input
                id="category"
                value={newCourse.category}
                onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Course category (e.g., nft, trading, security)"
                className="bg-slate-700 border-slate-600 text-white"
                disabled={addingCourse}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={addCourse} 
                disabled={addingCourse || !newCourse.title.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {addingCourse ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Course'
                )}
              </Button>
              <Button 
                onClick={() => setShowAddForm(false)} 
                variant="outline"
                disabled={addingCourse}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Completion Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Course Completion Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-400">{courses.length}</div>
              <div className="text-sm text-gray-400">Total Courses</div>
            </div>
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {courses.filter(c => c.is_published).length}
              </div>
              <div className="text-sm text-gray-400">Published Courses</div>
            </div>
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {courses.filter(c => c.is_visible).length}
              </div>
              <div className="text-sm text-gray-400">Visible Courses</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{course.emoji}</div>
                  <div>
                    <h3 className="font-semibold text-white">{course.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {course.level}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {course.squad || 'No Squad'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {course.totalLessons} lessons
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Visibility Toggle */}
                  <div className="flex items-center gap-2">
                    {course.is_visible ? (
                      <Eye className="w-4 h-4 text-green-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-red-400" />
                    )}
                    <Switch
                      checked={course.is_visible}
                      onCheckedChange={() => toggleCourseVisibility(course.id, course.is_visible)}
                      disabled={courseManagementLoading}
                    />
                  </div>

                  {/* Published Toggle */}
                  <div className="flex items-center gap-2">
                    {course.is_published ? (
                      <Globe className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-yellow-400" />
                    )}
                    <Switch
                      checked={course.is_published}
                      onCheckedChange={() => toggleCoursePublished(course.id, course.is_published)}
                      disabled={courseManagementLoading}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingCourse(course)}
                      disabled={courseManagementLoading}
                      className="border-slate-600 text-slate-300"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCourse(course.id)}
                      disabled={courseManagementLoading}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
