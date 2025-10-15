'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface WelcomeTutorialProps {
  walletAddress?: string;
  onClose?: () => void;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  action?: {
    label: string;
    route: string;
  };
}

const STORAGE_KEY = 'hoodie_academy_onboarding_seen';

export default function WelcomeTutorial({ walletAddress, onClose }: WelcomeTutorialProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const features: Feature[] = [
    {
      id: 'welcome',
      icon: '🎓',
      title: 'Welcome to Hoodie Academy!',
      description: 'Your journey into Web3 mastery starts here. Learn, earn, and grow with our comprehensive courses, live mentorship, and community challenges.',
      badge: 'Getting Started',
      badgeColor: 'bg-gradient-to-r from-purple-600 to-cyan-600'
    },
    {
      id: 'courses',
      icon: '📚',
      title: 'Explore Learning Tracks',
      description: 'Access expert-crafted courses on blockchain, NFTs, trading psychology, and more. Complete modules to earn XP and level up your skills.',
      badge: '10+ Courses',
      badgeColor: 'bg-gradient-to-r from-blue-600 to-purple-600',
      action: {
        label: 'Browse Courses',
        route: '/dashboard'
      }
    },
    {
      id: 'mentorship',
      icon: '🎥',
      title: 'Join Live Mentorship Sessions',
      description: 'Learn directly from industry experts through live video sessions. Ask questions, participate in discussions, and network with peers.',
      badge: 'Live & Interactive',
      badgeColor: 'bg-gradient-to-r from-red-600 to-orange-600',
      action: {
        label: 'View Sessions',
        route: '/mentorship'
      }
    },
    {
      id: 'bounties',
      icon: '💰',
      title: 'Complete Bounties & Earn Rewards',
      description: 'Take on challenges, submit your work, and earn XP and NFT rewards. Show off your skills and build your portfolio.',
      badge: 'Earn Rewards',
      badgeColor: 'bg-gradient-to-r from-yellow-600 to-orange-600',
      action: {
        label: 'See Bounties',
        route: '/dashboard'
      }
    },
    {
      id: 'leaderboard',
      icon: '🏆',
      title: 'Climb the Leaderboard',
      description: 'Track your progress, compete with other learners, and showcase your achievements. The top performers get exclusive perks and recognition.',
      badge: 'Compete & Win',
      badgeColor: 'bg-gradient-to-r from-amber-600 to-yellow-600',
      action: {
        label: 'View Rankings',
        route: '/leaderboard'
      }
    },
    {
      id: 'community',
      icon: '🤝',
      title: 'Connect with the Community',
      description: 'Join squad chats, collaborate on projects, and be part of a thriving Web3 learning community. Your success is our success!',
      badge: 'Squad Up',
      badgeColor: 'bg-gradient-to-r from-cyan-600 to-blue-600'
    }
  ];

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    
    if (!hasSeen && walletAddress) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [walletAddress]);

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleClose = () => {
    // Mark as seen
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onClose?.();
  };

  const handleActionClick = (route: string) => {
    handleClose();
    router.push(route);
  };

  if (!isVisible) return null;

  const currentFeature = features[currentStep];
  const progress = ((currentStep + 1) / features.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={handleSkip}
      />
      
      {/* Tutorial Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <Card 
          className={`
            relative max-w-2xl w-full pointer-events-auto
            bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
            border-2 border-cyan-500/30
            shadow-2xl shadow-cyan-500/20
            animate-in zoom-in-95 slide-in-from-bottom-4 duration-500
            ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
            transition-all duration-200
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            title="Skip tutorial"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6">
              <Badge className={`${currentFeature.badgeColor} text-white border-0 px-3 py-1`}>
                {currentFeature.badge}
              </Badge>
              <span className="text-sm text-gray-400">
                Step {currentStep + 1} of {features.length}
              </span>
            </div>

            {/* Icon & Title */}
            <div className="text-center mb-8">
              <div className="text-7xl mb-4 animate-in zoom-in duration-500">
                {currentFeature.icon}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-in slide-in-from-top duration-500">
                {currentFeature.title}
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed max-w-xl mx-auto animate-in slide-in-from-bottom duration-500">
                {currentFeature.description}
              </p>
            </div>

            {/* Action Button (if available) */}
            {currentFeature.action && (
              <div className="flex justify-center mb-8">
                <Button
                  onClick={() => handleActionClick(currentFeature.action!.route)}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold px-8 py-3 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {currentFeature.action.label} →
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-700">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="ghost"
                className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous
              </Button>

              {/* Dot Indicators */}
              <div className="flex gap-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAnimating(true);
                      setTimeout(() => {
                        setCurrentStep(index);
                        setIsAnimating(false);
                      }, 200);
                    }}
                    className={`
                      w-2 h-2 rounded-full transition-all duration-300
                      ${index === currentStep 
                        ? 'bg-cyan-500 w-8' 
                        : 'bg-gray-600 hover:bg-gray-500'}
                    `}
                    title={`Go to step ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-semibold px-6"
              >
                {currentStep === features.length - 1 ? "Let's Go! 🚀" : 'Next →'}
              </Button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
          </div>
        </Card>
      </div>
    </>
  );
}

