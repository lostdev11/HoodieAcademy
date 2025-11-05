"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Bug, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Palette,
  ChevronUp,
  Users,
  MessageSquare,
  Clock
} from 'lucide-react';

interface CommunitySubmission {
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
  completion_status: number;
  hasUserUpvoted?: boolean;
}

interface CommunitySubmissionsListProps {
  walletAddress?: string;
  limit?: number;
  showTitle?: boolean;
}

const CATEGORY_CONFIG = {
  bug_report: {
    icon: Bug,
    label: 'Bug Report',
    color: 'bg-red-500/20 text-red-400 border-red-500/50'
  },
  feature_request: {
    icon: Sparkles,
    label: 'Feature Request',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/50'
  },
  improvement: {
    icon: TrendingUp,
    label: 'Improvement',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
  },
  ui_ux: {
    icon: Palette,
    label: 'UI/UX',
    color: 'bg-pink-500/20 text-pink-400 border-pink-500/50'
  },
  performance: {
    icon: Zap,
    label: 'Performance',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
  }
};

const STATUS_CONFIG = {
  pending: {
    label: 'Under Review',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
  },
  reviewing: {
    label: 'Reviewing',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-500/20 text-green-400 border-green-500/50'
  },
  implemented: {
    label: 'Implemented',
    color: 'bg-green-600/20 text-green-300 border-green-600/50'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500/20 text-red-400 border-red-500/50'
  }
};

export default function CommunitySubmissionsList({ 
  walletAddress,
  limit = 10,
  showTitle = true 
}: CommunitySubmissionsListProps) {
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvoting, setUpvoting] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user-feedback?limit=${limit}&t=${Date.now()}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      const submissionsList = data.submissions || [];

      // Check which submissions the current user has upvoted
      if (walletAddress) {
        const submissionsWithVotes = await Promise.all(
          submissionsList.map(async (submission: CommunitySubmission) => {
            try {
              const voteResponse = await fetch(
                `/api/user-feedback/${submission.id}/upvote?wallet_address=${walletAddress}`
              );
              if (voteResponse.ok) {
                const voteData = await voteResponse.json();
                return { ...submission, hasUserUpvoted: voteData.upvoted };
              }
            } catch (err) {
              console.error('Error checking upvote status:', err);
            }
            return { ...submission, hasUserUpvoted: false };
          })
        );
        setSubmissions(submissionsWithVotes);
      } else {
        setSubmissions(submissionsList.map((s: CommunitySubmission) => ({ ...s, hasUserUpvoted: false })));
      }

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
  }, [walletAddress, limit]);

  const handleUpvote = async (submissionId: string, currentUpvoted: boolean) => {
    if (!walletAddress) {
      alert('Please connect your wallet to upvote');
      return;
    }

    setUpvoting(submissionId);
    try {
      const response = await fetch(`/api/user-feedback/${submissionId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress })
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error.includes('own feedback')) {
          alert('You cannot upvote your own feedback');
        } else {
          throw new Error(error.error || 'Failed to upvote');
        }
        return;
      }

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? {
                ...sub,
                upvotes: currentUpvoted ? sub.upvotes - 1 : sub.upvotes + 1,
                hasUserUpvoted: !currentUpvoted
              }
            : sub
        )
      );
    } catch (err) {
      console.error('Error upvoting:', err);
      alert('Failed to upvote. Please try again.');
    } finally {
      setUpvoting(null);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `${diffInDays}d ago`;
    if (diffInHours > 0) return `${diffInHours}h ago`;
    if (diffInMinutes > 0) return `${diffInMinutes}m ago`;
    return 'Just now';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-500';
      case 'approved': return 'bg-green-400';
      case 'reviewing': return 'bg-blue-400';
      case 'pending': return 'bg-gray-400';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
            <span>Loading community submissions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-red-500/30">
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            <p className="mb-2">Failed to load submissions</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSubmissions}
              className="text-xs"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-purple-400 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Community Bug Reports & Suggestions
          </CardTitle>
          <p className="text-sm text-gray-400 mt-2">
            Vote on community submissions and track their progress through implementation
          </p>
        </CardHeader>
      )}
      <CardContent className="p-6">
        {submissions.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No community submissions yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const CategoryIcon = CATEGORY_CONFIG[submission.category].icon;
              const categoryConfig = CATEGORY_CONFIG[submission.category];
              const statusConfig = STATUS_CONFIG[submission.status];

              return (
                <div
                  key={submission.id}
                  className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-purple-500/50 transition-all duration-200 group"
                >
                  {/* Header with title and status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className={`p-1.5 rounded-md ${categoryConfig.color}`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {submission.title}
                        </h4>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${statusConfig.color} ml-2 flex-shrink-0`}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                    {submission.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <Progress 
                      value={submission.completion_status} 
                      className="w-full h-2 bg-slate-900"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {submission.completion_status}% complete
                      </span>
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(submission.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Footer with category and upvote button */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${categoryConfig.color}`}
                      >
                        {categoryConfig.label}
                      </Badge>
                      <span className="flex items-center text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {getTimeAgo(submission.updated_at)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpvote(submission.id, submission.hasUserUpvoted || false)}
                      disabled={upvoting === submission.id || !walletAddress}
                      className={`h-7 px-2 text-xs ${
                        submission.hasUserUpvoted
                          ? 'text-green-400 hover:text-green-300'
                          : 'text-gray-400 hover:text-purple-400'
                      }`}
                    >
                      <ChevronUp className={`w-3 h-3 mr-1 ${submission.hasUserUpvoted ? 'text-green-400' : ''}`} />
                      {submission.upvotes || 0}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

