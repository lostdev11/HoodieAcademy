# XP Tracker System

A comprehensive XP tracking and squad rivalry system for the Hoodie Academy platform, designed to give users a sense of progression and encourage squad competition.

## 🧠 System Goals

- **Give users an overall sense of progression** - Visual XP tracking with levels and unlocks
- **Encourage squad rivalry** - Who's carrying their squad?
- **Open up paths for future unlockables** - Merch tie-ins, special badges, etc.

## Components

### GlobalXPTracker
Displays user's overall XP progress, level, rank, and next unlock information.

### SquadXPPool
Shows squad XP competition with rankings, progress bars, and rivalry metrics.

## GlobalXPTracker Props

```typescript
type GlobalXPTrackerProps = {
  userXP: number;              // User's total XP
  level?: number;              // Optional: override calculated level
  nextUnlock?: number;         // Optional: XP needed for next unlock
  rank?: string;               // Optional: user's global rank
  totalUsers?: number;         // Optional: total users for rank context
  className?: string;          // Optional: styling
  showDetails?: boolean;       // Optional: show detailed breakdown (default: true)
};
```

### Level Calculation
- **Formula**: `Math.floor(userXP / 1000) + 1`
- **Example**: 3,450 XP = Level 4
- **Next Level**: 4,000 XP needed for Level 5

### Features
- ✅ **Automatic level calculation**
- ✅ **Progress to next level**
- ✅ **Global rank display**
- ✅ **Next unlock tracking**
- ✅ **Compact sidebar variant**

## SquadXPPool Props

```typescript
type SquadXPData = {
  name: string;                // Squad name
  xp: number;                  // Squad total XP
  color: string;               // Progress bar color (e.g., "bg-pink-500")
  memberCount?: number;        // Optional: number of squad members
  rank?: number;               // Optional: squad rank
  icon?: string;               // Optional: squad icon/emoji
};

type SquadXPPoolProps = {
  squads: SquadXPData[];       // Array of squad data
  showDetails?: boolean;       // Optional: show detailed breakdown
  className?: string;          // Optional: styling
  title?: string;              // Optional: custom title
};
```

### Features
- ✅ **Squad rivalry visualization**
- ✅ **Real-time rankings with crowns/medals**
- ✅ **Member count display**
- ✅ **Market share percentages**
- ✅ **Compact leaderboard widget**

## Usage Examples

### Basic Global XP Tracker
```tsx
<GlobalXPTracker 
  userXP={3450}
  level={4}
  rank="127"
  totalUsers={1247}
  nextUnlock={5000}
/>
```

### Compact Sidebar Version
```tsx
<GlobalXPTracker 
  userXP={3450}
  showDetails={false}
  className="max-w-sm"
/>
```

### Squad XP Pool
```tsx
<SquadXPPool 
  squads={[
    { name: "Creators", xp: 520, color: "bg-pink-500", memberCount: 45, icon: "🎨" },
    { name: "Raiders", xp: 740, color: "bg-green-500", memberCount: 38, icon: "⚔️" },
    { name: "Decoders", xp: 890, color: "bg-yellow-500", memberCount: 41, icon: "🔍" }
  ]}
/>
```

### Compact Squad Widget
```tsx
<SquadXPPoolCompact squads={squads} />
```

## Suggested Usage Locations

| Component | Page/Placement | Features |
|-----------|----------------|----------|
| GlobalXPTracker | User Profile | Full progression details |
| GlobalXPTracker | Dashboard Sidebar | Compact overview |
| GlobalXPTracker | Stats Modal | Rank and achievements |
| SquadXPPool | /leaderboard | Squad competition |
| SquadXPPool | /squads | Detailed squad stats |
| SquadXPPoolCompact | Dashboard | Quick squad rankings |
| Both Combined | /xp route | Complete XP overview |

## XP Calculation Logic

### Global XP Tracker
- **Level Formula**: `Math.floor(userXP / 1000) + 1`
- **Progress**: Percentage to next level
- **Rank**: Global position among all users
- **Unlocks**: Custom milestone tracking

### Squad XP Pool
- **Total Pool**: Sum of all squad XP
- **Market Share**: Percentage of total XP
- **Rankings**: Real-time squad competition
- **Member Stats**: Average XP per member

## Demo

Visit `/xp-tracker-demo` to see all variants in action.

## Integration with Existing Systems

### BountyXPCard Integration
```tsx
// Combine bounty XP with global tracking
<GlobalXPTracker userXP={totalBountyXP + courseXP + streakXP} />
```

### Leaderboard Integration
```tsx
// Show squad competition in leaderboards
<SquadXPPoolCompact squads={leaderboardSquads} />
```

## Future Enhancements

### Unlock System
- **Level-based unlocks**: Special badges, profile frames
- **Squad achievements**: Squad-specific rewards
- **Merch tie-ins**: Physical rewards for milestones

### Analytics
- **XP trends**: Weekly/monthly progression
- **Squad performance**: Member contribution tracking
- **Competition metrics**: Rivalry statistics

### Social Features
- **XP sharing**: Squad member highlights
- **Achievement posts**: Automatic social sharing
- **Squad challenges**: Time-limited competitions 