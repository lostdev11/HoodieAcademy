'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Star, TrendingUp, Clock, Users } from 'lucide-react';
import { Submission } from '@/types/submission';

interface SubmissionCardProps {
  submission: Submission;
  currentWalletAddress?: string;
  currentUserSquad?: string;
  onUpvote?: (submissionId: string, emoji: string) => void;
}

const EMOJI_REACTIONS = [
  { emoji: '🔥', label: 'Fire', color: 'text-orange-400' },
  { emoji: '💎', label: 'Diamond', color: 'text-blue-400' },
  { emoji: '🚀', label: 'Rocket', color: 'text-purple-400' },
  { emoji: '⭐', label: 'Star', color: 'text-yellow-400' },
  { emoji: '❤️', label: 'Heart', color: 'text-red-400' },
  { emoji: '👑', label: 'Crown', color: 'text-yellow-500' }
];

export const SubmissionCard = ({ 
  submission, 
  currentWalletAddress, 
  currentUserSquad,
  onUpvote 
}: SubmissionCardProps) => {
  const [upvotes, setUpvotes] = useState(submission.upvotes || {});
  const [totalUpvotes, setTotalUpvotes] = useState(submission.totalUpvotes || 0);
  const [isLoading, setIsLoading] = useState(false);

  const getSquadColor = (squad: string) => {
    switch (squad) {
      case 'Creators': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Decoders': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'Speakers': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Raiders': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleUpvote = async (emoji: string) => {
    if (!currentWalletAddress) {
      // Handle guest user or prompt login
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/submissions/upvote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: submission.id,
          emoji,
          walletAddress: currentWalletAddress,
          squad: currentUserSquad
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUpvotes(data.upvotes);
        setTotalUpvotes(data.totalUpvotes);
        onUpvote?.(submission.id, emoji);
      }
    } catch (error) {
      console.error('Error upvoting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isUserUpvoted = (emoji: string) => {
    if (!currentWalletAddress || !upvotes[emoji]) return false;
    return upvotes[emoji].some(vote => vote.walletAddress === currentWalletAddress);
  };

  const getUpvoteCount = (emoji: string) => {
    return upvotes[emoji]?.length || 0;
  };

  const isSquadFavorite = () => {
    if (!currentUserSquad) return false;
    const squadVotes = Object.values(upvotes).flat().filter(vote => vote.squad === currentUserSquad);
    return squadVotes.length > 0;
  };

  const isTrending = () => {
    const recentVotes = Object.values(upvotes).flat().filter(vote => {
      const voteTime = new Date(vote.timestamp).getTime();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return voteTime > oneDayAgo;
    });
    return recentVotes.length >= 3;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-white text-lg mb-2">{submission.title}</CardTitle>
            <p className="text-gray-300 text-sm line-clamp-3">{submission.description}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={getSquadColor(submission.squad)}>
              {submission.squad}
            </Badge>
            <Badge className={getStatusColor(submission.status)}>
              {submission.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatTimestamp(submission.timestamp)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{submission.author || 'Anonymous'}</span>
          </div>
          {isSquadFavorite() && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-4 h-4" />
              <span>Squad Favorite</span>
            </div>
          )}
          {isTrending() && (
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>Trending</span>
            </div>
          )}
        </div>

        {/* Upvote Reactions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {EMOJI_REACTIONS.map(({ emoji, label, color }) => {
            const count = getUpvoteCount(emoji);
            const isUpvoted = isUserUpvoted(emoji);
            
            return (
              <Button
                key={emoji}
                variant="outline"
                size="sm"
                onClick={() => handleUpvote(emoji)}
                disabled={isLoading}
                className={`border-gray-600 hover:border-gray-500 ${
                  isUpvoted ? 'bg-gray-700 border-gray-500' : 'bg-gray-800'
                }`}
              >
                <span className="text-lg mr-1">{emoji}</span>
                <span className={`text-sm ${isUpvoted ? color : 'text-gray-400'}`}>
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Total Upvotes */}
        {totalUpvotes > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{totalUpvotes} total reactions</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 