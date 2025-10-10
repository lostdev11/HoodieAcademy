// Global refresh utility for XP system
// This ensures all components refresh when XP is awarded

export interface XpAwardEvent {
  targetWallet: string;
  newTotalXP: number;
  xpAwarded: number;
  awardedBy: string;
  reason: string;
}

class GlobalRefreshManager {
  private static instance: GlobalRefreshManager;
  private refreshCallbacks: Map<string, () => void> = new Map();

  static getInstance(): GlobalRefreshManager {
    if (!GlobalRefreshManager.instance) {
      GlobalRefreshManager.instance = new GlobalRefreshManager();
    }
    return GlobalRefreshManager.instance;
  }

  // Register a component for refresh notifications
  registerComponent(componentId: string, refreshCallback: () => void) {
    this.refreshCallbacks.set(componentId, refreshCallback);
    console.log(`🔄 [GlobalRefresh] Registered component: ${componentId}`);
  }

  // Unregister a component
  unregisterComponent(componentId: string) {
    this.refreshCallbacks.delete(componentId);
    console.log(`🔄 [GlobalRefresh] Unregistered component: ${componentId}`);
  }

  // Trigger refresh for all registered components
  triggerGlobalRefresh(event: XpAwardEvent) {
    console.log('🔄 [GlobalRefresh] Triggering global refresh for XP award:', event);
    
    // Dispatch global event for backward compatibility
    window.dispatchEvent(new CustomEvent('xpAwarded', { detail: event }));

    // Trigger all registered callbacks
    this.refreshCallbacks.forEach((callback, componentId) => {
      try {
        console.log(`🔄 [GlobalRefresh] Refreshing component: ${componentId}`);
        callback();
      } catch (error) {
        console.error(`❌ [GlobalRefresh] Error refreshing component ${componentId}:`, error);
      }
    });
  }

  // Get count of registered components
  getRegisteredCount(): number {
    return this.refreshCallbacks.size;
  }
}

export const globalRefresh = GlobalRefreshManager.getInstance();

// Export convenience functions
export const registerForRefresh = (componentId: string, callback: () => void) => {
  globalRefresh.registerComponent(componentId, callback);
};

export const unregisterFromRefresh = (componentId: string) => {
  globalRefresh.unregisterComponent(componentId);
};

export const triggerXpRefresh = (event: XpAwardEvent) => {
  globalRefresh.triggerGlobalRefresh(event);
};
