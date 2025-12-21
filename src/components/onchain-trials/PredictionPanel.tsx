'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wallet, Lock, Trophy, TrendingDown } from 'lucide-react';
import { useSNSResolution } from '@/hooks/use-sns-resolution';
import type { PredictionType } from '@/types/onchain-trials';

interface PredictionPanelProps {
  walletAddress: string | null;
  onLockPrediction: (predictionType: PredictionType, stakeAmount: number) => Promise<string | null>;
}

const STAKE_OPTIONS = [0.01, 0.02, 0.05];

export default function PredictionPanel({ walletAddress, onLockPrediction }: PredictionPanelProps) {
  const [predictionType, setPredictionType] = useState<PredictionType>('beat_median_score');
  const [stakeAmount, setStakeAmount] = useState<number>(0.01);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<'win' | 'loss' | 'pending' | null>(null);

  const { resolvedName, loading: snsLoading } = useSNSResolution(walletAddress);

  const handleClick = async () => {
    if (!walletAddress) {
      // you can also just let the page handle this
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    try {
      const id = await onLockPrediction(predictionType, stakeAmount);
      if (id) {
        // optional: store locally or show success UI
        console.log('Prediction locked with id:', id);
        setLastResult('pending');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayWallet = walletAddress 
    ? (resolvedName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`)
    : 'Not connected';

  return (
    <Card className="bg-slate-800/50 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Wallet className="w-5 h-5" />
          Prediction Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Connected Wallet</label>
          <div className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg border border-cyan-500/20">
            {snsLoading ? (
              <div className="flex items-center gap-2 text-cyan-400">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Resolving...</span>
              </div>
            ) : (
              <>
                <span className="text-sm font-mono text-cyan-400 flex-1">{displayWallet}</span>
                {resolvedName && (
                  <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                    .sol
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>

        {/* Prediction Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Prediction Type</label>
          <Select
            value={predictionType}
            onValueChange={(value) => setPredictionType(value as PredictionType)}
          >
            <SelectTrigger className="bg-slate-700/50 border-cyan-500/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-cyan-500/30">
              <SelectItem value="beat_median_score" className="text-white hover:bg-slate-700">
                Will I beat today&apos;s median score?
              </SelectItem>
              <SelectItem value="complete_under_time" className="text-white hover:bg-slate-700">
                Will I complete the Trial under X seconds?
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stake Amount Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Stake Amount (SOL)</label>
          <div className="flex gap-2">
            {STAKE_OPTIONS.map((amount) => (
              <Button
                key={amount}
                variant={stakeAmount === amount ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStakeAmount(amount)}
                className={
                  stakeAmount === amount
                    ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                    : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                }
              >
                {amount} SOL
              </Button>
            ))}
          </div>
        </div>

        {/* Lock Prediction Button */}
        <Button
          onClick={handleClick}
          disabled={!walletAddress || isSubmitting}
          className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Locking...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Lock Prediction
            </>
          )}
        </Button>

        {/* Result Placeholder */}
        {lastResult && (
          <div className="p-4 bg-slate-700/50 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              {lastResult === 'win' ? (
                <Trophy className="w-5 h-5 text-yellow-400" />
              ) : lastResult === 'loss' ? (
                <TrendingDown className="w-5 h-5 text-red-400" />
              ) : (
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span className="text-sm font-medium text-gray-300">
                {lastResult === 'win' ? 'Win!' : lastResult === 'loss' ? 'Loss' : 'Pending...'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {lastResult === 'pending' 
                ? 'Waiting for game result...'
                : `Your prediction has been ${lastResult === 'win' ? 'won' : 'lost'}.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

