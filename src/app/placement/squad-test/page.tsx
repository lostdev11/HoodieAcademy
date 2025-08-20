'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Trophy, Users, Target, Zap, User, AlertTriangle, Clock } from 'lucide-react';
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
import SquadBadge from '@/components/SquadBadge';
import { recordPlacementTest } from '@/lib/supabase';

interface QuizOption {
  id: string;
  text: string;
  squad: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

interface SquadInfo {
  name: string;
  description: string;
  specialties: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  recommendedCourses: string[];
}

interface QuizData {
  title: string;
  description: string;
  questions: QuizQuestion[];
  squads: Record<string, SquadInfo>;
}

export default function SquadTestPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [assignedSquad, setAssignedSquad] = useState<SquadInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSquad, setPendingSquad] = useState<SquadInfo | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    // Check if user has already taken the test
    const existingResult = localStorage.getItem('userSquad');
    if (existingResult) {
      try {
        const result = JSON.parse(existingResult);
        // Check if it's the old format (just a string) or new format (object)
        if (typeof result === 'string') {
          // Old format - try to find squad info from quiz data
          console.log('Found old format squad result:', result);
          // We'll need to load quiz data first to get squad info
        } else if (result.name) {
          // New format - we have the full squad object
          console.log('Found squad result:', result);
          setAssignedSquad(result);
          setShowResults(true);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing existing squad result:', error);
        localStorage.removeItem('userSquad');
      }
    }

    // Load quiz data with retry mechanism
    const loadQuizData = async () => {
      try {
        const response = await fetch('/placement/squad-test/quiz.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setQuizData(data);
        
        // If we have an old format result, try to convert it now
        const existingResult = localStorage.getItem('userSquad');
        if (existingResult && typeof JSON.parse(existingResult) === 'string') {
          try {
            const squadName = JSON.parse(existingResult);
            const squadInfo = data.squads[squadName];
            if (squadInfo) {
              console.log('Converted old format to new format:', squadInfo);
              setAssignedSquad(squadInfo);
              setShowResults(true);
            }
          } catch (error) {
            console.error('Error converting old format result:', error);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading quiz data:', error);
        setIsLoading(false);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        // Don't retry on error to prevent infinite loops
      }
    };

    loadQuizData();
  }, []);

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestion < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateSquad();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateSquad = async () => {
    if (!quizData) return;

    setIsCalculating(true);
    console.log('Starting squad calculation...');

    try {
      const squadScores: Record<string, number> = {};
      
      // Count votes for each squad
      Object.values(answers).forEach(optionId => {
        const question = quizData.questions.find(q => 
          q.options.some(opt => opt.id === optionId)
        );
        const option = question?.options.find(opt => opt.id === optionId);
        if (option) {
          squadScores[option.squad] = (squadScores[option.squad] || 0) + 1;
        }
      });

      console.log('Squad scores:', squadScores);

      // Find the squad with the most votes
      const topSquad = Object.entries(squadScores).reduce((a, b) => 
        squadScores[a[0]] > squadScores[b[0]] ? a : b
      )[0];

      console.log('Top squad key:', topSquad);
      console.log('Available squads:', Object.keys(quizData.squads));

      let squadInfo = quizData.squads[topSquad];
      
      // Fallback: if squad lookup fails, use the first available squad
      if (!squadInfo) {
        console.error('No squad info found for:', topSquad);
        console.error('Available squad keys:', Object.keys(quizData.squads));
        
        // Use the first available squad as fallback
        const fallbackSquadKey = Object.keys(quizData.squads)[0];
        if (fallbackSquadKey) {
          squadInfo = quizData.squads[fallbackSquadKey];
          console.log('Using fallback squad:', fallbackSquadKey, squadInfo);
        } else {
          console.error('No squads available at all');
          setIsCalculating(false);
          return;
        }
      }
      
      console.log('Final squad info:', squadInfo);
      setPendingSquad(squadInfo);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error calculating squad:', error);
      // Show error to user
      alert('There was an error calculating your squad. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirmSquadAssignment = async () => {
    if (!pendingSquad) return;
    
    console.log('Confirming squad assignment for:', pendingSquad);
    
    // Calculate lock end date (30 days from now)
    const lockEndDate = new Date();
    lockEndDate.setDate(lockEndDate.getDate() + 30);
    
    // Save result to localStorage with timestamp and lock info
    const squadResult = {
      ...pendingSquad,
      assignedAt: new Date().toISOString(),
      lockEndDate: lockEndDate.toISOString(),
      testVersion: '1.0'
    };
    console.log('Saving squad result to localStorage:', squadResult);
    
    // Store the full squad object for better functionality
    localStorage.setItem('userSquad', JSON.stringify(squadResult));
    console.log('Squad result saved to localStorage');
    
    // Mark placement test as completed
    localStorage.setItem('placementTestCompleted', 'true');
    
    // Get wallet address and display name
    const walletAddress = localStorage.getItem('walletAddress') || localStorage.getItem('connectedWallet');
    const displayName = localStorage.getItem('userDisplayName');
    
    // Sync with Supabase
    if (walletAddress) {
      try {
        await recordPlacementTest(walletAddress, pendingSquad.name, displayName || undefined);
        console.log('Successfully synced placement test with Supabase');
      } catch (error) {
        console.error('Error syncing placement test with Supabase:', error);
        // Continue with localStorage even if Supabase sync fails
      }
    }
    
    // If user doesn't have a display name, suggest they set one
    if (!displayName) {
      localStorage.setItem('suggestDisplayName', 'true');
    }
    
    setAssignedSquad(pendingSquad);
    setShowConfirmation(false);
    setPendingSquad(null);
    setShowResults(true);
    
    console.log('Squad assignment completed, showing results');
  };

  const resetTest = () => {
    localStorage.removeItem('userSquad');
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
    setAssignedSquad(null);
    setShowConfirmation(false);
    setPendingSquad(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-2xl animate-pulse">Loading squad test...</div>
      </div>
    );
  }

  // Error boundary for any unexpected errors
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl text-center">
          <div className="mb-4">Error loading squad test</div>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (showResults && assignedSquad) {
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
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Results */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 text-yellow-400 mr-4" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                Squad Assignment Complete!
              </h1>
            </div>
          </div>

          {/* Squad Card */}
          <Card className={`max-w-2xl mx-auto mb-8 ${assignedSquad.bgColor} border-2 ${assignedSquad.borderColor} backdrop-blur-sm`}>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className={`text-3xl font-bold mb-4 ${assignedSquad.color}`}>
                  {assignedSquad.name}
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {assignedSquad.description}
                </p>
              </div>

              {/* Squad Badge */}
              <div className="mb-6">
                <SquadBadge squad={assignedSquad.name.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, '')} />
              </div>

              {/* Specialties */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Your Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {assignedSquad.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-700/50 border border-cyan-500/30 rounded-full text-cyan-300 text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Courses */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Recommended Course Track
                </h3>
                <div className="space-y-2">
                  {assignedSquad.recommendedCourses.map((courseId, index) => {
                    const courseNames: Record<string, string> = {
                      'wallet-wizardry': 'Wallet Wizardry',
                      'nft-mastery': 'NFT Mastery',
                      'meme-coin-mania': 'Meme Coin Mania',
                      'community-strategy': 'Community Strategy',
                      'sns': 'SNS Simplified',
                      'technical-analysis': 'Technical Analysis Tactics'
                    };
                    return (
                      <div key={courseId} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                        <span className="text-gray-300">{courseNames[courseId]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={async () => {
                // Always go to courses since onboarding is now separate
                window.location.href = '/courses';
              }}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              Explore Courses
            </Button>
            
            {/* Profile Button */}
            <Button
              asChild
              variant="outline"
              className="border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-500/10"
            >
              <Link href="/profile">
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Link>
            </Button>
            
            <Button
              onClick={resetTest}
              variant="outline"
              className="border-orange-500/30 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
            >
              <Users className="w-4 h-4 mr-2" />
              Retake Test
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400 mb-2">
              Your squad assignment has been saved to your profile.
            </p>
            <p className="text-xs text-gray-500">
              You can retake this test anytime to change your squad assignment.
            </p>
                  </div>
      </div>

      {/* Squad Assignment Confirmation Dialog */}
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
                
                {pendingSquad && (
                  <div className="p-4 bg-slate-700/30 border border-slate-600/30 rounded-lg">
                    <h4 className="font-semibold text-cyan-400 mb-2">Your Assigned Squad:</h4>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        pendingSquad.name.includes('Creators') ? 'bg-yellow-500/20' :
                        pendingSquad.name.includes('Decoders') ? 'bg-gray-500/20' :
                        pendingSquad.name.includes('Speakers') ? 'bg-red-500/20' :
                        pendingSquad.name.includes('Raiders') ? 'bg-blue-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        {pendingSquad.name.includes('Creators') ? '🎨' :
                         pendingSquad.name.includes('Decoders') ? '🧠' :
                         pendingSquad.name.includes('Speakers') ? '🎤' :
                         pendingSquad.name.includes('Raiders') ? '⚔️' :
                         '🦅'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{pendingSquad.name}</p>
                        <p className="text-sm text-gray-300">{pendingSquad.description}</p>
                      </div>
                    </div>
                    
                    {/* Answer Summary */}
                    <div className="mt-4">
                      <h5 className="font-semibold text-cyan-400 mb-2">Your Answers Summary:</h5>
                      <div className="space-y-2 text-sm">
                        {quizData?.questions.map((question, index) => {
                          const answerId = answers[question.id];
                          const selectedOption = question.options.find(opt => opt.id === answerId);
                          return (
                            <div key={question.id} className="flex justify-between items-center p-2 bg-slate-600/30 rounded">
                              <span className="text-gray-300">Q{index + 1}: {question.text.substring(0, 50)}...</span>
                              <span className="text-cyan-400 font-medium">
                                {selectedOption ? selectedOption.text.substring(0, 30) + '...' : 'Not answered'}
                              </span>
                            </div>
                          );
                        })}
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
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-500/30 text-gray-300 hover:text-gray-200 hover:bg-gray-500/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSquadAssignment}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Confirm Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Failed to load quiz data</div>
      </div>
    );
  }

  const currentQuestionData = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
  const canProceed = answers[currentQuestionData.id];
  
  // Check if all questions are answered for the final question
  const allQuestionsAnswered = quizData.questions.every(q => answers[q.id]);
  const canSeeResults = currentQuestion === quizData.questions.length - 1 && allQuestionsAnswered;

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
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
            {quizData.title}
          </h1>
          <p className="text-xl text-gray-300 mb-6">{quizData.description}</p>
          
          {/* Progress */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Question {currentQuestion + 1} of {quizData.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Question completion indicator */}
            <div className="flex justify-center gap-1 mt-2">
              {quizData.questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    answers[quizData.questions[index].id] 
                      ? 'bg-green-400' 
                      : 'bg-gray-400'
                  }`}
                />
              ))}
            </div>
            
            {/* Completion status */}
            {currentQuestion === quizData.questions.length - 1 && (
              <div className="text-center mt-2">
                {allQuestionsAnswered ? (
                  <span className="text-green-400 text-sm">✓ All questions answered</span>
                ) : (
                  <span className="text-yellow-400 text-sm">⚠ Please answer all questions to see results</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Question Card */}
        <Card className="max-w-2xl mx-auto bg-slate-800/50 border-2 border-cyan-500/30 backdrop-blur-sm">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">
              {currentQuestionData.text}
            </h2>

            <RadioGroup
              value={answers[currentQuestionData.id] || ''}
              onValueChange={(value) => handleAnswerSelect(currentQuestionData.id, value)}
              className="space-y-4"
            >
              {currentQuestionData.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="text-lg text-gray-300 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between max-w-2xl mx-auto mt-8">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
          >
            Previous
          </Button>

          <Button
            onClick={() => {
              console.log('See Results button clicked');
              console.log('Current answers:', answers);
              console.log('Quiz data:', quizData);
              handleNext();
            }}
            disabled={!canProceed || isCalculating}
            className={`${
              canSeeResults 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
            } disabled:opacity-50`}
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Calculating...
              </>
            ) : (
              currentQuestion === quizData.questions.length - 1 ? 'See Results' : 'Next'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 
