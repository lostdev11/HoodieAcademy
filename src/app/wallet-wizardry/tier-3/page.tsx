'use client';

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { updateScoreForLessonCompletion } from '@/lib/utils';
import { completeCourse } from '@/lib/supabase';

export default function Tier3() {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Check if this tier is already completed
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem('walletWizardryProgress');
      if (savedStatus) {
        const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
        // Check if tier 3 (index 2) is completed
        if (parsedStatus[2] === 'completed') {
          setIsCompleted(true);
        }
      }
    }
  }, []);

  const markAsCompleted = async () => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem('walletWizardryProgress');
      let parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = ['completed', 'completed', 'unlocked', 'locked'];
      
      if (savedStatus) {
        parsedStatus = JSON.parse(savedStatus);
      }
      
      // Mark tier 3 as completed and unlock tier 4
      parsedStatus[2] = 'completed';
      if (parsedStatus.length > 3) {
        parsedStatus[3] = 'unlocked';
      }
      
      localStorage.setItem('walletWizardryProgress', JSON.stringify(parsedStatus));
      
      // Get user's wallet address (no demo-wallet fallback)
      const walletAddress = localStorage.getItem('userWalletAddress') || 
                           localStorage.getItem('connectedWallet') || 
                           localStorage.getItem('walletAddress') ||
                           (typeof window !== 'undefined' && window.solana?.publicKey ? window.solana.publicKey.toString() : null);
      
      // Update leaderboard score
      updateScoreForLessonCompletion(walletAddress, 'wallet-wizardry', 2, 4); // tier-3 is lesson 2 of 4
      
      // Record course completion in database
      if (walletAddress) {
        await completeCourse(walletAddress, 'wallet-wizardry-tier-3');
        console.log('✅ Tier 3 completion recorded in database for wallet:', walletAddress);
      }
      
      setIsCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Button
            asChild
            variant="outline"
            className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30"
          >
            <Link href="/wallet-wizardry">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Wallet Wizardry
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
            Tier 3: Understanding Keys & Phantom Interface
          </h1>
          <div className="flex items-center justify-center gap-2 text-cyan-300">
            <span className="text-lg">🔒</span>
            <span className="text-lg">Vault Keeper Path</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-500/30 mb-6">
            <p className="text-lg text-gray-300 leading-relaxed">
              Your public key is your receiving address. Your private key gives access. Never share it.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-500/30 mb-6">
            <p className="text-lg text-gray-300 leading-relaxed">
              Phantom displays your public address, lets you view your secret phrase (under Settings &gt; Security).
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-500/30 mb-8">
            <p className="text-lg text-gray-300 leading-relaxed">
              Always store your recovery phrase offline — it's the only way to recover your wallet.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-500/30 mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Key Takeaways</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>Public key = receiving address (safe to share).</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>Private key = access control (never share).</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>Recovery phrase = backup for wallet restoration.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Completion Button */}
        <div className="text-center">
          {!isCompleted ? (
            <Button
              onClick={markAsCompleted}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold"
            >
              Mark as Completed
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-lg font-semibold">Tier 3 Completed!</span>
                </div>
                <p className="text-green-300 mt-2">You can now proceed to Tier 4</p>
              </div>
              
              {/* Next Tier Button */}
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold"
              >
                <Link href="/wallet-wizardry/tier-4">
                  Continue to Tier 4: NFTs, dApps, DeFi, and Bridges
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 