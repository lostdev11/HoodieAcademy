'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { ArrowLeft, CheckCircle, XCircle, Lock, Unlock, Brain, Target, Mic, Palette, AlertTriangle, Wallet, Users, TrendingUp, Shield, Bot, BookOpen, PenTool } from 'lucide-react';
import { updateScoreForQuizCompletion } from '@/lib/utils';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import type { SolanaWallet } from "@/types/wallet";

interface Squad {
  id: string;
  name: string;
  description: string;
  motto: string;
  icon: React.ReactNode;
  color: string;
  courses: string[];
  purpose: string;
}

const squads: Squad[] = [
  {
    id: 'decoders',
    name: 'Decoders',
    description: 'The Analysts',
    motto: 'They don\'t guess. They test.',
    icon: <Brain className="w-6 h-6" />,
    color: 'bg-blue-500',
    purpose: 'Decode signals, identify market structure, validate meta',
    courses: [
      'technical-analysis',
      'cybersecurity-wallet-practices', 
      'ai-automation-curriculum',
      'nft-trading-psychology'
    ]
  },
  {
    id: 'raiders',
    name: 'Raiders',
    description: 'The Meta Hunters',
    motto: 'First in. First out. First to know.',
    icon: <Target className="w-6 h-6" />,
    color: 'bg-red-500',
    purpose: 'Track trend waves, time rotations, and lead stealth raids',
    courses: [
      'nft-trading-psychology',
      'technical-analysis',
      'cybersecurity-wallet-practices'
    ]
  },
  {
    id: 'speakers',
    name: 'Speakers',
    description: 'The Signal Boosters',
    motto: 'They set the tone and shape the tribe.',
    icon: <Mic className="w-6 h-6" />,
    color: 'bg-purple-500',
    purpose: 'Host, guide, narrate the vibe — from Spaces to lore drops',
    courses: [
      'lore-narrative-crafting',
      'cybersecurity-wallet-practices'
    ]
  },
  {
    id: 'creators',
    name: 'Creators',
    description: 'The Builders of the Brand',
    motto: 'Without them, there is no vision to share.',
    icon: <Palette className="w-6 h-6" />,
    color: 'bg-green-500',
    purpose: 'Craft lore, visuals, and content systems that scale',
    courses: [
      'lore-narrative-crafting',
      'ai-automation-curriculum'
    ]
  }
];

interface CourseProgress {
  courseId: string;
  progress: number;
  completed: boolean;
}

export default function HoodieSquadTrackPage() {
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [hasHoodie, setHasHoodie] = useState(false);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);

  const handleWalletConnection = async () => {
    try {
      const provider = typeof window !== 'undefined' ? window.solana : undefined;
      if (!provider) {
        console.error('Solana wallet not found');
        return;
      }
      
      // Connect only if not already connected
      if (!provider.publicKey) {
        try {
          await provider.connect({ onlyIfTrusted: true } as any);
        } catch {
          await provider.connect();
        }
      }
      
      if (!provider.publicKey) {
        console.error('Solana wallet public key is null after connection');
        return;
      }
      
      setWalletConnected(true);
      setWalletAddress(provider.publicKey.toString());
        
        // Check for WifHoodie token
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          new PublicKey(provider.publicKey.toString()),
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );
        
        const hoodieTokenMint = 'YOUR_WIFHOODIE_TOKEN_MINT_ADDRESS';
        const hasHoodieToken = tokenAccounts.value.some(account => 
          account.account.data.parsed.info.mint === hoodieTokenMint
        );
        
        setHasHoodie(hasHoodieToken);
        
      } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const getCourseProgress = (courseId: string): number => {
    const savedProgress = localStorage.getItem(`${courseId}Progress`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      const completedCount = progress.filter((status: string) => status === 'completed').length;
      const totalLessons = progress.length;
      return totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
    }
    return 0;
  };

  const getSquadProgress = (squad: Squad): number => {
    if (!squad.courses.length) return 0;
    
    const totalProgress = squad.courses.reduce((sum, courseId) => {
      return sum + getCourseProgress(courseId);
    }, 0);
    
    return totalProgress / squad.courses.length;
  };

  useEffect(() => {
    // Load course progress for all squads
    const progress: CourseProgress[] = [];
    squads.forEach(squad => {
      squad.courses.forEach(courseId => {
        const progressValue = getCourseProgress(courseId);
        progress.push({
          courseId,
          progress: progressValue,
          completed: progressValue === 100
        });
      });
    });
    setCourseProgress(progress);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/courses">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">Hoodie Squad Track</h1>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        {!walletConnected && (
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="text-center">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-gray-300 mb-4">Connect your Solana wallet to access squad-specific content.</p>
                <Button onClick={handleWalletConnection} className="bg-blue-600 hover:bg-blue-700">
                  Connect Phantom Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Squad Selection */}
        {walletConnected && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Squad</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {squads.map((squad) => {
                const squadProgress = getSquadProgress(squad);
                const completedCourses = squad.courses.filter(courseId => 
                  courseProgress.find(p => p.courseId === courseId)?.completed
                ).length;
                
                return (
                  <Card 
                    key={squad.id}
                    className={`bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer ${
                      selectedSquad?.id === squad.id ? 'ring-2 ring-blue-400' : ''
                    }`}
                    onClick={() => setSelectedSquad(squad)}
                  >
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${squad.color} flex items-center justify-center`}>
                          {squad.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{squad.name}</h3>
                        <p className="text-sm text-gray-300 mb-2">{squad.description}</p>
                        <p className="text-xs italic text-gray-400 mb-4">"{squad.motto}"</p>
                        
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-300">{squad.purpose}</p>
                          <div className="flex justify-between items-center text-xs">
                            <span>Progress</span>
                            <span>{Math.round(squadProgress)}%</span>
                          </div>
                          <Progress value={squadProgress} className="h-2" />
                          <p className="text-xs text-gray-400">
                            {completedCourses}/{squad.courses.length} courses completed
                          </p>
                        </div>
                        
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSquad(squad);
                          }}
                        >
                          View Track
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Squad Details */}
        {selectedSquad && walletConnected && (
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`w-12 h-12 rounded-full ${selectedSquad.color} flex items-center justify-center`}>
                    {selectedSquad.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedSquad.name}</h2>
                    <p className="text-gray-300">{selectedSquad.description}</p>
                    <p className="text-sm italic text-gray-400">"{selectedSquad.motto}"</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Mission</h3>
                  <p className="text-gray-300">{selectedSquad.purpose}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Course Pillars</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         {selectedSquad.courses.map((courseId) => {
                       const courseProgressData = courseProgress.find((p: CourseProgress) => p.courseId === courseId);
                       const courseName = getCourseDisplayName(courseId);
                       const progress = courseProgressData?.progress || 0;
                      
                      return (
                        <Card key={courseId} className="bg-white/5 border-white/10">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{courseName}</h4>
                              <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2 mb-2" />
                            <Link href={`/${courseId}`}>
                              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                                {progress === 100 ? 'Review' : 'Continue'}
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Squad-Specific Learning Path</h3>
                  <p className="text-sm text-gray-300">
                    Each squad has a curated curriculum designed to develop the skills and knowledge 
                    needed for their specific role in the Hoodie Academy ecosystem.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Squad Overview */}
        {!selectedSquad && walletConnected && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">Squad Overview</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-6 h-6 text-blue-400" />
                    <div>
                      <h3 className="font-semibold">Decoders</h3>
                      <p className="text-sm text-gray-300">Analysts who decode signals and validate meta</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Target className="w-6 h-6 text-red-400" />
                    <div>
                      <h3 className="font-semibold">Raiders</h3>
                      <p className="text-sm text-gray-300">Meta hunters who track trends and lead raids</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mic className="w-6 h-6 text-purple-400" />
                    <div>
                      <h3 className="font-semibold">Speakers</h3>
                      <p className="text-sm text-gray-300">Signal boosters who shape the tribe's voice</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Palette className="w-6 h-6 text-green-400" />
                    <div>
                      <h3 className="font-semibold">Creators</h3>
                      <p className="text-sm text-gray-300">Builders who craft the brand's vision</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">How to Choose Your Squad</h3>
                <p className="text-sm text-gray-300">
                  Select the squad that best aligns with your skills, interests, and role in the community. 
                  Each squad has a unique curriculum designed to develop specific competencies.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function getCourseDisplayName(courseId: string): string {
  const courseNames: Record<string, string> = {
    'technical-analysis': 'Technical Analysis',
    'cybersecurity-wallet-practices': 'Cybersecurity & Wallet Practices',
    'ai-automation-curriculum': 'AI + Automation',
    'nft-trading-psychology': 'NFT Trading Psychology',
    'lore-narrative-crafting': 'Lore & Narrative Crafting'
  };
  
  return courseNames[courseId] || courseId;
} 