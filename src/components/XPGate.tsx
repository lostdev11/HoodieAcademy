'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lock, TrendingUp, Star, ArrowRight, Trophy, Target } from 'lucide-react';
import Link from 'next/link';

interface XPGateProps {
  children: ReactNode;
  requiredXP: number;
  walletAddress: string;
  featureName?: string;
  description?: string;
  redirectUrl?: string;
}

export default function XPGate({
  children,
  requiredXP,
  walletAddress,
  featureName = 'This Feature',
  description = 'Keep earning XP to unlock this feature!',
  redirectUrl = '/dashboard'
}: XPGateProps) {
  const [userXP, setUserXP] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      fetchUserXP();
    }
  }, [walletAddress]);

  const fetchUserXP = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/xp?wallet=${walletAddress}`);
      const data = await response.json();

      if (data.exists) {
        setUserXP(data.totalXP || 0);
        setUserLevel(data.level || 1);
        setHasAccess(data.totalXP >= requiredXP);
      } else {
        setUserXP(0);
        setUserLevel(1);
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error fetching user XP:', error);
      setUserXP(0);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const progress = (userXP / requiredXP) * 100;
  const xpNeeded = requiredXP - userXP;

  // If user has access, render children
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="bg-slate-800/50 border-cyan-500/30 max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Checking your XP level...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // If no access, show unlock screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="bg-slate-800/50 border-orange-500/50 max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-orange-400">
            🔒 Feature Locked
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Feature Info */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">
              {featureName} Requires {requiredXP} XP
            </h2>
            <p className="text-gray-300">
              {description}
            </p>
          </div>

          {/* Current Progress */}
          <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Your Current XP</p>
                <p className="text-3xl font-bold text-cyan-400">{userXP.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Level</p>
                <p className="text-3xl font-bold text-purple-400">{userLevel}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress to unlock</span>
                <span className="text-orange-400 font-semibold">
                  {Math.min(100, Math.round(progress))}%
                </span>
              </div>
              <Progress value={Math.min(100, progress)} className="h-3" />
              <p className="text-sm text-center text-gray-400">
                {xpNeeded > 0 ? (
                  <>
                    <span className="text-orange-400 font-semibold">{xpNeeded.toLocaleString()} XP</span> needed to unlock
                  </>
                ) : (
                  <span className="text-green-400">✓ You have enough XP! Refresh the page.</span>
                )}
              </p>
            </div>
          </div>

          {/* Ways to Earn XP */}
          <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-lg p-6 border border-cyan-500/30">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Ways to Earn XP
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start space-x-2">
                <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Complete Courses</p>
                  <p className="text-gray-400">50-150 XP per course</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Trophy className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Submit Bounties</p>
                  <p className="text-gray-400">10-280 XP per bounty</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Target className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Give Feedback</p>
                  <p className="text-gray-400">10-100 XP per feedback</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Daily Login</p>
                  <p className="text-gray-400">5 XP per day</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/courses" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700">
                <TrendingUp className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </Link>
            <Link href="/bounties" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                <Trophy className="w-4 h-4 mr-2" />
                View Bounties
              </Button>
            </Link>
          </div>

          <Link href={redirectUrl} className="block">
            <Button variant="outline" className="w-full border-slate-600 text-gray-300 hover:bg-slate-700">
              <ArrowRight className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Motivational Message */}
          <div className="text-center pt-4 border-t border-slate-600">
            <p className="text-sm text-gray-400">
              💡 <span className="text-cyan-400">Pro tip:</span> Complete 2-3 courses to unlock the Social Feed!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

