'use client';

import { useState, useEffect } from 'react';
import { SubmissionCard } from './SubmissionCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, TrendingUp, Clock, Users } from 'lucide-react';

interface Submission {
  id: string;
  title: string;
  description: string;
  squad: string;
  courseRef?: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  upvotes?: Record<string, Array<{ userId: string; squad: string; timestamp: string }>>;
  totalUpvotes?: number;
  imageUrl?: string;
  author?: string;
}

interface SubmissionsGalleryProps {
  bountyId: string;
  currentUserId?: string;
  currentUserSquad?: string;
}

type SortOption = 'newest' | 'oldest' | 'most-upvoted' | 'squad-favorites' | 'trending';
type FilterOption = 'all' | 'creators' | 'speakers' | 'raiders' | 'decoders' | 'approved' | 'pending' | 'rejected';

export const SubmissionsGallery = ({ 
  bountyId, 
  currentUserId, 
  currentUserSquad 
}: SubmissionsGalleryProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [bountyId]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      if (response.ok) {
        const data = await response.json();
        // Filter submissions for this specific bounty
        const bountySubmissions = data.filter((sub: any) => 
          sub.bountyId === bountyId || sub.courseRef?.includes(bountyId)
        );
        setSubmissions(bountySubmissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = (submissionId: string, emoji: string) => {
    // Update local state optimistically
    setSubmissions(prev => prev.map(sub => {
      if (sub.id === submissionId) {
        const newUpvotes = { ...sub.upvotes };
        if (!newUpvotes[emoji]) newUpvotes[emoji] = [];
        
        const existingVoteIndex = newUpvotes[emoji].findIndex(vote => vote.userId === currentUserId);
        if (existingVoteIndex !== -1) {
          newUpvotes[emoji].splice(existingVoteIndex, 1);
        } else {
          newUpvotes[emoji].push({
            userId: currentUserId!,
            squad: currentUserSquad!,
            timestamp: new Date().toISOString()
          });
        }
        
        const totalUpvotes = Object.values(newUpvotes).reduce((total: number, votes: any) => {
          return total + votes.length;
        }, 0);
        
        return { ...sub, upvotes: newUpvotes, totalUpvotes };
      }
      return sub;
    }));
  };

  const sortSubmissions = (subs: Submission[]) => {
    switch (sortBy) {
      case 'newest':
        return [...subs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      case 'oldest':
        return [...subs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      case 'most-upvoted':
        return [...subs].sort((a, b) => (b.totalUpvotes || 0) - (a.totalUpvotes || 0));
      case 'squad-favorites':
        return [...subs].sort((a, b) => {
          const aStars = a.upvotes?.['⭐']?.length || 0;
          const bStars = b.upvotes?.['⭐']?.length || 0;
          return bStars - aStars;
        });
      case 'trending':
        return [...subs].sort((a, b) => {
          // Calculate trending score based on recent upvotes
          const aRecentUpvotes = Object.values(a.upvotes || {}).reduce((total: number, votes: any) => {
            const recentVotes = votes.filter((vote: any) => 
              new Date(vote.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            );
            return total + recentVotes.length;
          }, 0);
          const bRecentUpvotes = Object.values(b.upvotes || {}).reduce((total: number, votes: any) => {
            const recentVotes = votes.filter((vote: any) => 
              new Date(vote.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            );
            return total + recentVotes.length;
          }, 0);
          return bRecentUpvotes - aRecentUpvotes;
        });
      default:
        return subs;
    }
  };

  const filterSubmissions = (subs: Submission[]) => {
    return subs.filter(sub => {
      const matchesSearch = searchTerm === '' || 
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'approved' && sub.status === 'approved') ||
        (filterBy === 'pending' && sub.status === 'pending') ||
        (filterBy === 'rejected' && sub.status === 'rejected') ||
        (filterBy === 'creators' && sub.squad === 'Creators') ||
        (filterBy === 'speakers' && sub.squad === 'Speakers') ||
        (filterBy === 'raiders' && sub.squad === 'Raiders') ||
        (filterBy === 'decoders' && sub.squad === 'Decoders');
      
      return matchesSearch && matchesFilter;
    });
  };

  const processedSubmissions = sortSubmissions(filterSubmissions(submissions));

  const getStats = () => {
    const totalSubmissions = submissions.length;
    const totalUpvotes = submissions.reduce((sum, sub) => sum + (sub.totalUpvotes || 0), 0);
    const squadFavorites = submissions.filter(sub => 
      (sub.upvotes?.['⭐']?.length || 0) >= 3
    ).length;
    const trendingSubmissions = submissions.filter(sub => {
      const recentUpvotes = Object.values(sub.upvotes || {}).reduce((total: number, votes: any) => {
        const recentVotes = votes.filter((vote: any) => 
          new Date(vote.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        return total + recentVotes.length;
      }, 0);
      return recentUpvotes >= 5;
    }).length;

    return { totalSubmissions, totalUpvotes, squadFavorites, trendingSubmissions };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Submissions</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalSubmissions}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Total Reactions</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalUpvotes}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Squad Favorites</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.squadFavorites}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Trending</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.trendingSubmissions}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white"
          />
        </div>
        <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
          <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="Filter by..." />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all">All Submissions</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="creators">Creators</SelectItem>
            <SelectItem value="speakers">Speakers</SelectItem>
            <SelectItem value="raiders">Raiders</SelectItem>
            <SelectItem value="decoders">Decoders</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="most-upvoted">Most Upvoted</SelectItem>
            <SelectItem value="squad-favorites">Squad Favorites</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Grid */}
      {processedSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No submissions found</div>
          <div className="text-gray-500 text-sm">
            {searchTerm || filterBy !== 'all' ? 'Try adjusting your filters' : 'Be the first to submit!'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {processedSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              currentUserId={currentUserId}
              currentUserSquad={currentUserSquad}
              onUpvote={handleUpvote}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 