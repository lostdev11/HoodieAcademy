'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubmissionCard } from './SubmissionCard';
import { Users, Trophy, Star, TrendingUp } from 'lucide-react';
import { Submission, SubmissionStats } from '@/types/submission';

type SortOption = 'newest' | 'oldest' | 'most-upvoted' | 'squad-favorites' | 'trending';
type FilterOption = 'all' | 'creators' | 'speakers' | 'raiders' | 'decoders' | 'approved' | 'pending' | 'rejected';

interface SubmissionsGalleryProps {
  bountyId: string;
  currentUserId?: string;
  currentUserSquad?: string;
}

export const SubmissionsGallery = ({ 
  bountyId, 
  currentUserId, 
  currentUserSquad 
}: SubmissionsGalleryProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [bountyId]);

  const handleUpvote = async (submissionId: string, emoji: string) => {
    try {
      const response = await fetch('/api/submissions/upvote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          emoji,
          walletAddress: currentUserId,
          squad: currentUserSquad
        }),
      });

      if (response.ok) {
        // Refresh submissions to get updated data
        await fetchSubmissions();
      }
    } catch (error) {
      console.error('Error upvoting:', error);
    }
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
          const aSquadVotes = Object.values(a.upvotes || {}).flat().filter(vote => vote.squad === a.squad).length;
          const bSquadVotes = Object.values(b.upvotes || {}).flat().filter(vote => vote.squad === b.squad).length;
          return bSquadVotes - aSquadVotes;
        });
      case 'trending':
        return [...subs].sort((a, b) => {
          const aRecentVotes = Object.values(a.upvotes || {}).flat().filter(vote => {
            const voteTime = new Date(vote.timestamp).getTime();
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            return voteTime > oneDayAgo;
          }).length;
          const bRecentVotes = Object.values(b.upvotes || {}).flat().filter(vote => {
            const voteTime = new Date(vote.timestamp).getTime();
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            return voteTime > oneDayAgo;
          }).length;
          return bRecentVotes - aRecentVotes;
        });
      default:
        return subs;
    }
  };

  const filterSubmissions = (subs: Submission[]) => {
    let filtered = subs;

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.squad.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (filterBy) {
      case 'creators':
        filtered = filtered.filter(sub => sub.squad === 'Creators');
        break;
      case 'speakers':
        filtered = filtered.filter(sub => sub.squad === 'Speakers');
        break;
      case 'raiders':
        filtered = filtered.filter(sub => sub.squad === 'Raiders');
        break;
      case 'decoders':
        filtered = filtered.filter(sub => sub.squad === 'Decoders');
        break;
      case 'approved':
        filtered = filtered.filter(sub => sub.status === 'approved');
        break;
      case 'pending':
        filtered = filtered.filter(sub => sub.status === 'pending');
        break;
      case 'rejected':
        filtered = filtered.filter(sub => sub.status === 'rejected');
        break;
    }

    return filtered;
  };

  const getStats = (): SubmissionStats => {
    const totalSubmissions = submissions.length;
    const totalUpvotes = submissions.reduce((sum, sub) => sum + (sub.totalUpvotes || 0), 0);
    const squadFavorites = submissions.filter(sub => {
      const squadVotes = Object.values(sub.upvotes || {}).flat().filter(vote => vote.squad === sub.squad);
      return squadVotes.length > 0;
    }).length;
    const trendingSubmissions = submissions.filter(sub => {
      const recentVotes = Object.values(sub.upvotes || {}).flat().filter(vote => {
        const voteTime = new Date(vote.timestamp).getTime();
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        return voteTime > oneDayAgo;
      });
      return recentVotes.length >= 3;
    }).length;

    return {
      totalSubmissions,
      totalUpvotes,
      squadFavorites,
      trendingSubmissions
    };
  };

  const stats = getStats();
  const processedSubmissions = sortSubmissions(filterSubmissions(submissions));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
        <div className="text-center py-12">
          <div className="text-gray-400">Loading submissions...</div>
        </div>
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
              currentWalletAddress={currentUserId}
              currentUserSquad={currentUserSquad}
              onUpvote={handleUpvote}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 