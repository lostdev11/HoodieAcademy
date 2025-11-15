'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';

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
  voting_starts_at: string;
  requested_unlock_amount?: number;
  target_allocation?: string;
  created_by: string;
  created_at: string;
}

interface ProposalDetailModalProps {
  proposal: Proposal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userVote?: {
    vote_choice: string;
    voting_power: number;
  } | null;
  onVote?: (proposalId: string, choice: 'for' | 'against') => void;
  votingPower?: number;
  walletAddress?: string;
}

export function ProposalDetailModal({
  proposal,
  open,
  onOpenChange,
  userVote,
  onVote,
  votingPower = 0,
  walletAddress,
}: ProposalDetailModalProps) {
  const [isVoting, setIsVoting] = useState(false);

  if (!proposal) return null;

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
  const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));

  const isActive = proposal.status === 'active';
  const hasVoted = !!userVote;
  const canVote = isActive && walletAddress && votingPower > 0;

  const startDate = new Date(proposal.voting_starts_at).toLocaleDateString();
  const endDate = new Date(proposal.voting_ends_at).toLocaleDateString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 text-white">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
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
              <DialogTitle className="text-2xl text-white mb-2">{proposal.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-gray-300 space-y-6">
          {/* Unlock Details */}
          {proposal.requested_unlock_amount && proposal.requested_unlock_amount > 0 && (
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-4">
                <div className="text-sm text-purple-300">
                  <span className="font-semibold">Unlock Request:</span>{' '}
                  {(proposal.requested_unlock_amount / 1000000).toLocaleString()}M HOOD
                  {proposal.target_allocation && ` from ${proposal.target_allocation}`}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Description */}
          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <div className="text-sm text-gray-300">
              <MarkdownRenderer content={proposal.description} />
            </div>
          </div>

          {/* Proposal Details */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="text-xs text-gray-400 mb-1">Created By</div>
                <div className="text-sm text-white font-mono">
                  {proposal.created_by.slice(0, 6)}...{proposal.created_by.slice(-4)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="text-xs text-gray-400 mb-1">Created At</div>
                <div className="text-sm text-white">{startDate}</div>
              </CardContent>
            </Card>
          </div>

          {/* Voting Period */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Voting Period</span>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>Started: {startDate}</div>
                <div>Ends: {endDate}</div>
                {isActive && (
                  <div className="text-cyan-400 font-semibold">
                    {daysRemaining > 0 
                      ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                      : hoursRemaining > 0
                      ? `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} remaining`
                      : 'Voting ends soon'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vote Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Voting Results</h3>
              <span className="text-sm text-gray-400">
                {totalVotes.toLocaleString()} total votes
              </span>
            </div>

            {/* For Votes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-400 flex items-center space-x-2">
                  <ThumbsUp className="w-5 h-5" />
                  <span className="font-semibold">For</span>
                </span>
                <span className="text-lg font-bold text-green-400">
                  {forPercentage.toFixed(1)}% ({proposal.votes_for.toLocaleString()})
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-600 to-green-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${forPercentage}%` }}
                />
              </div>
            </div>

            {/* Against Votes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-red-400 flex items-center space-x-2">
                  <ThumbsDown className="w-5 h-5" />
                  <span className="font-semibold">Against</span>
                </span>
                <span className="text-lg font-bold text-red-400">
                  {againstPercentage.toFixed(1)}% ({proposal.votes_against.toLocaleString()})
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${againstPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* User's Vote Status */}
          {hasVoted && (
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-300 font-semibold">Your vote:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-blue-400">
                      {userVote.vote_choice.toUpperCase()}
                    </span>
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-blue-400">
                      {userVote.voting_power.toLocaleString()} power
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voting Buttons */}
          {canVote && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
              <Button
                onClick={() => handleVote('for')}
                disabled={isVoting}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold h-12"
              >
                <ThumbsUp className="w-5 h-5 mr-2" />
                {hasVoted && userVote?.vote_choice === 'for' ? 'Change to For' : 'Vote For'}
              </Button>
              <Button
                onClick={() => handleVote('against')}
                disabled={isVoting}
                size="lg"
                variant="destructive"
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 font-semibold h-12"
              >
                <ThumbsDown className="w-5 h-5 mr-2" />
                {hasVoted && userVote?.vote_choice === 'against' ? 'Change to Against' : 'Vote Against'}
              </Button>
            </div>
          )}

          {/* Cannot Vote Messages */}
          {isActive && !canVote && !walletAddress && (
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-yellow-300">Connect wallet to vote</p>
              </CardContent>
            </Card>
          )}

          {isActive && walletAddress && votingPower === 0 && (
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-yellow-300">
                  No voting power (need HOOD tokens or XP)
                </p>
              </CardContent>
            </Card>
          )}

          {!isActive && (
            <Card className="bg-gray-500/10 border-gray-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-400">
                  This proposal is {proposal.status}. Voting is closed.
                </p>
              </CardContent>
            </Card>
          )}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

