'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import ChatRoom from '@/components/chat/ChatRoom';
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

  const squadName = decodeURIComponent(params.squad);

  useEffect(() => {
    // Check if user has completed onboarding and has a squad
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    const hasDisplayName = localStorage.getItem('userDisplayName');
    
    if (!hasCompletedOnboarding || !hasDisplayName) {
      router.push('/onboarding');
      return;
    }

    // Get user's squad from localStorage
    const squadResult = localStorage.getItem('userSquad');
    if (squadResult) {
      try {
        const result = JSON.parse(squadResult);
        const userSquadName = result.name.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, '');
        setUserSquad(userSquadName);
        
        // Check if user has access to this squad's chat
        if (userSquadName.toLowerCase() === squadName.toLowerCase()) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error parsing squad result:', error);
        setHasAccess(false);
      }
    } else {
      // No squad assigned, redirect to placement test
      router.push('/placement/squad-test');
      return;
    }
    
    setIsLoading(false);
  }, [squadName, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Loading...</div>
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
                <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-400 mb-2">
                  Squad Access Required
                </h2>
                <p className="text-gray-300 mb-4">
                  You can only access the chat room for your assigned squad.
                </p>
                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-400 mb-2">Your Squad:</p>
                  <p className="text-cyan-400 font-semibold">{userSquad}</p>
                  <p className="text-sm text-gray-400 mt-2">Requested Access:</p>
                  <p className="text-red-400 font-semibold">{squadName}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                >
                  <Link href={`/squads/${userSquad}/chat`}>
                    <Users className="w-4 h-4 mr-2" />
                    Go to Your Squad Chat
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300"
                >
                  <Link href="/placement/squad-test">
                    Retake Squad Test
                  </Link>
                </Button>
              </div>
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

          {/* Chat Container */}
          <div className="h-[calc(100vh-200px)]">
            <ChatRoom squad={squadName} />
          </div>
        </div>
      </div>
    </TokenGate>
  );
} 