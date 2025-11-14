'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Heart,
  ThumbsDown,
  MessageSquare,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Flame,
  Rocket,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
    wallet_address?: string;
  };
}

interface Comment {
  id: string;
  wallet_address: string;
  content: string;
  likes_count: number;
  created_at: string;
  author?: {
    display_name: string;
    level: number;
    squad: string;
  };
}

interface PostCardProps {
  post: Post;
  currentWallet: string;
  onDelete: (postId: string) => void;
  isAdmin?: boolean;
}

export default function PostCard({ post, currentWallet, onDelete, isAdmin = false }: PostCardProps) {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [localLikes, setLocalLikes] = useState(post.likes_count);
  const [localDislikes, setLocalDislikes] = useState(post.dislikes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);

  const isAuthor = currentWallet === post.wallet_address;
  const canDelete = isAuthor || isAdmin;

  useEffect(() => {
    // Fetch user's reaction
    if (currentWallet) {
      fetchUserReaction();
    }
  }, [currentWallet, post.id]);

  const fetchUserReaction = async () => {
    try {
      const response = await fetch(`/api/social/reactions?wallet=${currentWallet}&targetType=post&targetId=${post.id}`);
      const data = await response.json();
      
      if (data.success && data.reactions.length > 0) {
        setUserReaction(data.reactions[0].reaction_type);
      }
    } catch (error) {
      console.error('Error fetching reaction:', error);
    }
  };

  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    try {
      const response = await fetch('/api/social/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: currentWallet,
          targetType: 'post',
          targetId: post.id,
          reactionType
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state based on action
        if (data.action === 'removed') {
          setUserReaction(null);
          if (reactionType === 'like') {
            setLocalLikes(prev => Math.max(0, prev - 1));
          } else {
            setLocalDislikes(prev => Math.max(0, prev - 1));
          }
        } else {
          // Removed previous reaction if switching
          if (userReaction === 'like' && reactionType === 'dislike') {
            setLocalLikes(prev => Math.max(0, prev - 1));
            setLocalDislikes(prev => prev + 1);
          } else if (userReaction === 'dislike' && reactionType === 'like') {
            setLocalDislikes(prev => Math.max(0, prev - 1));
            setLocalLikes(prev => prev + 1);
          } else if (!userReaction) {
            // New reaction
            if (reactionType === 'like') {
              setLocalLikes(prev => prev + 1);
            } else {
              setLocalDislikes(prev => prev + 1);
            }
          }
          setUserReaction(reactionType);
        }
      }
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await fetch(`/api/social/comments?postId=${post.id}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    try {
      setPosting(true);
      const response = await fetch('/api/social/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: currentWallet,
          postId: post.id,
          content: newComment
        })
      });

      const data = await response.json();

      if (data.success) {
        setComments([...comments, data.comment]);
        setNewComment('');
        // Toast will be handled by parent component if needed
      }
    } catch (error) {
      // Error handling will be done by parent component
    } finally {
      setPosting(false);
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
    <Card className="bg-slate-800/50 border-slate-600/50 hover:border-cyan-500/50 transition-colors">
      <CardContent className="p-6">
        {/* Author Info */}
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
                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                  Level {post.author?.level || 1}
                </Badge>
                {post.squad && (
                  <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                    {post.squad}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-400">{getTimeAgo(post.created_at)}</span>
            </div>
          </div>

          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(post.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              title={isAdmin && !isAuthor ? 'Admin: Delete post' : 'Delete your post'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-100 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-slate-700">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 pt-4 border-t border-slate-600/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleReaction('like')}
            className={`${
              userReaction === 'like'
                ? 'text-pink-400 bg-pink-500/10'
                : 'text-gray-400 hover:text-pink-400'
            }`}
          >
            <Heart className={`w-4 h-4 mr-1 ${userReaction === 'like' ? 'fill-current' : ''}`} />
            {localLikes}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleReaction('dislike')}
            className={`${
              userReaction === 'dislike'
                ? 'text-gray-300 bg-gray-500/10'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <ThumbsDown className={`w-4 h-4 mr-1 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
            {localDislikes}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleComments}
            className="text-gray-400 hover:text-cyan-400"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            {post.comments_count}
            {showComments ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-600/50 space-y-4">
            {/* New Comment Input */}
            <div className="flex space-x-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-slate-700/50 border-slate-600 text-white resize-none"
                rows={2}
                maxLength={2000}
              />
              <Button
                onClick={handlePostComment}
                disabled={posting || !newComment.trim()}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Comments List */}
            {loadingComments ? (
              <p className="text-center text-gray-400 text-sm">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {comment.author?.display_name?.[0] || comment.wallet_address[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-semibold text-white">
                            {comment.author?.display_name || `${comment.wallet_address.slice(0, 6)}...`}
                          </span>
                          <span className="text-xs text-gray-400">{getTimeAgo(comment.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

