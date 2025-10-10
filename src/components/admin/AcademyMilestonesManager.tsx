"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Calendar,
  TrendingUp,
  Save,
  X,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  target_date: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

interface AcademyMilestonesManagerProps {
  walletAddress: string;
}

export default function AcademyMilestonesManager({ walletAddress }: AcademyMilestonesManagerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    progress: 0,
    target_date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  // Fetch milestones
  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/admin/milestones?limit=50');
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchMilestones();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingMilestone ? '/api/admin/milestones' : '/api/admin/milestones';
      const method = editingMilestone ? 'PUT' : 'POST';
      
      const body = editingMilestone 
        ? { ...formData, id: editingMilestone.id, admin_wallet: walletAddress }
        : { ...formData, admin_wallet: walletAddress };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        if (editingMilestone) {
          setMilestones(prev => prev.map(milestone => 
            milestone.id === editingMilestone.id ? data.milestone : milestone
          ));
        } else {
          setMilestones(prev => [data.milestone, ...prev]);
        }
        
        resetForm();
        toast({
          title: "Success",
          description: editingMilestone ? "Milestone updated successfully!" : "Milestone created successfully!"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save milestone",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving milestone:', error);
      toast({
        title: "Error",
        description: "Failed to save milestone",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (milestone: Milestone) => {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/milestones?id=${milestone.id}&admin_wallet=${walletAddress}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMilestones(prev => prev.filter(m => m.id !== milestone.id));
        toast({
          title: "Success",
          description: "Milestone deleted successfully!"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete milestone",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: "Error",
        description: "Failed to delete milestone",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description,
      progress: milestone.progress,
      target_date: milestone.target_date.split('T')[0]
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      progress: 0,
      target_date: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
    setEditingMilestone(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle className="w-4 h-4 text-green-400" />;
    return <TrendingUp className="w-4 h-4 text-blue-400" />;
  };

  const isOverdue = (targetDate: string, progress: number) => {
    return new Date(targetDate) < new Date() && progress < 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              <span className="ml-2">Loading milestones...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-400 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Academy Milestones
            </CardTitle>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Milestone
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Target className="w-5 h-5 mr-2" />
              {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Milestone Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Phase 3 Rollout"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Advanced trading courses and squad challenges"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-700 border-slate-600"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div>
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={submitting || !formData.title.trim() || !formData.description.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {editingMilestone ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                  className="border-slate-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Milestones List */}
      <div className="space-y-4">
        {milestones.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No milestones found</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Milestone
              </Button>
            </CardContent>
          </Card>
        ) : (
          milestones.map((milestone) => (
            <Card key={milestone.id} className={`bg-slate-800/50 border-slate-700 ${isOverdue(milestone.target_date, milestone.progress) ? 'border-red-500/30' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-bold text-blue-400">{milestone.title}</h3>
                      <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(milestone.target_date)}
                      </Badge>
                      {isOverdue(milestone.target_date, milestone.progress) && (
                        <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-4">{milestone.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Progress</span>
                        <div className="flex items-center space-x-2">
                          {getProgressIcon(milestone.progress)}
                          <span className="text-sm font-medium text-blue-400">{milestone.progress}%</span>
                        </div>
                      </div>
                      <Progress 
                        value={milestone.progress} 
                        className="h-2"
                      />
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                      <span>Created: {formatDate(milestone.created_at)}</span>
                      {milestone.updated_at && milestone.updated_at !== milestone.created_at && (
                        <span>Updated: {formatDate(milestone.updated_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      onClick={() => handleEdit(milestone)}
                      size="sm"
                      variant="outline"
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(milestone)}
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      disabled={submitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {milestones.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Milestone Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{milestones.length}</div>
                <div className="text-sm text-gray-400">Total Milestones</div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {milestones.filter(m => m.progress >= 100).length}
                </div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-red-400">
                  {milestones.filter(m => isOverdue(m.target_date, m.progress)).length}
                </div>
                <div className="text-sm text-gray-400">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
