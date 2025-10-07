'use client';

import { useCallback } from 'react';
import {
  logCourseStart,
  logCourseComplete,
  logLessonStart,
  logLessonComplete,
  logExamStarted,
  logExamSubmitted,
  logPlacementStarted,
  logPlacementCompleted
} from '@/lib/tracking/client';
import { UseCourseEventsOptions } from '@/types/tracking';

/**
 * Hook for tracking course-related events
 * Provides functions to log course, lesson, exam, and placement events
 */
export function useCourseEvents(options: UseCourseEventsOptions = {}) {
  const { sessionId, walletAddress } = options;

  // Course events
  const onCourseStart = useCallback(async (courseId: string) => {
    const result = await logCourseStart(courseId, sessionId || undefined, walletAddress || undefined);
    if (!result.success) {
      console.error('Failed to log course start:', result.error);
    }
    return result;
  }, [sessionId, walletAddress]);

  const onCourseComplete = useCallback(async (courseId: string) => {
    const result = await logCourseComplete(courseId, sessionId || undefined, walletAddress || undefined);
    if (!result.success) {
      console.error('Failed to log course complete:', result.error);
    }
    return result;
  }, [sessionId, walletAddress]);

  // Lesson events
  const onLessonStart = useCallback(async (courseId: string, lessonId: string) => {
    const result = await logLessonStart(courseId, lessonId, sessionId || undefined, walletAddress || undefined);
    if (!result.success) {
      console.error('Failed to log lesson start:', result.error);
    }
    return result;
  }, [sessionId, walletAddress]);

  const onLessonComplete = useCallback(async (courseId: string, lessonId: string) => {
    const result = await logLessonComplete(courseId, lessonId, sessionId || undefined, walletAddress || undefined);
    if (!result.success) {
      console.error('Failed to log lesson complete:', result.error);
    }
    return result;
  }, [sessionId, walletAddress]);

  // Exam events
  const onExamStarted = useCallback(async (examId: string) => {
    const result = await logExamStarted(examId, sessionId || undefined, walletAddress || undefined);
    if (!result.success) {
      console.error('Failed to log exam started:', result.error);
    }
    return result;
  }, [sessionId, walletAddress]);

  const onExamSubmitted = useCallback(async (examId: string) => {
    const result = await logExamSubmitted(examId, sessionId || undefined, walletAddress || undefined);
    if (!result.success) {
      console.error('Failed to log exam submitted:', result.error);
    }
    return result;
  }, [sessionId, walletAddress]);

  // Placement events
  const onPlacementStarted = useCallback(async () => {
    const result = await logPlacementStarted(sessionId || undefined, walletAddress || undefined);
    if (!result.success) {
      console.error('Failed to log placement started:', result.error);
    }
    return result;
  }, [sessionId, walletAddress]);

  const onPlacementCompleted = useCallback(async () => {
    const result = await logPlacementCompleted(sessionId || undefined, walletAddress || undefined);
    if (!result.success) {
      console.error('Failed to log placement completed:', result.error);
    }
    return result;
  }, [sessionId, walletAddress]);

  return {
    // Course events
    onCourseStart,
    onCourseComplete,
    
    // Lesson events
    onLessonStart,
    onLessonComplete,
    
    // Exam events
    onExamStarted,
    onExamSubmitted,
    
    // Placement events
    onPlacementStarted,
    onPlacementCompleted
  };
}