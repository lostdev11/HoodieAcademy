"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Bug, 
  Wrench,
  Palette,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface FeedbackUpdate {
  id: string;
  title: string;
  description: string;
  category: 'bug_fix' | 'feature' | 'improvement' | 'ui_ux' | 'performance';
  status: 'fixed' | 'in_progress' | 'planned';
  requested_by?: string;
  fixed_date: string;
  upvotes: number;
  priority: number;
}

interface FeedbackTrackerWidgetProps {
  limit?: number;
  showTitle?: boolean;
  compact?: boolean;
  className?: string;
}

const CATEGORY_CONFIG = {
  bug_fix: {
    icon: Bug,
    label: 'Bug Fix',
    color: 'bg-red-500/20 text-red-400 border-red-500/50'
  },
  feature: {
    icon: Sparkles,
    label: 'New Feature',
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
  fixed: {
    label: 'Fixed',
    color: 'bg-green-500/20 text-green-400 border-green-500/50'
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
  },
  planned: {
    label: 'Planned',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
  }
};

export default function FeedbackTrackerWidget({ 
  limit = 5, 
  showTitle = true,
  compact = false,
  className = "" 
}: FeedbackTrackerWidgetProps) {
  const router = useRouter();
  const [updates, setUpdates] = useState<FeedbackUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUpdates = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(
        `/api/feedback-updates?limit=${limit}&t=${Date.now()}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch feedback updates');
      }

      const data = await response.json();
      setUpdates(data.updates || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching feedback updates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load updates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUpdates();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchUpdates();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [limit]);

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

  if (loading && updates.length === 0) {
    return (
      <Card className={`bg-slate-800/50 border-green-500/30 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading updates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-slate-800/50 border-red-500/30 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            <p className="mb-2">Failed to load updates</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchUpdates}
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
    <Card className={`bg-slate-800/50 border-green-500/30 ${className}`}>
      {showTitle && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-green-400 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              You Asked, We Fixed
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchUpdates}
              disabled={refreshing}
              className="text-xs text-gray-400 hover:text-green-400"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        {updates.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No updates yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map((update) => {
              const CategoryIcon = CATEGORY_CONFIG[update.category].icon;
              const categoryConfig = CATEGORY_CONFIG[update.category];
              const statusConfig = STATUS_CONFIG[update.status];

              return (
                <div
                  key={update.id}
                  className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-green-500/50 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className={`p-1.5 rounded-md ${categoryConfig.color}`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors truncate">
                          {update.title}
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

                  {!compact && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                      {update.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${categoryConfig.color}`}
                      >
                        {categoryConfig.label}
                      </Badge>
                      <span className="text-gray-500">
                        {getTimeAgo(update.fixed_date)}
                      </span>
                    </div>
                    {update.upvotes > 0 && (
                      <div className="flex items-center space-x-1 text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>{update.upvotes}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {updates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-600/50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Showing {updates.length} recent update{updates.length !== 1 ? 's' : ''}</span>
              <button 
                onClick={() => router.push('/feedback')} 
                className="flex items-center space-x-1 hover:text-green-400 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

