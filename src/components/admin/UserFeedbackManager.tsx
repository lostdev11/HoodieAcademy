"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  RefreshCw, 
  Filter,
  Bug,
  Sparkles,
  TrendingUp,
  Palette,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { LinkifyText } from "./LinkifyText";

interface UserFeedback {
  id: string;
  title: string;
  description: string;
  category: 'bug_report' | 'feature_request' | 'improvement' | 'ui_ux' | 'performance';
  status: 'pending' | 'reviewing' | 'approved' | 'implemented' | 'rejected';
  wallet_address: string;
  upvotes: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface UserFeedbackManagerProps {
  walletAddress?: string;
}

const CATEGORY_CONFIG = {
  bug_report: { icon: Bug, label: 'Bug Report', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  feature_request: { icon: Sparkles, label: 'Feature Request', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  improvement: { icon: TrendingUp, label: 'Improvement', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  ui_ux: { icon: Palette, label: 'UI/UX', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50' },
  performance: { icon: Zap, label: 'Performance', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' }
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50', icon: Clock },
  reviewing: { label: 'Reviewing', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', icon: Eye },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: CheckCircle },
  implemented: { label: 'Implemented', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: XCircle }
};

export default function UserFeedbackManager({ walletAddress }: UserFeedbackManagerProps) {
  const [submissions, setSubmissions] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterCategory !== 'all' && { category: filterCategory })
      });

      const response = await fetch(`/api/user-feedback?${params}&t=${Date.now()}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filterStatus, filterCategory]);

  const handleStatusUpdate = async (id: string, newStatus: string, adminNotes?: string) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/user-feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          admin_notes: adminNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchSubmissions();
      setSelectedFeedback(null);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 7) return date.toLocaleDateString();
    if (diffInDays > 0) return `${diffInDays}d ago`;
    if (diffInHours > 0) return `${diffInHours}h ago`;
    if (diffInMinutes > 0) return `${diffInMinutes}m ago`;
    return 'Just now';
  };

  const filteredSubmissions = submissions;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-400 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              User Feedback Submissions
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSubmissions}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-blue-400"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="approved">Approved</option>
                <option value="implemented">Implemented</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
              >
                <option value="all">All</option>
                <option value="bug_report">Bug Report</option>
                <option value="feature_request">Feature Request</option>
                <option value="improvement">Improvement</option>
                <option value="ui_ux">UI/UX</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const count = submissions.filter(s => s.status === key).length;
              return (
                <div key={key} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center space-x-2 mb-1">
                    <config.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">{config.label}</span>
                  </div>
                  <p className="text-xl font-bold text-white">{count}</p>
                </div>
              );
            })}
          </div>

          {/* Submissions List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {loading && submissions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Loading submissions...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400 py-8">
                <p>{error}</p>
                <Button onClick={fetchSubmissions} className="mt-4" size="sm">
                  Try Again
                </Button>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No submissions found</p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => {
                const CategoryIcon = CATEGORY_CONFIG[submission.category].icon;
                const categoryConfig = CATEGORY_CONFIG[submission.category];
                const statusConfig = STATUS_CONFIG[submission.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={submission.id}
                    className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className={`p-1.5 rounded-md ${categoryConfig.color}`}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white">{submission.title}</h4>
                          <p className="text-xs text-gray-500">
                            {submission.wallet_address === 'anonymous' 
                              ? 'Anonymous' 
                              : `${submission.wallet_address.slice(0, 6)}...${submission.wallet_address.slice(-4)}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${statusConfig.color} flex items-center space-x-1`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusConfig.label}</span>
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                      <LinkifyText text={submission.description} />
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs">
                        <Badge variant="outline" className={categoryConfig.color}>
                          {categoryConfig.label}
                        </Badge>
                        <span className="text-gray-500">{getTimeAgo(submission.created_at)}</span>
                        {submission.upvotes > 0 && (
                          <span className="text-green-400">↑ {submission.upvotes}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFeedback(submission)}
                          className="text-xs border-blue-500 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-blue-500/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Feedback Details</span>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{selectedFeedback.title}</h3>
                <p className="text-gray-300 whitespace-pre-wrap">
                  <LinkifyText text={selectedFeedback.description} />
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <Badge variant="outline" className={CATEGORY_CONFIG[selectedFeedback.category].color}>
                    {CATEGORY_CONFIG[selectedFeedback.category].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Status</p>
                  <Badge variant="outline" className={STATUS_CONFIG[selectedFeedback.status].color}>
                    {STATUS_CONFIG[selectedFeedback.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted By</p>
                  <p className="text-sm text-white">
                    {selectedFeedback.wallet_address === 'anonymous' 
                      ? 'Anonymous' 
                      : selectedFeedback.wallet_address}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Upvotes</p>
                  <p className="text-sm text-white">{selectedFeedback.upvotes}</p>
                </div>
              </div>

              {selectedFeedback.admin_notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Admin Notes</p>
                  <p className="text-sm text-gray-300 bg-slate-700/50 p-3 rounded-lg">
                    {selectedFeedback.admin_notes}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-600">
                <p className="text-xs text-gray-500 mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <Button
                      key={key}
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedFeedback.id, key)}
                      disabled={updating || selectedFeedback.status === key}
                      className={`text-xs ${
                        selectedFeedback.status === key
                          ? 'bg-green-500/20 text-green-400 border-green-500'
                          : 'bg-slate-700 text-gray-300 border-slate-600'
                      }`}
                    >
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

