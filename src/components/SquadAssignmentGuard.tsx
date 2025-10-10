'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { fetchUserSquad, getSquadNameFromCache } from '@/utils/squad-api';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';

interface SquadAssignmentGuardProps {
  children: React.ReactNode;
}

export default function SquadAssignmentGuard({ children }: SquadAssignmentGuardProps) {
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSquadAssignment, setShowSquadAssignment] = useState(false);
  const [hasCheckedDatabase, setHasCheckedDatabase] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { wallet: walletAddress } = useWalletSupabase();

  // Only the squad selection page is allowed without a squad
  const allowedPaths = [
    '/choose-your-squad'
  ];

  useEffect(() => {
    const checkSquadStatus = async () => {
      // If no wallet connected, don't block
      if (!walletAddress) {
        setIsLoading(false);
        setShowSquadAssignment(false);
        return;
      }

      console.log('[SQUAD GUARD] Checking squad for wallet:', walletAddress);

      // Show cached squad immediately for UX
      const cachedSquad = getSquadNameFromCache();
      if (cachedSquad) {
        console.log('[SQUAD GUARD] Found cached squad:', cachedSquad);
        setUserSquad(cachedSquad);
        setIsLoading(false); // Don't wait for DB if we have cache
      }
      
      // Always fetch from database (source of truth)
      try {
        console.log('[SQUAD GUARD] Fetching squad from database...');
        const squadData = await fetchUserSquad(walletAddress);
        
        console.log('[SQUAD GUARD] Database response:', squadData);
        
        if (squadData && squadData.hasSquad && squadData.squad) {
          console.log('[SQUAD GUARD] User has squad:', squadData.squad.name);
          setUserSquad(squadData.squad.name);
          setHasCheckedDatabase(true);
          setIsLoading(false);
        } else {
          // No squad in database
          console.log('[SQUAD GUARD] No squad found in database');
          setUserSquad(null);
          setHasCheckedDatabase(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[SQUAD GUARD] Error checking squad status:', error);
        // Fall back to cached data if available
        if (!cachedSquad) {
          setUserSquad(null);
        }
        setHasCheckedDatabase(true);
        setIsLoading(false);
      }
    };

    checkSquadStatus();
    
    // Listen for storage changes (when squad is updated in another tab or by choose-your-squad page)
    const handleStorageChange = () => {
      console.log('[SQUAD GUARD] Storage changed, refreshing squad...');
      const cachedSquad = getSquadNameFromCache();
      if (cachedSquad) {
        setUserSquad(cachedSquad);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [walletAddress]);

  useEffect(() => {
    // Normalize pathname to handle trailing slashes
    const normalizedPathname = pathname.replace(/\/$/, '');
    
    console.log('[SQUAD GUARD] Path check:', {
      pathname: normalizedPathname,
      walletAddress: !!walletAddress,
      userSquad,
      isLoading,
      hasCheckedDatabase,
      isAllowedPath: allowedPaths.includes(normalizedPathname)
    });
    
    // If user has wallet but no squad and is trying to access ANY page except allowed paths
    // AND we've finished checking the database
    if (walletAddress && !userSquad && !isLoading && hasCheckedDatabase && !allowedPaths.includes(normalizedPathname)) {
      console.log('[SQUAD GUARD] Showing squad assignment prompt');
      setShowSquadAssignment(true);
    } else {
      setShowSquadAssignment(false);
    }
  }, [pathname, userSquad, isLoading, walletAddress, hasCheckedDatabase]);

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
        <Card className="w-full max-w-3xl bg-slate-800/60 border-purple-500/30">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-16 h-16 text-purple-400 mr-4 animate-pulse" />
              <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  Welcome to Hoodie Academy! 🎉
                </h2>
                <p className="text-gray-300 text-lg">Choose Your Path to Mastery</p>
              </div>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 mb-6">
              <p className="text-gray-200 mb-4 text-lg leading-relaxed">
                Before you start your journey, you'll need to <strong className="text-purple-400">choose your squad</strong>. 
                Each squad specializes in different skills and learning paths designed to help you excel.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left text-sm">
                <div className="flex items-start space-x-2">
                  <Target className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Unique specialties and learning paths</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Squad-specific challenges and rewards</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Target className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Collaborate with like-minded members</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Target className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">30-day commitment to your chosen path</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/choose-your-squad"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Choose My Squad
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </div>

            <p className="text-gray-400 text-sm mt-6">
              💡 Don't worry - you can explore all squad options before making your choice!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
} 