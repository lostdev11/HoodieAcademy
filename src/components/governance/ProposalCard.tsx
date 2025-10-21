'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Proposal {
  id: string;
  proposal_number: number;
  title: string;
  description: string;
  proposal_type: string;
  status: string;
  votes_for: number;
  votes_against: number;
  total_voting_power: number;
  voting_ends_at: string;
  requested_unlock_amount?: number;
  target_allocation?: string;
  created_by: string;
}

interface ProposalCardProps {
  proposal: Proposal;
  userVote?: {
    vote_choice: string;
    voting_power: number;
  } | null;
  onVote?: (proposalId: string, choice: 'for' | 'against') => void;
  votingPower?: number;
  walletAddress?: string;
}

export function ProposalCard({ 
  proposal, 
  userVote, 
  onVote, 
  votingPower = 0,
  walletAddress 
}: ProposalCardProps) {
  const [isVoting, setIsVoting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'passed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'executed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="w-4 h-4" />;
      case 'passed': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'unlock': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'course': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'reward': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'policy': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleVote = async (choice: 'for' | 'against') => {
    if (!onVote || isVoting) return;
    setIsVoting(true);
    try {
      await onVote(proposal.id, choice);
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = proposal.votes_for + proposal.votes_against;
  const forPercentage = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 50;
  const againstPercentage = 100 - forPercentage;

  const timeRemaining = new Date(proposal.voting_ends_at).getTime() - Date.now();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  const isActive = proposal.status === 'active';
  const hasVoted = !!userVote;
  const canVote = isActive && walletAddress && votingPower > 0;

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 hover:border-cyan-500/50 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                #{proposal.proposal_number}
              </Badge>
              <Badge variant="outline" className={`text-xs ${getTypeColor(proposal.proposal_type)}`}>
                {proposal.proposal_type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={`text-xs flex items-center space-x-1 ${getStatusColor(proposal.status)}`}>
                {getStatusIcon(proposal.status)}
                <span>{proposal.status.toUpperCase()}</span>
              </Badge>
            </div>
            <CardTitle className="text-xl text-white mb-2">{proposal.title}</CardTitle>
          </div>
        </div>
        
        {/* Unlock Details */}
        {proposal.requested_unlock_amount && proposal.requested_unlock_amount > 0 && (
          <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="text-sm text-purple-300">
              <span className="font-semibold">Unlock Request:</span>{' '}
              {(proposal.requested_unlock_amount / 1000000).toLocaleString()}M HOOD
              {proposal.target_allocation && ` from ${proposal.target_allocation}`}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        <div className="text-sm">
          <MarkdownRenderer content={proposal.description} />
        </div>

        {/* Vote Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Voting Results</span>
            <span className="text-gray-400">
              {totalVotes.toLocaleString()} total votes
            </span>
          </div>

          {/* For Votes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-green-400 flex items-center space-x-1">
                <ThumbsUp className="w-4 h-4" />
                <span>For</span>
              </span>
              <span className="text-sm font-semibold text-green-400">
                {forPercentage.toFixed(1)}% ({proposal.votes_for.toLocaleString()})
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-green-600 to-green-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${forPercentage}%` }}
              />
            </div>
          </div>

          {/* Against Votes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-red-400 flex items-center space-x-1">
                <ThumbsDown className="w-4 h-4" />
                <span>Against</span>
              </span>
              <span className="text-sm font-semibold text-red-400">
                {againstPercentage.toFixed(1)}% ({proposal.votes_against.toLocaleString()})
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-red-600 to-red-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${againstPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Time Remaining */}
        {isActive && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              {daysRemaining > 0 
                ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                : 'Voting ends soon'}
            </span>
          </div>
        )}

        {/* User's Vote Status */}
        {hasVoted && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-300">Your vote:</span>
              <span className="font-semibold text-blue-400">
                {userVote.vote_choice.toUpperCase()} ({userVote.voting_power.toLocaleString()} power)
              </span>
            </div>
          </div>
        )}

        {/* Voting Buttons */}
        {canVote && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => handleVote('for')}
              disabled={isVoting}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              {hasVoted && userVote?.vote_choice === 'for' ? 'Voted For' : 'Vote For'}
            </Button>
            <Button
              onClick={() => handleVote('against')}
              disabled={isVoting}
              variant="destructive"
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 font-semibold"
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              {hasVoted && userVote?.vote_choice === 'against' ? 'Voted Against' : 'Vote Against'}
            </Button>
          </div>
        )}

        {/* Cannot Vote Message */}
        {isActive && !canVote && !walletAddress && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
            <p className="text-sm text-yellow-300">Connect wallet to vote</p>
          </div>
        )}

        {isActive && walletAddress && votingPower === 0 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
            <p className="text-sm text-yellow-300">
              No voting power (need HOOD tokens or XP)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

