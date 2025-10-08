// Utility functions for consistent squad storage and retrieval

export interface SquadData {
  name: string;
  id: string;
  lockEndDate?: string; // ISO date string for when the 30-day lock expires
}

/**
 * Store squad data in localStorage consistently
 */
export const storeSquad = (squad: SquadData | string): void => {
  try {
    if (typeof squad === 'string') {
      // Convert string to SquadData format
      localStorage.setItem('userSquad', JSON.stringify({ name: squad, id: squad }));
    } else {
      localStorage.setItem('userSquad', JSON.stringify(squad));
    }
  } catch (error) {
    console.error('Error storing squad data:', error);
  }
};

/**
 * Retrieve squad data from localStorage with proper error handling
 */
export const getSquad = (): SquadData | null => {
  try {
    const squadData = localStorage.getItem('userSquad');
    if (!squadData) return null;

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(squadData);
      if (parsed && (parsed.name || parsed.id)) {
        return {
          name: parsed.name || parsed.id,
          id: parsed.id || parsed.name
        };
      }
    } catch {
      // If JSON parsing fails, treat as plain string
      return {
        name: squadData,
        id: squadData
      };
    }
  } catch (error) {
    console.error('Error retrieving squad data:', error);
  }
  return null;
};

/**
 * Get just the squad name as a string
 */
export const getSquadName = (): string | null => {
  const squad = getSquad();
  return squad?.name || null;
};

/**
 * Get just the squad ID as a string
 */
export const getSquadId = (): string | null => {
  const squad = getSquad();
  return squad?.id || null;
};

/**
 * Clear squad data from localStorage
 */
export const clearSquad = (): void => {
  try {
    localStorage.removeItem('userSquad');
  } catch (error) {
    console.error('Error clearing squad data:', error);
  }
};

/**
 * Check if the squad is currently locked (within 30-day period)
 */
export const isSquadLocked = (): boolean => {
  try {
    const squad = getSquad();
    if (!squad || !squad.lockEndDate) return false;
    
    const lockEndDate = new Date(squad.lockEndDate);
    const now = new Date();
    
    return now < lockEndDate;
  } catch (error) {
    console.error('Error checking squad lock status:', error);
    return false;
  }
};

/**
 * Get the remaining days in the squad lock period
 */
export const getRemainingLockDays = (): number => {
  try {
    const squad = getSquad();
    if (!squad || !squad.lockEndDate) return 0;
    
    const lockEndDate = new Date(squad.lockEndDate);
    const now = new Date();
    
    if (now >= lockEndDate) return 0;
    
    const diffTime = lockEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Error calculating remaining lock days:', error);
    return 0;
  }
};
