'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { useWalletTracking } from '@/hooks/useWalletTracking';
import { usePageView } from '@/hooks/usePageView';
import { useCourseEvents } from '@/hooks/useCourseEvents';

interface TrackingContextType {
  sessionId: string | null;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  startSession: (walletAddress?: string) => Promise<void>;
  endSession: () => Promise<void>;
  // Course event helpers
  onCourseStart: (courseId: string) => Promise<{ success: boolean; error?: string }>;
  onCourseComplete: (courseId: string) => Promise<{ success: boolean; error?: string }>;
  onLessonStart: (courseId: string, lessonId: string) => Promise<{ success: boolean; error?: string }>;
  onLessonComplete: (courseId: string, lessonId: string) => Promise<{ success: boolean; error?: string }>;
  onExamStarted: (examId: string) => Promise<{ success: boolean; error?: string }>;
  onExamSubmitted: (examId: string) => Promise<{ success: boolean; error?: string }>;
  onPlacementStarted: () => Promise<{ success: boolean; error?: string }>;
  onPlacementCompleted: () => Promise<{ success: boolean; error?: string }>;
}

const TrackingContext = createContext<TrackingContextType | null>(null);

interface TrackingProviderProps {
  children: ReactNode;
  walletAddress?: string | null;
  autoStart?: boolean;
}

export function TrackingProvider({ 
  children, 
  walletAddress, 
  autoStart = true 
}: TrackingProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session tracking
  const {
    sessionId,
    isActive,
    isLoading,
    error,
    startSession,
    endSession
  } = useSessionTracking({
    walletAddress: walletAddress || undefined,
    autoStart: false // We'll start manually after wallet connects
  });

  // Initialize wallet tracking
  const { logConnect, logDisconnect } = useWalletTracking({
    walletAddress,
    sessionId,
    autoStart: false // We'll handle this manually
  });

  // Initialize page view tracking
  usePageView({
    sessionId,
    debounceMs: 1000
  });

  // Initialize course events
  const courseEvents = useCourseEvents({
    sessionId,
    walletAddress
  });

  // Auto-start session when wallet connects
  useEffect(() => {
    if (walletAddress && autoStart && !isInitialized && !isLoading) {
      const initializeTracking = async () => {
        try {
          // Start session first
          await startSession(walletAddress);
          
          // Log wallet connect
          await logConnect(walletAddress);
          
          setIsInitialized(true);
        } catch (err) {
          console.error('Error initializing tracking:', err);
        }
      };

      initializeTracking();
    }
  }, [walletAddress, autoStart, isInitialized, isLoading, startSession, logConnect]);

  // Handle wallet disconnect
  useEffect(() => {
    if (!walletAddress && isInitialized) {
      const handleDisconnect = async () => {
        try {
          // Log wallet disconnect (if we have a previous wallet address)
          // Note: We don't have access to the previous wallet address here
          // This would need to be handled by the parent component
          
          // End session
          await endSession();
          
          setIsInitialized(false);
        } catch (err) {
          console.error('Error handling wallet disconnect:', err);
        }
      };

      handleDisconnect();
    }
  }, [walletAddress, isInitialized, endSession]);

  const contextValue: TrackingContextType = {
    sessionId,
    isActive,
    isLoading,
    error,
    startSession,
    endSession,
    ...courseEvents
  };

  return (
    <TrackingContext.Provider value={contextValue}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextType {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}