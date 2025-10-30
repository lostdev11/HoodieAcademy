'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';

interface SquadBadgeProps {
  squad: string;
  walletAddress?: string;
  showPfpForAcademyMember?: boolean;
}

export default function SquadBadge({ squad, walletAddress, showPfpForAcademyMember = true }: SquadBadgeProps) {
  const [imageError, setImageError] = useState(false);
  const [userPfp, setUserPfp] = useState<string | null>(null);
  const [loadingPfp, setLoadingPfp] = useState(false);

  // Fetch user's PFP if they're an Academy Member
  useEffect(() => {
    if (showPfpForAcademyMember && walletAddress && squad === 'Unassigned') {
      fetchUserPfp();
    }
  }, [walletAddress, squad, showPfpForAcademyMember]);

  // Listen for PFP updates from profile page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('🔔 Storage event detected:', e.key, e.newValue, 'Current wallet:', walletAddress);
      if (e.key === 'profile_pfp_updated' && e.newValue === walletAddress) {
        console.log('🔄 PFP update detected for current wallet, refreshing...');
        // PFP was updated for this wallet, refresh it
        if (showPfpForAcademyMember && walletAddress && squad === 'Unassigned') {
          fetchUserPfp();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [walletAddress, squad, showPfpForAcademyMember]);

  const fetchUserPfp = async () => {
    if (!walletAddress) return;
    
    console.log('🔍 Fetching PFP for wallet:', walletAddress);
    setLoadingPfp(true);
    try {
      const response = await fetch(`/api/user-profile?wallet=${walletAddress}`);
      const data = await response.json();
      
      console.log('📡 PFP API response:', data);
      
      if (data.success && data.profile?.pfp_url) {
        console.log('✅ PFP found:', data.profile.pfp_url);
        setUserPfp(data.profile.pfp_url);
      } else {
        console.log('❌ No PFP found in response');
        setUserPfp(null);
      }
    } catch (error) {
      console.error('❌ Error fetching user PFP:', error);
    } finally {
      setLoadingPfp(false);
    }
  };
  
  // Fallback badge with emoji and styling
  const getFallbackBadge = (squadName: string) => {
    const emojiMap: Record<string, string> = {
      Creators: '🎨',
      Decoders: '🧠',
      Raiders: '⚔️',
      Speakers: '🎤',
      Rangers: '🦅',
      Unassigned: '🎓', // New: Unassigned users get academy badge
    };
    
    const colorMap: Record<string, string> = {
      Creators: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
      Decoders: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
      Raiders: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
      Speakers: 'bg-red-500/20 border-red-500/50 text-red-400',
      Rangers: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
      Unassigned: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400', // New: Cyan for unassigned
    };

    const displayName = squadName === 'Unassigned' ? 'Academy Member' : `${squadName} Squad`;

    // Special handling for Academy Member with PFP
    if (squadName === 'Unassigned' && showPfpForAcademyMember && userPfp) {
      return (
        <div className="text-center">
          <div className="w-40 h-40 rounded-xl border-2 bg-cyan-500/20 border-cyan-500/50 shadow-xl overflow-hidden">
            <ProfileAvatar pfpUrl={userPfp} size={160} />
          </div>
          <p className="mt-3 text-lg font-bold">{displayName}</p>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className={`w-40 h-40 rounded-xl border-2 ${colorMap[squadName] || 'bg-slate-500/20 border-slate-500/50 text-slate-300'} flex items-center justify-center text-6xl shadow-xl`}>
          {emojiMap[squadName] || '🏆'}
        </div>
        <p className="mt-3 text-lg font-bold">{displayName}</p>
      </div>
    );
  };

  // Normalize squad name to match badge map
  const normalizeSquadName = (squadName: string): string => {
    const normalized = squadName
      .replace(/^[🎨🧠🎤⚔️🦅]+\s*/, '') // Remove emoji prefixes
      .replace(/^Hoodie\s+/, '') // Remove "Hoodie " prefix
      .trim();
    
    // Map to badge names - ensure consistency with quiz data
    const nameMap: Record<string, string> = {
      'Creators': 'Creators',
      'Decoders': 'Decoders', 
      'Raiders': 'Raiders',
      'Speakers': 'Speakers',
      'Rangers': 'Rangers', // Fixed: was "Ranger" but should be "Rangers"
      'Treasury Builders': 'Creators', // Fallback to Creators badge
    };
    
    return nameMap[normalized] || normalized;
  };
  
  const normalizedSquad = normalizeSquadName(squad);
  
  const badgeMap: Record<string, string> = {
    Creators: '/badges/badge_creators.png',
    Decoders: '/badges/badge_decoders.png',
    Raiders: '/badges/badge_raiders.png',
    Speakers: '/badges/badge_speakers.png',
    Rangers: '/badges/badge_ranger.png',
    Unassigned: '', // No image badge for unassigned - use fallback
  };

  const badgePath = badgeMap[normalizedSquad];
  
  // Always use fallback for Unassigned or if no badge path found
  if (!badgePath || normalizedSquad === 'Unassigned') {
    return getFallbackBadge(normalizedSquad);
  }

  if (imageError) {
    console.warn(`Image failed to load for squad: ${normalizedSquad}, using fallback`);
    return getFallbackBadge(normalizedSquad);
  }

  return (
    <div className="text-center">
      <Image
        src={badgePath}
        alt={`${normalizedSquad} Squad`}
        width={160}
        height={160}
        className="mx-auto rounded-xl shadow-xl"
        onError={() => setImageError(true)}
      />
      <p className="mt-3 text-lg font-bold">{normalizedSquad} Squad</p>
    </div>
  );
} 