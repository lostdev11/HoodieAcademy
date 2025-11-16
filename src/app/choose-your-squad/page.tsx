'use client';
export const dynamic = 'force-static';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OFFICIAL_SQUADS, getSquadEmoji, getSquadBadgeImage } from '@/lib/squad-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Lock, Unlock } from 'lucide-react';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';

type SquadId = 'creators' | 'decoders' | 'speakers' | 'raiders' | 'rangers';

const SQUAD_ID_BY_NAME: Record<string, SquadId> = {
  Creators: 'creators',
  Decoders: 'decoders',
  Speakers: 'speakers',
  Raiders: 'raiders',
  Rangers: 'rangers',
};

export default function ChooseYourSquadPage() {
  const router = useRouter();
  const { wallet } = useWalletSupabase();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<{
    name: string | null;
    isLocked: boolean;
    remainingDays: number;
  } | null>(null);

  // Fetch existing squad/lock
  useEffect(() => {
    let isMounted = true;
    const fetchCurrent = async () => {
      if (!wallet) return;
      try {
        const res = await fetch(`/api/user-squad?wallet_address=${encodeURIComponent(wallet)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        if (data?.hasSquad) {
          setCurrent({
            name: data.squad?.name ?? null,
            isLocked: !!data.isLocked,
            remainingDays: data.remainingDays ?? 0,
          });
        } else {
          setCurrent({
            name: null,
            isLocked: false,
            remainingDays: 0,
          });
        }
      } catch (e) {
        // Non-fatal
      }
    };
    fetchCurrent();
    return () => {
      isMounted = false;
    };
  }, [wallet]);

  const canChange = useMemo(() => {
    if (!current) return true;
    return !current.isLocked;
  }, [current]);

  const handleSelect = async (name: string) => {
    if (!wallet) {
      setError('Please connect your wallet first.');
      return;
    }
    if (!canChange && current?.name !== name) {
      setError(`Your squad is locked for ${current?.remainingDays ?? 0} more day(s).`);
      return;
    }

    setError(null);
    setSubmitting(name);
    try {
      const payload = {
        wallet_address: wallet,
        squad: name,
        squad_id: SQUAD_ID_BY_NAME[name as keyof typeof SQUAD_ID_BY_NAME],
      };
      const res = await fetch('/api/user-squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to save squad');
      }
      try {
        localStorage.setItem('assignedSquad', JSON.stringify({ name }));
        localStorage.setItem('userSquad', name);
      } catch {}
      router.push('/dashboard');
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Choose Your Squad</h1>
          <p className="text-slate-300 mt-2">Pick a squad to focus your learning path.</p>
          {current?.name ? (
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-300">
              <span>Current squad:</span>
              <span className="font-semibold">{current.name}</span>
              {current.isLocked ? (
                <span className="inline-flex items-center gap-1 text-yellow-300">
                  <Lock className="w-4 h-4" /> locked {current.remainingDays}d
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-green-300">
                  <Unlock className="w-4 h-4" /> can change
                </span>
              )}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 text-red-300 text-sm">{error}</div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {OFFICIAL_SQUADS.map((name) => {
            const emoji = getSquadEmoji(name);
            const badge = getSquadBadgeImage(name);
            const isCurrent = current?.name === name;
            return (
              <Card key={name} className="bg-slate-800/60 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <span>{name}</span>
                    {isCurrent ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-green-300 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Selected
                      </span>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {badge ? (
                    <div className="mb-4">
                      <img
                        src={badge}
                        alt={`${name} badge`}
                        className="w-full h-32 object-contain"
                      />
                    </div>
                  ) : null}
                  <Button
                    className="w-full"
                    disabled={submitting !== null || (!canChange && !isCurrent)}
                    onClick={() => handleSelect(name)}
                  >
                    {submitting === name ? 'Saving...' : isCurrent ? 'Keep This Squad' : 'Select Squad'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

