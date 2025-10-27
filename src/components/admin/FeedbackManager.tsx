"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle, 
  Plus, 
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { LinkifyText } from "./LinkifyText";

interface FeedbackUpdate {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  requested_by?: string;
  fixed_date: string;
  upvotes: number;
  priority: number;
  is_active: boolean;
}

interface FeedbackManagerProps {
  walletAddress?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'bug_fix', label: 'Bug Fix' },
  { value: 'feature', label: 'New Feature' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'ui_ux', label: 'UI/UX' },
  { value: 'performance', label: 'Performance' }
];

const STATUS_OPTIONS = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'planned', label: 'Planned' }
];

export default function FeedbackManager({ walletAddress }: FeedbackManagerProps) {
  const [updates, setUpdates] = useState<FeedbackUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('bug_fix');
  const [status, setStatus] = useState('fixed');
  const [requestedBy, setRequestedBy] = useState('');
  const [priority, setPriority] = useState('5');

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/feedback-updates?limit=50&t=${Date.now()}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch feedback updates');
      }

      const data = await response.json();
      setUpdates(data.updates || []);
    } catch (err) {
      console.error('Error fetching updates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      setError('Wallet not connected');
      return;
    }

    if (!title || !description) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/feedback-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          status,
          requested_by: requestedBy || null,
          priority: parseInt(priority),
          adminWallet: walletAddress
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create update');
      }

      setSuccess('Feedback update created successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('bug_fix');
      setStatus('fixed');
      setRequestedBy('');
      setPriority('5');

      // Refresh the list
      await fetchUpdates();

    } catch (err) {
      console.error('Error creating update:', err);
      setError(err instanceof Error ? err.message : 'Failed to create update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Update */}
      <Card className="bg-slate-800/50 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create New Feedback Update
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., XP System Cache Fix"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of what was fixed or implemented..."
                className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-white">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority" className="text-white">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  placeholder="0-10"
                  min="0"
                  max="10"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="requested_by" className="text-white">Requested By (optional)</Label>
              <Input
                id="requested_by"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder="User wallet or name"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Update
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Updates */}
      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-400 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Existing Updates ({updates.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUpdates}
              disabled={loading}
              className="text-blue-400 border-blue-500/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No updates yet</p>
          ) : (
            <div className="space-y-3">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-semibold">{update.title}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        Priority: {update.priority}
                      </Badge>
                      <Badge 
                        variant={update.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {update.is_active ? 'Active' : 'Hidden'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    <LinkifyText text={update.description} />
                  </p>
                  <div className="flex items-center space-x-3 text-xs">
                    <Badge variant="outline">{update.category.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{update.status.replace('_', ' ')}</Badge>
                    <span className="text-gray-500">
                      {new Date(update.fixed_date).toLocaleDateString()}
                    </span>
                    {update.upvotes > 0 && (
                      <span className="text-green-400">👍 {update.upvotes}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

