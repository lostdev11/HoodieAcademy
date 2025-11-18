'use client';
export const dynamic = 'force-static';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OFFICIAL_SQUADS, getSquadEmoji, getSquadBadgeImage } from '@/lib/squad-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Lock, Unlock } from 'lucide-react';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SquadId = 'creators' | 'decoders' | 'speakers' | 'raiders' | 'rangers';

const SQUAD_ID_BY_NAME: Record<string, SquadId> = {
  Creators: 'creators',
  Decoders: 'decoders',
  Speakers: 'speakers',
  Raiders: 'raiders',
  Rangers: 'rangers',
};

const SQUAD_COLORS: Record<string, string> = {
  Creators: 'bg-pink-500/30 text-pink-200 ring-1 ring-pink-400/30',
  Decoders: 'bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/30',
  Speakers: 'bg-purple-500/30 text-purple-200 ring-1 ring-purple-400/30',
  Raiders: 'bg-red-500/30 text-red-200 ring-1 ring-red-400/30',
  Rangers: 'bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-400/30',
};

const SQUAD_DESCRIPTIONS: Record<string, string> = {
  Creators:
    'Content creators and artists who craft stories, visuals, and experiences that grow the Hoodie brand. Ideal if you love designing, editing, or building narratives.',
  Decoders:
    'Technical analysts, researchers, and builders who break down complex problems, explore on-chain data, and ship scrappy tools. Ideal if you enjoy researching or coding.',
  Speakers:
    'Community leaders, moderators, and hosts who rally people, run sessions, and keep conversations high-signal. Ideal if you thrive in public or group settings.',
  Raiders:
    'Strategists and operators who plan missions, execute growth plays, and move fast with precision. Ideal if you like competitiveness and decisive execution.',
  Rangers:
    'Elite path reserved for top performers across tracks. Unlocks after completing required tracks and demonstrating consistent excellence.',
};

const SQUAD_MOTTO: Record<string, string> = {
  Creators: 'Make it beautiful. Make it resonate.',
  Decoders: 'Signal over noise. Facts over vibes.',
  Speakers: 'Lead the room. Shape the narrative.',
  Raiders: 'Move fast. Hit hard. Win clean.',
  Rangers: 'Excellence is the standard.',
};

const SQUAD_PURPOSE: Record<string, string> = {
  Creators: 'Drive culture and brand through content, design, editing, and storytelling.',
  Decoders: 'Research, validate meta, and build tools to guide strategic decisions.',
  Speakers: 'Host, moderate, and amplify; keep channels high-signal and welcoming.',
  Raiders: 'Plan and execute missions that grow impact, reach, and outcomes.',
  Rangers: 'Operate at the highest level across tracks; mentor and set the bar.',
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
  const [eligibleForRangers, setEligibleForRangers] = useState<boolean>(false);

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
        // Rangers eligibility (optional fields; default false)
        const eligible =
          !!data?.eligibleForRangers ||
          (typeof data?.completedCoreSquads === 'number' && data.completedCoreSquads >= 4) ||
          (Array.isArray(data?.completedSquads) && data.completedSquads.filter((s: string) => s && s !== 'Rangers').length >= 4);
        setEligibleForRangers(eligible);
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

  const [pending, setPending] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const finalizeSelection = async (name: string) => {
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
        // Dispatch events to notify other components of squad change
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('squadUpdated', { 
          detail: { squad: name } 
        }));
      } catch {}
      router.push('/dashboard');
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(null);
      setPending(null);
      setConfirmOpen(false);
    }
  };

  const handleSelect = (name: string) => {
    // Gate Hoodie Rangers unless eligible or already current
    if (name === 'Rangers' && current?.name !== 'Rangers' && !eligibleForRangers) {
      setError('Rangers unlock after completing all four core squads.');
      return;
    }
    if (!canChange && current?.name !== name) {
      setError(`Your squad is locked for ${current?.remainingDays ?? 0} more day(s).`);
      return;
    }
    // If already selected, allow keeping without confirm; otherwise confirm lock
    if (current?.name === name) {
      finalizeSelection(name);
      return;
    }
    setPending(name);
    setConfirmOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Choose Your Squad</h1>
          <p className="text-slate-300 mt-2">
            Pick a squad to focus your learning path. Your selection will be locked for 30 days.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-sm text-yellow-200">
            <Lock className="w-4 h-4" />
            <span>
              Changing squads is restricted for 30 days after selection.
              {current?.isLocked ? ` ${current.remainingDays} day(s) remaining on your lock.` : ''}
            </span>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {OFFICIAL_SQUADS.map((name) => {
            const emoji = getSquadEmoji(name);
            const badge = getSquadBadgeImage(name);
            const isCurrent = current?.name === name;
            const isRangers = name === 'Rangers';
            const rangersLocked = isRangers && !isCurrent && !eligibleForRangers;
            return (
              <Card
                key={name}
                className={`bg-white/10 backdrop-blur-sm border-white/20 transition-all ${
                  isCurrent ? 'ring-2 ring-green-400/60' : 'hover:translate-y-[-2px]'
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-3">
                    <span
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${SQUAD_COLORS[name]}`}
                    >
                      <span className="text-2xl">{emoji}</span>
                    </span>
                    <span className="text-xl font-bold">{name}</span>
                    {isCurrent ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-green-300 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Selected
                      </span>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    {badge ? (
                      <div className="mb-4">
                        <img
                          src={badge}
                          alt={`${name} badge`}
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    ) : null}
                    <p className="text-sm text-slate-300 mb-2">{SQUAD_DESCRIPTIONS[name]}</p>
                    <p className="text-xs italic text-slate-400 mb-2">"{SQUAD_MOTTO[name]}"</p>
                    <p className="text-xs text-slate-400 mb-4">{SQUAD_PURPOSE[name]}</p>
                    <Button
                      className={`w-full ${rangersLocked ? 'bg-slate-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                      disabled={submitting !== null || (!canChange && !isCurrent) || rangersLocked}
                      onClick={() => handleSelect(name)}
                    >
                      {rangersLocked
                        ? 'Locked: Complete 4 squads'
                        : submitting === name
                        ? 'Saving...'
                        : isCurrent
                        ? 'Keep This Squad'
                        : 'Select Squad'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 30-day lock confirmation dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent className="bg-slate-800 border-purple-500/30 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-purple-400 flex items-center gap-2">
                Confirm Squad Selection
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <Lock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="font-semibold text-yellow-400">30-Day Lock Period</p>
                      <p className="text-sm text-gray-300">
                        Once selected, you cannot change your squad for 30 days. This ensures focus and prevents gaming the system.
                      </p>
                    </div>
                  </div>
                  {pending && (
                    <div className="p-3 rounded-md bg-slate-700/60 text-sm">
                      You are selecting: <span className="font-semibold">{pending}</span>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => pending && finalizeSelection(pending)}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

