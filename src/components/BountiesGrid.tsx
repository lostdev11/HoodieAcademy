'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { Target, Clock, Award, Users, Eye, EyeOff } from 'lucide-react';
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

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        // Use the API instead of direct Supabase access
        const response = await fetch('/api/bounties');
        const result = await response.json();
        
        if (response.ok && result.success) {
          setBounties(result.bounties || []);
        } else {
          console.error('Error fetching bounties:', result.error);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchBounties();
  }, []);

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
          className={`hover:shadow-lg transition-all duration-200 ${
            bounty.hidden ? 'opacity-60 border-dashed' : ''
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2 flex items-center gap-2">
                  {bounty.title}
                  {bounty.hidden && (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="capitalize">{bounty.squad_tag || 'All Squads'}</span>
                </div>
              </div>
              <Badge 
                className={`${getStatusColor(bounty.status)} text-white capitalize`}
              >
                {bounty.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-gray-700 mb-4 line-clamp-3">
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
