# 🚀 Welcome Tutorial - Quick Start

## What You Get

A **beautiful 6-step tutorial** that appears when users connect their wallet for the first time! 🎓

---

## ✅ It's Already Working!

The tutorial is **fully integrated** and ready to use. No setup needed!

### How to Test It

1. **Open DevTools** (Press `F12`)
2. **Go to Console**
3. **Run this command**:
   ```javascript
   localStorage.removeItem('hoodie_academy_onboarding_seen')
   ```
4. **Refresh the page** (`Ctrl + Shift + R`)
5. **Connect your wallet**
6. **🎉 Tutorial appears!**

---

## 📋 Tutorial Steps

Users will see:

1. 🎓 **Welcome** - Academy overview
2. 📚 **Courses** - Browse learning tracks
3. 🎥 **Mentorship** - Join live sessions  
4. 💰 **Bounties** - Earn rewards
5. 🏆 **Leaderboard** - Compete and win
6. 🤝 **Community** - Connect with others

Each step has:
- ✨ Smooth animations
- 🎯 Action buttons
- ⏭️ Easy navigation
- ❌ Skip option

---

## 🔄 Reset Tutorial

### Method 1: Use the Tool
1. Open `reset-tutorial.html` in your browser
2. Click "Reset Tutorial"
3. Done! ✅

### Method 2: Browser Console
```javascript
localStorage.removeItem('hoodie_academy_onboarding_seen')
```

### Method 3: Programmatically
```typescript
import { resetOnboarding } from '@/utils/onboarding';
resetOnboarding(); // Call this function
```

---

## 🎯 When Does It Show?

- ✅ **First time** connecting wallet → Tutorial shows
- ✅ **After reset** → Tutorial shows  
- ❌ **Returning users** → Skip to dashboard
- ❌ **Already seen** → Never shows again

---

## 🎨 What Users See

```
┌─────────────────────────────────┐
│  🎓 Welcome to Hoodie Academy!  │
│                                 │
│  Your journey into Web3         │
│  mastery starts here...         │
│                                 │
│  [Browse Features →]            │
│                                 │
│  ← Previous  ●●○○○○  Next →    │
└─────────────────────────────────┘
```

- **Beautiful gradients**
- **Smooth animations**
- **Mobile responsive**
- **Dark theme**

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/components/onboarding/WelcomeTutorial.tsx` | Main component |
| `src/utils/onboarding.ts` | Helper functions |
| `src/components/TokenGate.tsx` | Integration point |
| `reset-tutorial.html` | Reset tool |

---

## 🧪 Testing Checklist

- [ ] Reset tutorial using console
- [ ] Disconnect wallet
- [ ] Reconnect wallet
- [ ] Tutorial appears with animations
- [ ] Can navigate between steps
- [ ] Can click dot indicators
- [ ] Can skip tutorial
- [ ] Action buttons work and redirect
- [ ] Tutorial doesn't show again after completion
- [ ] Mobile responsive

---

## ⚙️ Customization

### Change the features shown:

Edit `src/components/onboarding/WelcomeTutorial.tsx`:

```typescript
const features = [
  {
    id: 'your-feature',
    icon: '🚀',
    title: 'Your Feature',
    description: 'Description here',
    badge: 'New',
    badgeColor: 'bg-gradient-to-r from-pink-600 to-purple-600',
    action: {
      label: 'Try It',
      route: '/your-route'
    }
  }
  // Add more steps...
];
```

### Trigger manually:

```typescript
import { resetOnboarding } from '@/utils/onboarding';

// Reset and reload
resetOnboarding();
window.location.reload();
```

---

## 🎯 User Experience

### First-Time User
```
1. Lands on site
2. Clicks "Connect Wallet"
3. Approves in Phantom
4. 🎓 Tutorial slides in
5. Learns about features
6. Clicks action buttons
7. Starts exploring!
```

### Returning User
```
1. Lands on site
2. Clicks "Connect Wallet"
3. Approves in Phantom
4. ✅ Goes straight to dashboard
   (No tutorial interruption!)
```

---

## 💡 Pro Tips

1. **Test as new user**: Always reset before testing
2. **Watch animations**: They make it feel premium
3. **Try on mobile**: It's fully responsive
4. **Click everything**: All buttons work
5. **Skip is OK**: Users can always come back

---

## 🚨 Quick Fixes

### Tutorial not showing?
```javascript
// Check status
console.log(localStorage.getItem('hoodie_academy_onboarding_seen'))

// Reset it
localStorage.removeItem('hoodie_academy_onboarding_seen')
```

### Styling broken?
- Clear browser cache
- Check Tailwind CSS is loaded
- Verify UI components exist

### Tutorial shows every time?
- Check if localStorage is being cleared
- Verify the storage key is correct

---

## ✅ Done!

Your welcome tutorial is **live and ready**! 

New users will automatically see it when they connect their wallet for the first time. 🎉

**Want to see it?** Just run:
```javascript
localStorage.removeItem('hoodie_academy_onboarding_seen')
```

Then refresh and reconnect! 🚀

