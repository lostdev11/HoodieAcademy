import Image from 'next/image';
import { useState } from 'react';

export default function SquadBadge({ squad }: { squad: string }) {
  const [imageError, setImageError] = useState(false);
  
  // Normalize squad name to match badge map
  const normalizeSquadName = (squadName: string): string => {
    const normalized = squadName
      .replace(/^[🎨🧠🎤⚔️🦅]+\s*/, '') // Remove emoji prefixes
      .replace(/^Hoodie\s+/, '') // Remove "Hoodie " prefix
      .trim();
    
    // Map to badge names
    const nameMap: Record<string, string> = {
      'Creators': 'Creators',
      'Decoders': 'Decoders', 
      'Raiders': 'Raiders',
      'Speakers': 'Speakers',
      'Rangers': 'Ranger', // Note: badge is named "Ranger" not "Rangers"
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
    Ranger: '/badges/badge_ranger.png',
  };

  const badgePath = badgeMap[normalizedSquad];
  if (!badgePath) {
    // Return fallback badge if no matching badge found
    return getFallbackBadge(normalizedSquad);
  }

  // Fallback badge with emoji and styling
  const getFallbackBadge = (squadName: string) => {
    const emojiMap: Record<string, string> = {
      Creators: '🎨',
      Decoders: '🧠',
      Raiders: '⚔️',
      Speakers: '🎤',
      Ranger: '🦅',
    };
    
    const colorMap: Record<string, string> = {
      Creators: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
      Decoders: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
      Raiders: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
      Speakers: 'bg-red-500/20 border-red-500/50 text-red-400',
      Ranger: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    };

    return (
      <div className="text-center">
        <div className={`w-40 h-40 rounded-xl border-2 ${colorMap[squadName] || 'bg-slate-500/20 border-slate-500/50 text-slate-300'} flex items-center justify-center text-6xl shadow-xl`}>
          {emojiMap[squadName] || '🏆'}
        </div>
        <p className="mt-3 text-lg font-bold">{squadName} Badge</p>
      </div>
    );
  };

  if (imageError) {
    return getFallbackBadge(normalizedSquad);
  }

  return (
    <div className="text-center">
      <Image
        src={badgePath}
        alt={`${normalizedSquad} Badge`}
        width={160}
        height={160}
        className="mx-auto rounded-xl shadow-xl"
        onError={() => setImageError(true)}
      />
      <p className="mt-3 text-lg font-bold">{normalizedSquad} Badge</p>
    </div>
  );
} 