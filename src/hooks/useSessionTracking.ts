'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UseSessionTrackingOptions } from '@/types/tracking';

/**
 * Hook for managing user sessions and heartbeats
 * Automatically creates sessions and sends heartbeats
 */
export function useSessionTracking(options: UseSessionTrackingOptions = {}) {
  const { walletAddress, autoStart = false, heartbeatInterval = 30000 } = options;
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  // Start a new session
  const startSession = useCallback(async (walletAddr?: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddr || walletAddress
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setIsActive(true);
      isInitialized.current = true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error starting session:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isLoading]);

  // End the current session
  const endSession = useCallback(async () => {
    if (!sessionId || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end session');
      }

      setSessionId(null);
      setIsActive(false);
      isInitialized.current = false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error ending session:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!sessionId || !isActive) return;

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'custom',
          payload: { type: 'heartbeat' },
          sessionId
        })
      });

      if (!response.ok) {
        console.error('Failed to send heartbeat');
      }
    } catch (err) {
      console.error('Error sending heartbeat:', err);
    }
  }, [sessionId, isActive]);

  // Start heartbeat interval
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(sendHeartbeat, heartbeatInterval);
  }, [sendHeartbeat, heartbeatInterval]);

  // Stop heartbeat interval
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Auto-start session if enabled
  useEffect(() => {
    if (autoStart && walletAddress && !isInitialized.current && !isLoading) {
      startSession();
    }
  }, [autoStart, walletAddress, startSession, isLoading]);

  // Start/stop heartbeat based on session state
  useEffect(() => {
    if (isActive && sessionId) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    return () => stopHeartbeat();
  }, [isActive, sessionId, startHeartbeat, stopHeartbeat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (sessionId) {
        endSession();
      }
    };
  }, [sessionId, endSession, stopHeartbeat]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat();
      } else if (isActive && sessionId) {
        startHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, sessionId, startHeartbeat, stopHeartbeat]);

  return {
    sessionId,
    isActive,
    isLoading,
    error,
    startSession,
    endSession,
    sendHeartbeat
  };
}