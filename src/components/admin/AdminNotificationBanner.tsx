'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  FileText, 
  MessageSquare, 
  Users, 
  X, 
  ChevronRight,
  Clock,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface AdminNotificationBannerProps {
  walletAddress: string | null;
  isAdmin: boolean;
}

interface NotificationCounts {
  newSubmissions: number;
  newFeedback: number;
  newUsers: number;
}

export default function AdminNotificationBanner({ walletAddress, isAdmin }: AdminNotificationBannerProps) {
  const [counts, setCounts] = useState<NotificationCounts>({
    newSubmissions: 0,
    newFeedback: 0,
    newUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin || !walletAddress || dismissed) {
      return;
    }

    const fetchCounts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/notifications/counts?wallet=${walletAddress}&is_admin=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch notification counts');
        }

        const data = await response.json();
        
        if (data.success && data.counts) {
          setCounts({
            newSubmissions: data.counts.newSubmissions || 0,
            newFeedback: data.counts.newFeedback || 0,
            newUsers: data.counts.newUsers || 0
          });
        }
      } catch (err) {
        console.error('Error fetching admin notification counts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();

    // Refresh every 2 minutes
    const interval = setInterval(fetchCounts, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAdmin, walletAddress, dismissed]);

  // Don't show if not admin, dismissed, or no important items
  if (!isAdmin || dismissed || (!loading && counts.newSubmissions === 0 && counts.newFeedback === 0 && counts.newUsers === 0)) {
    return null;
  }

  const totalItems = counts.newSubmissions + counts.newFeedback + counts.newUsers;
  const hasUrgentItems = counts.newSubmissions > 0 || counts.newFeedback > 0;

  return (
    <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10 dark:bg-yellow-500/5">
      <AlertCircle className="h-5 w-5 text-yellow-500" />
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <AlertTitle className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
            <span>Admin Dashboard - Action Required</span>
            {loading && (
              <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
            )}
          </AlertTitle>
          <AlertDescription className="text-slate-300 space-y-3">
            <p className="text-sm font-medium">
              You have <span className="text-yellow-400 font-bold">{totalItems}</span> item{totalItems !== 1 ? 's' : ''} requiring your attention:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {/* Pending Submissions */}
              {counts.newSubmissions > 0 && (
                <Link 
                  href="/admin-dashboard" 
                  className="group flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-yellow-500/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        Pending Submissions
                      </div>
                      <div className="text-xs text-slate-400">
                        Bounty submissions awaiting review
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/50">
                      {counts.newSubmissions}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-yellow-400 transition-colors" />
                  </div>
                </Link>
              )}

              {/* Pending Feedback */}
              {counts.newFeedback > 0 && (
                <Link 
                  href="/admin-dashboard" 
                  className="group flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-yellow-500/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <MessageSquare className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        User Feedback
                      </div>
                      <div className="text-xs text-slate-400">
                        Feedback submissions to review
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/50">
                      {counts.newFeedback}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-yellow-400 transition-colors" />
                  </div>
                </Link>
              )}

              {/* New Users */}
              {counts.newUsers > 0 && (
                <Link 
                  href="/admin-dashboard" 
                  className="group flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-yellow-500/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Users className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        New Users
                      </div>
                      <div className="text-xs text-slate-400">
                        Users joined in last 7 days
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      {counts.newUsers}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-yellow-400 transition-colors" />
                  </div>
                </Link>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-400 mt-2">
                Error loading notifications: {error}
              </p>
            )}
          </AlertDescription>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="ml-4 h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          onClick={() => setDismissed(true)}
          title="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

