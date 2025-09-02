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
  BarChart3,
  RefreshCw,
  Save,
  X,
  Download,
  Upload,
  User,
  Home
} from 'lucide-react';
import { Course, CourseStats } from '@/types/course';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import Link from 'next/link';

interface AdminCoursesClientProps {
  // No props needed - fetch data on client side
}

export default function AdminCoursesClient({}: AdminCoursesClientProps) {
  const { wallet: walletAddress, isAdmin, connectWallet, loading: walletLoading, error: walletError } = useWalletSupabase();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [importingCourses, setImportingCourses] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' });
  const [availableCourseFiles, setAvailableCourseFiles] = useState<any[]>([]);
  const [newCourse, setNewCourse] = useState({
    slug: '',
    title: '',
    description: '',
    cover_url: '',
    emoji: '',
    badge: '',
    totalLessons: 1,
    category: '',
    level: 'beginner',
    access: 'free',
    squad: '',
    sort_order: 0,
    is_published: false
  });

  // Fetch courses data
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      if (response.ok) {
        const coursesData = await response.json();
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Fetch course files
  const fetchCourseFiles = async () => {
    try {
      const response = await fetch('/api/admin/course-files');
      if (response.ok) {
        const courseFilesData = await response.json();
        setAvailableCourseFiles(courseFilesData);
      }
    } catch (error) {
      console.error('Error fetching course files:', error);
    }
  };

  // Fetch course statistics
  const fetchCourseStats = async () => {
    try {
      const response = await fetch('/api/admin/course-stats');
      if (response.ok) {
        const stats = await response.json();
        setCourseStats(stats);
      }
    } catch (error) {
      console.error('Error fetching course stats:', error);
    }
  };

  // Bulk import courses from public/courses directory
  const bulkImportCourses = async () => {
    if (!confirm('This will import all courses from the public/courses directory. Continue?')) {
      return;
    }

    setImportingCourses(true);
    setImportProgress({ current: 0, total: 0, message: 'Starting import...' });

    try {
      // First, get the list of available courses
      const response = await fetch('/api/admin/bulk-import-courses');
      if (!response.ok) {
        throw new Error('Failed to start bulk import');
      }

      const { totalCourses } = await response.json();
      setImportProgress({ current: 0, total: totalCourses, message: 'Importing courses...' });

      // Start the actual import process
      const importResponse = await fetch('/api/admin/bulk-import-courses', {
        method: 'POST'
      });

      if (!importResponse.ok) {
        throw new Error('Import failed');
      }

      const result = await importResponse.json();
      
      // Refresh the courses list
      fetchCourses();

      // Refresh stats
      fetchCourseStats();

      alert(`Import completed! ${result.success} courses imported successfully.`);
      
    } catch (error) {
      console.error('Bulk import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImportingCourses(false);
      setImportProgress({ current: 0, total: 0, message: '' });
    }
  };

  // Toggle course publish status
  const toggleCoursePublished = async (courseId: string, currentPublished: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !currentPublished })
      });

      if (response.ok) {
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, is_published: !currentPublished }
            : course
        ));
        // Refresh stats after toggle
        fetchCourseStats();
      }
    } catch (error) {
      console.error('Error toggling course published status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update course
  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedCourse = await response.json();
        setCourses(prev => prev.map(course => 
          course.id === courseId ? updatedCourse : course
        ));
        setEditingCourse(null);
      }
    } catch (error) {
      console.error('Error updating course:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete course
  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCourses(prev => prev.filter(course => course.id !== courseId));
        // Refresh stats after deletion
        fetchCourseStats();
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new course
  const addCourse = async () => {
    setAddingCourse(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse)
      });

      if (response.ok) {
        const course = await response.json();
        setCourses(prev => [course, ...prev]);
        setShowAddForm(false);
        setNewCourse({
          slug: '',
          title: '',
          description: '',
          cover_url: '',
          emoji: '',
          badge: '',
          totalLessons: 1,
          category: '',
          level: 'beginner',
          access: 'free',
          squad: '',
          sort_order: 0,
          is_published: false
        });
        // Refresh stats after adding
        fetchCourseStats();
      }
    } catch (error) {
      console.error('Error adding course:', error);
    } finally {
      setAddingCourse(false);
    }
  };

  // Load data when component mounts and wallet is connected
  useEffect(() => {
    if (walletAddress && isAdmin) {
      fetchCourses();
      fetchCourseFiles();
      fetchCourseStats();
    }
  }, [walletAddress, isAdmin]);

  // Client-side admin protection
  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            Please connect your wallet to access the admin dashboard.
          </p>
          <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">
            <User className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Admin Access Required</h1>
          <p className="text-slate-400 mb-6">
            This wallet ({walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}) does not have admin privileges.
          </p>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Course Management</h1>
            <p className="text-gray-400">Manage course visibility and track completion statistics</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="border-green-500 text-green-400">
                ✅ Admin wallet: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                📚 {courses.length} courses in database
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowStats(!showStats)} 
              variant="outline"
              className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showStats ? 'Hide Stats' : 'View Stats'}
            </Button>
            <Button 
              onClick={bulkImportCourses}
              disabled={importingCourses}
              variant="outline"
              className="border-green-500 text-green-400 hover:bg-green-500/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importingCourses ? 'Importing...' : 'Bulk Import'}
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>
        </div>

        {/* Import Progress */}
        {importingCourses && (
          <Card className="bg-slate-800/50 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <Upload className="w-5 h-5" />
                Importing Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress: {importProgress.current} / {importProgress.total}</span>
                  <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400">{importProgress.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Statistics */}
        {showStats && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Course Completion Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {courseStats.map((stat) => {
                  const course = courses.find(c => c.id === stat.course_id);
                  const completionRate = stat.total_learners > 0 
                    ? Math.round((stat.completed_learners / stat.total_learners) * 100)
                    : 0;
                  
                  return (
                    <div key={stat.course_id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div>
                        <h3 className="font-semibold">{course?.title || 'Unknown Course'}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-gray-400">
                          <span>Total Learners: {stat.total_learners}</span>
                          <span>Completed: {stat.completed_learners}</span>
                          <span>Avg Progress: {stat.avg_percent}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{completionRate}%</div>
                        <div className="text-sm text-gray-400">Completion Rate</div>
                      </div>
                    </div>
                  );
                })}
                {courseStats.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    No course statistics available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Course Form */}
        {showAddForm && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>Add New Course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slug" className="text-white">Slug</Label>
                  <Input
                    id="slug"
                    value={newCourse.slug}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="course-slug"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={addingCourse}
                  />
                </div>
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
                  <Label htmlFor="sort_order" className="text-white">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={newCourse.sort_order}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={addingCourse}
                  />
                </div>
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
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={addCourse} 
                  disabled={addingCourse || !newCourse.slug.trim() || !newCourse.title.trim()}
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

        {/* Courses List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>All Courses ({courses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{course.emoji || '📚'}</div>
                    <div>
                      <h3 className="font-semibold text-white">{course.title}</h3>
                      <p className="text-sm text-gray-400">{course.description}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {course.level}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {course.access}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Order: {course.sort_order}
                        </Badge>
                        {!course.is_published && (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
                            Draft
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Publish Toggle */}
                    <div className="flex items-center gap-2">
                      {course.is_published ? (
                        <Globe className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-yellow-400" />
                      )}
                      <Switch
                        checked={course.is_published}
                        onCheckedChange={() => toggleCoursePublished(course.id, course.is_published)}
                        disabled={loading}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCourse(course)}
                        disabled={loading}
                        className="border-slate-600 text-slate-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteCourse(course.id)}
                        disabled={loading}
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-lg mb-2">No courses found in the database.</p>
                  <p className="text-sm mb-4">
                    {availableCourseFiles.length > 0 
                      ? `You have ${availableCourseFiles.length} course files available for import.`
                      : 'No course files found in the courses directory.'
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Course
                    </Button>
                    {availableCourseFiles.length > 0 && (
                      <Button 
                        onClick={bulkImportCourses}
                        variant="outline"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Course Files
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Course Modal */}
        {editingCourse && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Edit Course: {editingCourse.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title" className="text-white">Title</Label>
                    <Input
                      id="edit-title"
                      value={editingCourse.title}
                      onChange={(e) => setEditingCourse(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-sort-order" className="text-white">Sort Order</Label>
                    <Input
                      id="edit-sort-order"
                      type="number"
                      value={editingCourse.sort_order}
                      onChange={(e) => setEditingCourse(prev => prev ? { ...prev, sort_order: parseInt(e.target.value) } : null)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-white">Description</Label>
                  <Input
                    id="edit-description"
                    value={editingCourse.description}
                    onChange={(e) => setEditingCourse(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (editingCourse) {
                        updateCourse(editingCourse.id, {
                          title: editingCourse.title,
                          description: editingCourse.description,
                          sort_order: editingCourse.sort_order
                        });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => setEditingCourse(null)} 
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
