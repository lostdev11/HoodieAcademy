'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getSquadName } from '@/utils/squad-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Users, AlertCircle, Home } from 'lucide-react';
import Link from 'next/link';
import ChatRoom from '@/components/chat/ChatRoom';
import PinnedMessage from '@/components/chat/PinnedMessage';
import TokenGate from '@/components/TokenGate';

interface PageProps {
  params: {
    squad: string;
  };
}

export default function SquadChatClient({ params }: PageProps) {
  const router = useRouter();
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const squadName = decodeURIComponent(params.squad);

  // Helper function to normalize squad names for comparison
  const normalizeSquadName = (name: string): string => {
    if (!name) return '';
    // Remove emojis and extra spaces, convert to lowercase
    return name.replace(/^[🎨🧠🎤⚔️🦅🏦🔍🗣️]+\s*/, '').toLowerCase().trim();
  };

  // Helper function to get squad ID from name
  const getSquadId = (name: string): string => {
    const normalized = normalizeSquadName(name);
    const squadMapping: { [key: string]: string } = {
      'hoodie creators': 'creators',
      'hoodie decoders': 'decoders', 
      'hoodie speakers': 'speakers',
      'hoodie raiders': 'raiders',
      'hoodie rangers': 'rangers',
      'treasury builders': 'treasury'
    };
    return squadMapping[normalized] || normalized;
  };

  // Helper function to check if squad names match (improved)
  const doSquadsMatch = (squadName: string, userSquad: string | null): boolean => {
    if (!userSquad) return false;
    
    // Normalize squad names for comparison
    const normalizeSquadName = (name: string): string => {
      return name.replace(/^[🎨🧠🎤⚔️🦅🏦]+\s*/, '').toLowerCase().trim();
    };
    
    // Create reverse mapping from URL format to display names
    const urlToDisplayMapping: { [key: string]: string } = {
      'hoodie-creators': 'Hoodie Creators',
      'hoodie-decoders': 'Hoodie Decoders',
      'hoodie-speakers': 'Hoodie Speakers',
      'hoodie-raiders': 'Hoodie Raiders',
      'hoodie-rangers': 'Hoodie Rangers',
      'treasury-builders': 'Treasury Builders'
    };
    
    // First, try to convert URL format to display format
    let normalizedSquadName = squadName;
    if (urlToDisplayMapping[squadName]) {
      normalizedSquadName = urlToDisplayMapping[squadName];
    }
    
    // Normalize both names for comparison
    const normalizedRequested = normalizeSquadName(normalizedSquadName);
    const normalizedUserSquad = normalizeSquadName(userSquad);
    
    // Debug logging (can be removed in production)
    console.log('Squad matching debug:', {
      originalSquadName: squadName,
      normalizedSquadName: normalizedSquadName,
      normalizedRequested,
      userSquad,
      normalizedUserSquad,
      matches: normalizedRequested === normalizedUserSquad
    });
    
    return normalizedRequested === normalizedUserSquad;
  };

  // Helper function to generate squad chat URL
  const getSquadChatUrl = (squadName: string): string => {
    if (!squadName) return '/';
    
    // Map squad names to their URL paths (including emoji variations)
    const squadUrlMapping: { [key: string]: string } = {
      // Full names with emojis (from quiz.json)
      '🎨 Hoodie Creators': 'hoodie-creators',
      '🧠 Hoodie Decoders': 'hoodie-decoders',
      '🎤 Hoodie Speakers': 'hoodie-speakers', 
      '⚔️ Hoodie Raiders': 'hoodie-raiders',
      '🦅 Hoodie Rangers': 'hoodie-rangers',
      '🏦 Treasury Builders': 'treasury-builders',
      // Full names without emojis
      'Hoodie Creators': 'hoodie-creators',
      'Hoodie Decoders': 'hoodie-decoders',
      'Hoodie Speakers': 'hoodie-speakers',
      'Hoodie Raiders': 'hoodie-raiders',
      'Hoodie Rangers': 'hoodie-rangers',
      'Treasury Builders': 'treasury-builders',
      // Lowercase variations
      'hoodie creators': 'hoodie-creators',
      'hoodie decoders': 'hoodie-decoders',
      'hoodie speakers': 'hoodie-speakers',
      'hoodie raiders': 'hoodie-raiders',
      'hoodie rangers': 'hoodie-rangers',
      'treasury builders': 'treasury-builders',
      // Squad IDs (fallback)
      'creators': 'hoodie-creators',
      'decoders': 'hoodie-decoders',
      'speakers': 'hoodie-speakers',
      'raiders': 'hoodie-raiders',
      'rangers': 'hoodie-rangers',
      'treasury': 'treasury-builders'
    };

    // Try exact match first
    if (squadUrlMapping[squadName]) {
      return `/squads/${squadUrlMapping[squadName]}/chat`;
    }

    // Try normalized match (remove emojis and normalize)
    const normalized = normalizeSquadName(squadName);
    if (squadUrlMapping[normalized]) {
      return `/squads/${squadUrlMapping[normalized]}/chat`;
    }

    // Try squad ID match
    const squadId = getSquadId(squadName);
    if (squadUrlMapping[squadId]) {
      return `/squads/${squadUrlMapping[squadId]}/chat`;
    }

    // Fallback: convert to URL-friendly format
    const urlFriendly = squadName
      .toLowerCase()
      .replace(/[🎨🧠🎤⚔️🦅🏦🔍🗣️]/g, '') // Remove emojis
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special characters
      .trim();
    
    return `/squads/${urlFriendly}/chat`;
  };

  // Helper function to debug localStorage squad data
  const debugSquadData = () => {
    const squadResult = getSquadName();
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    const hasDisplayName = localStorage.getItem('userDisplayName');
    
    console.log('=== LOCALSTORAGE DEBUG ===');
    console.log('userSquad raw:', squadResult);
    console.log('onboardingCompleted:', onboardingCompleted);
    console.log('hasDisplayName:', hasDisplayName);
    
    if (squadResult) {
      console.log('userSquad type:', typeof squadResult);
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Debug localStorage data
        debugSquadData();
        
        // Check if user has completed onboarding and has a squad
        const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
        const hasDisplayName = localStorage.getItem('userDisplayName');
        
        if (!hasCompletedOnboarding || !hasDisplayName) {
          router.push('/onboarding');
          return;
        }

        // Get user's squad using utility
        const userSquadName = getSquadName();
        
        if (userSquadName) {
          console.log('Extracted userSquadName:', userSquadName);
          
          setUserSquad(userSquadName);
          
          // Check if user has access to this squad's chat
          const squadsMatch = doSquadsMatch(squadName, userSquadName);
          
          // Debug logging for access check
          console.log('Access check debug:', {
            squadName,
            userSquadName,
            squadsMatch,
            hasCompletedOnboarding,
            hasDisplayName
          });
          
          if (squadsMatch) {
            setHasAccess(true);
          } else {
            setHasAccess(false);
            setError(`Access denied: You're assigned to "${userSquadName}" but trying to access "${squadName}". Squad names must match exactly.`);
          }
        } else {
          // No squad assigned, redirect to placement test
          router.push('/placement/squad-test');
          return;
        }
      } catch (error) {
        console.error('Error checking squad access:', error);
        setError('An error occurred while checking your access. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [squadName, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-cyan-400 text-xl">Loading Squad Chat...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative z-10 p-6 max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-8">
            <Button
              asChild
              variant="outline"
              className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30"
            >
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Access Denied */}
          <Card className="max-w-2xl mx-auto bg-slate-800/60 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-400 mb-2">
                  Squad Access Required
                </h2>
                <p className="text-gray-300 mb-4">
                  {error || "You can only access the chat room for your assigned squad."}
                </p>
                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-400 mb-2">Your Squad:</p>
                  <p className="text-cyan-400 font-semibold">{userSquad || 'Not assigned'}</p>
                  <p className="text-sm text-gray-400 mt-2">Requested Access:</p>
                  <p className="text-red-400 font-semibold">{squadName}</p>
                  {userSquad && (
                    <>
                      <p className="text-sm text-gray-400 mt-2">Generated URL:</p>
                      <p className="text-yellow-400 font-mono text-xs break-all">
                        {getSquadChatUrl(userSquad)}
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {userSquad && (
                  <Button
                    asChild
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  >
                    <Link href={getSquadChatUrl(userSquad)}>
                      <Users className="w-4 h-4 mr-2" />
                      Go to Your Squad Chat
                    </Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300"
                >
                  <Link href="/placement/squad-test">
                    {userSquad ? 'Retake Squad Test' : 'Take Squad Test'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Custom authentication check for squad chat
  const isAuthenticatedForSquadChat = () => {
    const userSquad = getSquadName();
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    const placementTestCompleted = localStorage.getItem('placementTestCompleted');
    
    return userSquad || onboardingCompleted === 'true' || placementTestCompleted === 'true';
  };

  // If user has access to squad chat, render without TokenGate
  if (hasAccess && isAuthenticatedForSquadChat()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300">
                <Home className="w-5 h-5" />
              </Link>
              <span className="text-gray-400">/</span>
              <Link href="/squads" className="text-cyan-400 hover:text-cyan-300">
                Squads
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-white font-semibold">{squadName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Your Squad:</span>
              <span className="text-cyan-400 font-semibold">{userSquad}</span>
            </div>
          </div>
          
          <ChatRoom squad={squadName} />
        </div>
      </div>
    );
  }

  // Fallback to TokenGate for users who need authentication
  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300">
                <Home className="w-5 h-5" />
              </Link>
              <span className="text-gray-400">/</span>
              <Link href="/squads" className="text-cyan-400 hover:text-cyan-300">
                Squads
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-white font-semibold">{squadName}</span>
            </div>
          </div>
          
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Squad Chat Access Required</h2>
              <p className="text-gray-300 mb-6">
                You need to complete onboarding and be assigned to the {squadName} squad to access this chat room.
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <Button asChild className="w-full bg-cyan-600 hover:bg-cyan-700">
                  <Link href="/onboarding">
                    Complete Onboarding
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20">
                  <Link href="/placement/squad-test">
                    Take Squad Placement Test
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TokenGate>
  );
} 