'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface SquadAssignmentGuardProps {
  children: React.ReactNode;
}

export default function SquadAssignmentGuard({ children }: SquadAssignmentGuardProps) {
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSquadAssignment, setShowSquadAssignment] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Pages that don't require squad assignment
  const allowedPaths = [
    '/',
    '/onboarding',
    '/lore-narrative-crafting',
    '/placement/squad-test',
    '/choose-your-squad',
    '/profile',
    '/dashboard',
    '/courses'
  ];

  useEffect(() => {
    // Check if user has a squad assigned
    const squadResult = localStorage.getItem('userSquad');
    let squad: string | null = null;
    let lockEndDate: string | null = null;
    
    if (squadResult) {
      try {
        const result = JSON.parse(squadResult);
        squad = typeof result === 'object' && result.name ? result.name : result;
        lockEndDate = result.lockEndDate || null;
      } catch (error) {
        squad = squadResult;
      }
    }

    // Check if lock period has expired
    if (lockEndDate) {
      const lockEnd = new Date(lockEndDate);
      const now = new Date();
      if (now > lockEnd) {
        // Lock period expired, allow squad change
        localStorage.removeItem('userSquad');
        squad = null;
      }
    }

    setUserSquad(squad);
    setIsLoading(false);

    // Normalize pathname to handle trailing slashes
    const normalizedPathname = pathname.replace(/\/$/, '');
    
    // If user doesn't have a squad and is trying to access a restricted page
    if (!squad && !allowedPaths.includes(normalizedPathname)) {
      setShowSquadAssignment(true);
    } else {
      setShowSquadAssignment(false);
    }
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (showSquadAssignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-slate-800/60 border-purple-500/30">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mr-4" />
              <div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">Squad Assignment Required</h2>
                <p className="text-gray-300">You need to choose your squad before accessing this page</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 max-w-lg mx-auto">
              To access courses, leaderboards, and community features, you must first choose your squad. 
              Each squad has unique specialties and learning paths. Take your time to explore and find your perfect match.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/choose-your-squad"
                className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-200"
              >
                <Target className="w-5 h-5 mr-2" />
                Choose Your Squad
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/')}
                className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
} 