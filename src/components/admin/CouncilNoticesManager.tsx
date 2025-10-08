'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Plus, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';

interface CouncilNotice {
  id: string;
  title: string;
  content: string;
  directive_date?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

export default function CouncilNoticesManager({ walletAddress }: { walletAddress: string }) {
  const [notices, setNotices] = useState<CouncilNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    directive_date: '',
    priority: 'normal' as CouncilNotice['priority'],
    expires_at: ''
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await fetch('/api/council-notices?includeInactive=true');
      const data = await response.json();
      if (data.success) {
        setNotices(data.notices);
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editing ? '/api/council-notices' : '/api/council-notices';
      const method = editing ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editing && { id: editing }),
          ...formData,
          created_by: walletAddress
        })
      });

      if (response.ok) {
        fetchNotices();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving notice:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      const response = await fetch(`/api/council-notices?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchNotices();
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
    }
  };

  const handleToggleActive = async (notice: CouncilNotice) => {
    try {
      const response = await fetch('/api/council-notices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: notice.id,
          is_active: !notice.is_active
        })
      });

      if (response.ok) {
        fetchNotices();
      }
    } catch (error) {
      console.error('Error toggling notice status:', error);
    }
  };

  const startEdit = (notice: CouncilNotice) => {
    setEditing(notice.id);
    setFormData({
      title: notice.title,
      content: notice.content,
      directive_date: notice.directive_date || '',
      priority: notice.priority,
      expires_at: notice.expires_at || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      directive_date: '',
      priority: 'normal',
      expires_at: ''
    });
    setEditing(null);
    setShowForm(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'high': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'normal': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'low': return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
      default: return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">Loading council notices...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Council Notices Management
            </CardTitle>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Notice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-blue-500/30 space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">Notice Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Hoodie Scholar Council Directive..."
                  className="bg-slate-800 border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content" className="text-white">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Phase 3 rollout is live..."
                  className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="directive_date" className="text-white">Directive Date</Label>
                  <Input
                    id="directive_date"
                    value={formData.directive_date}
                    onChange={(e) => setFormData({ ...formData, directive_date: e.target.value })}
                    placeholder="January 28, 2025"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="priority" className="text-white">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expires_at" className="text-white">Expires At (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  {editing ? 'Update' : 'Create'} Notice
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {notices.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No council notices yet</p>
            ) : (
              notices.map((notice) => (
                <Card key={notice.id} className={`${getPriorityColor(notice.priority)} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{notice.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(notice.priority)} uppercase font-semibold`}>
                            {notice.priority}
                          </span>
                          {!notice.is_active && (
                            <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-2 whitespace-pre-wrap">{notice.content}</p>
                        {notice.directive_date && (
                          <p className="text-xs opacity-75">📅 {notice.directive_date}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(notice)}
                          className="border-slate-600"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(notice)}
                          className={notice.is_active ? 'border-orange-600' : 'border-green-600'}
                        >
                          {notice.is_active ? '👁️' : '🔒'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(notice.id)}
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

