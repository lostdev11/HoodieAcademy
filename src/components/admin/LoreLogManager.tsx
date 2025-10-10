"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ScrollText, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Calendar,
  FileText,
  Save,
  X
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface LoreEntry {
  id: string;
  title: string;
  content: string;
  entry_date: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

interface LoreLogManagerProps {
  walletAddress: string;
}

export default function LoreLogManager({ walletAddress }: LoreLogManagerProps) {
  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LoreEntry | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    entry_date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  // Fetch lore entries
  const fetchLoreEntries = async () => {
    try {
      const response = await fetch('/api/admin/lore-log?limit=50');
      if (response.ok) {
        const data = await response.json();
        setLoreEntries(data.loreEntries || []);
      }
    } catch (error) {
      console.error('Error fetching lore entries:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchLoreEntries();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingEntry ? '/api/admin/lore-log' : '/api/admin/lore-log';
      const method = editingEntry ? 'PUT' : 'POST';
      
      const body = editingEntry 
        ? { ...formData, id: editingEntry.id, admin_wallet: walletAddress }
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
        if (editingEntry) {
          setLoreEntries(prev => prev.map(entry => 
            entry.id === editingEntry.id ? data.loreEntry : entry
          ));
        } else {
          setLoreEntries(prev => [data.loreEntry, ...prev]);
        }
        
        resetForm();
        toast({
          title: "Success",
          description: editingEntry ? "Lore entry updated successfully!" : "Lore entry created successfully!"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save lore entry",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving lore entry:', error);
      toast({
        title: "Error",
        description: "Failed to save lore entry",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entry: LoreEntry) => {
    if (!confirm('Are you sure you want to delete this lore entry?')) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/lore-log?id=${entry.id}&admin_wallet=${walletAddress}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setLoreEntries(prev => prev.filter(e => e.id !== entry.id));
        toast({
          title: "Success",
          description: "Lore entry deleted successfully!"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete lore entry",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting lore entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete lore entry",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry: LoreEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      entry_date: entry.entry_date.split('T')[0]
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      entry_date: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
    setEditingEntry(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-green-400" />
              <span className="ml-2">Loading lore entries...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-green-400 flex items-center">
              <ScrollText className="w-5 h-5 mr-2" />
              Lore Log Management
            </CardTitle>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              {editingEntry ? 'Edit Lore Entry' : 'Create New Lore Entry'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Entry Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Entry 0042: The Glitchfire Relic"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label htmlFor="entry_date">Entry Date</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write the lore entry content here..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="bg-slate-700 border-slate-600"
                  rows={8}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {editingEntry ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingEntry ? 'Update Entry' : 'Create Entry'}
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

      {/* Lore Entries List */}
      <div className="space-y-4">
        {loreEntries.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <ScrollText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No lore entries found</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          loreEntries.map((entry) => (
            <Card key={entry.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-bold text-green-400">{entry.title}</h3>
                      <Badge variant="outline" className="text-green-400 border-green-500/30">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(entry.entry_date)}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                      {entry.content}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created: {formatDate(entry.created_at)}</span>
                      {entry.updated_at && entry.updated_at !== entry.created_at && (
                        <span>Updated: {formatDate(entry.updated_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      onClick={() => handleEdit(entry)}
                      size="sm"
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(entry)}
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
    </div>
  );
}
