// API-based squad utilities
// This replaces localStorage with database API calls for global, cross-device squad management

export interface SquadData {
  name: string;
  id: string;
  lockEndDate?: string;
  selectedAt?: string;
  changeCount?: number;
}

export interface SquadStatusResponse {
  hasSquad: boolean;
  squad: SquadData | null;
  isLocked: boolean;
  remainingDays: number;
}

/**
 * Fetch user's squad from the database
 * This is the source of truth - localStorage is only used as cache
 */
export async function fetchUserSquad(walletAddress: string): Promise<SquadStatusResponse | null> {
  try {
    const response = await fetch(`/api/user-squad?wallet_address=${walletAddress}&t=${Date.now()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Failed to fetch squad:', response.status);
      return null;
    }

    const data = await response.json();
    
    // Cache in localStorage for quick access
    if (data.hasSquad && data.squad) {
      localStorage.setItem('userSquad', JSON.stringify(data.squad));
      localStorage.setItem('squadStatus', JSON.stringify({
        isLocked: data.isLocked,
        remainingDays: data.remainingDays,
        lastFetched: new Date().toISOString()
      }));
    } else {
      localStorage.removeItem('userSquad');
      localStorage.removeItem('squadStatus');
    }

    return data;
  } catch (error) {
    console.error('Error fetching squad:', error);
    return null;
  }
}

/**
 * Get squad from cache (localStorage) if available and recent
 * Falls back to API if cache is stale or missing
 */
export async function getSquadWithCache(walletAddress: string): Promise<SquadStatusResponse | null> {
  // Check cache first
  const cachedSquad = localStorage.getItem('userSquad');
  const cachedStatus = localStorage.getItem('squadStatus');
  
  if (cachedSquad && cachedStatus) {
    try {
      const status = JSON.parse(cachedStatus);
      const lastFetched = new Date(status.lastFetched);
      const now = new Date();
      const minutesSinceCache = (now.getTime() - lastFetched.getTime()) / 60000;
      
      // Cache is valid for 5 minutes
      if (minutesSinceCache < 5) {
        const squad = JSON.parse(cachedSquad);
        return {
          hasSquad: true,
          squad,
          isLocked: status.isLocked,
          remainingDays: status.remainingDays
        };
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
  }
  
  // Cache miss or stale - fetch from API
  return await fetchUserSquad(walletAddress);
}

/**
 * Update user's squad via API
 */
export async function updateUserSquad(
  walletAddress: string,
  squad: string,
  squadId: string,
  renew: boolean = false
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const response = await fetch('/api/user-squad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: walletAddress,
        squad,
        squad_id: squadId,
        renew
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || 'Failed to update squad'
      };
    }

    // Update cache
    if (result.squad) {
      localStorage.setItem('userSquad', JSON.stringify(result.squad));
      localStorage.setItem('squadStatus', JSON.stringify({
        isLocked: true,
        remainingDays: 30,
        lastFetched: new Date().toISOString()
      }));
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error updating squad:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update squad'
    };
  }
}

/**
 * Clear squad cache (useful for logout)
 */
export function clearSquadCache(): void {
  localStorage.removeItem('userSquad');
  localStorage.removeItem('squadStatus');
}

/**
 * Get squad name from cache only (for quick display)
 * Should be followed by API fetch for accuracy
 */
export function getSquadNameFromCache(): string | null {
  try {
    const cachedSquad = localStorage.getItem('userSquad');
    if (cachedSquad) {
      const squad = JSON.parse(cachedSquad);
      return squad.name || null;
    }
  } catch (error) {
    console.error('Error reading squad name from cache:', error);
  }
  return null;
}

/**
 * Check if squad is locked (from cache)
 * Should be followed by API fetch for accuracy
 */
export function isSquadLockedFromCache(): boolean {
  try {
    const cachedStatus = localStorage.getItem('squadStatus');
    if (cachedStatus) {
      const status = JSON.parse(cachedStatus);
      return status.isLocked || false;
    }
  } catch (error) {
    console.error('Error checking lock status:', error);
  }
  return false;
}

/**
 * Get remaining lock days (from cache)
 * Should be followed by API fetch for accuracy
 */
export function getRemainingDaysFromCache(): number {
  try {
    const cachedStatus = localStorage.getItem('squadStatus');
    if (cachedStatus) {
      const status = JSON.parse(cachedStatus);
      return status.remainingDays || 0;
    }
  } catch (error) {
    console.error('Error getting remaining days:', error);
  }
  return 0;
}

