import { useState, useCallback } from 'react';
import { xpBountyService } from '@/services/xp-bounty-service';

export interface CourseCompletionResult {
  success: boolean;
  xpAwarded?: number;
  newTotalXP?: number;
  levelUp?: boolean;
  message?: string;
  alreadyCompleted?: boolean;
}

export function useCourseCompletion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeCourse = useCallback(async (
    walletAddress: string,
    courseId: string,
    courseTitle?: string,
    customXP?: number
  ): Promise<CourseCompletionResult> => {
    if (!walletAddress || !courseId) {
      return {
        success: false,
        message: 'Wallet address and course ID are required'
      };
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🎯 [useCourseCompletion] Completing course:', {
        walletAddress,
        courseId,
        courseTitle,
        customXP
      });

      const result = await xpBountyService.awardCourseCompletion(
        walletAddress,
        courseId,
        courseTitle,
        customXP
      );

      if (result.success) {
        console.log('✅ [useCourseCompletion] Course completed successfully:', result);
        
        // Show success notification
        if (typeof window !== 'undefined') {
          const message = result.levelUp 
            ? `Course completed! +${result.xpAwarded} XP! Level up!`
            : `Course completed! +${result.xpAwarded} XP!`;
          
          // You can replace this with a toast notification system
          setTimeout(() => {
            window.alert(message);
          }, 500);
        }
      } else {
        console.warn('⚠️ [useCourseCompletion] Course completion failed:', result);
        setError(result.message || 'Failed to complete course');
      }

      return result;
    } catch (err) {
      console.error('❌ [useCourseCompletion] Error completing course:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const checkCourseCompletion = useCallback(async (
    walletAddress: string,
    courseId?: string
  ) => {
    if (!walletAddress) return null;

    try {
      const result = await xpBountyService.checkCourseCompletionStatus(walletAddress, courseId);
      return result;
    } catch (err) {
      console.error('❌ [useCourseCompletion] Error checking course completion:', err);
      return null;
    }
  }, []);

  return {
    completeCourse,
    checkCourseCompletion,
    loading,
    error
  };
}
