# 🚀 XP System Quick Reference Guide

## 🎯 Quick Start

### For Frontend Developers

```typescript
// Import the service
import { xpService } from '@/services/xp-service';

// Get user XP data
const xpData = await xpService.getUserXP(walletAddress);
console.log(xpData.totalXP); // 2500
console.log(xpData.level); // 3

// Award course XP
await xpService.awardCourseXP(
  walletAddress,
  'nft-mastery',
  'NFT Mastery',
  100 // optional custom XP
);

// Use the hook in React components
import { useUserXP } from '@/hooks/useUserXP';

function MyComponent() {
  const { totalXP, level, loading, refresh } = useUserXP(walletAddress);
  
  return (
    <div>
      <h1>Level {level}</h1>
      <p>Total XP: {totalXP}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### For Backend/API Integration

```typescript
// Award XP via API
const response = await fetch('/api/xp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetWallet: 'ABC123...',
    xpAmount: 100,
    source: 'course',
    reason: 'Completed NFT Mastery'
  })
});

const result = await response.json();
```

## 📚 Common Use Cases

### 1. Display User's Current XP

```typescript
const { totalXP, level, xpToNextLevel, progressToNextLevel } = useUserXP(walletAddress);

return (
  <div>
    <div className="text-2xl font-bold">Level {level}</div>
    <div className="text-lg">{totalXP.toLocaleString()} XP</div>
    <progress value={progressToNextLevel} max={100} />
    <div className="text-sm">{xpToNextLevel} XP to next level</div>
  </div>
);
```

### 2. Award XP When User Completes a Course

```typescript
import { xpService } from '@/services/xp-service';

async function handleCourseCompletion() {
  try {
    const result = await xpService.awardCourseXP(
      walletAddress,
      'nft-mastery',
      'NFT Mastery',
      150 // custom XP amount
    );
    
    if (result.success) {
      alert(`Course completed! +${result.xpAwarded} XP earned!`);
      if (result.levelUp) {
        alert(`🎉 Level up! You are now level ${result.newLevel}!`);
      }
    }
  } catch (error) {
    console.error('Failed to award XP:', error);
  }
}
```

### 3. Daily Login Bonus

```typescript
import { xpService } from '@/services/xp-service';

async function claimDailyBonus() {
  try {
    // Check status first
    const status = await xpService.checkDailyLoginStatus(walletAddress);
    
    if (status.alreadyClaimed) {
      alert('Daily bonus already claimed today!');
      return;
    }
    
    // Claim bonus
    const result = await xpService.claimDailyLoginBonus(walletAddress);
    
    if (result.success) {
      alert(`Daily bonus claimed! +${result.xpAwarded} XP`);
    }
  } catch (error) {
    console.error('Failed to claim daily bonus:', error);
  }
}
```

### 4. Admin Award XP

```typescript
import { xpService } from '@/services/xp-service';

async function awardXPToUser(targetWallet: string) {
  try {
    const result = await xpService.awardXP({
      targetWallet,
      xpAmount: 500,
      source: 'admin',
      reason: 'Outstanding contribution to community',
      awardedBy: adminWalletAddress
    });
    
    if (result.success) {
      alert(`Successfully awarded ${result.xpAwarded} XP to user!`);
    }
  } catch (error) {
    console.error('Failed to award XP:', error);
  }
}
```

### 5. Show XP Breakdown

```typescript
const { breakdown } = useUserXP(walletAddress);

return (
  <div>
    <h3>XP Breakdown</h3>
    <ul>
      <li>Course XP: {breakdown?.courseXP || 0}</li>
      <li>Bounty XP: {breakdown?.bountyXP || 0}</li>
      <li>Daily Login XP: {breakdown?.dailyLoginXP || 0}</li>
      <li>Admin Award XP: {breakdown?.adminAwardXP || 0}</li>
    </ul>
  </div>
);
```

### 6. Display Badges

```typescript
const { badges } = useUserXP(walletAddress);

return (
  <div className="grid grid-cols-3 gap-4">
    {badges.map(badge => (
      <div 
        key={badge.id}
        className={badge.unlocked ? 'opacity-100' : 'opacity-30'}
      >
        <div className="text-4xl">{badge.icon}</div>
        <div className="font-bold">{badge.name}</div>
        <div className="text-sm">{badge.description}</div>
      </div>
    ))}
  </div>
);
```

### 7. Force Refresh XP Data

```typescript
import { xpService } from '@/services/xp-service';

function handleForceRefresh() {
  // This will refresh all components that use useUserXP
  xpService.forceRefresh();
}
```

### 8. Listen for XP Updates

```typescript
useEffect(() => {
  const handleXPUpdate = (event: CustomEvent) => {
    const { targetWallet, xpAwarded, newTotalXP, levelUp } = event.detail;
    
    if (targetWallet === walletAddress) {
      // Show notification
      toast.success(`+${xpAwarded} XP earned!`);
      
      if (levelUp) {
        toast.success('🎉 Level up!');
      }
    }
  };
  
  window.addEventListener('xpAwarded', handleXPUpdate as EventListener);
  
  return () => {
    window.removeEventListener('xpAwarded', handleXPUpdate as EventListener);
  };
}, [walletAddress]);
```

## 🎨 UI Components Examples

### XP Progress Bar

```typescript
function XPProgressBar({ walletAddress }: { walletAddress: string }) {
  const { level, xpInCurrentLevel, xpToNextLevel, progressToNextLevel } = useUserXP(walletAddress);
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-semibold">Level {level}</span>
        <span className="text-sm text-gray-500">
          {xpInCurrentLevel} / 1000 XP
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progressToNextLevel}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {xpToNextLevel} XP to next level
      </div>
    </div>
  );
}
```

### XP Stats Card

```typescript
function XPStatsCard({ walletAddress }: { walletAddress: string }) {
  const { totalXP, level, breakdown, loading } = useUserXP(walletAddress);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Level {level}</h2>
      <div className="text-4xl font-bold text-blue-600 mb-6">
        {totalXP.toLocaleString()} XP
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold">XP Breakdown</h3>
        <div className="flex justify-between">
          <span>📚 Courses:</span>
          <span>{breakdown?.courseXP || 0} XP</span>
        </div>
        <div className="flex justify-between">
          <span>🎯 Bounties:</span>
          <span>{breakdown?.bountyXP || 0} XP</span>
        </div>
        <div className="flex justify-between">
          <span>📅 Daily Login:</span>
          <span>{breakdown?.dailyLoginXP || 0} XP</span>
        </div>
      </div>
    </div>
  );
}
```

### Level Badge

```typescript
function LevelBadge({ level }: { level: number }) {
  const getBadgeColor = (level: number) => {
    if (level >= 10) return 'bg-purple-600';
    if (level >= 5) return 'bg-blue-600';
    return 'bg-green-600';
  };
  
  return (
    <div className={`${getBadgeColor(level)} text-white px-4 py-2 rounded-full font-bold`}>
      Level {level}
    </div>
  );
}
```

## 🔧 Utility Functions

### Calculate Level from XP

```typescript
import { xpService } from '@/services/xp-service';

const level = xpService.calculateLevel(2500); // Returns 3
```

### Calculate XP to Next Level

```typescript
const xpNeeded = xpService.calculateXPToNextLevel(2500); // Returns 500
```

### Calculate Progress Percentage

```typescript
const progress = xpService.calculateProgressToNextLevel(2500); // Returns 50
```

## 🎯 XP Amounts Reference

| Action | XP Amount | Frequency |
|--------|-----------|-----------|
| Course Completion | 50-150 | Once per course |
| Daily Login | 5 | Once per day |
| Bounty (Small) | 50-100 | Per bounty |
| Bounty (Medium) | 100-200 | Per bounty |
| Bounty (Large) | 200-500 | Per bounty |
| Admin Award | Custom | As needed |
| Special Event | Varies | Event-specific |

## 🐛 Common Issues & Solutions

### Issue: XP not updating in real-time

**Solution:**
```typescript
// Force refresh
import { xpService } from '@/services/xp-service';
xpService.forceRefresh();

// Or use the hook's refresh
const { refresh } = useUserXP(walletAddress);
refresh();
```

### Issue: Daily login bonus already claimed

**Solution:**
```typescript
// Check status before claiming
const status = await xpService.checkDailyLoginStatus(walletAddress);
if (status.alreadyClaimed) {
  console.log('Already claimed today');
  console.log('Next available:', status.nextAvailable);
}
```

### Issue: Course XP not awarded

**Solution:**
```typescript
// The API prevents duplicate completions
// Check if course already completed
const xpData = await xpService.getUserXP(walletAddress, { includeCourses: true });
const alreadyCompleted = xpData.courseCompletions?.some(c => c.course_id === 'nft-mastery');

if (alreadyCompleted) {
  console.log('Course already completed');
}
```

## 📊 Dashboard Integration Example

```typescript
function UserDashboard({ walletAddress }: { walletAddress: string }) {
  const { 
    totalXP, 
    level, 
    xpToNextLevel, 
    progressToNextLevel,
    completedCourses,
    badges,
    loading,
    error,
    refresh
  } = useUserXP(walletAddress);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Level {level}</h1>
          <p className="text-xl">{totalXP.toLocaleString()} XP</p>
        </div>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Refresh
        </button>
      </div>
      
      {/* Progress Bar */}
      <div>
        <progress value={progressToNextLevel} max={100} className="w-full" />
        <p className="text-sm text-gray-500">{xpToNextLevel} XP to level {level + 1}</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-2xl font-bold">{completedCourses.length}</div>
          <div className="text-sm text-gray-500">Courses</div>
        </div>
        {/* More stats... */}
      </div>
      
      {/* Badges */}
      <div>
        <h2 className="text-xl font-bold mb-4">Achievements</h2>
        <div className="grid grid-cols-4 gap-4">
          {badges.map(badge => (
            <div 
              key={badge.id}
              className={`p-4 rounded ${badge.unlocked ? 'bg-yellow-100' : 'bg-gray-100'}`}
            >
              <div className="text-3xl mb-2">{badge.icon}</div>
              <div className="font-bold">{badge.name}</div>
              <div className="text-xs">{badge.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 🎓 Level System

```
Level 1:  0 - 999 XP
Level 2:  1000 - 1999 XP
Level 3:  2000 - 2999 XP
Level 4:  3000 - 3999 XP
Level 5:  4000 - 4999 XP
...and so on (1000 XP per level)
```

## 🏆 Badge Unlock Requirements

```typescript
const BADGE_REQUIREMENTS = {
  'first-steps': { courses: 1 },
  'dedicated-learner': { courses: 5 },
  'xp-collector': { xp: 1000 },
  'course-master': { courses: 10 },
  'elite-hoodie': { xp: 5000 },
  'streak-master': { streak: 7 }
};
```

---

**Need more help?** Check the full documentation: `XP_SYSTEM_COMPLETE_DOCUMENTATION.md`

