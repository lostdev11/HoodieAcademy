'use client';

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { updateScoreForLessonCompletion } from '@/lib/utils';
import { updateUserActivity } from '@/lib/supabase';

export default function Tier4() {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Check if this tier is already completed
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem('walletWizardryProgress');
      if (savedStatus) {
        const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
        // Check if tier 4 (index 3) is completed
        if (parsedStatus[3] === 'completed') {
          setIsCompleted(true);
        }
      }
    }
  }, []);

  const markAsCompleted = async () => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem('walletWizardryProgress');
      let parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = ['completed', 'completed', 'completed', 'unlocked'];
      
      if (savedStatus) {
        parsedStatus = JSON.parse(savedStatus);
      }
      
      // Mark tier 4 as completed
      parsedStatus[3] = 'completed';
      
      localStorage.setItem('walletWizardryProgress', JSON.stringify(parsedStatus));
      
      // Update leaderboard score
      const walletAddress = localStorage.getItem('walletAddress') || 'demo-wallet';
      updateScoreForLessonCompletion(walletAddress, 'wallet-wizardry', 3, 4); // tier-4 is lesson 3 of 4
      
      // Track user activity in Supabase
      if (walletAddress && walletAddress !== 'demo-wallet') {
        try {
          await updateUserActivity(walletAddress, 'course_completion');
          console.log('✅ Course completion activity recorded');
        } catch (error) {
          console.error('❌ Error recording course completion activity:', error);
        }
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
            Tier 4: NFTs, dApps, DeFi, and Bridges
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
              NFTs = unique digital assets for art, music, tickets, identity. Phantom shows your NFTs + prices.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-500/30 mb-6">
            <p className="text-lg text-gray-300 leading-relaxed">
              dApps = decentralized apps. You access them with Phantom via wallet login — no emails.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-500/30 mb-6">
            <p className="text-lg text-gray-300 leading-relaxed">
              DeFi = decentralized finance. Trade, borrow, or lend via protocols like Jupiter.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-500/30 mb-8">
            <p className="text-lg text-gray-300 leading-relaxed">
              Cross-chain swaps = bridge tokens across Solana, Ethereum, Polygon with Phantom's swapper.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-500/30 mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Key Takeaways</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>NFTs = unique digital assets with value.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>dApps = decentralized applications using wallet login.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>DeFi = financial services without intermediaries.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>Cross-chain swaps = move tokens between blockchains.</span>
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
                  <span className="text-lg font-semibold">Tier 4 Completed!</span>
                </div>
                <p className="text-green-300 mt-2">You can now take the Final Exam</p>
              </div>
              
              {/* Next Tier Button */}
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold"
              >
                <Link href="/wallet-wizardry/final-exam">
                  Take Final Exam: Complete Your Wallet Wizardry Journey
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 