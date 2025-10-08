'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'course' | 'event' | 'bounty' | 'system';
  is_expandable: boolean;
  is_active: boolean;
  posted_at: string;
  expires_at?: string;
}

export default function AnnouncementsManager({ walletAddress }: { walletAddress: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as Announcement['category'],
    is_expandable: true,
    expires_at: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements?includeInactive=true');
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const method = editing ? 'PUT' : 'POST';
      
      console.log('Submitting announcement:', {
        ...(editing && { id: editing }),
        ...formData,
        created_by: walletAddress
      });
      
      const response = await fetch('/api/announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editing && { id: editing }),
          ...formData,
          created_by: walletAddress
        })
      });

      const result = await response.json();
      console.log('Response:', result);

      if (response.ok) {
        setSuccess(editing ? 'Announcement updated successfully!' : 'Announcement created successfully!');
        fetchAnnouncements();
        resetForm();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save announcement');
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      setError('Network error occurred. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      const response = await fetch(`/api/announcements?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const response = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: announcement.id,
          is_active: !announcement.is_active
        })
      });

      if (response.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error toggling announcement status:', error);
    }
  };

  const startEdit = (announcement: Announcement) => {
    setEditing(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      is_expandable: announcement.is_expandable,
      expires_at: announcement.expires_at || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      is_expandable: true,
      expires_at: ''
    });
    setEditing(null);
    setShowForm(false);
    setError(null);
    setSuccess(null);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'course': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'event': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'bounty': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'system': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">Loading announcements...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Megaphone className="w-6 h-6" />
              Academy Announcements Management
            </CardTitle>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-cyan-500/30 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  {success}
                </div>
              )}
              <div>
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="New Course: Trading Psychology"
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
                  placeholder="Master the mental game of trading..."
                  className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-white">Category</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="bounty">Bounty</SelectItem>
                      <SelectItem value="system">System</SelectItem>
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_expandable"
                  checked={formData.is_expandable}
                  onChange={(e) => setFormData({ ...formData, is_expandable: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_expandable" className="text-white cursor-pointer">
                  Make expandable (allow users to expand/collapse)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={submitLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {submitLoading ? 'Saving...' : (editing ? 'Update' : 'Create')} Announcement
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No announcements yet</p>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id} className={`${getCategoryColor(announcement.category)} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{announcement.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(announcement.category)} uppercase font-semibold`}>
                            {announcement.category}
                          </span>
                          {!announcement.is_active && (
                            <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                              Inactive
                            </span>
                          )}
                        </div>
                        {announcement.is_expandable ? (
                          <>
                            <p className="text-sm mb-2">
                              {expanded.has(announcement.id) 
                                ? announcement.content 
                                : announcement.content.slice(0, 100) + '...'}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleExpanded(announcement.id)}
                              className="text-xs"
                            >
                              {expanded.has(announcement.id) ? (
                                <><ChevronUp className="w-3 h-3 mr-1" /> Show less</>
                              ) : (
                                <><ChevronDown className="w-3 h-3 mr-1" /> Show more</>
                              )}
                            </Button>
                          </>
                        ) : (
                          <p className="text-sm mb-2">{announcement.content}</p>
                        )}
                        <p className="text-xs opacity-75">📅 Posted: {new Date(announcement.posted_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(announcement)}
                          className="border-slate-600"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(announcement)}
                          className={announcement.is_active ? 'border-orange-600' : 'border-green-600'}
                        >
                          {announcement.is_active ? '👁️' : '🔒'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(announcement.id)}
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

