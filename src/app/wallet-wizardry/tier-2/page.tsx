'use client';

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Tier2() {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Check if this tier is already completed
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem('walletWizardryProgress');
      if (savedStatus) {
        const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
        // Check if tier 2 (index 1) is completed
        if (parsedStatus[1] === 'completed') {
          setIsCompleted(true);
        }
      }
    }
  }, []);

  const markAsCompleted = () => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem('walletWizardryProgress');
      let parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = ['completed', 'unlocked', 'locked', 'locked'];
      
      if (savedStatus) {
        parsedStatus = JSON.parse(savedStatus);
      }
      
      // Mark tier 2 as completed and unlock tier 3
      parsedStatus[1] = 'completed';
      if (parsedStatus.length > 2) {
        parsedStatus[2] = 'unlocked';
      }
      
      localStorage.setItem('walletWizardryProgress', JSON.stringify(parsedStatus));
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
            Tier 2: Custodial vs Non-Custodial Wallets
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
              Custodial wallets give a third party control of your keys. Non-custodial wallets give YOU control.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-500/30 mb-6">
            <p className="text-lg text-gray-300 leading-relaxed">
              Non-custodial = full ownership, full responsibility. Forget the recovery phrase? You're locked out.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-cyan-500/30 mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Key Takeaways</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>Custodial wallets = third party controls your keys.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>Non-custodial wallets = you control your keys.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>Recovery phrase is your backup - keep it safe!</span>
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
            <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">Tier 2 Completed!</span>
              </div>
              <p className="text-green-300 mt-2">You can now proceed to Tier 3</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 