'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, Eye, EyeOff, RefreshCw, Search, Edit,
  CheckCircle, XCircle, Users, Award, Loader2, Trash2
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description?: string;
  squad_id?: string;
  squad_name?: string;
  difficulty_level?: string;
  estimated_duration?: number;
  xp_reward?: number;
  is_published: boolean;
  is_hidden: boolean;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

interface CourseManagementTabProps {
  adminWallet: string;
}

interface CourseStats {
  total: number;
  published: number;
  unpublished: number;
  visible: number;
  hidden: number;
}

export default function CourseManagementTab({ adminWallet }: CourseManagementTabProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<CourseStats | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, squadFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses?wallet_address=${adminWallet}&is_admin=true&include_hidden=true`);
      
      if (!response.ok) {
        console.error('Failed to fetch courses');
        return;
      }

      const data = await response.json();
      setCourses(data.courses || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Squad filter
    if (squadFilter !== 'all') {
      filtered = filtered.filter(course => course.squad_id === squadFilter);
    }

    setFilteredCourses(filtered);
  };

  const toggleCourseVisibility = async (courseId: string, currentlyHidden: boolean) => {
    try {
      setToggleLoading(courseId);
      
      const response = await fetch(`/api/courses/${courseId}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_wallet: adminWallet,
          is_hidden: !currentlyHidden
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error: ${data.error || 'Failed to update course'}`);
        return;
      }

      alert(data.message);
      await fetchCourses();

    } catch (error) {
      console.error('Error toggling course visibility:', error);
      alert('Failed to update course visibility');
    } finally {
      setToggleLoading(null);
    }
  };

  const deleteCourse = async (courseId: string, courseTitle: string) => {
    const confirmDelete = confirm(
      `Are you sure you want to permanently delete "${courseTitle}"?\n\n` +
      `This will remove:\n` +
      `- The course and all its content\n` +
      `- All course progress data\n` +
      `- All related submissions\n\n` +
      `This action cannot be undone!`
    );

    if (!confirmDelete) return;

    try {
      setToggleLoading(courseId);
      
      const response = await fetch('/api/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          admin_wallet: adminWallet
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error: ${data.error || 'Failed to delete course'}`);
        return;
      }

      alert(data.message);
      await fetchCourses();

    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    } finally {
      setToggleLoading(null);
    }
  };

  const getSquadBadge = (squadId?: string) => {
    const colors: Record<string, string> = {
      'creators': 'bg-purple-500',
      'decoders': 'bg-blue-500',
      'speakers': 'bg-green-500',
      'builders': 'bg-orange-500',
      'all': 'bg-gray-500'
    };

    return (
      <Badge className={`${colors[squadId || 'all'] || 'bg-gray-500'} text-white`}>
        {squadId || 'All'}
      </Badge>
    );
  };

  const getVisibleCount = () => courses.filter(c => !c.is_hidden).length;
  const getHiddenCount = () => courses.filter(c => c.is_hidden).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-300">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.total || courses.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Visible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats?.visible || getVisibleCount()}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Hidden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.hidden || getHiddenCount()}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats?.published || courses.filter(c => c.is_published).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <select
              value={squadFilter}
              onChange={(e) => setSquadFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              <option value="all">All Squads</option>
              <option value="creators">Creators</option>
              <option value="decoders">Decoders</option>
              <option value="speakers">Speakers</option>
              <option value="builders">Builders</option>
            </select>

            <Button onClick={fetchCourses} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No courses found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCourses.map((course) => (
            <Card key={course.id} className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                      {getSquadBadge(course.squad_id)}
                      {course.is_hidden && (
                        <Badge className="bg-red-500 text-white">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                      {!course.is_published && (
                        <Badge className="bg-yellow-500 text-white">
                          Draft
                        </Badge>
                      )}
                    </div>

                    {course.description && (
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {course.xp_reward && (
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>{course.xp_reward} XP</span>
                        </div>
                      )}
                      {course.difficulty_level && (
                        <div className="capitalize">
                          {course.difficulty_level}
                        </div>
                      )}
                      {course.estimated_duration && (
                        <div>
                          {course.estimated_duration} min
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant={course.is_hidden ? "default" : "outline"}
                      onClick={() => toggleCourseVisibility(course.id, course.is_hidden)}
                      disabled={toggleLoading === course.id}
                      className={course.is_hidden ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {toggleLoading === course.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : course.is_hidden ? (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Show
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Hide
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteCourse(course.id, course.title)}
                      disabled={toggleLoading === course.id}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {toggleLoading === course.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

