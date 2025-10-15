'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Vote, Plus, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { ProposalCard } from '@/components/governance/ProposalCard';
import { VotingPowerCard } from '@/components/governance/VotingPowerCard';

interface GovernanceManagerProps {
  walletAddress: string;
}

export function GovernanceManager({ walletAddress }: GovernanceManagerProps) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposalType, setProposalType] = useState('policy');
  const [unlockAmount, setUnlockAmount] = useState('');
  const [targetAllocation, setTargetAllocation] = useState('');
  const [votingDays, setVotingDays] = useState('7');

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/governance/proposals');
      const data = await response.json();
      
      if (data.success) {
        setProposals(data.proposals || []);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/governance/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          proposal_type: proposalType,
          requested_unlock_amount: proposalType === 'unlock' ? parseInt(unlockAmount) || 0 : 0,
          target_allocation: proposalType === 'unlock' ? targetAllocation : null,
          voting_duration_days: parseInt(votingDays) || 7,
          created_by: walletAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Proposal created successfully!');
        // Reset form
        setTitle('');
        setDescription('');
        setProposalType('policy');
        setUnlockAmount('');
        setTargetAllocation('');
        setVotingDays('7');
        setShowCreateForm(false);
        // Refresh proposals
        fetchProposals();
      } else {
        alert(`❌ Failed to create proposal: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('❌ Error creating proposal');
    } finally {
      setCreating(false);
    }
  };

  const handleFinalizeProposal = async (proposalId: string) => {
    if (!confirm('Are you sure you want to finalize this proposal? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/governance/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposalId,
          admin_wallet: walletAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Proposal ${data.result.result}!`);
        fetchProposals();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error finalizing proposal:', error);
      alert('❌ Error finalizing proposal');
    }
  };

  const activeProposals = proposals.filter(p => p.status === 'active');
  const pastProposals = proposals.filter(p => p.status !== 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Vote className="w-8 h-8 text-purple-400" />
            <span>Governance Management</span>
          </h2>
          <p className="text-gray-400 mt-1">Create and manage $HOOD governance proposals</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Proposal
        </Button>
      </div>

      {/* Voting Power Card */}
      <VotingPowerCard walletAddress={walletAddress} />

      {/* Create Proposal Form */}
      {showCreateForm && (
        <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-purple-400" />
              <span>Create New Proposal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProposal} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Proposal Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Unlock 50M HOOD for Community Rewards"
                  className="bg-slate-800 border-gray-700 text-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the proposal, its purpose, and expected outcomes..."
                  rows={6}
                  className="bg-slate-800 border-gray-700 text-white"
                  required
                />
              </div>

              {/* Proposal Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Proposal Type *
                </label>
                <Select value={proposalType} onValueChange={setProposalType}>
                  <SelectTrigger className="bg-slate-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-700">
                    <SelectItem value="unlock">Token Unlock</SelectItem>
                    <SelectItem value="course">New Course/Content</SelectItem>
                    <SelectItem value="reward">Reward Structure</SelectItem>
                    <SelectItem value="policy">Policy Change</SelectItem>
                    <SelectItem value="treasury">Treasury Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Unlock-specific fields */}
              {proposalType === 'unlock' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Unlock Amount (HOOD tokens)
                    </label>
                    <Input
                      type="number"
                      value={unlockAmount}
                      onChange={(e) => setUnlockAmount(e.target.value)}
                      placeholder="e.g., 50000000 (50 million)"
                      className="bg-slate-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Allocation
                    </label>
                    <Select value={targetAllocation} onValueChange={setTargetAllocation}>
                      <SelectTrigger className="bg-slate-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select vault..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-gray-700">
                        <SelectItem value="Founder Vault">Founder Vault</SelectItem>
                        <SelectItem value="Community Vault">Community Vault</SelectItem>
                        <SelectItem value="Partnerships & Collabs">Partnerships & Collabs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Voting Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Voting Duration (days)
                </label>
                <Input
                  type="number"
                  value={votingDays}
                  onChange={(e) => setVotingDays(e.target.value)}
                  min="1"
                  max="30"
                  className="bg-slate-800 border-gray-700 text-white"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Proposal
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Proposals */}
      {activeProposals.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <span>Active Proposals ({activeProposals.length})</span>
          </h3>
          <div className="grid gap-4">
            {activeProposals.map((proposal) => (
              <div key={proposal.id} className="space-y-2">
                <ProposalCard
                  proposal={proposal}
                  walletAddress={walletAddress}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleFinalizeProposal(proposal.id)}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalize Proposal
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Proposals */}
      {pastProposals.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">
            Past Proposals ({pastProposals.length})
          </h3>
          <div className="grid gap-4">
            {pastProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                walletAddress={walletAddress}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && proposals.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-gray-700">
          <CardContent className="py-12 text-center">
            <Vote className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No proposals yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create the first governance proposal to get started
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Proposal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}
    </div>
  );
}

