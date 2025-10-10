'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { fetchUserSquad, updateUserSquad } from '@/utils/squad-api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Users, Trophy, CheckCircle, ArrowRight, Clock, AlertTriangle, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SquadInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  role: string;
  specialties: string[];
  courses: string[];
  personality: string[];
  challenges: string[];
  locked: boolean;
}

const squads: SquadInfo[] = [
  {
    id: 'creators',
    name: 'Hoodie Creators',
    emoji: '🎨',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    description: 'Content creators, artists, and storytellers who build the cultural foundation of the Hoodie Academy.',
    role: 'Cultural Architects',
    specialties: ['Content Creation', 'Visual Design', 'Storytelling', 'Community Building', 'Brand Development'],
    courses: ['Meme Creation', 'Visual Composition', 'Comics & Sequential Art', 'Micro Animation', 'Custom Trait Creation'],
    personality: ['Creative', 'Expressive', 'Community-focused', 'Aesthetically driven', 'Story-oriented'],
    challenges: ['Design challenges', 'Meme competitions', 'Trait creation contests', 'Community events'],
    locked: false
  },
  {
    id: 'decoders',
    name: 'Hoodie Decoders',
    emoji: '🧠',
    color: 'text-gray-300',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    description: 'Technical analysts, researchers, and data-driven decision makers who decode market patterns and trends.',
    role: 'Data Scientists',
    specialties: ['Technical Analysis', 'Data Research', 'Pattern Recognition', 'Risk Assessment', 'Market Analysis'],
    courses: ['Chart Literacy', 'Technical Analysis Tactics', 'Support & Resistance', 'Indicator Basics', 'Confluence Strategy'],
    personality: ['Analytical', 'Detail-oriented', 'Research-driven', 'Patient', 'Methodical'],
    challenges: ['Analysis competitions', 'Pattern recognition', 'Data interpretation', 'Research projects'],
    locked: false
  },
  {
    id: 'speakers',
    name: 'Hoodie Speakers',
    emoji: '🎤',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    description: 'Community leaders, moderators, and communication specialists who amplify voices and build connections.',
    role: 'Community Leaders',
    specialties: ['Communication', 'Leadership', 'Moderation', 'Event Planning', 'Community Management'],
    courses: ['Community Strategy', 'SNS Simplified', 'Onboarding Wizard', 'Scaling Vibes', 'Raid Psychology'],
    personality: ['Charismatic', 'Empathetic', 'Leadership-oriented', 'Social', 'Motivational'],
    challenges: ['Leadership roles', 'Community events', 'Moderation tasks', 'Mentorship programs'],
    locked: false
  },
  {
    id: 'raiders',
    name: 'Hoodie Raiders',
    emoji: '⚔️',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Traders, strategists, and risk-takers who navigate market dynamics and execute tactical moves.',
    role: 'Market Warriors',
    specialties: ['Trading Strategy', 'Risk Management', 'Market Timing', 'Portfolio Management', 'Tactical Execution'],
    courses: ['NFT Mastery', 'Trading Psychology', 'Floor Games', 'Bid Games', 'Trait Meta'],
    personality: ['Strategic', 'Risk-tolerant', 'Action-oriented', 'Competitive', 'Results-driven'],
    challenges: ['Trading competitions', 'Strategy development', 'Risk management', 'Portfolio challenges'],
    locked: false
  },
  {
    id: 'rangers',
    name: 'Hoodie Rangers',
    emoji: '🦅',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Elite explorers and pioneers who have mastered all four core tracks. Only available after completing all other squad tracks.',
    role: 'Elite Scouts',
    specialties: ['Mastery Integration', 'Cross-Disciplinary Skills', 'Advanced Strategy', 'Innovation Leadership', 'System Mastery'],
    courses: ['Advanced Integration', 'Mastery Projects', 'Elite Challenges', 'Leadership Development', 'Innovation Labs'],
    personality: ['Masterful', 'Integrative', 'Visionary', 'Experienced', 'Leadership-focused'],
    challenges: ['Elite missions', 'Mastery challenges', 'Leadership projects', 'Innovation initiatives'],
    locked: true
  }
];

export default function ChooseYourSquadPage() {
  const [selectedSquad, setSelectedSquad] = useState<SquadInfo | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentSquad, setCurrentSquad] = useState<SquadInfo | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingDays, setRemainingDays] = useState(0);
  const [saving, setSaving] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renewSuccess, setRenewSuccess] = useState(false);
  const router = useRouter();
  const { wallet: walletAddress } = useWalletSupabase();

  useEffect(() => {
    // Fetch user's squad from database
    const loadSquadData = async () => {
      if (!walletAddress) return;
      
      try {
        const squadData = await fetchUserSquad(walletAddress);
        
        if (squadData && squadData.hasSquad && squadData.squad) {
          // Find the matching squad info
          const squadInfo = squads.find(s => 
            s.id === squadData.squad?.id || s.name === squadData.squad?.name
          );
          
          if (squadInfo) {
            setCurrentSquad(squadInfo);
          }
          
          // Set lock status from API
          setIsLocked(squadData.isLocked);
          setRemainingDays(squadData.remainingDays);
        }
      } catch (error) {
        console.error('Error loading squad data:', error);
      }
    };
    
    loadSquadData();
  }, [walletAddress]);

  const handleSquadSelection = (squad: SquadInfo) => {
    if (squad.locked) {
      // Show locked message instead of confirmation
      alert('Hoodie Rangers is locked! Complete all 4 core squad tracks to unlock this elite path.');
      return;
    }
    
    // Check if user has a locked squad
    if (isLocked && currentSquad && currentSquad.id !== squad.id) {
      alert(`You are currently locked into ${currentSquad.name} for ${remainingDays} more days. You can change your squad after the lock period expires.`);
      return;
    }
    
    setSelectedSquad(squad);
    setShowConfirmation(true);
  };

  const handleRenewSquad = async () => {
    if (!currentSquad || !walletAddress) return;
    
    setRenewing(true);
    setError(null);
    setRenewSuccess(false);
    
    try {
      const result = await updateUserSquad(
        walletAddress,
        currentSquad.name,
        currentSquad.id,
        true // renew flag
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to renew squad');
      }

      // Update state
      setIsLocked(true);
      setRemainingDays(30);
      setRenewSuccess(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => setRenewSuccess(false), 5000);
      
    } catch (err) {
      console.error('Error renewing squad:', err);
      setError(err instanceof Error ? err.message : 'Failed to renew squad');
    } finally {
      setRenewing(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedSquad || !walletAddress) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const result = await updateUserSquad(
        walletAddress,
        selectedSquad.name,
        selectedSquad.id,
        false // not a renewal
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save squad');
      }

      localStorage.setItem('placementTestCompleted', 'true');
      
      // Redirect to home page
      router.push('/');
      
    } catch (err) {
      console.error('Error saving squad:', err);
      setError(err instanceof Error ? err.message : 'Failed to save squad selection');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-purple-400">Choose Your Squad</h1>
            </div>
          </div>
        </div>

        {/* Current Squad Status */}
        {currentSquad && (
          <Card className="mb-8 bg-cyan-500/10 border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${currentSquad.bgColor}`}>
                    {currentSquad.emoji}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400">Current Squad: {currentSquad.name}</h3>
                    <p className="text-gray-300 text-sm">{currentSquad.description}</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3">
                  {isLocked && (
                    <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <Lock className="w-5 h-5 text-orange-400" />
                      <div className="text-center">
                        <p className="font-semibold text-orange-400">Squad Locked</p>
                        <p className="text-sm text-gray-300">{remainingDays} days remaining</p>
                      </div>
                    </div>
                  )}
                  {!isLocked && (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div className="text-center">
                        <p className="font-semibold text-green-400">Squad Unlocked</p>
                        <p className="text-sm text-gray-300">You can change squads now</p>
                      </div>
                    </div>
                  )}
                  {walletAddress && (
                    <Button
                      onClick={handleRenewSquad}
                      disabled={renewing}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                    >
                      {renewing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Renewing...
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Renew for 30 Days
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              {renewSuccess && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Squad renewed! Your commitment has been extended for another 30 days.
                  </p>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            {currentSquad ? 'Change Your Squad' : 'Discover Your Path in Hoodie Academy'}
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">
            Each squad represents a unique role in the Hoodie Academy ecosystem. Choose the path that aligns with your skills, 
            interests, and goals. Your squad will determine your learning track, community focus, and specialized challenges.
          </p>
          <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-400">ELITE PATH AVAILABLE</span>
            </div>
            <p className="text-sm text-gray-300">
              <strong>Hoodie Rangers</strong> is an elite path that requires completion of all 4 core squad tracks. 
              This represents the highest level of mastery in the Hoodie Academy.
            </p>
          </div>
        </div>

        {/* Squad Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {squads.map((squad) => {
            // Check if this squad is locked due to user's current squad lock
            const isLockedDueToUserSquad = isLocked && currentSquad && currentSquad.id !== squad.id;
            const isCurrentSquad = currentSquad?.id === squad.id;
            const isRangersLocked = squad.locked;
            
            return (
            <Card 
              key={squad.id}
              className={`relative ${squad.bgColor} ${squad.borderColor} border-2 transition-all duration-300 ${
                isRangersLocked || isLockedDueToUserSquad
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:scale-105 cursor-pointer'
              } ${isCurrentSquad ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => !isLockedDueToUserSquad && handleSquadSelection(squad)}
            >
              <CardContent className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${squad.bgColor}`}>
                      {squad.emoji}
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold ${squad.color}`}>{squad.name}</h3>
                      <p className="text-gray-400 text-sm">{squad.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {isCurrentSquad && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Current
                      </Badge>
                    )}
                    {isLockedDueToUserSquad ? (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                        <Lock className="w-4 h-4 mr-1" />
                        {remainingDays}d left
                      </Badge>
                    ) : isRangersLocked ? (
                      <div className="flex items-center gap-2">
                        <Lock className="w-6 h-6 text-gray-500" />
                        <span className="text-sm text-gray-500">ELITE</span>
                      </div>
                    ) : (
                      <ArrowRight className={`w-6 h-6 ${squad.color} opacity-50`} />
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {squad.description}
                </p>
                
                {squad.locked && (
                  <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-semibold text-yellow-400">ELITE PATH LOCKED</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      Complete all 4 core squad tracks (Creators, Decoders, Speakers, Raiders) to unlock this elite path. 
                      Hoodie Rangers represents mastery of all disciplines.
                    </p>
                  </div>
                )}

                {/* Specialties */}
                <div className="mb-6">
                  <h4 className={`font-semibold ${squad.color} mb-3 flex items-center gap-2`}>
                    <Target className="w-4 h-4" />
                    Specialties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {squad.specialties.map((specialty, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={`${squad.borderColor} ${squad.color} text-xs`}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Course Examples */}
                <div className="mb-6">
                  <h4 className={`font-semibold ${squad.color} mb-3 flex items-center gap-2`}>
                    <CheckCircle className="w-4 h-4" />
                    Featured Courses
                  </h4>
                  <div className="space-y-2">
                    {squad.courses.slice(0, 3).map((course, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-sm text-gray-300">{course}</span>
                      </div>
                    ))}
                    {squad.courses.length > 3 && (
                      <span className="text-xs text-gray-400">+{squad.courses.length - 3} more courses</span>
                    )}
                  </div>
                </div>

                {/* Personality Traits */}
                <div>
                  <h4 className={`font-semibold ${squad.color} mb-3 flex items-center gap-2`}>
                    <Users className="w-4 h-4" />
                    Ideal For
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {squad.personality.map((trait, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={`${squad.borderColor} ${squad.color} text-xs`}
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>

              {/* Lock Overlay for Locked Squads */}
              {isLockedDueToUserSquad && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center pointer-events-none rounded-lg">
                  <div className="text-center p-6">
                    <Lock className="w-16 h-16 text-orange-400 mx-auto mb-3 animate-pulse" />
                    <p className="text-orange-400 font-bold text-xl mb-1">Locked</p>
                    <p className="text-orange-300 text-lg font-semibold mb-2">{remainingDays} days remaining</p>
                    <p className="text-gray-300 text-sm">Complete your {currentSquad?.name} track first</p>
                  </div>
                </div>
              )}
            </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <Card className="bg-slate-800/50 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-cyan-500/20 rounded-full">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">30-Day Commitment</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Once you choose your squad, you'll be locked in for 30 days. This ensures focused learning and prevents 
                  system gaming. After 30 days, you can request a squad change if needed. Choose wisely!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <AlertDialogContent className="bg-slate-800 border-purple-500/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-purple-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Confirm Squad Assignment
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="font-semibold text-yellow-400">30-Day Lock Period</p>
                      <p className="text-sm text-gray-300">
                        Once assigned, you cannot change your squad for 30 days. This prevents gaming the system and ensures focused learning.
                      </p>
                    </div>
                  </div>
                  
                  {selectedSquad && (
                    <div className="p-4 bg-slate-700/30 border border-slate-600/30 rounded-lg">
                      <h4 className="font-semibold text-cyan-400 mb-2">Your Selected Squad:</h4>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${selectedSquad.bgColor}`}>
                          {selectedSquad.emoji}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{selectedSquad.name}</p>
                          <p className="text-sm text-gray-300">{selectedSquad.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-400">
                    <p>• You'll have access to squad-specific courses and challenges</p>
                    <p>• Your progress will be tracked within your squad</p>
                    <p>• You can participate in squad competitions and events</p>
                    <p>• After 30 days, you can request a squad change</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                disabled={saving}
                className="border-gray-500/30 text-gray-300 hover:text-gray-200 hover:bg-gray-500/10 disabled:opacity-50"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmAssignment}
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Saving...
                  </>
                ) : (
                  'Confirm Assignment'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 