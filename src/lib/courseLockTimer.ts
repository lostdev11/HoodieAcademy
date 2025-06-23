import { useState, useEffect } from 'react';

export interface CourseLockStatus {
  isLocked: boolean;
  lockTime: number | null;
  unlockTime: number | null;
  timeRemaining: number | null;
}

const LOCK_TIMER_KEY_PREFIX = 'course_lock_timer_';
const LOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours (until next day)
const MIN_RANDOM_DELAY = 1 * 60 * 1000; // 1 minute minimum
const MAX_RANDOM_DELAY = 5 * 60 * 1000; // 5 minutes maximum

export class CourseLockTimer {
  private courseId: string;
  private storageKey: string;

  constructor(courseId: string) {
    this.courseId = courseId;
    this.storageKey = `${LOCK_TIMER_KEY_PREFIX}${courseId}`;
  }

  // Generate a random lock time between 1-5 minutes
  private generateRandomLockTime(): number {
    const now = Date.now();
    const randomDelay = MIN_RANDOM_DELAY + Math.random() * (MAX_RANDOM_DELAY - MIN_RANDOM_DELAY);
    return now + randomDelay;
  }

  // Check if it's a new day (after midnight)
  private isNewDay(lastResetDate: string): boolean {
    const lastReset = new Date(lastResetDate);
    const now = new Date();
    return lastReset.getDate() !== now.getDate() || 
           lastReset.getMonth() !== now.getMonth() || 
           lastReset.getFullYear() !== now.getFullYear();
  }

  // Initialize or get lock status
  public getLockStatus(): CourseLockStatus {
    if (typeof window === 'undefined') {
      return { isLocked: false, lockTime: null, unlockTime: null, timeRemaining: null };
    }

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      // First time accessing this course today
      const lockTime = this.generateRandomLockTime();
      const unlockTime = lockTime + LOCK_DURATION;
      const lockData = {
        lockTime,
        unlockTime,
        lastResetDate: new Date().toDateString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(lockData));
      
      return {
        isLocked: false,
        lockTime,
        unlockTime,
        timeRemaining: lockTime - Date.now()
      };
    }

    try {
      const lockData = JSON.parse(stored);
      const now = Date.now();

      // Check if it's a new day
      if (this.isNewDay(lockData.lastResetDate)) {
        // Reset for new day
        const newLockTime = this.generateRandomLockTime();
        const newUnlockTime = newLockTime + LOCK_DURATION;
        const newLockData = {
          lockTime: newLockTime,
          unlockTime: newUnlockTime,
          lastResetDate: new Date().toDateString()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(newLockData));
        
        return {
          isLocked: false,
          lockTime: newLockTime,
          unlockTime: newUnlockTime,
          timeRemaining: newLockTime - now
        };
      }

      // Check current lock status
      if (now < lockData.lockTime) {
        // Course hasn't locked yet
        return {
          isLocked: false,
          lockTime: lockData.lockTime,
          unlockTime: lockData.unlockTime,
          timeRemaining: lockData.lockTime - now
        };
      } else {
        // Course is locked (until next day)
        return {
          isLocked: true,
          lockTime: lockData.lockTime,
          unlockTime: lockData.unlockTime,
          timeRemaining: null
        };
      }
    } catch (error) {
      console.error('Error parsing lock data:', error);
      return { isLocked: false, lockTime: null, unlockTime: null, timeRemaining: null };
    }
  }

  // Format time remaining for display
  public formatTimeRemaining(timeRemaining: number): string {
    if (timeRemaining <= 0) return '00:00';
    
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Check if course is accessible (not locked)
  public isAccessible(): boolean {
    const status = this.getLockStatus();
    return !status.isLocked;
  }

  // Force reset for testing (admin function)
  public forceReset(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}

// Hook for React components
export function useCourseLockTimer(courseId: string) {
  const [lockStatus, setLockStatus] = useState<CourseLockStatus>({ 
    isLocked: false, 
    lockTime: null, 
    unlockTime: null, 
    timeRemaining: null 
  });

  useEffect(() => {
    const timer = new CourseLockTimer(courseId);
    
    const updateStatus = () => {
      const status = timer.getLockStatus();
      setLockStatus(status);
    };

    // Initial check
    updateStatus();

    // Update every second if there's a countdown
    const interval = setInterval(() => {
      updateStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [courseId]);

  return lockStatus;
} 