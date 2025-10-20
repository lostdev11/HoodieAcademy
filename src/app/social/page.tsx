'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Send, 
  RefreshCw,
  MessageSquare,
  Heart,
  ThumbsDown,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';
import PostCard from '@/components/social/PostCard';
import TokenGate from '@/components/TokenGate';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MobileNavigation } from '@/components/dashboard/MobileNavigation';
import { Progress } from '@/components/ui/progress';
import { Lock, Sparkles } from 'lucide-react';
import { fetchUserSquad } from '@/utils/squad-api';
import Link from 'next/link';

interface Post {
  id: string;
  wallet_address: string;
  content: string;
  post_type: string;
  image_url?: string;
  link_url?: string;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  tags?: string[];
  squad?: string;
  created_at: string;
  author?: {
    display_name: string;
    level: number;
    squad: string;
  };
}

export default function SocialFeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('newest');
  const [filterSquad, setFilterSquad] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [hasUsedTrialPost, setHasUsedTrialPost] = useState(false);
  const [isTrialUser, setIsTrialUser] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const wallet = localStorage.getItem('walletAddress');
      if (wallet) {
        setWalletAddress(wallet);
        
        // Fetch complete user profile (includes XP and squad)
        try {
          const profileResponse = await fetch(`/api/user-profile?wallet=${wallet}`);
          const profileData = await profileResponse.json();
          
          if (profileData.success && profileData.profile) {
            setUserXP(profileData.profile.totalXP || 0);
            setIsTrialUser(profileData.profile.totalXP < 1000);
            setUserSquad(profileData.profile.squad?.name || null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to individual calls
          fetchUserXP(wallet);
        }
        
        // Check trial post status
        const trialKey = `trial_post_used_${wallet}`;
        const hasUsed = localStorage.getItem(trialKey) === 'true';
        setHasUsedTrialPost(hasUsed);
      }

      fetchPosts();
    };
    
    loadData();
  }, [sortBy, filterSquad]);

  const fetchUserXP = async (wallet: string) => {
    try {
      const response = await fetch(`/api/xp?wallet=${wallet}`);
      const data = await response.json();
      
      if (data.exists) {
        setUserXP(data.totalXP || 0);
        setIsTrialUser(data.totalXP < 1000);
      }
    } catch (error) {
      console.error('Error fetching user XP:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '20',
        sort: sortBy
      });

      if (filterSquad) {
        params.append('squad', filterSquad);
      }

      const response = await fetch(`/api/social/posts?${params}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
        setNeedsSetup(data.needsSetup || false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !walletAddress) {
      alert('Please write something!');
      return;
    }

    // Check if trial user trying to post again
    if (isTrialUser && hasUsedTrialPost) {
      alert('You\'ve used your free trial post! Earn 1000 XP to unlock unlimited posting.');
      return;
    }

    try {
      setPosting(true);
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          content: newPostContent,
          postType: 'text',
          squad: userSquad,
          tags: isTrialUser ? ['trial'] : [] // Tag trial posts
        })
      });

      const data = await response.json();

      if (data.success && data.post) {
        console.log('✅ Post created successfully:', data.post);
        
        // Clear the input
        setNewPostContent('');
        
        // Add new post to the top of the feed
        setPosts([data.post, ...posts]);
        
        // Mark trial as used for trial users
        if (isTrialUser) {
          localStorage.setItem(`trial_post_used_${walletAddress}`, 'true');
          setHasUsedTrialPost(true);
          alert('🎉 Trial post created successfully! Your post is now visible on the feed.\n\nEarn 1000 XP to unlock unlimited posting.');
        } else {
          alert('✅ Post created successfully! +1 XP\n\nYour post is now live on the feed.');
        }
        
        // Refresh the feed to show the new post with updated counts
        setTimeout(() => fetchPosts(), 1000);
      } else {
        console.error('Post creation failed:', data);
        alert('Failed to create post: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/social/posts?id=${postId}&wallet=${walletAddress}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setPosts(posts.filter(p => p.id !== postId));
        alert('Post deleted');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <TokenGate>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <DashboardSidebar 
            isCollapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />

          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-slate-800/50 border-b border-cyan-500/30 px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <MobileNavigation userSquad={userSquad} isAdmin={false} />
                  <div>
                    <h1 className="text-3xl font-bold text-cyan-400">🌟 Social Feed</h1>
                    <p className="text-gray-300">Connect with the Hoodie Academy community</p>
                  </div>
                </div>
              </div>
            </header>

          {/* Main Content */}
          <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full space-y-6">
            {/* Trial User Banner */}
            {isTrialUser && (
              <Card className="bg-gradient-to-r from-orange-900/30 to-pink-900/30 border-orange-500/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="text-sm font-semibold text-orange-400">
                          Trial Access • {userXP.toLocaleString()} / 1,000 XP
                        </p>
                        <p className="text-xs text-gray-300">
                          {hasUsedTrialPost ? 'Trial post used. Earn more XP to unlock full access!' : '1 free post available'}
                        </p>
                      </div>
                    </div>
                    <Link href="/courses">
                      <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                        Earn XP
                      </Button>
                    </Link>
                  </div>
                  <Progress value={(userXP / 1000) * 100} className="h-2 mt-3" />
                </CardContent>
              </Card>
            )}

            {/* Create Post Card */}
            <Card className={`bg-slate-800/50 ${isTrialUser && hasUsedTrialPost ? 'border-orange-500/50 opacity-60' : 'border-cyan-500/30'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-cyan-400">✍️ Share Your Thoughts</CardTitle>
                  {isTrialUser && (
                    <Badge className={hasUsedTrialPost ? 'bg-gray-600' : 'bg-pink-600'}>
                      {hasUsedTrialPost ? 'Trial Used' : '1 Free Post'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isTrialUser && hasUsedTrialPost ? (
                  <div className="text-center py-8">
                    <Lock className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                    <p className="text-orange-400 font-semibold mb-2">Trial Post Used</p>
                    <p className="text-sm text-gray-400 mb-4">Earn {1000 - userXP} more XP to unlock unlimited posting</p>
                    <Link href="/courses">
                      <Button className="bg-gradient-to-r from-cyan-600 to-purple-600">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Start Earning XP
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <Textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder={isTrialUser 
                        ? "Try posting! You have 1 free trial post to experience the social feed..."
                        : "What's on your mind? Share your Web3 journey, ask questions, or start a discussion..."
                      }
                      className="min-h-[100px] bg-slate-700/50 border-slate-600 text-white resize-none"
                      maxLength={isTrialUser ? 500 : 5000}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-xs text-gray-400">
                        {newPostContent.length}/{isTrialUser ? 500 : 5000} characters • 
                        {isTrialUser ? (
                          <span className="text-pink-400 font-semibold ml-1">1 free trial post</span>
                        ) : (
                          <span className="text-cyan-400 ml-1">Earn 1 XP per post</span>
                        )}
                      </div>
                      <Button
                        onClick={handleCreatePost}
                        disabled={posting || !newPostContent.trim() || (isTrialUser && hasUsedTrialPost)}
                        className={isTrialUser ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700' : 'bg-cyan-600 hover:bg-cyan-700'}
                      >
                        {posting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            {isTrialUser ? 'Post Trial' : 'Post'}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'newest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('newest')}
                  className={sortBy === 'newest' ? 'bg-cyan-600' : ''}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Newest
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('popular')}
                  className={sortBy === 'popular' ? 'bg-cyan-600' : ''}
                >
                  <Heart className="w-4 h-4 mr-1" />
                  Popular
                </Button>
                <Button
                  variant={sortBy === 'trending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('trending')}
                  className={sortBy === 'trending' ? 'bg-cyan-600' : ''}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Trending
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPosts()}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>

            {/* Posts Feed */}
            {loading ? (
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardContent className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                  <p className="text-gray-400">Loading posts...</p>
                </CardContent>
              </Card>
            ) : needsSetup ? (
              <Card className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-500/50">
                <CardContent className="p-8 text-center">
                  <Lock className="w-16 h-16 mx-auto mb-4 text-orange-400" />
                  <h3 className="text-2xl font-semibold text-orange-400 mb-2">Database Setup Required</h3>
                  <p className="text-gray-300 mb-4">
                    The social feed database tables need to be created.
                  </p>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-left max-w-2xl mx-auto">
                    <p className="text-sm text-cyan-400 font-semibold mb-2">📝 Setup Instructions:</p>
                    <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                      <li>Go to your Supabase project dashboard</li>
                      <li>Navigate to SQL Editor</li>
                      <li>Open the file: <code className="bg-slate-700 px-2 py-1 rounded text-cyan-400">setup-social-feed.sql</code></li>
                      <li>Copy and paste the contents into the SQL editor</li>
                      <li>Click "Run" to create the tables</li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-6 bg-cyan-600 hover:bg-cyan-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Page
                  </Button>
                </CardContent>
              </Card>
            ) : posts.length === 0 ? (
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No posts yet</h3>
                  <p className="text-gray-500">Be the first to share something!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentWallet={walletAddress}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </TokenGate>
  );
}

