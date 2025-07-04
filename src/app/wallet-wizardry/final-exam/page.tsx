'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Trophy, GraduationCap, AlertTriangle, Clock } from 'lucide-react';
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

interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  explanation: string;
}

interface QuizData {
  title: string;
  description: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export default function FinalExamPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [examPassed, setExamPassed] = useState(false);
  const [score, setScore] = useState(0);
  const [examResult, setExamResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');

  useEffect(() => {
    // Check if user has already taken the exam
    const examResultData = localStorage.getItem('walletWizardryFinalExam');
    if (examResultData) {
      const result = JSON.parse(examResultData);
      setExamResult(result);
      setExamPassed(result.passed);
      setScore(result.score);
      setShowResults(true);
      setIsLoading(false);
      return;
    }

    // Check if all tiers are completed
    const courseProgress = localStorage.getItem('walletWizardryProgress');
    if (courseProgress) {
      const progress: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(courseProgress);
      const allCompleted = progress.every(status => status === 'completed');
      
      if (!allCompleted) {
        // Redirect or show message that all tiers must be completed
        setIsLoading(false);
        return;
      }
    }

    // Load quiz data
    fetch('/wallet-wizardry/final-exam/quiz.json')
      .then(response => response.json())
      .then(data => {
        setQuizData(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading quiz data:', error);
        setIsLoading(false);
      });
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
      setShowConfirmSubmit(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    if (!quizData) return;

    let correctAnswers = 0;
    const totalQuestions = quizData.questions.length;

    quizData.questions.forEach(question => {
      const selectedAnswer = answers[question.id];
      const correctOption = question.options.find(option => option.correct);
      
      if (selectedAnswer === correctOption?.id) {
        correctAnswers++;
      }
    });

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = percentage >= quizData.passingScore;

    setScore(percentage);
    setExamPassed(passed);

    // Save result to localStorage with admin approval status
    const examResult = {
      passed,
      score: percentage,
      totalQuestions,
      taken: true,
      approved: false, // Admin must approve
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    localStorage.setItem('walletWizardryFinalExam', JSON.stringify(examResult));

    // Save to user's course progress for admin dashboard
    const userWalletAddress = localStorage.getItem('userWalletAddress') || 'demo-wallet';
    const userProgress = localStorage.getItem('userProgress') || '{}';
    const progress = JSON.parse(userProgress);
    
    if (!progress[userWalletAddress]) {
      progress[userWalletAddress] = {
        courses: {}
      };
    }
    
    if (!progress[userWalletAddress].courses['wallet-wizardry']) {
      progress[userWalletAddress].courses['wallet-wizardry'] = {
        progress: ['completed', 'completed', 'completed', 'completed']
      };
    }
    
    progress[userWalletAddress].courses['wallet-wizardry'].finalExam = examResult;
    localStorage.setItem('userProgress', JSON.stringify(progress));

    setShowResults(true);
  };

  const showQuestionExplanation = () => {
    const currentQuestionData = quizData?.questions[currentQuestion];
    if (currentQuestionData) {
      setCurrentExplanation(currentQuestionData.explanation);
      setShowExplanation(true);
    }
  };

  const resetExam = () => {
    localStorage.removeItem('walletWizardryFinalExam');
    localStorage.removeItem('walletWizardryGraduated');
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
    setExamPassed(false);
    setScore(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-2xl animate-pulse">Loading final exam...</div>
      </div>
    );
  }

  // Check if all tiers are completed
  const courseProgress = localStorage.getItem('walletWizardryProgress');
  if (courseProgress) {
    const progress: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(courseProgress);
    const allCompleted = progress.every(status => status === 'completed');
    
    if (!allCompleted) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="relative z-10 p-6 max-w-4xl mx-auto">
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

            <Card className="max-w-2xl mx-auto bg-slate-800/50 border-2 border-yellow-500/30 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Complete All Tiers First</h2>
                <p className="text-gray-300 mb-6">
                  You must complete all tiers of the Wallet Wizardry course before taking the final exam.
                </p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                >
                  <Link href="/wallet-wizardry">
                    Continue Learning
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
  }

  if (showResults) {
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

          {/* Results */}
          <div className="text-center mb-8">
            {examPassed ? (
              <div className="flex items-center justify-center mb-4">
                <Trophy className="w-16 h-16 text-yellow-400 mr-4" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {examResult?.approved ? 'Congratulations! You\'ve Graduated!' : 'Exam Completed!'}
                </h1>
              </div>
            ) : (
              <div className="flex items-center justify-center mb-4">
                <XCircle className="w-16 h-16 text-red-400 mr-4" />
                <h1 className="text-4xl font-bold text-red-400">
                  Exam Failed
                </h1>
              </div>
            )}
          </div>

          {/* Results Card */}
          <Card className={`max-w-2xl mx-auto mb-8 ${examPassed ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'} backdrop-blur-sm`}>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">
                  {examPassed ? '🎓' : '📚'}
                </div>
                <h2 className={`text-3xl font-bold mb-4 ${examPassed ? 'text-green-400' : 'text-red-400'}`}>
                  {examPassed 
                    ? (examResult?.approved ? 'Wallet Wizardry Graduate' : 'Exam Passed - Pending Approval')
                    : 'Keep Studying'
                  }
                </h2>
                <p className="text-gray-300 text-lg mb-4">
                  Your Score: <span className={`font-bold ${examPassed ? 'text-green-400' : 'text-red-400'}`}>{score}%</span>
                </p>
                <p className="text-gray-300">
                  {examPassed 
                    ? (examResult?.approved 
                        ? "You've demonstrated mastery of wallet security and best practices. Welcome to the Hoodie Academy graduate community!"
                        : "You've passed the exam! Your results are now pending admin approval. You'll be notified once approved."
                      )
                    : `You need ${quizData?.passingScore || 80}% to pass. Review the material and try again.`
                  }
                </p>
              </div>

              {examPassed && (
                <div className={`p-4 rounded-lg mb-6 ${
                  examResult?.approved 
                    ? 'bg-green-900/30 border border-green-500/50' 
                    : 'bg-yellow-900/30 border border-yellow-500/50'
                }`}>
                  <div className="flex items-center justify-center gap-2 text-yellow-400">
                    {examResult?.approved ? (
                      <>
                        <GraduationCap className="w-6 h-6 text-green-400" />
                        <span className="font-semibold text-green-400">Status: Approved & Graduated</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-6 h-6" />
                        <span className="font-semibold">Status: Pending Admin Approval</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-yellow-300 mt-2">
                    {examResult?.approved 
                      ? "Congratulations! Your graduation has been approved by an admin."
                      : "An admin will review your exam and approve your graduation. This usually takes 24-48 hours."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              asChild
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              <Link href="/courses">
                Explore Other Courses
              </Link>
            </Button>
            {!examPassed && (
              <Button
                onClick={resetExam}
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300"
              >
                Retake Exam
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Failed to load exam data</div>
      </div>
    );
  }

  const currentQuestionData = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
  const canProceed = answers[currentQuestionData.id];

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

            {/* Explanation Button */}
            <div className="mt-6 pt-6 border-t border-cyan-500/30">
              <Button
                onClick={showQuestionExplanation}
                variant="outline"
                size="sm"
                className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300"
              >
                Show Explanation
              </Button>
            </div>
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
            onClick={handleNext}
            disabled={!canProceed}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50"
          >
            {currentQuestion === quizData.questions.length - 1 ? 'Submit Exam' : 'Next'}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent className="bg-slate-800 border-cyan-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-cyan-400">Submit Final Exam?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to submit your exam? You cannot change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300">
              Review Answers
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={calculateResults}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              Submit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Explanation Dialog */}
      <AlertDialog open={showExplanation} onOpenChange={setShowExplanation}>
        <AlertDialogContent className="bg-slate-800 border-cyan-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-cyan-400">Question Explanation</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="text-gray-300">
            {currentExplanation}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 