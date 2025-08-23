'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getSquadName } from '@/utils/squad-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, Mic, Palette, MessageSquare, Users, ArrowRight } from 'lucide-react';
import PageLayout from '@/components/layouts/PageLayout';

interface Squad {
  id: string;
  name: string;
  description: string;
  motto: string;
  icon: React.ReactNode;
  color: string;
  purpose: string;
  memberCount?: number;
}

const squads: Squad[] = [
  {
    id: 'decoders',
    name: 'Decoders',
    description: 'The Analysts',
    motto: "They don't guess. They test.",
    icon: <Brain className="w-6 h-6" />,
    color: 'bg-blue-500',
    purpose: 'Decode signals, identify market structure, validate meta',
    memberCount: 42
  },
  {
    id: 'raiders',
    name: 'Raiders',
    description: 'The Meta Hunters',
    motto: 'First in. First out. First to know.',
    icon: <Target className="w-6 h-6" />,
    color: 'bg-red-500',
    purpose: 'Track trend waves, time rotations, and lead stealth raids',
    memberCount: 38
  },
  {
    id: 'speakers',
    name: 'Speakers',
    description: 'The Signal Boosters',
    motto: 'They set the tone and shape the tribe.',
    icon: <Mic className="w-6 h-6" />,
    color: 'bg-purple-500',
    purpose: 'Host, guide, narrate the vibe — from Spaces to lore drops',
    memberCount: 25
  },
  {
    id: 'creators',
    name: 'Creators',
    description: 'The Builders of the Brand',
    motto: 'Without them, there is no vision to share.',
    icon: <Palette className="w-6 h-6" />,
    color: 'bg-green-500',
    purpose: 'Craft lore, visuals, and content systems that scale',
    memberCount: 31
  }
];

export default function SquadsPage() {
  const [userSquad, setUserSquad] = useState<string | null>(null);

  useEffect(() => {
    // Load user's squad from localStorage
    const savedSquad = getSquadName();
    if (savedSquad) {
      setUserSquad(savedSquad);
    }
  }, []);

  return (
    <PageLayout
      title="🏴‍☠️ Hoodie Squads"
      subtitle="Join your tribe and connect with fellow Hoodies"
      showHomeButton={true}
      showBackButton={true}
      backHref="/"
      backgroundImage=""
      backgroundOverlay={false}
    >
      {/* User's Current Squad */}
      {userSquad && (
        <div className="mb-8">
          <Card className="border-2 border-yellow-500/30 bg-yellow-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🎯</div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400">Your Squad</h3>
                    <p className="text-yellow-300">
                      {squads.find(s => s.id === userSquad)?.name || 'Unknown Squad'}
                    </p>
                  </div>
                </div>
                <Button asChild className="bg-yellow-600 hover:bg-yellow-700">
                  <Link href={`/squads/${userSquad}/chat`}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Go to Chat
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Squad Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {squads.map((squad) => (
          <Card key={squad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className={`${squad.color} text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {squad.icon}
                  <div>
                    <CardTitle className="text-xl">{squad.name}</CardTitle>
                    <p className="text-sm opacity-90">{squad.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {squad.memberCount} members
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Motto</p>
                  <p className="text-lg italic">"{squad.motto}"</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Purpose</p>
                  <p className="text-sm">{squad.purpose}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/squads/${squad.id}/chat`}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat Room
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/hoodie-squad-track">
                      <Users className="w-4 h-4 mr-2" />
                      Squad Info
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Squad Assignment Notice */}
      {!userSquad && (
        <Card className="border-2 border-orange-500/30 bg-orange-500/10">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-orange-400 mb-2">Squad Assignment Required</h3>
            <p className="text-orange-300 mb-4">
              Complete the onboarding process to be assigned to a squad and unlock chat access.
            </p>
            <Button asChild>
              <Link href="/onboarding">
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Onboarding
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Need help choosing a squad? Check out the detailed breakdown in Squad Track.
        </p>
        <Button asChild variant="outline">
          <Link href="/hoodie-squad-track">
            <Target className="w-4 h-4 mr-2" />
            View Squad Track
          </Link>
        </Button>
      </div>
    </PageLayout>
  );
}
