'use client';

import React, { useState } from 'react';
import { OptimizedButton } from '@/components/ui/optimized-button';
import { OptimizedLink } from '@/components/ui/optimized-link';
import { StaggerChildren, StaggerItem, FadeInWhenVisible } from '@/components/ui/page-transition';
import { useUserBounties } from '@/hooks/useUserBounties';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { Target, Clock, Award, Users, EyeOff, Send, CheckCircle, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BountyListSkeleton } from '@/components/ui/skeleton';
import { DBBounty } from '@/types/database';
import { motion } from 'framer-motion';

interface BountiesGridOptimizedProps {
  initialBounties?: DBBounty[];
  showHidden?: boolean;
}

export default function BountiesGridOptimized({ 
  initialBounties = [], 
  showHidden = false 
}: BountiesGridOptimizedProps) {
  const { submissions, stats, loading: userLoading, error } = useUserBounties();
  const { wallet } = useWalletSupabase();
  const [userSubmissions, setUserSubmissions] = useState<{ [bountyId: string]: any }>({});

  // Use initialBounties from server-side rendering
  const displayBounties = initialBounties || [];

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

  if (initialBounties.length === 0) {
    return <BountyListSkeleton count={6} />;
  }

  if (displayBounties.length === 0) {
    return (
      <FadeInWhenVisible>
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bounties Available</h3>
          <p className="text-gray-500">
            {showHidden ? 'No bounties have been created yet.' : 'All available bounties are currently hidden.'}
          </p>
        </div>
      </FadeInWhenVisible>
    );
  }

  return (
    <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {displayBounties.map((bounty, index) => (
        <StaggerItem key={bounty.id}>
          <motion.div
            whileHover={{ scale: 1.02, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              className={`group overflow-hidden bg-slate-800/50 border transition-all duration-300 ${
                bounty.hidden ? 'opacity-60 border-dashed border-gray-500' : 'border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]'
              }`}
            >
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 group-hover:from-purple-900/50 group-hover:to-cyan-900/50 transition-all duration-300 border-b border-cyan-500/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl font-bold mb-2 flex items-center gap-2 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                      <span className="truncate">{bounty.title}</span>
                      {bounty.hidden && (
                        <EyeOff className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Target className="w-4 h-4 flex-shrink-0 text-purple-400" />
                      <span className="capitalize truncate font-medium">{bounty.squad_tag || 'All Squads'}</span>
                    </div>
                  </div>
                  <Badge 
                    className={`${getStatusColor(bounty.status)} text-white capitalize flex-shrink-0 shadow-lg px-3 py-1`}
                  >
                    {bounty.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="overflow-hidden">
                <p className="text-gray-300 mb-6 line-clamp-3 break-words leading-relaxed">
                  {bounty.short_desc}
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="flex items-center gap-2 text-sm text-green-300">
                      <Award className="w-5 h-5 text-green-400" />
                      <span className="font-medium">Reward</span>
                    </div>
                    <span className="font-bold text-green-400 text-lg">{bounty.reward}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                    <div className="flex items-center gap-2 text-sm text-cyan-300">
                      <Users className="w-5 h-5 text-cyan-400" />
                      <span className="font-medium">Submissions</span>
                    </div>
                    <span className="font-bold text-cyan-400">{bounty.submissions}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <div className="flex items-center gap-2 text-sm text-orange-300">
                      <Clock className="w-5 h-5 text-orange-400" />
                      <span className="font-medium">Deadline</span>
                    </div>
                    <span className={`font-bold ${
                      isDeadlineNear(bounty.deadline) ? 'text-red-400 animate-pulse' : 'text-orange-400'
                    }`}>
                      {formatDeadline(bounty.deadline)}
                    </span>
                  </div>
                </div>
                
                {bounty.status === 'active' && (
                  <div className="mt-6 space-y-3">
                    {!wallet ? (
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg border border-purple-500/30">
                        <p className="text-sm text-gray-300 mb-3 font-medium">🔒 Connect your wallet to submit</p>
                        <OptimizedButton 
                          size="sm"
                          onClick={async () => {
                            if (typeof window !== 'undefined' && window.solana) {
                              await window.solana.connect();
                            }
                          }}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        >
                          Connect Wallet
                        </OptimizedButton>
                      </div>
                    ) : userSubmissions[bounty.id] ? (
                      <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                        <div className="flex items-center justify-center gap-2 text-green-400 mb-3">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-bold">Submission Submitted! ✨</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="text-sm font-semibold px-4 py-1 border-yellow-500/50 text-yellow-400 bg-yellow-500/20"
                        >
                          PENDING
                        </Badge>
                      </div>
                    ) : (
                      <OptimizedLink href={`/bounties/${bounty.id}`}>
                        <OptimizedButton
                          variant="outline"
                          className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/60 font-medium"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Submit Entry
                        </OptimizedButton>
                      </OptimizedLink>
                    )}
                  </div>
                )}

                {bounty.link_to && (
                  <OptimizedButton 
                    variant="outline" 
                    className="w-full mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/60 font-medium"
                    onClick={() => window.open(bounty.link_to!, '_blank')}
                  >
                    View Details →
                  </OptimizedButton>
                )}
                
                <div className="text-xs text-gray-500 mt-4 text-center border-t pt-3 border-slate-700/50">
                  Created {new Date(bounty.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </StaggerItem>
      ))}
    </StaggerChildren>
  );
}

