'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { Target, Clock, Award, Users, Eye, EyeOff, Send, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DBBounty } from '@/types/database';

interface BountiesGridProps {
  initialBounties?: DBBounty[];
  showHidden?: boolean; // For admin view
}

export default function BountiesGrid({ 
  initialBounties = [], 
  showHidden = false 
}: BountiesGridProps) {
  const [bounties, setBounties] = useState<DBBounty[]>(initialBounties);
  const [userSubmissions, setUserSubmissions] = useState<{ [bountyId: string]: any }>({});
  const [submittingBounty, setSubmittingBounty] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState<{ [bountyId: string]: string }>({});
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Get wallet address from localStorage
    const storedWallet = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null;
    if (storedWallet) {
      setWalletAddress(storedWallet);
    }
  }, []);

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        // Use the API instead of direct Supabase access
        const response = await fetch('/api/bounties');
        const result = await response.json();
        
        if (response.ok) {
          // API returns bounties directly, not wrapped in a bounties property
          setBounties(Array.isArray(result) ? result : []);
        } else {
          console.error('Error fetching bounties:', result.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchBounties();
  }, []);

  // Fetch user submissions for all bounties
  useEffect(() => {
    if (!walletAddress || bounties.length === 0) return;

    const fetchUserSubmissions = async () => {
      const submissions: { [bountyId: string]: any } = {};
      
      for (const bounty of bounties) {
        try {
          const response = await fetch(`/api/bounties/${bounty.id}/submit?walletAddress=${walletAddress}`);
          if (response.ok) {
            const result = await response.json();
            if (result.submission) {
              submissions[bounty.id] = result.submission;
            }
          }
        } catch (error) {
          console.error(`Error fetching submission for bounty ${bounty.id}:`, error);
        }
      }
      
      setUserSubmissions(submissions);
    };

    fetchUserSubmissions();
  }, [walletAddress, bounties]);

  const handleSubmitBounty = async (bountyId: string) => {
    if (!walletAddress || !submissionText[bountyId]?.trim()) return;

    setSubmittingBounty(bountyId);
    try {
      const response = await fetch(`/api/bounties/${bountyId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission: submissionText[bountyId],
          walletAddress,
          submissionType: 'text'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        // Update user submissions
        setUserSubmissions(prev => ({
          ...prev,
          [bountyId]: result.submission
        }));
        
        // Clear submission text
        setSubmissionText(prev => ({
          ...prev,
          [bountyId]: ''
        }));
        
        // Update bounty submissions count
        setBounties(prev => prev.map(bounty => 
          bounty.id === bountyId 
            ? { ...bounty, submissions: bounty.submissions + 1 }
            : bounty
        ));
        
        alert('Bounty submitted successfully!');
      } else {
        alert(result.error || 'Failed to submit bounty');
      }
    } catch (error) {
      console.error('Error submitting bounty:', error);
      alert('Failed to submit bounty');
    } finally {
      setSubmittingBounty(null);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDeadline = (deadline: string | null): string => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days left`;
    return date.toLocaleDateString();
  };

  const isDeadlineNear = (deadline: string | null): boolean => {
    if (!deadline) return false;
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  // Filter bounties based on showHidden prop
  const visibleBounties = showHidden 
    ? bounties 
    : bounties.filter(bounty => !bounty.hidden);

  if (visibleBounties.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bounties Available</h3>
        <p className="text-gray-500">
          {showHidden ? 'No bounties have been created yet.' : 'All available bounties are currently hidden.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleBounties.map((bounty) => (
        <Card 
          key={bounty.id} 
          className={`hover:shadow-lg transition-all duration-200 overflow-hidden ${
            bounty.hidden ? 'opacity-60 border-dashed' : ''
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg mb-2 flex items-center gap-2">
                  <span className="truncate">{bounty.title}</span>
                  {bounty.hidden && (
                    <EyeOff className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Target className="w-4 h-4 flex-shrink-0" />
                  <span className="capitalize truncate">{bounty.squad_tag || 'All Squads'}</span>
                </div>
              </div>
              <Badge 
                className={`${getStatusColor(bounty.status)} text-white capitalize flex-shrink-0`}
              >
                {bounty.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="overflow-hidden">
            <p className="text-gray-700 mb-4 line-clamp-3 break-words">
              {bounty.short_desc}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Award className="w-4 h-4" />
                  <span>Reward:</span>
                </div>
                <span className="font-semibold text-green-600">{bounty.reward}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Submissions:</span>
                </div>
                <span className="font-semibold">{bounty.submissions}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Deadline:</span>
                </div>
                <span className={`font-semibold ${
                  isDeadlineNear(bounty.deadline) ? 'text-orange-600' : 'text-gray-700'
                }`}>
                  {formatDeadline(bounty.deadline)}
                </span>
              </div>
            </div>
            
            {/* User Actions */}
            {walletAddress && bounty.status === 'active' && (
              <div className="mt-4 space-y-3">
                {userSubmissions[bounty.id] ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Submission Submitted</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        userSubmissions[bounty.id].status === 'approved' 
                          ? 'border-green-500 text-green-600' 
                          : userSubmissions[bounty.id].status === 'rejected'
                          ? 'border-red-500 text-red-600'
                          : 'border-yellow-500 text-yellow-600'
                      }`}
                    >
                      {userSubmissions[bounty.id].status}
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Describe your submission or paste a link..."
                      value={submissionText[bounty.id] || ''}
                      onChange={(e) => setSubmissionText(prev => ({
                        ...prev,
                        [bounty.id]: e.target.value
                      }))}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none break-words overflow-wrap-anywhere"
                      rows={2}
                    />
                    <Button
                      onClick={() => handleSubmitBounty(bounty.id)}
                      disabled={!submissionText[bounty.id]?.trim() || submittingBounty === bounty.id}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm"
                    >
                      {submittingBounty === bounty.id ? (
                        'Submitting...'
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-1" />
                          Submit Bounty
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {bounty.link_to && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => window.open(bounty.link_to!, '_blank')}
              >
                View Details
              </Button>
            )}
            
            <div className="text-xs text-gray-400 mt-3 text-center">
              Created {new Date(bounty.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
