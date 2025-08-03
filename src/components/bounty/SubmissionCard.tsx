'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Star, Trophy, Users, Calendar } from 'lucide-react';

interface Submission {
  id: string;
  title: string;
  description: string;
  squad: string;
  courseRef?: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  upvotes?: Record<string, Array<{ walletAddress: string; squad: string; timestamp: string }>>;
  totalUpvotes?: number;
  imageUrl?: string;
  author?: string;
  walletAddress?: string;
}

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

  const getSquadFavoriteCount = () => {
    if (!upvotes['⭐']) return 0;
    return upvotes['⭐'].length;
  };

  const isSquadFavorite = () => {
    return getSquadFavoriteCount() >= 3; // Consider it a squad favorite if 3+ stars
  };

  return (
    <Card className="border border-indigo-500/30 bg-gray-800/50 hover:shadow-indigo-500/30 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={submission.author ? `/api/avatar/${submission.author}` : undefined} />
              <AvatarFallback className="bg-purple-600 text-white">
                {submission.author ? submission.author.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-white">{submission.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                {submission.squad && (
                  <Badge className={`${getSquadColor(submission.squad)} text-xs`}>
                    {submission.squad}
                  </Badge>
                )}
                <Badge className={`${getStatusColor(submission.status)} text-xs`}>
                  {submission.status}
                </Badge>
                {isSquadFavorite() && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Squad Favorite
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            {new Date(submission.timestamp).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {submission.imageUrl && (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={submission.imageUrl} 
              alt={submission.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        <p className="text-gray-300 leading-relaxed">{submission.description}</p>

        {submission.courseRef && (
          <div className="text-sm text-purple-400">
            📚 Related Course: {submission.courseRef}
          </div>
        )}

        {/* Emoji Reactions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{totalUpvotes} reactions</span>
            {getSquadFavoriteCount() > 0 && (
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4" />
                {getSquadFavoriteCount()} squad favorites
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {EMOJI_REACTIONS.map(({ emoji, label, color }) => {
              const voteCount = upvotes[emoji]?.length || 0;
              const isUpvoted = isUserUpvoted(emoji);
              
              return (
                <Button
                  key={emoji}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => handleUpvote(emoji)}
                  className={`
                    ${isUpvoted ? 'bg-purple-500/20 border-purple-500/50' : 'border-gray-600'}
                    ${color} hover:bg-purple-500/20 transition-all duration-200
                  `}
                >
                  <span className="text-lg mr-1">{emoji}</span>
                  <span className="text-xs">{voteCount}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Squad Breakdown */}
        {Object.keys(upvotes).length > 0 && (
          <div className="pt-3 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Squad Reactions:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(upvotes).map(([emoji, votes]) => {
                const squadBreakdown = votes.reduce((acc: Record<string, number>, vote: any) => {
                  acc[vote.squad] = (acc[vote.squad] || 0) + 1;
                  return acc;
                }, {});

                return (
                  <div key={emoji} className="flex items-center gap-1 text-xs">
                    <span>{emoji}</span>
                    {Object.entries(squadBreakdown).map(([squad, count]) => (
                      <Badge key={squad} className={`${getSquadColor(squad)} text-xs`}>
                        {squad}: {count}
                      </Badge>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 