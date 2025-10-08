'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Plus, Edit2, Trash2, Save, X, Star } from 'lucide-react';

interface Spotlight {
  id: string;
  quote: string;
  author: string;
  author_title?: string;
  author_squad?: string;
  author_image?: string;
  is_active: boolean;
  featured_at: string;
}

export default function SpotlightManager({ walletAddress }: { walletAddress: string }) {
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    quote: '',
    author: '',
    author_title: '',
    author_squad: '',
    author_image: ''
  });

  useEffect(() => {
    fetchSpotlights();
  }, []);

  const fetchSpotlights = async () => {
    try {
      const response = await fetch('/api/spotlight?includeInactive=true');
      const data = await response.json();
      if (data.success) {
        setSpotlights(data.spotlights);
      }
    } catch (error) {
      console.error('Error fetching spotlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editing ? 'PUT' : 'POST';
      
      const response = await fetch('/api/spotlight', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editing && { id: editing }),
          ...formData,
          created_by: walletAddress
        })
      });

      if (response.ok) {
        fetchSpotlights();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving spotlight:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this spotlight?')) return;
    
    try {
      const response = await fetch(`/api/spotlight?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchSpotlights();
      }
    } catch (error) {
      console.error('Error deleting spotlight:', error);
    }
  };

  const handleToggleActive = async (spotlight: Spotlight) => {
    try {
      const response = await fetch('/api/spotlight', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: spotlight.id,
          is_active: !spotlight.is_active
        })
      });

      if (response.ok) {
        fetchSpotlights();
      }
    } catch (error) {
      console.error('Error toggling spotlight status:', error);
    }
  };

  const startEdit = (spotlight: Spotlight) => {
    setEditing(spotlight.id);
    setFormData({
      quote: spotlight.quote,
      author: spotlight.author,
      author_title: spotlight.author_title || '',
      author_squad: spotlight.author_squad || '',
      author_image: spotlight.author_image || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      quote: '',
      author: '',
      author_title: '',
      author_squad: '',
      author_image: ''
    });
    setEditing(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">Loading spotlights...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Academy Spotlight Management
            </CardTitle>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Spotlight
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-purple-500/30 space-y-4">
              <div>
                <Label htmlFor="quote" className="text-white">Quote</Label>
                <Textarea
                  id="quote"
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  placeholder="In the chaos of the market, find your rhythm."
                  className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="author" className="text-white">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="RangerPrime"
                    className="bg-slate-800 border-slate-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="author_title" className="text-white">Author Title</Label>
                  <Input
                    id="author_title"
                    value={formData.author_title}
                    onChange={(e) => setFormData({ ...formData, author_title: e.target.value })}
                    placeholder="Rangers Lead"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="author_squad" className="text-white">Squad</Label>
                  <Input
                    id="author_squad"
                    value={formData.author_squad}
                    onChange={(e) => setFormData({ ...formData, author_squad: e.target.value })}
                    placeholder="Rangers"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="author_image" className="text-white">Author Image URL</Label>
                  <Input
                    id="author_image"
                    value={formData.author_image}
                    onChange={(e) => setFormData({ ...formData, author_image: e.target.value })}
                    placeholder="https://..."
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  {editing ? 'Update' : 'Create'} Spotlight
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {spotlights.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No spotlights yet</p>
            ) : (
              spotlights.map((spotlight, index) => (
                <Card key={spotlight.id} className={`border ${
                  index === 0 && spotlight.is_active 
                    ? 'border-purple-500/50 bg-purple-500/10' 
                    : 'border-purple-500/30 bg-purple-500/5'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {index === 0 && spotlight.is_active && (
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-yellow-400 font-semibold">CURRENTLY FEATURED</span>
                          </div>
                        )}
                        <div className="bg-slate-800/50 p-4 rounded-lg mb-3 border-l-4 border-purple-500">
                          <p className="text-lg italic text-purple-200 mb-2">
                            "{spotlight.quote}"
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {spotlight.author_image && (
                            <img 
                              src={spotlight.author_image} 
                              alt={spotlight.author}
                              className="w-10 h-10 rounded-full border-2 border-purple-500/50"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-white">— {spotlight.author}</p>
                            {spotlight.author_title && (
                              <p className="text-sm text-purple-300">{spotlight.author_title}</p>
                            )}
                            {spotlight.author_squad && (
                              <p className="text-xs text-purple-400">{spotlight.author_squad}</p>
                            )}
                          </div>
                        </div>
                        {!spotlight.is_active && (
                          <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                            Inactive
                          </span>
                        )}
                        <p className="text-xs opacity-75 mt-2">✨ Featured: {new Date(spotlight.featured_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(spotlight)}
                          className="border-slate-600"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(spotlight)}
                          className={spotlight.is_active ? 'border-orange-600' : 'border-green-600'}
                        >
                          {spotlight.is_active ? '👁️' : '🔒'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(spotlight.id)}
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

