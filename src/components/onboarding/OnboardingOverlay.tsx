'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, User, Users, BookOpen, Calendar, Target, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
  action: {
    type: 'navigate' | 'api';
    path?: string;
    endpoint?: string;
  };
  completed: boolean;
  completedAt: string | null;
  xpAwarded: number;
  available?: boolean;
}

interface OnboardingProgress {
  tasks: OnboardingTask[];
  completedCount: number;
  totalCount: number;
  isCompleted: boolean;
  totalXPEarned: number;
}

interface OnboardingOverlayProps {
  walletAddress: string;
  onClose?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  users: Users,
  book: BookOpen,
  calendar: Calendar,
  target: Target,
};

export default function OnboardingOverlay({ walletAddress, onClose }: OnboardingOverlayProps) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (walletAddress) {
      fetchProgress();
    }
  }, [walletAddress]);

  // Auto-check for completed tasks when progress is loaded
  // This helps catch tasks that were completed while user was away
  useEffect(() => {
    if (!progress || !walletAddress) return;
    
    const checkCompletedTasks = async () => {
      // Check each incomplete task to see if it's actually done
      const incompleteTasks = progress.tasks.filter(t => !t.completed && t.available);
      
      for (const task of incompleteTasks) {
        try {
          const response = await fetch('/api/onboarding/complete-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, taskId: task.id }),
          });
          
          const data = await response.json();
          if (data.success && data.verified) {
            // Task was completed, refresh progress
            await fetchProgress();
            break; // Only refresh once
          }
        } catch (error) {
          // Silently fail - task not completed yet
        }
      }
    };
    
    // Check after a short delay to allow for navigation back
    const timer = setTimeout(checkCompletedTasks, 2000);
    return () => clearTimeout(timer);
  }, [progress?.tasks.length, walletAddress]); // Only check when task count changes

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/onboarding/progress?wallet=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding progress');
      }

      const data = await response.json();
      setProgress(data);

      // If onboarding is already completed, don't show overlay
      if (data.isCompleted) {
        setIsOpen(false);
        onClose?.();
      }
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to load onboarding tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (task: OnboardingTask) => {
    // Don't allow clicking if task is completed, unavailable, or already processing
    if (task.completed || !task.available || completingTask) {
      if (!task.available && !task.completed) {
        toast({
          title: 'Task Unavailable',
          description: task.id === 'start_first_course' 
            ? 'No courses are currently available. Check back later!'
            : 'This task is not available yet.',
          variant: 'default',
        });
      }
      return;
    }

    // For navigation tasks, just navigate - completion will be verified when they return
    if (task.action.type === 'navigate' && task.action.path) {
      // Use full page navigation for choose-your-squad to trigger server-side redirect
      if (task.action.path === '/choose-your-squad') {
        window.location.href = task.action.path;
      } else {
        router.push(task.action.path);
      }
      return;
    }

    // For API tasks (like daily login), try to complete immediately
    setCompletingTask(task.id);

    try {
      const response = await fetch('/api/onboarding/complete-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          taskId: task.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.verified) {
        throw new Error(data.message || 'Failed to complete task');
      }

      // Show success toast
      toast({
        title: 'Task Completed! 🎉',
        description: `You earned ${data.xpAwarded} XP!`,
      });

      // Refresh progress
      await fetchProgress();

      // If all tasks completed, show completion message
      if (data.allTasksCompleted) {
        setTimeout(() => {
          toast({
            title: 'Onboarding Complete! 🎊',
            description: `You've earned ${progress?.totalXPEarned || 0} XP total!`,
          });
          setIsOpen(false);
          onClose?.();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: 'Task Not Completed',
        description: error.message || 'Please complete the action first, then return to claim your XP.',
        variant: 'default',
      });
    } finally {
      setCompletingTask(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-cyan-500/30">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Sparkles className="w-8 h-8 animate-pulse text-cyan-400 mx-auto mb-4" />
              <p className="text-gray-400">Loading your onboarding tasks...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!progress) {
    return null;
  }

  const completionPercentage = (progress.completedCount / progress.totalCount) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-cyan-500/30">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Welcome to Hoodie Academy!
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-2">
                Complete these tasks to get started and earn XP rewards
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Progress Overview */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">
                Progress: {progress.completedCount} of {progress.totalCount} tasks
              </span>
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                {progress.totalXPEarned} XP Earned
              </Badge>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {progress.tasks.map((task) => {
              const IconComponent = iconMap[task.icon] || Circle;
              const isCompleting = completingTask === task.id;
              const isAvailable = task.available !== false; // Default to true if not specified
              const isDisabled = task.completed || !isAvailable;

              return (
                <div
                  key={task.id}
                  className={`
                    bg-slate-800/50 rounded-lg p-4 border transition-all
                    ${task.completed 
                      ? 'border-green-500/30 bg-green-500/5' 
                      : isAvailable
                        ? 'border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 cursor-pointer'
                        : 'border-slate-700/50 bg-slate-900/50 opacity-60 cursor-not-allowed'
                    }
                    ${isCompleting ? 'opacity-50 pointer-events-none' : ''}
                  `}
                  onClick={() => !isDisabled && handleTaskClick(task)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      p-2 rounded-lg
                      ${task.completed 
                        ? 'bg-green-500/20 text-green-400' 
                        : isAvailable
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-gray-500/20 text-gray-500'
                      }
                    `}>
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <IconComponent className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`
                          font-semibold
                          ${task.completed 
                            ? 'text-green-400 line-through' 
                            : isAvailable
                              ? 'text-white'
                              : 'text-gray-500'
                          }
                        `}>
                          {task.title}
                        </h3>
                        {!task.completed && isAvailable && (
                          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                            +{task.xpReward} XP
                          </Badge>
                        )}
                        {!task.completed && !isAvailable && (
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">
                            Unavailable
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm mb-2 ${isAvailable ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                        {!isAvailable && task.id === 'start_first_course' && (
                          <span className="block mt-1 text-xs text-gray-500">
                            No courses are currently available. Check back later!
                          </span>
                        )}
                      </p>
                      {task.completed && task.completedAt && (
                        <p className="text-xs text-green-400/70">
                          Completed • {new Date(task.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion Message */}
          {progress.isCompleted && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-green-400 mb-1">
                Onboarding Complete! 🎊
              </h3>
              <p className="text-sm text-gray-400">
                You've earned {progress.totalXPEarned} XP. Welcome to Hoodie Academy!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

