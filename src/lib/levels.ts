export type Level = {
  level: number;
  title: string;
  xpRequired: number;
  description?: string;
  unlocks?: string[];
  color?: string; // optional color theme for the level
  icon?: string; // optional icon/emoji for the level
};

export const LEVELS: Level[] = [
  { 
    level: 1, 
    title: "New Recruit", 
    xpRequired: 0,
    description: "Welcome to the Hoodie Academy",
    unlocks: ["Basic profile access", "Course enrollment"],
    color: "text-gray-400",
    icon: "👋"
  },
  { 
    level: 2, 
    title: "Apprentice Hoodie", 
    xpRequired: 100,
    description: "Learning the ropes",
    unlocks: ["Bounty submissions", "Squad chat access"],
    color: "text-blue-400",
    icon: "🎓"
  },
  { 
    level: 3, 
    title: "Squad Contributor", 
    xpRequired: 250,
    description: "Making your mark",
    unlocks: ["Squad leaderboards", "XP tracking"],
    color: "text-green-400",
    icon: "👥"
  },
  { 
    level: 4, 
    title: "Lore Builder", 
    xpRequired: 500,
    description: "Crafting the narrative",
    unlocks: ["Lore creation", "Story submissions"],
    color: "text-purple-400",
    icon: "📚"
  },
  { 
    level: 5, 
    title: "Vault Access", 
    xpRequired: 1000,
    description: "Unlocking hidden knowledge",
    unlocks: ["Premium courses", "Exclusive content"],
    color: "text-yellow-400",
    icon: "🔐"
  },
  { 
    level: 6, 
    title: "DAO Ready", 
    xpRequired: 1750,
    description: "Prepared for governance",
    unlocks: ["Voting rights", "Proposal creation"],
    color: "text-indigo-400",
    icon: "🏛️"
  },
  { 
    level: 7, 
    title: "Squad Leader", 
    xpRequired: 2500,
    description: "Leading your squad",
    unlocks: ["Squad management", "Event hosting"],
    color: "text-red-400",
    icon: "⚔️"
  },
  { 
    level: 8, 
    title: "Council Member", 
    xpRequired: 3500,
    description: "Part of the inner circle",
    unlocks: ["Council access", "Strategic decisions"],
    color: "text-pink-400",
    icon: "👑"
  },
  { 
    level: 9, 
    title: "Shadow Hoodie", 
    xpRequired: 5000,
    description: "Operating in the shadows",
    unlocks: ["Stealth missions", "Covert operations"],
    color: "text-gray-600",
    icon: "🕵️"
  },
  { 
    level: 10, 
    title: "Legend", 
    xpRequired: 7777,
    description: "A true legend of the academy",
    unlocks: ["Legendary status", "All access pass"],
    color: "text-orange-400",
    icon: "🌟"
  },
  // Extended levels for long-term progression
  { 
    level: 11, 
    title: "Mythic Hoodie", 
    xpRequired: 10000,
    description: "Beyond legendary status",
    unlocks: ["Mythic rewards", "Exclusive merch"],
    color: "text-purple-500",
    icon: "✨"
  },
  { 
    level: 12, 
    title: "Eternal Guardian", 
    xpRequired: 15000,
    description: "Protecting the academy's legacy",
    unlocks: ["Guardian status", "Mentorship rights"],
    color: "text-cyan-400",
    icon: "🛡️"
  },
  { 
    level: 13, 
    title: "Cosmic Wanderer", 
    xpRequired: 25000,
    description: "Exploring the digital cosmos",
    unlocks: ["Cosmic rewards", "Interdimensional access"],
    color: "text-violet-400",
    icon: "🌌"
  },
  { 
    level: 14, 
    title: "Digital Deity", 
    xpRequired: 50000,
    description: "Ascended to digital godhood",
    unlocks: ["Deity status", "Reality manipulation"],
    color: "text-amber-400",
    icon: "⚡"
  },
  { 
    level: 15, 
    title: "Hoodie God", 
    xpRequired: 100000,
    description: "The ultimate hoodie achievement",
    unlocks: ["God status", "All powers unlocked"],
    color: "text-rose-400",
    icon: "🔥"
  }
];

// Helper functions for level calculations
export const getLevelByXP = (xp: number): Level => {
  let currentLevel = LEVELS[0];
  
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) {
      currentLevel = level;
    } else {
      break;
    }
  }
  
  return currentLevel;
};

export const getNextLevel = (currentLevel: Level): Level | null => {
  const nextLevelIndex = LEVELS.findIndex(level => level.level === currentLevel.level) + 1;
  return nextLevelIndex < LEVELS.length ? LEVELS[nextLevelIndex] : null;
};

export const getProgressToNextLevel = (xp: number): number => {
  const currentLevel = getLevelByXP(xp);
  const nextLevel = getNextLevel(currentLevel);
  
  if (!nextLevel) {
    return 100; // Max level reached
  }
  
  const currentXP = currentLevel.xpRequired;
  const nextXP = nextLevel.xpRequired;
  const progress = ((xp - currentXP) / (nextXP - currentXP)) * 100;
  
  return Math.min(Math.max(progress, 0), 100);
};

export const getXPForNextLevel = (xp: number): number => {
  const currentLevel = getLevelByXP(xp);
  const nextLevel = getNextLevel(currentLevel);
  
  return nextLevel ? nextLevel.xpRequired : currentLevel.xpRequired;
};

export const getXPNeededForNextLevel = (xp: number): number => {
  const nextLevelXP = getXPForNextLevel(xp);
  return Math.max(0, nextLevelXP - xp);
};

// Level-up detection
export const hasLeveledUp = (oldXP: number, newXP: number): boolean => {
  const oldLevel = getLevelByXP(oldXP);
  const newLevel = getLevelByXP(newXP);
  
  return newLevel.level > oldLevel.level;
};

// Squad level calculations
export const getAverageSquadLevel = (squadMembers: { xp: number }[]): number => {
  if (squadMembers.length === 0) return 0;
  
  const totalLevel = squadMembers.reduce((sum, member) => {
    return sum + getLevelByXP(member.xp).level;
  }, 0);
  
  return Math.round(totalLevel / squadMembers.length);
};

// Level rewards and unlocks
export const getUnlocksForLevel = (level: number): string[] => {
  const levelData = LEVELS.find(l => l.level === level);
  return levelData?.unlocks || [];
};

export const getTotalUnlocks = (level: number): string[] => {
  const unlocks: string[] = [];
  
  for (let i = 1; i <= level; i++) {
    const levelUnlocks = getUnlocksForLevel(i);
    unlocks.push(...levelUnlocks);
  }
  
  return unlocks;
}; 