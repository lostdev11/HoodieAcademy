// Leaderboard Auto-Refresh System
// This ensures the leaderboard updates automatically when users earn XP

let refreshCallbacks: (() => void)[] = [];

export function registerLeaderboardRefresh(callback: () => void) {
  refreshCallbacks.push(callback);
  return () => {
    refreshCallbacks = refreshCallbacks.filter(cb => cb !== callback);
  };
}

export function triggerLeaderboardRefresh() {
  console.log('🔄 [LeaderboardRefresh] Triggering refresh for', refreshCallbacks.length, 'components');
  refreshCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Error in leaderboard refresh callback:', error);
    }
  });
}

// Listen for XP award events
if (typeof window !== 'undefined') {
  window.addEventListener('xpAwarded', () => {
    console.log('🎯 [LeaderboardRefresh] XP awarded, refreshing leaderboard');
    triggerLeaderboardRefresh();
  });

  window.addEventListener('xpUpdated', () => {
    console.log('🔄 [LeaderboardRefresh] XP updated, refreshing leaderboard');
    triggerLeaderboardRefresh();
  });
}
