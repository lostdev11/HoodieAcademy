"use client";
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";

export default function SquadIndicator() {
  const [userSquad, setUserSquad] = useState<string | null>(null);

  useEffect(() => {
    // Get squad from localStorage
    const savedSquad = localStorage.getItem('userSquad');
    if (savedSquad) {
      setUserSquad(savedSquad);
    }
  }, []);

  if (!userSquad) {
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-300 bg-amber-500/10">
        No Squad
      </Badge>
    );
  }

  const squadConfig: Record<string, { emoji: string; color: string }> = {
    Creators: { emoji: '🎨', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' },
    Decoders: { emoji: '🧠', color: 'bg-gray-500/20 border-gray-500/50 text-gray-300' },
    Raiders: { emoji: '⚔️', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
    Speakers: { emoji: '🎤', color: 'bg-red-500/20 border-red-500/50 text-red-400' },
    Rangers: { emoji: '🦅', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400' },
  };

  const config = squadConfig[userSquad] || { emoji: '🏆', color: 'bg-slate-500/20 border-slate-500/50 text-slate-300' };

  return (
    <Badge variant="outline" className={`${config.color}`}>
      {config.emoji} {userSquad}
    </Badge>
  );
}
