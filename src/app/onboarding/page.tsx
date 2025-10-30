'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, User, Trophy, CheckCircle, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initializeUserInLeaderboard } from '@/lib/utils';
import { useDisplayName } from '@/hooks/use-display-name';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();
  const { updateDisplayName } = useDisplayName();

  // Check if user has already completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    const hasDisplayName = localStorage.getItem('userDisplayName');
    
    if (hasCompletedOnboarding && hasDisplayName) {
      setIsCompleted(true);
    }
  }, []);

  const handleCompleteProfile = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;

    // Mark onboarding complete flags
    localStorage.setItem('onboardingCompleted', 'true');
    sessionStorage.setItem('justCompletedOnboarding', 'true');

    // Update global display name (updates localStorage + broadcasts)
    updateDisplayName(trimmed);

    // Persist to backend user record
    try {
      const walletAddress = localStorage.getItem('walletAddress') || 'demo-wallet';
      await fetch('/api/users/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, displayName: trimmed, activityType: 'onboarding_complete' })
      });
      // Initialize user in leaderboard system
      initializeUserInLeaderboard(walletAddress, trimmed, undefined);
    } catch (e) {
      // Non-blocking; UI already updated via hook
      console.error('Failed to persist display name during onboarding:', e);
    }

    setIsCompleted(true);
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Set up your display name to get started',
      component: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <User className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">Welcome to Hoodie Academy!</h2>
            <p className="text-gray-300">Let's set up your profile to get started on your Web3 learning journey.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-gray-300">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="bg-slate-700/50 border-cyan-500/30 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleCompleteProfile()}
              />
            </div>
            
            <Button
              onClick={handleCompleteProfile}
              disabled={!displayName.trim()}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              Complete Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Squad Information */}
          <div className="mt-8 p-4 bg-slate-700/30 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-cyan-400">Explore Your Squad</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              After setup, you can explore different squad tracks and take an optional personality test to find your perfect match.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">🎨 Hoodie Creators</Badge>
              <Badge variant="outline" className="text-gray-300 border-gray-500/30">🧠 Hoodie Decoders</Badge>
              <Badge variant="outline" className="text-red-400 border-red-500/30">🎤 Hoodie Speakers</Badge>
              <Badge variant="outline" className="text-blue-400 border-blue-500/30">⚔️ Hoodie Raiders</Badge>
              <Badge variant="outline" className="text-purple-400 border-purple-500/30 md:col-span-2">🦅 Hoodie Rangers</Badge>
            </div>
          </div>
        </div>
      )
    }
  ];

  // If onboarding is completed, show completion screen
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800/60 border-green-500/30">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Onboarding Complete!</h2>
            <p className="text-gray-300 mb-6">
              Welcome to Hoodie Academy! You're all set up and ready to start your Web3 learning journey.
            </p>
            <div className="animate-pulse">
              <p className="text-cyan-400">Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800/60 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Welcome to Hoodie Academy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Step 1 of 1</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          {steps[0].component}
        </CardContent>
      </Card>
    </div>
  );
} 