'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, User, Trophy, CheckCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();

  // Check if user has already completed onboarding
  useEffect(() => {
    // Check if onboarding is completed from database instead of localStorage
    // TODO: Implement database check here
    console.log('Checking onboarding status from database...');
    
    // For now, assume onboarding is not completed
    setIsCompleted(false);
  }, []);

  const handleCompleteProfile = () => {
    if (displayName.trim()) {
      // Save to database instead of localStorage
      // TODO: Implement database save here
      console.log('Profile completed, should save to database:', displayName.trim());
      setCurrentStep(1);
    }
  };

  const handleCompleteSquadTest = () => {
    // Save to database instead of localStorage
    // TODO: Implement database save here
    console.log('Squad test completed, should save to database');
    setIsCompleted(true);
    // Redirect to dashboard after a short delay
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
              Continue to Squad Placement
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'squad',
      title: 'Choose Your Squad',
      description: 'Select the squad that matches your skills and interests',
      component: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-purple-400 mb-2">Choose Your Squad</h2>
            <p className="text-gray-300">Select the squad that matches your skills, interests, and goals in the Hoodie Academy.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 p-3 text-center">
              🎨 Hoodie Creators
            </Badge>
            <Badge variant="outline" className="text-gray-300 border-gray-500/30 p-3 text-center">
              🧠 Hoodie Decoders
            </Badge>
            <Badge variant="outline" className="text-red-400 border-red-500/30 p-3 text-center">
              🎤 Hoodie Speakers
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-500/30 p-3 text-center">
              ⚔️ Hoodie Raiders
            </Badge>
            <Badge variant="outline" className="text-purple-400 border-purple-500/30 p-3 text-center md:col-span-2">
              🦅 Hoodie Rangers
            </Badge>
          </div>
          
          <Button
            asChild
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Link href="/choose-your-squad">
              Choose Your Squad
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-gray-400">
              After completing the test, you'll be redirected back here to finish setup.
            </p>
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

  const progress = ((currentStep + 1) / steps.length) * 100;

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
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          {steps[currentStep].component}
        </CardContent>
      </Card>
    </div>
  );
} 