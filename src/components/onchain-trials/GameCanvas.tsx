'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

type GameStatus = 'idle' | 'waiting' | 'ready' | 'finished';

interface GameCanvasProps {
  // Hook this into your stats/settlement logic
  onGameEnd?: (scoreMs: number | null) => void;
}

export function GameCanvas({ onGameEnd }: GameCanvasProps) {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [message, setMessage] = useState('Press START to begin the Daily Trial.');
  const [score, setScore] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeoutIfNeeded = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleStart = () => {
    // reset
    setScore(null);
    setStatus('waiting');
    setMessage('Wait for the signal...');

    clearTimeoutIfNeeded();
    startTimeRef.current = null;

    // random delay between 1–3 seconds
    const delay = 1000 + Math.random() * 2000;
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setStatus('ready');
      setMessage('TAP NOW!');
    }, delay);
  };

  const handleTap = () => {
    // Tap too early
    if (status === 'waiting') {
      clearTimeoutIfNeeded();
      startTimeRef.current = null;
      setStatus('finished');
      setMessage('Too early! You tapped before the signal.');
      setScore(null);
      if (onGameEnd) onGameEnd(null);
      return;
    }

    // Valid reaction
    if (status === 'ready' && startTimeRef.current) {
      const end = performance.now();
      const reactionMs = Math.round(end - startTimeRef.current);

      clearTimeoutIfNeeded();
      startTimeRef.current = null;
      setStatus('finished');
      setMessage('Nice reflexes! Your reaction time:');
      setScore(reactionMs);

      if (onGameEnd) onGameEnd(reactionMs);
      return;
    }

    // If idle/finished, ignore or prompt restart
  };

  useEffect(() => {
    return () => {
      clearTimeoutIfNeeded();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 w-full">
      {/* Icon / Visual */}
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
        <span className="text-4xl">🎯</span>
      </div>

      {/* Title / Description */}
      <div>
        <h3 className="text-xl font-bold text-cyan-400">Reaction Trial</h3>
        <p className="text-gray-300 text-sm max-w-md">
          Wait for the signal, then tap as fast as you can.
          Your reaction time determines your score for today&apos;s Trial.
        </p>
      </div>

      {/* Interactive Area */}
      <div
        className={`
          mt-2 px-6 py-8 rounded-lg border transition
          ${
            status === 'ready'
              ? 'border-green-500/60 bg-green-500/10'
              : status === 'waiting'
              ? 'border-yellow-500/60 bg-yellow-500/5'
              : 'border-cyan-500/30 bg-slate-900/40'
          }
          cursor-pointer select-none w-full max-w-md
        `}
        onClick={handleTap}
      >
        <p className="text-xs text-cyan-300 mb-2 uppercase tracking-wide">
          {status === 'ready'
            ? 'TAP NOW!'
            : status === 'waiting'
            ? 'Do NOT tap yet...'
            : 'Tap here when prompted'}
        </p>

        <p className="text-base text-gray-100 font-medium">{message}</p>

        {score !== null && (
          <p className="mt-3 text-2xl font-bold text-cyan-400">
            {score} ms
          </p>
        )}

        {status === 'finished' && score === null && (
          <p className="mt-3 text-sm text-red-400 font-semibold">
            False start! No score recorded.
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleStart}
          className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
        >
          {status === 'idle' || status === 'finished' ? 'Start Trial' : 'Restart'}
        </Button>
      </div>
    </div>
  );
}
