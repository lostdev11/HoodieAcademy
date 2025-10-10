'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Users,
  Clock,
  Award,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';

interface CourseFormData {
  title: string;
  description: string;
  content: string;
  squad_id: string;
  squad_name: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_duration: number;
  xp_reward: number;
  tags: string[];
  prerequisites: string[];
  is_published: boolean;
  is_hidden: boolean;
}

const SQUADS = [
  { id: 'creators', name: 'Hoodie Creators' },
  { id: 'decoders', name: 'Hoodie Decoders' },
  { id: 'speakers', name: 'Hoodie Speakers' },
  { id: 'traders', name: 'Hoodie Traders' },
  { id: 'all', name: 'All Squads' }
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
];

export default function CourseManager() {
  const [activeTab, setActiveTab] = useState('courses');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    content: '',
    squad_id: '',
    squad_name: '',
    difficulty_level: 'beginner',
    estimated_duration: 0,
    xp_reward: 0,
    tags: [],
    prerequisites: [],
    is_published: true,
    is_hidden: false
  });
  const [tagInput, setTagInput] = useState('');
  const [prerequisiteInput, setPrerequisiteInput] = useState('');

  const { toast } = useToast();
  const { wallet } = useWalletSupabase();
  const { courses, loading, error, fetchCourses, createCourse, updateCourse, deleteCourse } = useCourses();

  // Fetch courses including hidden ones for admin
  useEffect(() => {
    if (wallet) {
      fetchCourses(undefined, true);
    }
  }, [wallet, fetchCourses]);

  const handleSquadChange = (squadId: string) => {
    const squad = SQUADS.find(s => s.id === squadId);
    setFormData(prev => ({
      ...prev,
      squad_id: squadId,
      squad_name: squad?.name || ''
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addPrerequisite = () => {
    if (prerequisiteInput.trim() && !formData.prerequisites.includes(prerequisiteInput.trim())) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, prerequisiteInput.trim()]
      }));
      setPrerequisiteInput('');
    }
  };

  const removePrerequisite = (prereqToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter(prereq => prereq !== prereqToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.squad_id) {
      toast({
        title: 'Error',
        description: 'Title and squad are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData);
        toast({
          title: 'Success',
          description: 'Course updated successfully'
        });
      } else {
        await createCourse(formData);
        toast({
          title: 'Success',
          description: 'Course created successfully'
        });
      }
      
      resetForm();
      fetchCourses(undefined, true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save course',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      content: course.content || '',
      squad_id: course.squad_id,
      squad_name: course.squad_name,
      difficulty_level: course.difficulty_level,
      estimated_duration: course.estimated_duration,
      xp_reward: course.xp_reward,
      tags: course.tags || [],
      prerequisites: course.prerequisites || [],
      is_published: course.is_published,
      is_hidden: course.is_hidden
    });
    setShowForm(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCourse(courseId);
      toast({
        title: 'Success',
        description: 'Course deleted successfully'
      });
      fetchCourses(undefined, true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete course',
        variant: 'destructive'
      });
    }
  };

  const toggleVisibility = async (course: any) => {
    try {
      await updateCourse(course.id, {
        is_hidden: !course.is_hidden
      });
      toast({
        title: 'Success',
        description: `Course ${course.is_hidden ? 'shown' : 'hidden'} successfully`
      });
      fetchCourses(undefined, true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update course',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      squad_id: '',
      squad_name: '',
      difficulty_level: 'beginner',
      estimated_duration: 0,
      xp_reward: 0,
      tags: [],
      prerequisites: [],
      is_published: true,
      is_hidden: false
    });
    setEditingCourse(null);
    setShowForm(false);
    setTagInput('');
    setPrerequisiteInput('');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading courses...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="create">Create Course</TabsTrigger>
            </TabsList>
            
            <TabsContent value="courses" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">All Courses</h3>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="grid gap-4">
                {courses.map((course) => (
                  <Card key={course.id} className={`${course.is_hidden ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{course.title}</h4>
                            <Badge variant={course.is_hidden ? 'secondary' : 'default'}>
                              {course.squad_name}
                            </Badge>
                            <Badge variant="outline">
                              {course.difficulty_level}
                            </Badge>
                            {course.is_hidden && (
                              <Badge variant="destructive">Hidden</Badge>
                            )}
                          </div>
                          
                          {course.description && (
                            <p className="text-sm text-gray-400 mb-2">{course.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {course.estimated_duration} min
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {course.xp_reward} XP
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {course.course_sections?.length || 0} sections
                            </div>
                          </div>
                          
                          {course.tags && course.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {course.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleVisibility(course)}
                          >
                            {course.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(course)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(course.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="create">
              {showForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {editingCourse ? 'Edit Course' : 'Create New Course'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Title *</label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Course title"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Squad *</label>
                          <Select value={formData.squad_id} onValueChange={handleSquadChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select squad" />
                            </SelectTrigger>
                            <SelectContent>
                              {SQUADS.map((squad) => (
                                <SelectItem key={squad.id} value={squad.id}>
                                  {squad.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Course description"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Content</label>
                        <Textarea
                          value={formData.content}
                          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Course content (markdown supported)"
                          rows={6}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Difficulty</label>
                          <Select 
                            value={formData.difficulty_level} 
                            onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DIFFICULTY_LEVELS.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                          <Input
                            type="number"
                            value={formData.estimated_duration}
                            onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 0 }))}
                            placeholder="120"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">XP Reward</label>
                          <Input
                            type="number"
                            value={formData.xp_reward}
                            onChange={(e) => setFormData(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 0 }))}
                            placeholder="100"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Tags</label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Add tag"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" onClick={addTag}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {formData.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="cursor-pointer" onClick={() => removeTag(tag)}>
                              {tag} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={formData.is_published}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                          />
                          <label className="text-sm">Published</label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={formData.is_hidden}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_hidden: checked }))}
                          />
                          <label className="text-sm">Hidden</label>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="submit">
                          <Save className="w-4 h-4 mr-2" />
                          {editingCourse ? 'Update Course' : 'Create Course'}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetForm}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
