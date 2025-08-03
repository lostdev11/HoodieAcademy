# Leveling System Scaffold

A modular and scalable leveling system for the Hoodie Academy platform that converts XP to levels with custom titles, progression logic, and visual components.

## 🧠 System Overview

The leveling system provides:
- **XP thresholds** with custom level titles
- **Reusable leveling logic** with React hooks
- **Visual progress bars** and level badges
- **Level-up animations** and unlock tracking
- **Squad level calculations** for group progression

## 📦 Core Components

### 1. Level Configuration (`src/lib/levels.ts`)
```typescript
export type Level = {
  level: number;
  title: string;
  xpRequired: number;
  description?: string;
  unlocks?: string[];
  color?: string;
  icon?: string;
};
```

### 2. React Hook (`src/hooks/useLevel.ts`)
```typescript
export const useLevel = (xp: number): LevelData => {
  // Returns level, title, progress, unlocks, etc.
};
```

### 3. UI Component (`src/components/leveling/LevelBadge.tsx`)
```typescript
<LevelBadge xp={850} variant="premium" showUnlocks={true} />
```

## 🎯 Level Progression

### Level Thresholds
| Level | Title | XP Required | Description |
|-------|-------|-------------|-------------|
| 1 | New Recruit | 0 | Welcome to the academy |
| 2 | Apprentice Hoodie | 100 | Learning the ropes |
| 3 | Squad Contributor | 250 | Making your mark |
| 4 | Lore Builder | 500 | Crafting the narrative |
| 5 | Vault Access | 1000 | Unlocking hidden knowledge |
| 6 | DAO Ready | 1750 | Prepared for governance |
| 7 | Squad Leader | 2500 | Leading your squad |
| 8 | Council Member | 3500 | Part of the inner circle |
| 9 | Shadow Hoodie | 5000 | Operating in the shadows |
| 10 | Legend | 7777 | A true legend of the academy |

### Extended Levels (11-15)
- **Mythic Hoodie** (10,000 XP)
- **Eternal Guardian** (15,000 XP)
- **Cosmic Wanderer** (25,000 XP)
- **Digital Deity** (50,000 XP)
- **Hoodie God** (100,000 XP)

## 🪝 Available Hooks

### useLevel
Main hook for level calculations:
```typescript
const levelData = useLevel(850);
// Returns: level, title, progress, unlocks, etc.
```

### useLevelUp
Detects level-up events:
```typescript
const hasLeveledUp = useLevelUp(oldXP, newXP);
```

### useSquadLevel
Calculates squad statistics:
```typescript
const squadStats = useSquadLevel(squadMembers);
// Returns: averageLevel, highestLevel, lowestLevel, totalXP
```

### useLevelRewards
Tracks level unlocks and rewards:
```typescript
const rewards = useLevelRewards(level);
// Returns: currentUnlocks, totalUnlocks, nextUnlocks
```

### useXPMilestones
Tracks progress to next milestones:
```typescript
const milestones = useXPMilestones(xp);
// Returns: nextMilestone, milestones, progressToMilestone
```

## 💻 Usage Examples

### Basic Level Badge
```tsx
<LevelBadge xp={850} />
```

### Premium Variant with Unlocks
```tsx
<LevelBadge 
  xp={850} 
  variant="premium"
  showUnlocks={true}
/>
```

### Compact Sidebar Version
```tsx
<LevelBadge 
  xp={850} 
  variant="compact"
  showDetails={false}
/>
```

### Level-Up Animation
```tsx
<LevelUpAnimation 
  isVisible={showLevelUp}
  newLevel={levelData.level}
  newTitle={levelData.title}
/>
```

## 🔧 Helper Functions

### Level Calculations
```typescript
import { 
  getLevelByXP, 
  getNextLevel, 
  getProgressToNextLevel,
  getXPForNextLevel,
  getXPNeededForNextLevel,
  hasLeveledUp
} from '@/lib/levels';

const currentLevel = getLevelByXP(850);
const progress = getProgressToNextLevel(850);
const xpNeeded = getXPNeededForNextLevel(850);
```

### Squad Calculations
```typescript
import { getAverageSquadLevel } from '@/lib/levels';

const avgLevel = getAverageSquadLevel(squadMembers);
```

### Unlock Tracking
```typescript
import { getUnlocksForLevel, getTotalUnlocks } from '@/lib/levels';

const currentUnlocks = getUnlocksForLevel(5);
const allUnlocks = getTotalUnlocks(5);
```

## 🎨 UI Variants

### Default Variant
- Full level information
- Progress bar
- Level description
- Optional unlocks display

### Compact Variant
- Minimal information
- Icon and level only
- XP display
- Perfect for sidebars

### Premium Variant
- Gradient background
- Enhanced styling
- Crown icon for max level
- Detailed unlock display

## 🔮 Optional Add-ons

### Level-Up Animation
- Flash "LEVEL UP!" when user passes threshold
- Animated celebration screen
- Auto-dismiss after 3 seconds

### Unlock Tracker
- Show what each level unlocks
- Merch tie-ins
- Special page access
- Squad permissions

### Reward Triggers
- POAP minting at milestone levels
- Token rewards
- NFT badges
- Physical merch unlocks

### Squad Average Level
- Show average level per squad
- Squad leaderboards
- Level-based squad rankings
- Squad progression tracking

## 📊 Integration Points

### With Global XP Tracker
```tsx
import { GlobalXPTracker } from '@/components/xp';
import { useLevel } from '@/hooks/useLevel';

const levelData = useLevel(userXP);

<GlobalXPTracker 
  userXP={userXP}
  level={levelData.level}
  nextUnlock={levelData.nextXP}
/>
```

### With Squad XP Pool
```tsx
import { SquadXPPool } from '@/components/xp';
import { useSquadLevel } from '@/hooks/useLevel';

const squadStats = useSquadLevel(squadMembers);

<SquadXPPool 
  squads={squads}
  showLevelInfo={true}
/>
```

## 🚀 Future Enhancements

### Analytics Integration
- Level progression tracking
- Time-to-level metrics
- Squad level distribution
- Unlock completion rates

### Social Features
- Level-up announcements
- Squad level celebrations
- Achievement sharing
- Level-based challenges

### Gamification
- Level-based quests
- XP multipliers
- Streak bonuses
- Seasonal level events

## Demo

Visit `/leveling-demo` to see all components in action with interactive XP controls and level progression examples. 