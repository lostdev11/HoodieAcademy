'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Pin,
  PinOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Heart,
  ThumbsDown,
  Flag,
  TrendingUp,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SocialFeedManagerProps {
  adminWallet: string;
}

interface Post {
  id: string;
  wallet_address: string;
  content: string;
  post_type: string;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  is_pinned: boolean;
  is_hidden: boolean;
  is_reported: boolean;
  moderation_status: string;
  moderated_by?: string;
  moderation_reason?: string;
  tags?: string[];
  squad?: string;
  created_at: string;
  author?: {
    display_name: string;
    level: number;
    squad: string;
    is_admin: boolean;
    banned: boolean;
  };
}

export default function SocialFeedManager({ adminWallet }: SocialFeedManagerProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    flagged: 0,
    hidden: 0
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (adminWallet) {
      fetchPosts();
      fetchAnalytics();
    }
  }, [adminWallet, filterStatus]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        adminWallet,
        limit: '50'
      });

      if (filterStatus !== 'all') {
        if (filterStatus === 'flagged') {
          params.append('flagged', 'true');
        } else {
          params.append('status', filterStatus);
        }
      }

      const response = await fetch(`/api/admin/social?${params}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/social', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminWallet })
      });

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleModerate = async (postId: string, action: string, reason?: string) => {
    try {
      setProcessing(postId);

      const response = await fetch('/api/admin/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminWallet,
          postId,
          action,
          reason
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh posts
        fetchPosts();
        alert(`Post ${action}ed successfully!`);
      } else {
        alert(`Failed to ${action} post: ` + data.error);
      }
    } catch (error) {
      console.error('Error moderating post:', error);
      alert('Failed to moderate post');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">✓ Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600">⏳ Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600">✗ Rejected</Badge>;
      case 'flagged':
        return <Badge className="bg-orange-600">⚠ Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <Card className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 border-pink-500/30">
        <CardHeader>
          <CardTitle className="text-pink-400 flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-6 h-6 mr-2" />
              Social Feed Moderation
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchPosts();
                fetchAnalytics();
              }}
              className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400">Total Posts</p>
            </div>
            <div className="bg-green-900/30 rounded-lg p-3 text-center border border-green-500/30">
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              <p className="text-xs text-gray-400">Approved</p>
            </div>
            <div className="bg-yellow-900/30 rounded-lg p-3 text-center border border-yellow-500/30">
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-xs text-gray-400">Pending</p>
            </div>
            <div className="bg-red-900/30 rounded-lg p-3 text-center border border-red-500/30">
              <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              <p className="text-xs text-gray-400">Rejected</p>
            </div>
            <div className="bg-orange-900/30 rounded-lg p-3 text-center border border-orange-500/30">
              <p className="text-2xl font-bold text-orange-400">{stats.flagged}</p>
              <p className="text-xs text-gray-400">Flagged</p>
            </div>
            <div className="bg-gray-900/30 rounded-lg p-3 text-center border border-gray-500/30">
              <p className="text-2xl font-bold text-gray-400">{stats.hidden}</p>
              <p className="text-xs text-gray-400">Hidden</p>
            </div>
          </div>

          {/* Analytics */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-2 bg-slate-700/30 rounded p-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300">{analytics.totalComments} Comments</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-700/30 rounded p-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <span className="text-gray-300">{analytics.totalReactions} Reactions</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-700/30 rounded p-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">{analytics.topPosters?.length || 0} Active Posters</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'approved', 'pending', 'rejected', 'flagged'].map(filter => (
          <Button
            key={filter}
            variant={filterStatus === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(filter)}
            className={filterStatus === filter ? 'bg-pink-600' : ''}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
            <p className="text-gray-400">Loading posts...</p>
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">No posts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <Card key={post.id} className={`${
              post.is_hidden ? 'opacity-60 border-gray-600' :
              post.is_reported ? 'border-orange-500' :
              post.is_pinned ? 'border-yellow-500' :
              'border-slate-600'
            }`}>
              <CardContent className="p-6">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {post.author?.display_name?.[0] || post.wallet_address[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">
                          {post.author?.display_name || `${post.wallet_address.slice(0, 6)}...${post.wallet_address.slice(-4)}`}
                        </span>
                        {post.author?.is_admin && (
                          <Badge className="bg-blue-600 text-xs">Admin</Badge>
                        )}
                        {post.author?.banned && (
                          <Badge className="bg-red-600 text-xs">Banned</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{getTimeAgo(post.created_at)}</span>
                        {post.squad && <span>• {post.squad}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(post.moderation_status)}
                    {post.is_pinned && <Badge className="bg-yellow-600">📌 Pinned</Badge>}
                    {post.is_hidden && <Badge className="bg-gray-600">👁️ Hidden</Badge>}
                    {post.is_reported && <Badge className="bg-orange-600">⚠️ Reported</Badge>}
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                  
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center space-x-4 text-sm mb-4">
                  <div className="flex items-center space-x-1 text-pink-400">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes_count}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400">
                    <ThumbsDown className="w-4 h-4" />
                    <span>{post.dislikes_count}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-cyan-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments_count}</span>
                  </div>
                </div>

                {/* Moderation Reason */}
                {post.moderation_reason && (
                  <div className="bg-slate-700/50 rounded p-3 mb-4 text-sm">
                    <p className="text-gray-400">
                      <strong>Reason:</strong> {post.moderation_reason}
                    </p>
                    {post.moderated_by && (
                      <p className="text-xs text-gray-500 mt-1">
                        By: {post.moderated_by.slice(0, 8)}... on {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
                  <Button
                    size="sm"
                    onClick={() => handleModerate(post.id, 'approve')}
                    disabled={processing === post.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleModerate(post.id, 'reject', 'Violated community guidelines')}
                    disabled={processing === post.id}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerate(post.id, post.is_hidden ? 'unhide' : 'hide')}
                    disabled={processing === post.id}
                    className="border-gray-500/30"
                  >
                    {post.is_hidden ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                    {post.is_hidden ? 'Unhide' : 'Hide'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerate(post.id, post.is_pinned ? 'unpin' : 'pin')}
                    disabled={processing === post.id}
                    className="border-yellow-500/30 text-yellow-400"
                  >
                    {post.is_pinned ? <PinOff className="w-4 h-4 mr-1" /> : <Pin className="w-4 h-4 mr-1" />}
                    {post.is_pinned ? 'Unpin' : 'Pin'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
                        handleModerate(post.id, 'delete');
                      }
                    }}
                    disabled={processing === post.id}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

