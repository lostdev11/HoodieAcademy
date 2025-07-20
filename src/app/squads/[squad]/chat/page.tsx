'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import ChatRoom from '@/components/chat/ChatRoom';
import PinnedMessage from '@/components/chat/PinnedMessage';
import TokenGate from '@/components/TokenGate';

interface PageProps {
  params: {
    squad: string;
  };
}

export default function SquadChatPage({ params }: PageProps) {
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
  const doSquadsMatch = (userSquad: string, requestedSquad: string): boolean => {
    // Normalize both squad names
    const normalizedUser = normalizeSquadName(userSquad);
    const normalizedRequested = normalizeSquadName(requestedSquad);
    
    console.log('doSquadsMatch debug:', {
      userSquad,
      requestedSquad,
      normalizedUser,
      normalizedRequested
    });
    
    // Direct comparison
    if (normalizedUser === normalizedRequested) {
      console.log('Direct match found');
      return true;
    }
    
    // Get squad IDs
    const userSquadId = getSquadId(userSquad);
    const requestedSquadId = getSquadId(requestedSquad);
    
    console.log('Squad ID comparison:', {
      userSquadId,
      requestedSquadId
    });
    
    // Compare squad IDs
    if (userSquadId === requestedSquadId) {
      console.log('Squad ID match found');
      return true;
    }
    
    // Additional mapping for URL parameters
    const urlMapping: { [key: string]: string } = {
      'hoodie-creators': 'hoodie creators',
      'hoodie-decoders': 'hoodie decoders',
      'hoodie-speakers': 'hoodie speakers',
      'hoodie-raiders': 'hoodie raiders',
      'hoodie-rangers': 'hoodie rangers',
      'treasury-builders': 'treasury builders'
    };
    
    // Check if requested squad matches user squad through URL mapping
    if (urlMapping[requestedSquad] === normalizedUser) {
      console.log('URL mapping match found (requested -> user)');
      return true;
    }
    
    // Check if user squad matches requested squad through URL mapping
    if (urlMapping[normalizedUser.replace(/\s+/g, '-')] === normalizedRequested) {
      console.log('URL mapping match found (user -> requested)');
      return true;
    }
    
    console.log('No match found');
    return false;
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
      console.log('Exact match found for squad:', squadName, '->', squadUrlMapping[squadName]);
      return `/squads/${squadUrlMapping[squadName]}/chat`;
    }

    // Try normalized match (remove emojis and normalize)
    const normalized = normalizeSquadName(squadName);
    if (squadUrlMapping[normalized]) {
      console.log('Normalized match found for squad:', squadName, '->', squadUrlMapping[normalized]);
      return `/squads/${squadUrlMapping[normalized]}/chat`;
    }

    // Try squad ID match
    const squadId = getSquadId(squadName);
    if (squadUrlMapping[squadId]) {
      console.log('Squad ID match found for squad:', squadName, '->', squadUrlMapping[squadId]);
      return `/squads/${squadUrlMapping[squadId]}/chat`;
    }

    // Fallback: convert to URL-friendly format
    const urlFriendly = squadName
      .toLowerCase()
      .replace(/[🎨🧠🎤⚔️🦅🏦🔍🗣️]/g, '') // Remove emojis
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special characters
      .trim();
    
    console.log('Fallback URL generated for squad:', squadName, '->', urlFriendly);
    return `/squads/${urlFriendly}/chat`;
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        console.log('Checking squad chat access for:', squadName);
        
        // Check if user has completed onboarding and has a squad
        const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
        const hasDisplayName = localStorage.getItem('userDisplayName');
        
        console.log('Onboarding status:', { hasCompletedOnboarding, hasDisplayName });
        
        if (!hasCompletedOnboarding || !hasDisplayName) {
          console.log('User needs to complete onboarding, redirecting...');
          router.push('/onboarding');
          return;
        }

        // Get user's squad from localStorage
        const squadResult = localStorage.getItem('userSquad');
        console.log('Squad result from localStorage:', squadResult);
        
        if (squadResult) {
          try {
            const result = JSON.parse(squadResult);
            let userSquadName: string;
            
            // Handle both object and string formats
            if (typeof result === 'object' && result.name) {
              userSquadName = result.name;
            } else if (typeof result === 'string') {
              userSquadName = result;
            } else {
              throw new Error('Invalid squad result format');
            }
            
            console.log('User squad name:', userSquadName);
            setUserSquad(userSquadName);
            
            // Get squad IDs for comparison
            const userSquadId = getSquadId(userSquadName);
            const requestedSquadId = getSquadId(squadName);
            
            console.log('Squad comparison:', {
              userSquadId,
              requestedSquadId,
              userSquadName,
              requestedSquadName: squadName,
              normalizedUser: normalizeSquadName(userSquadName),
              normalizedRequested: normalizeSquadName(squadName)
            });
            
            // Check if user has access to this squad's chat
            const squadsMatch = doSquadsMatch(userSquadName, squadName);
            console.log('Squads match result:', squadsMatch);
            
            if (squadsMatch) {
              console.log('Access granted to squad chat');
              setHasAccess(true);
            } else {
              console.log('Access denied - squad mismatch');
              setHasAccess(false);
              setError(`You can only access your assigned squad's chat. Your squad: ${userSquadName}`);
              
              // Debug: Show the URL that would be generated
              const correctUrl = getSquadChatUrl(userSquadName);
              console.log('Generated squad chat URL:', correctUrl);
              console.log('Current URL:', window.location.pathname);
            }
          } catch (error) {
            console.error('Error parsing squad result:', error);
            setHasAccess(false);
            setError('Error reading your squad assignment. Please retake the placement test.');
          }
        } else {
          console.log('No squad assigned, redirecting to placement test');
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

              {/* Debug Section */}
              {userSquad && (
                <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-yellow-500/30">
                  <h3 className="text-yellow-400 font-semibold mb-2">🔧 Debug Information</h3>
                  <div className="text-xs text-gray-300 space-y-1">
                    <p><strong>Raw Squad Data:</strong> {JSON.stringify(userSquad)}</p>
                    <p><strong>Normalized Squad:</strong> {normalizeSquadName(userSquad)}</p>
                    <p><strong>Squad ID:</strong> {getSquadId(userSquad)}</p>
                    <p><strong>Generated URL:</strong> {getSquadChatUrl(userSquad)}</p>
                    <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
                  </div>
                  <Button
                    onClick={() => {
                      console.log('=== SQUAD CHAT DEBUG ===');
                      console.log('User Squad:', userSquad);
                      console.log('Normalized:', normalizeSquadName(userSquad));
                      console.log('Squad ID:', getSquadId(userSquad));
                      console.log('Generated URL:', getSquadChatUrl(userSquad));
                      console.log('Current URL:', window.location.pathname);
                      console.log('localStorage userSquad:', localStorage.getItem('userSquad'));
                      alert('Check browser console for detailed debug information');
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-yellow-500/30 text-yellow-400 hover:text-yellow-300"
                  >
                    Debug to Console
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative z-10 p-6 max-w-6xl mx-auto">
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

          {/* Squad Info Header */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-cyan-500/30">
            <h1 className="text-2xl font-bold text-cyan-400 mb-2">
              {squadName} Chat Room
            </h1>
            <p className="text-gray-300">
              Connect with your squad members and discuss strategies, share insights, and build your community.
            </p>
            
            {/* Debug Info */}
            <div className="mt-4 p-3 bg-slate-900/50 rounded border border-yellow-500/30">
              <h3 className="text-yellow-400 font-semibold text-sm mb-2">🔧 Debug Info</h3>
              <div className="text-xs text-gray-300 space-y-1">
                <p><strong>Squad Name:</strong> {squadName}</p>
                <p><strong>User Squad:</strong> {userSquad || 'Not assigned'}</p>
                <p><strong>Has Access:</strong> {hasAccess ? 'Yes' : 'No'}</p>
                <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
              </div>
              <Button
                onClick={() => {
                  console.log('=== SQUAD CHAT DEBUG ===');
                  console.log('Squad Name:', squadName);
                  console.log('User Squad:', userSquad);
                  console.log('Has Access:', hasAccess);
                  console.log('localStorage userSquad:', localStorage.getItem('userSquad'));
                  console.log('localStorage onboardingCompleted:', localStorage.getItem('onboardingCompleted'));
                  console.log('localStorage userDisplayName:', localStorage.getItem('userDisplayName'));
                  
                  // Test squad matching
                  if (userSquad) {
                    console.log('=== TESTING SQUAD MATCHING ===');
                    const testResult = doSquadsMatch(userSquad, squadName);
                    console.log('Test result:', testResult);
                  }
                  
                  alert('Check browser console for detailed debug information');
                }}
                variant="outline"
                size="sm"
                className="mt-2 border-yellow-500/30 text-yellow-400 hover:text-yellow-300"
              >
                Debug to Console
              </Button>
            </div>
          </div>

          {/* Chat Container */}
          <div className="h-[calc(100vh-300px)]">
            {/* Pinned Message Area */}
            <PinnedMessage squad={squadName} />
            
            <ChatRoom squad={squadName} />
          </div>
        </div>
      </div>
    </TokenGate>
  );
} 