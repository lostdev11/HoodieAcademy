import { useEffect } from 'react';
import { enhancedLeaderboardService } from '@/services/enhanced-leaderboard-service';

export interface CourseProgressUpdate {
  walletAddress: string;
  courseId: string;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesPassed: number;
  totalQuizzes: number;
  score: number;
  completed: boolean;
}

export const useLeaderboardTracking = () => {
  // Track course completion
  const trackCourseCompletion = async (
    walletAddress: string,
    courseId: string
  ) => {
    try {
      await enhancedLeaderboardService.recordCourseCompletion(walletAddress, courseId);
      await enhancedLeaderboardService.updateUserActivity(walletAddress);
      console.log(`✅ Course completion tracked for ${walletAddress} - ${courseId}`);
    } catch (error) {
      console.error('❌ Error tracking course completion:', error);
    }
  };

  // Track quiz completion
  const trackQuizCompletion = async (
    walletAddress: string,
    quizId: string,
    quizScore: number,
    passed: boolean
  ) => {
    try {
      await enhancedLeaderboardService.recordQuizResult(walletAddress, quizId, quizScore, passed);
      await enhancedLeaderboardService.updateUserActivity(walletAddress);
      console.log(`✅ Quiz completion tracked for ${walletAddress} - ${quizId}`);
    } catch (error) {
      console.error('❌ Error tracking quiz completion:', error);
    }
  };

  // Track badge earned
  const trackBadgeEarned = async (
    walletAddress: string,
    badgeId: string
  ) => {
    try {
      await enhancedLeaderboardService.recordBadge(walletAddress, badgeId);
      await enhancedLeaderboardService.updateUserActivity(walletAddress);
      console.log(`✅ Badge earned tracked for ${walletAddress} - ${badgeId}`);
    } catch (error) {
      console.error('❌ Error tracking badge earned:', error);
    }
  };

  // Track lesson completion (for progress tracking)
  const trackLessonCompletion = async (
    walletAddress: string,
    courseId: string,
    lessonIndex: number,
    totalLessons: number
  ) => {
    try {
      // Update user activity for lesson completion
      await enhancedLeaderboardService.updateUserActivity(walletAddress);
      
      // If this is the final lesson, mark course as completed
      if (lessonIndex + 1 >= totalLessons) {
        await enhancedLeaderboardService.recordCourseCompletion(walletAddress, courseId);
      }
      
      console.log(`✅ Lesson completion tracked for ${walletAddress} - ${courseId}`);
    } catch (error) {
      console.error('❌ Error tracking lesson completion:', error);
    }
  };

  return {
    trackCourseCompletion,
    trackQuizCompletion,
    trackBadgeEarned,
    trackLessonCompletion
  };
};

// Hook for course components to automatically track progress
export const useCourseProgressTracking = (
  walletAddress: string,
  courseId: string
) => {
  const { trackCourseCompletion, trackQuizCompletion, trackLessonCompletion } = useLeaderboardTracking();

  return {
    onLessonComplete: (lessonIndex: number, totalLessons: number) => {
      trackLessonCompletion(walletAddress, courseId, lessonIndex, totalLessons);
    },
    onQuizComplete: (quizId: string, score: number, passed: boolean) => {
      trackQuizCompletion(walletAddress, quizId, score, passed);
    },
    onCourseComplete: () => {
      trackCourseCompletion(walletAddress, courseId);
    }
  };
};

// Hook for badge/achievement tracking
export const useBadgeTracking = (walletAddress: string) => {
  const { trackBadgeEarned } = useLeaderboardTracking();

  return {
    onBadgeEarned: (badgeId: string) => {
      trackBadgeEarned(walletAddress, badgeId);
    }
  };
}; 