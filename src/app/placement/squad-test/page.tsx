'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { storeSquad, getSquadName } from '@/utils/squad-storage';
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
import { useDisplayNameReadOnly } from '@/hooks/use-display-name';

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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const { displayName } = useDisplayNameReadOnly();

  // Simple error boundary for SquadBadge
  const renderSquadBadge = (squadName: string) => {
    try {
      return <SquadBadge squad={squadName} />;
    } catch (error) {
      console.error('Error rendering SquadBadge:', error);
      // Fallback badge display
      return (
        <div className="text-center">
          <div className="w-40 h-40 rounded-xl border-2 border-cyan-500/50 bg-slate-700/30 flex items-center justify-center text-6xl shadow-xl mx-auto">
            🏆
          </div>
          <p className="mt-3 text-lg font-bold text-cyan-400">{squadName} Badge</p>
        </div>
      );
    }
  };

  useEffect(() => {
    // Check if user has already taken the test
    const existingResult = getSquadName();
    if (existingResult) {
      // We have a squad name, but we need the full squad object for display
      // We'll need to load quiz data first to get squad info
      console.log('Found existing squad result:', existingResult);
    }

    // Load quiz data with retry mechanism
    const loadQuizData = async () => {
      try {
        console.log('Attempting to load quiz data...');
        console.log('Fetching from:', '/placement/squad-test/quiz.json');
        
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('/placement/squad-test/quiz.json', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded quiz data:', data);
        console.log('Quiz data structure check:');
        console.log('- Has questions:', !!data.questions);
        console.log('- Questions count:', data.questions?.length);
        console.log('- Has squads:', !!data.squads);
        console.log('- Squad keys:', Object.keys(data.squads || {}));
        
        // Check if data is actually an object
        if (typeof data !== 'object' || data === null) {
          throw new Error('Quiz data is not a valid object');
        }
        
        // Validate quiz data structure
        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error('Invalid quiz data: questions array is missing or empty');
        }
        
        if (!data.squads || typeof data.squads !== 'object' || Object.keys(data.squads).length === 0) {
          throw new Error('Invalid quiz data: squads object is missing or empty');
        }
        
        // Validate each question has the required structure
        for (let i = 0; i < data.questions.length; i++) {
          const question = data.questions[i];
          if (!question.id || !question.text || !question.options || !Array.isArray(question.options)) {
            throw new Error(`Invalid question structure at index ${i}`);
          }
          
          // Validate each option has the required structure
          for (let j = 0; j < question.options.length; j++) {
            const option = question.options[j];
            if (!option.id || !option.text || !option.squad) {
              throw new Error(`Invalid option structure at question ${i}, option ${j}`);
            }
            
            // Validate that the squad referenced exists
            if (!data.squads[option.squad]) {
              throw new Error(`Question ${i}, option ${j} references unknown squad: ${option.squad}`);
            }
          }
        }
        
        // Validate each squad has the required structure
        for (const [squadKey, squad] of Object.entries(data.squads)) {
          const squadInfo = squad as SquadInfo;
          if (!squadInfo.name || !squadInfo.description || !Array.isArray(squadInfo.specialties) || !Array.isArray(squadInfo.recommendedCourses)) {
            throw new Error(`Invalid squad structure for ${squadKey}`);
          }
        }
        
        console.log('Quiz data validation passed');
        setQuizData(data);
        
        // If we have an existing squad result, try to display it
        const existingResult = getSquadName();
        if (existingResult) {
          const squadInfo = data.squads[existingResult];
          if (squadInfo) {
            console.log('Found existing squad info:', squadInfo);
            setAssignedSquad(squadInfo);
            setShowResults(true);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading quiz data:', error);
        setIsLoading(false);
        
        // Handle specific error types
        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
          } else if (error.message.includes('HTTP error')) {
            errorMessage = `Server error: ${error.message}`;
          } else if (error.message.includes('Invalid quiz data')) {
            errorMessage = `Data error: ${error.message}`;
          } else {
            errorMessage = error.message;
          }
        }
        
        // Implement retry mechanism
        if (retryCount < maxRetries) {
          console.log(`Retrying... Attempt ${retryCount + 1} of ${maxRetries}`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            setIsLoading(true);
            loadQuizData();
          }, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
          setError(errorMessage);
        }
        // Don't retry on error to prevent infinite loops
      }
    };

    loadQuizData();
  }, [retryCount]);

  // Debug useEffect to track state changes
  useEffect(() => {
    console.log('State changed:');
    console.log('- showResults:', showResults);
    console.log('- assignedSquad:', assignedSquad);
    console.log('- pendingSquad:', pendingSquad);
    console.log('- showConfirmation:', showConfirmation);
    console.log('- isCalculating:', isCalculating);
  }, [showResults, assignedSquad, pendingSquad, showConfirmation, isCalculating]);

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
      // This is the last question, calculate squad
      console.log('Last question reached, calculating squad...');
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
    console.log('Quiz data:', quizData);
    console.log('User answers:', answers);

    try {
      const squadScores: Record<string, number> = {};
      
      // Count votes for each squad
      Object.values(answers).forEach(optionId => {
        const question = quizData.questions.find(q => 
          q.options.some(opt => opt.id === optionId)
        );
        const option = question?.options.find(opt => opt.id === optionId);
        if (option) {
          console.log(`Option ${optionId} selected for squad: ${option.squad}`);
          squadScores[option.squad] = (squadScores[option.squad] || 0) + 1;
        } else {
          console.warn(`Could not find option ${optionId} in any question`);
        }
      });

      console.log('Squad scores:', squadScores);
      console.log('Total answers:', Object.keys(answers).length);
      console.log('Expected answers:', quizData.questions.length);
      
      // Check if we have enough answers
      if (Object.keys(answers).length < quizData.questions.length) {
        console.warn('Not all questions answered:', Object.keys(answers).length, 'of', quizData.questions.length);
      }
      
      // Check if we have any squad scores
      if (Object.keys(squadScores).length === 0) {
        console.error('No valid squad scores calculated');
        setError('Unable to calculate squad assignment. Please answer all questions and try again.');
        setIsCalculating(false);
        return;
      }

      // Find the squad with the most votes
      const topSquad = Object.entries(squadScores).reduce((a, b) => 
        squadScores[a[0]] > squadScores[b[0]] ? a : b
      )[0];

      console.log('Top squad key:', topSquad);
      console.log('Available squads:', Object.keys(quizData.squads));
      console.log('Squad keys vs names mapping:');
      Object.entries(quizData.squads).forEach(([key, squad]) => {
        console.log(`  ${key} -> ${squad.name}`);
      });

      let squadInfo = quizData.squads[topSquad];
      
      // Fallback: if squad lookup fails, use the first available squad
      if (!squadInfo) {
        console.error('No squad info found for:', topSquad);
        console.error('Available squad keys:', Object.keys(quizData.squads));
        console.error('Squad scores:', squadScores);
        console.error('Top squad key:', topSquad);
        
        // Use the first available squad as fallback
        const fallbackSquadKey = Object.keys(quizData.squads)[0];
        if (fallbackSquadKey) {
          squadInfo = quizData.squads[fallbackSquadKey];
          console.log('Using fallback squad:', fallbackSquadKey, squadInfo);
        } else {
          console.error('No squads available at all');
          setIsCalculating(false);
          setError('No squads available. Please refresh the page and try again.');
          return;
        }
      }
      
      console.log('Final squad info:', squadInfo);
      console.log('Squad info type:', typeof squadInfo);
      console.log('Squad info keys:', Object.keys(squadInfo || {}));
      
      // Validate squad info structure
      if (!squadInfo.name || !squadInfo.description) {
        console.error('Invalid squad info structure:', squadInfo);
        setError('Invalid squad data. Please refresh the page and try again.');
        setIsCalculating(false);
        return;
      }
      
      // Additional validation for required fields
      if (!Array.isArray(squadInfo.specialties) || !Array.isArray(squadInfo.recommendedCourses)) {
        console.error('Missing required squad arrays:', {
          specialties: squadInfo.specialties,
          recommendedCourses: squadInfo.recommendedCourses
        });
        setError('Invalid squad data structure. Please refresh the page and try again.');
        setIsCalculating(false);
        return;
      }
      
      console.log('Squad validation passed, proceeding with assignment');
      
      setPendingSquad(squadInfo);
      setShowConfirmation(true);
      
      // Also set the assigned squad immediately as a fallback
      // This ensures results are shown even if confirmation dialog has issues
      setAssignedSquad(squadInfo);
      setShowResults(true);
      console.log('Set assignedSquad and showResults as fallback');
      
      // For now, let's skip the confirmation dialog and show results immediately
      // This will help debug the issue
      console.log('Skipping confirmation dialog for debugging');
      setShowConfirmation(false);
      setPendingSquad(null);
      
      console.log('Squad assignment completed successfully');
      console.log('Final state - assignedSquad:', squadInfo);
      console.log('Final state - showResults:', true);
    } catch (error) {
      console.error('Error calculating squad:', error);
      // Show error to user
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirmSquadAssignment = async () => {
    if (!pendingSquad) return;
    
    console.log('Confirming squad assignment for:', pendingSquad);
    console.log('Setting assignedSquad to:', pendingSquad);
    
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
    
    try {
      // Store the full squad object for better functionality
      storeSquad({
        ...squadResult,
        id: squadResult.name // Use name as id since we don't have a separate id
      });
      console.log('Squad result saved to localStorage');
      
      // Mark placement test as completed
      localStorage.setItem('placementTestCompleted', 'true');
      console.log('Placement test marked as completed');
    } catch (storageError) {
      console.error('Error saving to localStorage:', storageError);
      // Continue with the process even if localStorage fails
    }
    
    // Get wallet address and display name
    const walletAddress = localStorage.getItem('walletAddress') || localStorage.getItem('connectedWallet');
    const currentDisplayName = displayName || localStorage.getItem('userDisplayName');
    
    // Sync with Supabase
    if (walletAddress) {
      try {
        console.log('Attempting to sync with Supabase...');
        await recordPlacementTest(walletAddress, pendingSquad.name, currentDisplayName || undefined);
        console.log('Successfully synced placement test with Supabase');
      } catch (error) {
        console.error('Error syncing placement test with Supabase:', error);
        // Continue with localStorage even if Supabase sync fails
        console.log('Continuing with localStorage only due to Supabase sync failure');
      }
    } else {
      console.log('No wallet address found, skipping Supabase sync');
    }
    
    // If user doesn't have a display name, suggest they set one
    if (!displayName) {
      try {
        localStorage.setItem('suggestDisplayName', 'true');
        console.log('Display name suggestion flag set');
      } catch (storageError) {
        console.error('Error setting display name suggestion flag:', storageError);
        // Continue with the process even if this fails
      }
    }
    
    console.log('Setting assignedSquad and showResults...');
    setAssignedSquad(pendingSquad);
    setShowConfirmation(false);
    setPendingSquad(null);
    setShowResults(true);
    
    console.log('Squad assignment completed, showing results');
    console.log('Current state - assignedSquad:', pendingSquad);
    console.log('Current state - showResults:', true);
    
    // Verify the state was set correctly
    setTimeout(() => {
      console.log('State verification - assignedSquad:', assignedSquad);
      console.log('State verification - showResults:', showResults);
    }, 100);
  };

  const resetTest = () => {
    try {
      console.log('Resetting placement test...');
      localStorage.removeItem('userSquad');
      localStorage.removeItem('placementTestCompleted');
      localStorage.removeItem('suggestDisplayName');
      console.log('LocalStorage cleared');
      
      setAnswers({});
      setCurrentQuestion(0);
      setShowResults(false);
      setAssignedSquad(null);
      setShowConfirmation(false);
      setPendingSquad(null);
      setError(null);
      setRetryCount(0);
      setIsLoading(false);
      setIsCalculating(false);
      
      console.log('State reset completed');
    } catch (error) {
      console.error('Error resetting test:', error);
      // Force reload if reset fails
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-cyan-400 text-2xl animate-pulse mb-4">
            {retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Loading squad test...'}
          </div>
          {retryCount > 0 && (
            <div className="text-gray-400 text-sm">
              Attempt {retryCount} of {maxRetries}
            </div>
          )}
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error boundary for any unexpected errors
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Squad Test</h2>
            <p className="text-gray-300 text-sm mb-4">{error}</p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => {
                setError(null);
                setRetryCount(0);
                setIsLoading(true);
                // Reload the component
                window.location.reload();
              }} 
              className="bg-red-600 hover:bg-red-700 w-full"
            >
              Retry
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 w-full"
            >
              <Link href="/">
                Back to Dashboard
              </Link>
            </Button>
          </div>
          
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 mt-4">
              Retry attempts: {retryCount}/{maxRetries}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (showResults && assignedSquad) {
    console.log('Rendering results section');
    console.log('showResults:', showResults);
    console.log('assignedSquad:', assignedSquad);
    console.log('assignedSquad type:', typeof assignedSquad);
    console.log('assignedSquad keys:', Object.keys(assignedSquad));
    console.log('assignedSquad.name:', assignedSquad.name);
    console.log('assignedSquad.description:', assignedSquad.description);
    
    // Validate squad data before rendering
    if (!assignedSquad.name || !assignedSquad.description || !assignedSquad.specialties || !assignedSquad.recommendedCourses) {
      console.error('Invalid squad data structure:', assignedSquad);
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-red-400 text-xl text-center">
            <div className="mb-4">Invalid squad data</div>
            <Button onClick={() => resetTest()} className="bg-red-600 hover:bg-red-700">
              Retake Test
            </Button>
          </div>
        </div>
      );
    }
    
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
                <div className="error-boundary">
                  {renderSquadBadge(assignedSquad.name.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, ''))}
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Your Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {assignedSquad.specialties && assignedSquad.specialties.length > 0 ? (
                    assignedSquad.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-700/50 border border-cyan-500/30 rounded-full text-cyan-300 text-sm"
                      >
                        {specialty}
                      </span>
                    ))
                  ) : (
                    <div className="text-gray-400 text-center py-2 w-full">No specialties available</div>
                  )}
                </div>
              </div>

              {/* Recommended Courses */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Recommended Course Track
                </h3>
                <div className="space-y-2">
                  {assignedSquad.recommendedCourses && assignedSquad.recommendedCourses.length > 0 ? (
                    assignedSquad.recommendedCourses.map((courseId, index) => {
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
                          <span className="text-gray-300">{courseNames[courseId] || courseId}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-400 text-center py-2">No recommended courses available</div>
                  )}
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
                        pendingSquad.name && pendingSquad.name.includes('Creators') ? 'bg-yellow-500/20' :
                        pendingSquad.name && pendingSquad.name.includes('Decoders') ? 'bg-gray-500/20' :
                        pendingSquad.name && pendingSquad.name.includes('Speakers') ? 'bg-red-500/20' :
                        pendingSquad.name && pendingSquad.name.includes('Raiders') ? 'bg-blue-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        {pendingSquad.name && pendingSquad.name.includes('Creators') ? '🎨' :
                         pendingSquad.name && pendingSquad.name.includes('Decoders') ? '🧠' :
                         pendingSquad.name && pendingSquad.name.includes('Speakers') ? '🎤' :
                         pendingSquad.name && pendingSquad.name.includes('Raiders') ? '⚔️' :
                         '🦅'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{pendingSquad.name || 'Unknown Squad'}</p>
                        <p className="text-sm text-gray-300">{pendingSquad.description || 'No description available'}</p>
                      </div>
                    </div>
                    
                    {/* Answer Summary */}
                    <div className="mt-4">
                      <h5 className="font-semibold text-cyan-400 mb-2">Your Answers Summary:</h5>
                      <div className="space-y-2 text-sm">
                        {quizData?.questions && quizData.questions.length > 0 ? (
                          quizData.questions.map((question, index) => {
                            const answerId = answers[question.id];
                            const selectedOption = question.options?.find(opt => opt.id === answerId);
                            return (
                              <div key={question.id} className="flex justify-between items-center p-2 bg-slate-600/30 rounded">
                                <span className="text-gray-300">Q{index + 1}: {question.text.substring(0, 50)}...</span>
                                <span className="text-cyan-400 font-medium">
                                  {selectedOption ? selectedOption.text.substring(0, 30) + '...' : 'Not answered'}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-red-400 text-center py-2">No questions available</div>
                        )}
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
        <div className="text-red-400 text-xl text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Quiz Data Not Available</h2>
            <p className="text-gray-300 text-sm mb-4">
              The quiz data could not be loaded. This might be a temporary issue.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => {
                setError(null);
                setRetryCount(0);
                setIsLoading(true);
                // Reload the component
                window.location.reload();
              }} 
              className="bg-red-600 hover:bg-red-700 w-full"
            >
              Retry
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 w-full"
            >
              <Link href="/">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionData = quizData.questions[currentQuestion];
  
  // Validate current question data
  if (!currentQuestionData || !currentQuestionData.options || currentQuestionData.options.length === 0) {
    console.error('Invalid current question data:', currentQuestionData);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Invalid Question Data</h2>
            <p className="text-gray-300 text-sm mb-4">
              The current question data is invalid. Please refresh the page and try again.
            </p>
          </div>
          
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700 w-full"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
  
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
  const canProceed = answers[currentQuestionData.id];
  
  // Validate progress calculation
  if (isNaN(progress) || progress < 0 || progress > 100) {
    console.error('Invalid progress calculation:', { currentQuestion, totalQuestions: quizData.questions.length, progress });
    // Use fallback progress
    const fallbackProgress = Math.min(100, Math.max(0, ((currentQuestion + 1) / Math.max(1, quizData.questions.length)) * 100));
    console.log('Using fallback progress:', fallbackProgress);
  }
  
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
              {quizData.questions && quizData.questions.length > 0 ? (
                quizData.questions.map((question, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      answers[question.id] 
                        ? 'bg-green-400' 
                        : 'bg-gray-400'
                    }`}
                  />
                ))
              ) : (
                <div className="text-red-400 text-xs">No questions available</div>
              )}
            </div>
            
            {/* Completion status */}
            {currentQuestion === (quizData.questions?.length || 0) - 1 && (
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
              {currentQuestionData.options && currentQuestionData.options.length > 0 ? (
                currentQuestionData.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label
                      htmlFor={option.id}
                      className="text-lg text-gray-300 cursor-pointer hover:text-cyan-300 transition-colors"
                    >
                      {option.text}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-red-400 text-center py-4">
                  No options available for this question. Please refresh the page.
                </div>
              )}
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
              try {
                console.log('See Results button clicked');
                console.log('Current answers:', answers);
                console.log('Quiz data:', quizData);
                console.log('All questions answered:', allQuestionsAnswered);
                console.log('Can see results:', canSeeResults);
                
                if (canSeeResults) {
                  calculateSquad();
                } else {
                  console.log('Cannot see results yet - not all questions answered');
                  // Show helpful message to user
                  // Toast will be shown by parent component if needed
                }
              } catch (error) {
                console.error('Error in See Results button click:', error);
                setError('An error occurred while processing your request. Please try again.');
              }
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

        {/* Debug Section - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-slate-800/50 border border-cyan-500/30 rounded-lg">
            <h3 className="text-cyan-400 font-semibold mb-2">Debug Info</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Current Question: {currentQuestion + 1} of {quizData.questions.length}</div>
              <div>All Questions Answered: {allQuestionsAnswered ? 'Yes' : 'No'}</div>
              <div>Can See Results: {canSeeResults ? 'Yes' : 'No'}</div>
              <div>Show Results: {showResults ? 'Yes' : 'No'}</div>
              <div>Assigned Squad: {assignedSquad ? assignedSquad.name : 'None'}</div>
              <div>Pending Squad: {pendingSquad ? pendingSquad.name : 'None'}</div>
              <div>Show Confirmation: {showConfirmation ? 'Yes' : 'No'}</div>
              <div>Is Calculating: {isCalculating ? 'Yes' : 'No'}</div>
              <div>Answers Count: {Object.keys(answers).length}</div>
              <div>Expected Answers: {quizData.questions.length}</div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={() => {
                  try {
                    console.log('Debug: Current state:', {
                      currentQuestion,
                      allQuestionsAnswered,
                      canSeeResults,
                      showResults,
                      assignedSquad,
                      pendingSquad,
                      showConfirmation,
                      isCalculating,
                      answers,
                      quizData
                    });
                  } catch (error) {
                    console.error('Error in debug log:', error);
                  }
                }}
                variant="outline"
                size="sm"
                className="border-cyan-500/30 text-cyan-400"
              >
                Log State to Console
              </Button>
              <Button
                onClick={() => {
                  try {
                    console.log('Debug: Testing squad calculation...');
                    calculateSquad();
                  } catch (error) {
                    console.error('Error in debug squad calculation:', error);
                  }
                }}
                variant="outline"
                size="sm"
                className="border-green-500/30 text-green-400"
              >
                Test Squad Calculation
              </Button>
              <Button
                onClick={() => {
                  try {
                    console.log('Debug: Force showing results...');
                    // Force show results with a test squad
                    const testSquad = quizData.squads.creators;
                    if (testSquad) {
                      setAssignedSquad(testSquad);
                      setShowResults(true);
                      console.log('Forced results display with test squad:', testSquad);
                    }
                  } catch (error) {
                    console.error('Error in debug force show results:', error);
                  }
                }}
                variant="outline"
                size="sm"
                className="border-purple-500/30 text-purple-400"
              >
                Force Show Results
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
