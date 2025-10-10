// Simple utility to force refresh all XP-related components
// This is a more direct approach than the global refresh system

export function forceRefreshAllXpComponents() {
  console.log('🔄 [ForceRefresh] Triggering refresh of all XP components...');
  
  // 1. Dispatch multiple events to ensure compatibility
  const events = [
    'xpAwarded',
    'xpUpdated', 
    'forceRefresh',
    'dataUpdated'
  ];
  
  events.forEach(eventName => {
    window.dispatchEvent(new CustomEvent(eventName, { 
      detail: { 
        timestamp: Date.now(),
        source: 'forceRefresh'
      } 
    }));
  });
  
  // 2. Set a flag in localStorage to trigger refreshes
  localStorage.setItem('xpRefreshRequired', Date.now().toString());
  
  // 3. Trigger a storage event (for cross-tab communication)
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'xpRefreshRequired',
    newValue: Date.now().toString(),
    storageArea: localStorage
  }));
  
  console.log('✅ [ForceRefresh] All refresh triggers dispatched');
}

export function checkForXpRefresh() {
  const refreshFlag = localStorage.getItem('xpRefreshRequired');
  if (refreshFlag) {
    const refreshTime = parseInt(refreshFlag);
    const now = Date.now();
    
    // If refresh was requested within the last 10 seconds, trigger refresh
    if (now - refreshTime < 10000) {
      console.log('🔄 [ForceRefresh] XP refresh required, triggering...');
      localStorage.removeItem('xpRefreshRequired');
      return true;
    }
  }
  return false;
}

// Listen for storage events (cross-tab communication)
export function setupXpRefreshListener(callback: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'xpRefreshRequired' && event.newValue) {
      console.log('🔄 [ForceRefresh] Cross-tab refresh detected');
      callback();
    }
  };
  
  const handleCustomEvents = (event: CustomEvent) => {
    if (['xpAwarded', 'xpUpdated', 'forceRefresh', 'dataUpdated'].includes(event.type)) {
      console.log(`🔄 [ForceRefresh] ${event.type} event received`);
      callback();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('xpAwarded', handleCustomEvents as EventListener);
  window.addEventListener('xpUpdated', handleCustomEvents as EventListener);
  window.addEventListener('forceRefresh', handleCustomEvents as EventListener);
  window.addEventListener('dataUpdated', handleCustomEvents as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('xpAwarded', handleCustomEvents as EventListener);
    window.removeEventListener('xpUpdated', handleCustomEvents as EventListener);
    window.removeEventListener('forceRefresh', handleCustomEvents as EventListener);
    window.removeEventListener('dataUpdated', handleCustomEvents as EventListener);
  };
}
