'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { ProposalCard } from '@/components/governance/ProposalCard';
import { ProposalDetailModal } from '@/components/governance/ProposalDetailModal';
import { VotingPowerCard } from '@/components/governance/VotingPowerCard';
import { Vote, TrendingUp, Clock, CheckCircle, XCircle, PieChart, Wallet, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GovernancePageClient() {
  const router = useRouter();
  const { wallet, isAdmin, connectWallet } = useWalletSupabase();
  const [proposals, setProposals] = useState<any[]>([]);
  const [tokenomics, setTokenomics] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<Record<string, any>>({});
  const [votingPower, setVotingPower] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchProposals();
    fetchTokenomics();
  }, []);

  useEffect(() => {
    if (wallet) {
      fetchUserVotes();
      fetchVotingPower();
    }
  }, [wallet]);

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

  const fetchTokenomics = async () => {
    try {
      const response = await fetch('/api/governance/tokenomics');
      const data = await response.json();
      
      if (data.success) {
        setTokenomics(data);
      }
    } catch (error) {
      console.error('Error fetching tokenomics:', error);
    }
  };

  const fetchUserVotes = async () => {
    if (!wallet) return;

    try {
      const votes: Record<string, any> = {};
      
      for (const proposal of proposals) {
        const response = await fetch(
          `/api/governance/vote?proposal_id=${proposal.id}&voter_wallet=${wallet}`
        );
        const data = await response.json();
        
        if (data.success && data.vote) {
          votes[proposal.id] = data.vote;
        }
      }
      
      setUserVotes(votes);
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  const fetchVotingPower = async () => {
    if (!wallet) return;

    try {
      const response = await fetch(`/api/governance/voting-power?wallet=${wallet}`);
      const data = await response.json();
      
      if (data.success) {
        setVotingPower(data.voting_power.voting_power || 0);
      }
    } catch (error) {
      console.error('Error fetching voting power:', error);
    }
  };

  const handleVote = async (proposalId: string, choice: 'for' | 'against') => {
    if (!wallet) {
      alert('Please connect your wallet to vote');
      return;
    }

    try {
      const response = await fetch('/api/governance/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposalId,
          voter_wallet: wallet,
          vote_choice: choice
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Vote cast successfully!`);
        // Refresh data
        fetchProposals();
        fetchUserVotes();
        fetchVotingPower();
      } else {
        alert(`❌ Failed to vote: ${data.error}`);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('❌ Error casting vote');
    }
  };

  const handleViewDetails = (proposal: any) => {
    setSelectedProposal(proposal);
    setIsDetailModalOpen(true);
  };

  const activeProposals = proposals.filter(p => p.status === 'active');
  const passedProposals = proposals.filter(p => p.status === 'passed');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back/Home Buttons */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-purple-500/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-cyan-500/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Vote className="w-12 h-12 text-purple-400" />
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                Governance Proposals
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              View and vote on community proposals. Your voting power is based on your HOOD tokens and XP.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {proposals.length}
                  </div>
                  <div className="text-sm text-gray-400">Total Proposals</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {activeProposals.length}
                  </div>
                  <div className="text-sm text-gray-400">Active Votes</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {passedProposals.length}
                  </div>
                  <div className="text-sm text-gray-400">Passed</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-cyan-400">
                    1B
                  </div>
                  <div className="text-sm text-gray-400">Total $HOOD</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Voting Power & Tokenomics */}
          <div className="space-y-6">
            {/* Voting Power Card */}
            {wallet ? (
              <VotingPowerCard walletAddress={wallet} />
            ) : (
              <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-purple-400" />
                    <span>Connect to Vote</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    Connect your wallet to see your voting power and participate in governance.
                  </p>
                  <Button
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tokenomics Card */}
            {tokenomics && (
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-cyan-400" />
                    <span>Token Allocation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tokenomics.allocations?.map((allocation: any) => (
                    <div key={allocation.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">
                          {allocation.allocation_name}
                        </span>
                        <span className="text-sm font-semibold text-cyan-400">
                          {allocation.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-cyan-600 h-2 rounded-full"
                          style={{ width: `${allocation.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(allocation.total_tokens / 1000000).toFixed(0)}M HOOD
                        {allocation.locked_tokens > 0 && (
                          <> • 🔒 {(allocation.locked_tokens / 1000000).toFixed(0)}M Locked</>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* How to Vote */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-sm">How Voting Works</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-400 space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-purple-400">1.</span>
                  <span>Your voting power = 40% HOOD + 60% XP (× 0.002) - XP has more weight!</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-400">2.</span>
                  <span>Vote "For" or "Against" active proposals</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-400">3.</span>
                  <span>You can change your vote before deadline</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-400">4.</span>
                  <span>Simple majority wins (50% + 1)</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Proposals */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                <TabsTrigger value="active" className="data-[state=active]:bg-yellow-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Active ({activeProposals.length})
                </TabsTrigger>
                <TabsTrigger value="passed" className="data-[state=active]:bg-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Passed ({passedProposals.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="data-[state=active]:bg-red-600">
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejected ({rejectedProposals.length})
                </TabsTrigger>
              </TabsList>

              {/* Active Proposals */}
              <TabsContent value="active" className="space-y-4 mt-6">
                {activeProposals.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-4">
                    {activeProposals.map((proposal) => {
                      const totalVotes = proposal.votes_for + proposal.votes_against;
                      return (
                        <AccordionItem
                          key={proposal.id}
                          value={proposal.id}
                          className="border border-slate-700 rounded-xl px-4 bg-slate-900/50"
                        >
                          <AccordionTrigger className="text-left text-white hover:no-underline py-4">
                            <div className="flex flex-col w-full">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-lg font-semibold">{proposal.title}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${proposal.status === 'active'
                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                    : proposal.status === 'passed'
                                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                                    }`}
                                >
                                  {proposal.status.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center justify-between text-sm text-gray-400 mt-2 gap-2">
                                <span>#{proposal.proposal_number} • {proposal.proposal_type.toUpperCase()}</span>
                                <span>{totalVotes.toLocaleString()} total votes</span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-0">
                            <div className="pt-2 pb-4">
                              <ProposalCard
                                proposal={proposal}
                                userVote={userVotes[proposal.id]}
                                onVote={handleVote}
                                votingPower={votingPower}
                                walletAddress={wallet || undefined}
                                onViewDetails={handleViewDetails}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <Card className="bg-slate-800/50 border-gray-700">
                    <CardContent className="py-12 text-center">
                      <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-400 mb-2">
                        No active proposals
                      </h3>
                      <p className="text-gray-500">
                        Check back later for new governance proposals
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Passed Proposals */}
              <TabsContent value="passed" className="space-y-4 mt-6">
                {passedProposals.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-4">
                    {passedProposals.map((proposal) => {
                      const totalVotes = proposal.votes_for + proposal.votes_against;
                      return (
                        <AccordionItem
                          key={proposal.id}
                          value={proposal.id}
                          className="border border-slate-700 rounded-xl px-4 bg-slate-900/50"
                        >
                          <AccordionTrigger className="text-left text-white hover:no-underline py-4">
                            <div className="flex flex-col w-full">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-lg font-semibold">{proposal.title}</span>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-500/20 text-green-300 border-green-500/30"
                                >
                                  PASSED
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center justify-between text-sm text-gray-400 mt-2 gap-2">
                                <span>#{proposal.proposal_number} • {proposal.proposal_type.toUpperCase()}</span>
                                <span>{totalVotes.toLocaleString()} total votes</span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-0">
                            <div className="pt-2 pb-4">
                              <ProposalCard
                                proposal={proposal}
                                userVote={userVotes[proposal.id]}
                                walletAddress={wallet || undefined}
                                onViewDetails={handleViewDetails}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <Card className="bg-slate-800/50 border-gray-700">
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-400 mb-2">
                        No passed proposals yet
                      </h3>
                      <p className="text-gray-500">
                        Successful proposals will appear here
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Rejected Proposals */}
              <TabsContent value="rejected" className="space-y-4 mt-6">
                {rejectedProposals.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-4">
                    {rejectedProposals.map((proposal) => {
                      const totalVotes = proposal.votes_for + proposal.votes_against;
                      return (
                        <AccordionItem
                          key={proposal.id}
                          value={proposal.id}
                          className="border border-slate-700 rounded-xl px-4 bg-slate-900/50"
                        >
                          <AccordionTrigger className="text-left text-white hover:no-underline py-4">
                            <div className="flex flex-col w-full">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-lg font-semibold">{proposal.title}</span>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-red-500/20 text-red-300 border-red-500/30"
                                >
                                  REJECTED
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center justify-between text-sm text-gray-400 mt-2 gap-2">
                                <span>#{proposal.proposal_number} • {proposal.proposal_type.toUpperCase()}</span>
                                <span>{totalVotes.toLocaleString()} total votes</span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-0">
                            <div className="pt-2 pb-4">
                              <ProposalCard
                                proposal={proposal}
                                userVote={userVotes[proposal.id]}
                                walletAddress={wallet || undefined}
                                onViewDetails={handleViewDetails}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <Card className="bg-slate-800/50 border-gray-700">
                    <CardContent className="py-12 text-center">
                      <XCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-400 mb-2">
                        No rejected proposals
                      </h3>
                      <p className="text-gray-500">
                        Rejected proposals will appear here
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Admin Link */}
      {isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <Card className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border-purple-500/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Vote className="w-5 h-5 text-purple-400" />
                <span className="text-gray-300">
                  You have admin access to create and finalize proposals
                </span>
              </div>
              <Button
                onClick={() => window.location.href = '/admin-dashboard?tab=governance'}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              >
                Go to Admin Governance
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Proposal Detail Modal */}
      <ProposalDetailModal
        proposal={selectedProposal}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        userVote={selectedProposal ? userVotes[selectedProposal.id] : null}
        onVote={handleVote}
        votingPower={votingPower}
        walletAddress={wallet || undefined}
      />
    </div>
  );
}
