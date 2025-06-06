'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
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

const lessonsData = [
  {
    id: 1,
    title: "Introduction to Solana Name Service",
    content: "Learn about the Solana Name Service (SNS) and how it revolutionizes on-chain identity.",
    quiz: {
      question: "What is the main purpose of Solana Name Service?",
      options: [
        "To provide human-readable names for Solana addresses",
        "To create new cryptocurrencies",
        "To manage NFT collections",
        "To handle smart contracts"
      ],
      correctAnswer: 0
    }
  },
  {
    id: 2,
    title: "Registering Your First .sol Domain",
    content: "Step-by-step guide to registering and managing your .sol domain name.",
    quiz: {
      question: "What is the minimum length for a .sol domain name?",
      options: [
        "1 character",
        "3 characters",
        "5 characters",
        "7 characters"
      ],
      correctAnswer: 1
    }
  },
  {
    id: 3,
    title: "Managing Your SNS Domain",
    content: "Learn how to update records, transfer ownership, and manage your SNS domain settings.",
    quiz: {
      question: "Which of these can you NOT do with an SNS domain?",
      options: [
        "Update the domain's records",
        "Transfer ownership",
        "Create new cryptocurrencies",
        "Set up subdomains"
      ],
      correctAnswer: 2
    }
  },
  {
    id: 4,
    title: "Advanced SNS Features",
    content: "Explore advanced features like subdomains, reverse lookups, and integration with dApps.",
    quiz: {
      question: "What is a reverse lookup in SNS?",
      options: [
        "Finding a domain from an address",
        "Finding an address from a domain",
        "Looking up transaction history",
        "Checking domain availability"
      ],
      correctAnswer: 1
    }
  }
];

export default function SNSPage() {
  const [currentLesson, setCurrentLesson] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [progress, setProgress] = useState<Array<'locked' | 'unlocked' | 'completed'>>(['unlocked', 'locked', 'locked', 'locked']);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  useEffect(() => {
    const savedProgress = localStorage.getItem('snsProgress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  const markComplete = () => {
    if (selectedAnswer === lessonsData[currentLesson - 1].quiz.correctAnswer) {
      const newProgress = [...progress];
      newProgress[currentLesson - 1] = 'completed';
      if (currentLesson < lessonsData.length) {
        newProgress[currentLesson] = 'unlocked';
      }
      setProgress(newProgress);
      localStorage.setItem('snsProgress', JSON.stringify(newProgress));
      setQuizCompleted(true);
      setShowCompletionDialog(true);
    }
  };

  const nextLesson = () => {
    if (currentLesson < lessonsData.length) {
      setCurrentLesson(currentLesson + 1);
      setSelectedAnswer(null);
      setShowQuiz(false);
      setQuizCompleted(false);
    }
  };

  const currentLessonData = lessonsData[currentLesson - 1];
  const completionPercentage = (progress.filter(p => p === 'completed').length / lessonsData.length) * 100;

  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-background text-foreground">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <Button variant="outline" size="sm" asChild className="bg-card hover:bg-muted text-accent hover:text-accent-foreground border-accent">
            <Link href="/" className="flex items-center space-x-1">
              <Home size={16} />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>

        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">Solana Name Service (SNS)</h1>
          <p className="text-lg text-muted-foreground">Master the art of on-chain identity</p>
        </header>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Course Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
          <h2 className="text-2xl font-bold mb-4">{currentLessonData.title}</h2>
          <p className="text-muted-foreground mb-6">{currentLessonData.content}</p>

          {!showQuiz && !quizCompleted && (
            <Button onClick={() => setShowQuiz(true)} className="w-full">
              Take Quiz
            </Button>
          )}

          {showQuiz && !quizCompleted && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{currentLessonData.quiz.question}</h3>
              <RadioGroup
                value={selectedAnswer?.toString()}
                onValueChange={(value) => setSelectedAnswer(parseInt(value))}
              >
                {currentLessonData.quiz.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
              <Button 
                onClick={markComplete}
                disabled={selectedAnswer === null}
                className="w-full mt-4"
              >
                Submit Answer
              </Button>
            </div>
          )}

          {quizCompleted && currentLesson < lessonsData.length && (
            <Button onClick={nextLesson} className="w-full">
              Next Lesson <ArrowRight className="ml-2" size={16} />
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lesson Completed!</AlertDialogTitle>
            <AlertDialogDescription>
              {currentLesson === lessonsData.length 
                ? "Congratulations! You've completed the SNS course!"
                : "Great job! You can now proceed to the next lesson."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {currentLesson === lessonsData.length ? (
              <AlertDialogAction asChild>
                <Link href="/">Return to Home</Link>
              </AlertDialogAction>
            ) : (
              <AlertDialogAction onClick={nextLesson}>
                Continue
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 