'use client';

import { useState, useEffect } from 'react';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { MobileNavigation } from '@/components/dashboard/MobileNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, LogOut } from 'lucide-react';
import PredictionPanel from '@/components/onchain-trials/PredictionPanel';
import PlayerStats from '@/components/onchain-trials/PlayerStats';
import Leaderboard from '@/components/onchain-trials/Leaderboard';
import { GameCanvas } from '@/components/onchain-trials/GameCanvas';
import type { PredictionType } from '@/types/onchain-trials';
import type { PlayerStats as PlayerStatsType } from '@/types/onchain-trials';

export default function OnChainTrialsPage() {
  const { wallet, isAdmin, connectWallet, disconnectWallet } = useWalletSupabase();
  const [playerStats, setPlayerStats] = useState<PlayerStatsType | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activePredictionId, setActivePredictionId] = useState<string | null>(null);

  useEffect(() => {
    if (wallet) {
      fetchPlayerStats();
    } else {
      setPlayerStats(null);
    }
  }, [wallet]);

  const fetchPlayerStats = async () => {
    if (!wallet) return;

    setLoadingStats(true);
    try {
      const response = await fetch(`/api/onchain-trials/stats?wallet=${wallet}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setPlayerStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLockPrediction = async (
    predictionType: PredictionType,
    stakeAmount: number
  ): Promise<string | null> => {
    if (!wallet) {
      alert('Please connect your wallet first');
      return null;
    }

    try {
      const res = await fetch('/api/onchain-trials/prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          predictionType,
          stakeSol: stakeAmount,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to lock prediction');
      }

      const data = await res.json();

      const id = data?.prediction?.id as string | undefined;
      if (!id) {
        throw new Error('Prediction ID missing in response');
      }

      setActivePredictionId(id);

      alert(`Prediction locked! Type: ${predictionType}, Stake: ${stakeAmount} SOL`);
      return id;
    } catch (error) {
      console.error('Error locking prediction:', error);
      alert('There was an error locking your prediction. Please try again.');
      return null;
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setPlayerStats(null);
    setActivePredictionId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900" />
        
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent" />
        
        {/* Moving orbs */}
        <div 
          className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          style={{ animation: 'float 20s ease-in-out infinite' }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          style={{ animation: 'float 25s ease-in-out infinite reverse' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"
          style={{ animation: 'float 30s ease-in-out infinite' }}
        />
        
        {/* Animated grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(cyan 1px, transparent 1px),
              linear-gradient(90deg, cyan 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite',
          }}
        />
        
        {/* Floating particles */}
        <div 
          className="absolute top-20 left-10 w-2 h-2 bg-cyan-400/40 rounded-full blur-sm"
          style={{ animation: 'particleFloat 15s ease-in-out infinite' }}
        />
        <div 
          className="absolute top-40 right-20 w-1.5 h-1.5 bg-pink-400/40 rounded-full blur-sm"
          style={{ animation: 'particleFloat 18s ease-in-out infinite 2s' }}
        />
        <div 
          className="absolute bottom-32 left-1/3 w-2 h-2 bg-purple-400/40 rounded-full blur-sm"
          style={{ animation: 'particleFloat 20s ease-in-out infinite 4s' }}
        />
        <div 
          className="absolute top-1/3 right-1/4 w-1 h-1 bg-cyan-300/50 rounded-full blur-sm"
          style={{ animation: 'particleFloat 12s ease-in-out infinite 1s' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 bg-slate-800/60 backdrop-blur-md border-b border-cyan-500/40 shadow-lg shadow-cyan-500/10 px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Mobile Navigation */}
            <MobileNavigation userSquad={null} isAdmin={isAdmin} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400">
                  On-Chain Trials
                </h1>
                <Badge className="bg-green-500 text-white text-xs">NEW</Badge>
              </div>
              <p className="text-sm sm:text-base text-gray-300 mt-1">
                Solana-powered prediction mini-games built for the Indie.fun Hackathon.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full">
            {/* Wallet Info */}
            {wallet && (
              <div className="flex items-center space-x-2 bg-slate-700/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-cyan-500/40 w-full sm:w-auto flex-shrink-0 shadow-md shadow-cyan-500/10">
                <User className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-sm text-cyan-400 font-mono break-all">
                  {wallet.slice(0, 6)}...{wallet.slice(-6)}
                </span>
              </div>
            )}

            {/* Connect/Disconnect Button */}
            {wallet ? (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 w-full sm:w-auto min-h-[44px] flex-shrink-0"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={connectWallet}
                variant="outline"
                size="sm"
                className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-300 w-full sm:w-auto min-h-[44px] flex-shrink-0"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 2-Column Layout: Desktop, Stacked: Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left Column: Game Canvas */}
          <div className="order-1 lg:order-1">
            <div className="bg-slate-800/60 backdrop-blur-md border border-cyan-500/40 rounded-xl p-6 sm:p-8 min-h-[500px] flex items-center justify-center shadow-xl shadow-cyan-500/10 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300">
              <GameCanvas
                onGameEnd={async (scoreMs) => {
                  console.log('Trial finished. Score (ms):', scoreMs);

                  if (!wallet) return;

                  try {
                    const res = await fetch('/api/onchain-trials/settle', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        wallet,
                        predictionId: activePredictionId,
                        scoreMs,
                      }),
                    });

                    const data = await res.json();
                    console.log('Settle result:', data);

                    // refresh player stats if returned
                    if (data?.stats) {
                      setPlayerStats(data.stats);
                    } else {
                      fetchPlayerStats();
                    }

                    // Clear active prediction after settlement
                    setActivePredictionId(null);
                  } catch (err) {
                    console.error('Error settling trial:', err);
                  }
                }}
              />
            </div>
          </div>

          {/* Right Column: Prediction Panel + Player Stats */}
          <div className="order-2 lg:order-2 space-y-6">
            <PredictionPanel 
              walletAddress={wallet} 
              onLockPrediction={handleLockPrediction}
            />
            <PlayerStats stats={playerStats} loading={loadingStats} />
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="mt-8">
          <Leaderboard />
        </div>
      </main>
    </div>
  );
}

