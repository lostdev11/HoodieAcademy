'use client';

import { logCustomEvent } from './client';

/**
 * Heartbeat system for tracking active user sessions
 * Sends a heartbeat every 30 seconds while the tab is active
 */
export function startHeartbeat(sessionId: string): () => void {
  let timer: NodeJS.Timeout;
  let isActive = true;

  function beat() {
    if (!isActive) return;
    
    logCustomEvent({ 
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      tab_active: document.visibilityState === 'visible'
    }, sessionId).catch(error => {
      console.warn('Heartbeat failed:', error);
    });
  }

  // Send initial heartbeat
  beat();
  
  // Set up interval for regular heartbeats
  timer = setInterval(beat, 30000); // 30 seconds

  // Send heartbeat when tab becomes visible (if it was hidden)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      beat();
    }
  };

  // Send heartbeat when window regains focus
  const handleFocus = () => {
    beat();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);

  // Return cleanup function
  return () => {
    isActive = false;
    clearInterval(timer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
  };
}

/**
 * Enhanced heartbeat with page visibility and focus tracking
 */
export function startEnhancedHeartbeat(sessionId: string): () => void {
  let timer: NodeJS.Timeout;
  let isActive = true;
  let lastHeartbeat = Date.now();

  function beat() {
    if (!isActive) return;
    
    const now = Date.now();
    const timeSinceLastHeartbeat = now - lastHeartbeat;
    
    logCustomEvent({ 
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      tab_active: document.visibilityState === 'visible',
      time_since_last_heartbeat: timeSinceLastHeartbeat,
      page_url: window.location.href,
      referrer: document.referrer
    }, sessionId).catch(error => {
      console.warn('Enhanced heartbeat failed:', error);
    });

    lastHeartbeat = now;
  }

  // Send initial heartbeat
  beat();
  
  // Set up interval for regular heartbeats
  timer = setInterval(beat, 30000); // 30 seconds

  // Send heartbeat when tab becomes visible
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      beat();
    }
  };

  // Send heartbeat when window regains focus
  const handleFocus = () => {
    beat();
  };

  // Send heartbeat before page unload
  const handleBeforeUnload = () => {
    // Use sendBeacon for reliable delivery during page unload
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        kind: 'custom',
        payload: {
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
          tab_active: false,
          event: 'beforeunload'
        },
        sessionId
      });
      
      navigator.sendBeacon('/api/track', data);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return cleanup function
  return () => {
    isActive = false;
    clearInterval(timer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}
