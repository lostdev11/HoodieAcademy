/**
 * Onboarding Utilities
 * 
 * Manages the welcome tutorial state for new users
 */

const ONBOARDING_STORAGE_KEY = 'hoodie_academy_onboarding_seen';

/**
 * Check if user has seen the onboarding tutorial
 */
export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}

/**
 * Mark onboarding as seen
 */
export function markOnboardingAsSeen(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

/**
 * Reset onboarding (allows user to see it again)
 */
export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  console.log('✅ Onboarding reset - tutorial will show on next wallet connection');
}

/**
 * Force show onboarding (for testing or manual trigger)
 * Returns true if successful
 */
export function showOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  resetOnboarding();
  // Trigger a page reload to show the tutorial
  window.location.reload();
  return true;
}

