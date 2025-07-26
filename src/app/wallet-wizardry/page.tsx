'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LockKeyhole, AlertTriangle, ArrowLeft, CheckCircle, Award, BookOpen } from 'lucide-react';
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
import { Progress } from "@/components/ui/progress";
import TokenGate from "@/components/TokenGate"; 
import { Card, CardContent } from "@/components/ui/card";
import { Syllabus } from "@/components/Syllabus";
import { syllabusData } from "@/lib/syllabusData";

const LOCAL_STORAGE_KEY = 'walletWizardryProgress';

const tiers = [
  {
    id: 'tier-1',
    title: 'Tier 1: Wallet Basics',
    description: 'Learn the fundamentals of cryptocurrency wallets',
    lessons: ['Understanding Wallets', 'Types of Wallets', 'Security Best Practices', 'Setting Up Your First Wallet'],
    duration: '2-3 hours',
    difficulty: 'Beginner'
  },
  {
    id: 'tier-2',
    title: 'Tier 2: Advanced Features',
    description: 'Master advanced wallet features and functionality',
    lessons: ['Multi-Signature Wallets', 'Hardware Wallets', 'Wallet Recovery', 'Advanced Security'],
    duration: '3-4 hours',
    difficulty: 'Intermediate'
  },
  {
    id: 'tier-3',
    title: 'Tier 3: DeFi Integration',
    description: 'Connect your wallet to DeFi protocols',
    lessons: ['Connecting to DEXs', 'Yield Farming', 'Liquidity Provision', 'Risk Management'],
    duration: '4-5 hours',
    difficulty: 'Advanced'
  },
  {
    id: 'tier-4',
    title: 'Tier 4: Expert Level',
    description: 'Become a wallet wizard with expert techniques',
    lessons: ['Custom RPCs', 'Gas Optimization', 'MEV Protection', 'Advanced Trading'],
    duration: '5-6 hours',
    difficulty: 'Expert'
  }
];

export default function WalletWizardryPage() {
  const [tierStatus, setTierStatus] = useState<Array<'locked' | 'unlocked' | 'completed'>>(
    tiers.map((_, index) => (index === 0 ? 'unlocked' : 'locked'))
  );
  const [showSyllabus, setShowSyllabus] = useState(false);

  const allTiersCompleted = tierStatus.every(status => status === 'completed');
  
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStatus) {
        const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
        setTierStatus(parsedStatus);
      }
    }
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const saveProgress = (newStatus: Array<'locked' | 'unlocked' | 'completed'>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newStatus));
    }
  };

  const progressPercentage = (tierStatus.filter(s => s === 'completed').length / tiers.length) * 100;

  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-12">
            <div className="flex items-center justify-between mb-6">
              <Link href="/courses">
                <Button variant="outline" size="sm" className="text-cyan-400 border-cyan-500/30">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Courses
                </Button>
              </Link>
              <div className="text-right">
                <div className="text-sm text-gray-400">Current Time</div>
                <div className="text-lg text-cyan-400 font-mono">{currentTime}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-purple-600 rounded-full">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
                  Wallet Wizardry
                </h1>
                <p className="text-gray-300 mt-2">Master the art of cryptocurrency wallets</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="max-w-2xl mx-auto mt-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3 bg-slate-700" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{tierStatus.filter(s => s === 'completed').length} of {tiers.length} tiers completed</span>
                <span>{tierStatus.filter(s => s === 'unlocked').length} available</span>
              </div>
            </div>
          </header>

          {/* Course Content */}
          <main className="space-y-8">
            {/* Syllabus Button */}
            <div className="text-center">
              <Button
                onClick={() => setShowSyllabus(!showSyllabus)}
                variant="outline"
                className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {showSyllabus ? 'Hide Syllabus' : 'View Syllabus'}
              </Button>
            </div>

            {/* Syllabus */}
            {showSyllabus && (
              <Syllabus data={syllabusData.walletWizardry} />
            )}

            {/* Tiers */}
            <div className="grid gap-6">
              {tiers.map((tier, index) => (
                <Card key={tier.id} className={`relative overflow-hidden transition-all duration-300 ${
                  tierStatus[index] === 'completed' 
                    ? 'bg-gradient-to-r from-green-900/50 to-green-800/50 border-green-500/50' 
                    : tierStatus[index] === 'unlocked'
                    ? 'bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-purple-500/50'
                    : 'bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/50'
                } border-2`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {tierStatus[index] === 'completed' ? (
                            <div className="p-2 bg-green-500/20 rounded-full">
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                          ) : tierStatus[index] === 'unlocked' ? (
                            <div className="p-2 bg-purple-500/20 rounded-full">
                              <Award className="w-6 h-6 text-purple-400" />
                            </div>
                          ) : (
                            <div className="p-2 bg-slate-500/20 rounded-full">
                              <LockKeyhole className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          
                          <div>
                            <h3 className="text-xl font-bold text-white">{tier.title}</h3>
                            <p className="text-gray-300">{tier.description}</p>
                          </div>
                        </div>

                        <div className="ml-11 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Duration:</span>
                            <span className="text-cyan-400">{tier.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Difficulty:</span>
                            <span className="text-yellow-400">{tier.difficulty}</span>
                          </div>
                          
                          <div className="mt-3">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Lessons:</h4>
                            <ul className="space-y-1">
                              {tier.lessons.map((lesson, lessonIndex) => (
                                <li key={lessonIndex} className="text-sm text-gray-400 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                                  {lesson}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="ml-6">
                        {tierStatus[index] === 'completed' ? (
                          <div className="text-center">
                            <div className="p-3 bg-green-500/20 rounded-full mb-2">
                              <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <span className="text-sm text-green-400 font-semibold">Completed</span>
                          </div>
                        ) : tierStatus[index] === 'unlocked' ? (
                          <Link href={`/wallet-wizardry/${tier.id}`}>
                            <Button className="bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 text-white">
                              Start Tier
                            </Button>
                          </Link>
                        ) : (
                          <div className="text-center">
                            <div className="p-3 bg-slate-500/20 rounded-full mb-2">
                              <LockKeyhole className="w-8 h-8 text-slate-400" />
                            </div>
                            <span className="text-sm text-slate-400">Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Final Exam */}
            {allTiersCompleted && (
              <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-800/50 border-yellow-500/50 border-2">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="p-3 bg-yellow-500/20 rounded-full">
                      <Award className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-yellow-400">Final Exam</h3>
                      <p className="text-gray-300">Test your wallet wizardry knowledge</p>
                    </div>
                  </div>
                  <Link href="/wallet-wizardry/final-exam">
                    <Button className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-8 py-3">
                      Take Final Exam
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </TokenGate>
  );
}

    