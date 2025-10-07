'use client';

import { EventKind, TrackEventRequest } from '@/types/tracking';

/**
 * Client-side tracking utilities for Hoodie Academy
 * Provides functions to log events and manage sessions
 */

/**
 * Log an event to the tracking system
 */
export async function logEvent(input: TrackEventRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/track', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(input),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Failed to log event' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error logging event:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Log wallet connect event
 */
export async function logWalletConnect(walletAddress: string, sessionId?: string): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'wallet_connect',
    walletAddress,
    sessionId,
    payload: {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
  });
}

/**
 * Log wallet disconnect event
 */
export async function logWalletDisconnect(walletAddress: string, sessionId?: string): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'wallet_disconnect',
    walletAddress,
    sessionId,
    payload: {
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}

/**
 * Log page view event
 */
export async function logPageView(
  path: string, 
  referrer?: string, 
  sessionId?: string
): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'page_view',
    path,
    referrer,
    sessionId,
    payload: {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      title: document.title
    }
  });
}

/**
 * Log course start event
 */
export async function logCourseStart(
  courseId: string, 
  sessionId?: string, 
  walletAddress?: string
): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'course_start',
    courseId,
    sessionId,
    walletAddress,
    payload: {
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}

/**
 * Log course complete event
 */
export async function logCourseComplete(
  courseId: string, 
  sessionId?: string, 
  walletAddress?: string
): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'course_complete',
    courseId,
    sessionId,
    walletAddress,
    payload: {
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}

/**
 * Log lesson start event
 */
export async function logLessonStart(
  courseId: string,
  lessonId: string, 
  sessionId?: string, 
  walletAddress?: string
): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'lesson_start',
    courseId,
    lessonId,
    sessionId,
    walletAddress,
    payload: {
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}

/**
 * Log lesson complete event
 */
export async function logLessonComplete(
  courseId: string,
  lessonId: string, 
  sessionId?: string, 
  walletAddress?: string
): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'lesson_complete',
    courseId,
    lessonId,
    sessionId,
    walletAddress,
    payload: {
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}

/**
 * Log exam started event
 */
export async function logExamStarted(
  examId: string, 
  sessionId?: string, 
  walletAddress?: string
): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'exam_started',
    examId,
    sessionId,
    walletAddress,
    payload: {
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}

/**
 * Log exam submitted event
 */
export async function logExamSubmitted(
  examId: string, 
  sessionId?: string, 
  walletAddress?: string
): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'exam_submitted',
    examId,
    sessionId,
    walletAddress,
    payload: {
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}

/**
 * Log placement started event
 */
export async function logPlacementStarted(
  sessionId?: string, 
  walletAddress?: string
): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'placement_started',
    sessionId,
    walletAddress,
    payload: {
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}

/**
 * Log placement completed event
 */
export async function logPlacementCompleted(
  sessionId?: string, 
  walletAddress?: string
): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'placement_completed',
    sessionId,
    walletAddress,
    payload: {
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}

/**
 * Log custom event
 */
export async function logCustomEvent(
  payload: Record<string, unknown>,
  sessionId?: string,
  walletAddress?: string
): Promise<{ success: boolean; error?: string }> {
  return logEvent({
    kind: 'custom',
    payload: {
      ...payload,
      timestamp: new Date().toISOString(),
      url: window.location.href
    },
    sessionId,
    walletAddress
  });
}