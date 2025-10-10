# 📊 localStorage Audit - What Should Be Global

## 🔍 Analysis of Current localStorage Usage

After auditing the codebase, here's what's currently stored locally that would benefit from global database storage:

---

## 🎯 HIGH PRIORITY - Should Be Global

### **1. Course Progress & Lesson Status** 🎓
**Current:** Stored in localStorage per course
**Impact:** HIGH - Users lose progress on device switch

**Examples Found:**
```typescript
// lore-narrative-crafting/page.tsx
localStorage.setItem('loreNarrativeProgress', JSON.stringify(lessonStatus));

// meme-coin-mania/page.tsx
localStorage.setItem('memeCoinManiaProgress', JSON.stringify(lessonStatus));

// nft-mastery/page.tsx
localStorage.setItem('nftMasteryProgress', JSON.stringify(lessonStatus));

// technical-analysis/page.tsx
localStorage.setItem('technicalAnalysisProgress', JSON.stringify(lessonStatus));

// ai-automation-curriculum/page.tsx
localStorage.setItem('aiAutomationProgress', JSON.stringify(lessonStatus));

// wallet-wizardry tiers (1-4)
localStorage.setItem('walletWizardryTier1Progress', JSON.stringify(progress));
```

**Files Affected:** ~15+ course pages

**Why Global:**
- ✅ Users switch devices frequently
- ✅ Course progress is critical data
- ✅ Affects completion tracking
- ✅ Affects XP awards
- ✅ Affects leaderboard ranking

**Recommendation:** **MIGRATE TO DATABASE**

---

### **2. Onboarding & Placement Status** 🎯
**Current:** Boolean flags in localStorage
**Impact:** MEDIUM-HIGH - Users may repeat onboarding

**Examples Found:**
```typescript
// placement/squad-test/page.tsx
localStorage.setItem('placementTestCompleted', 'true');

// onboarding/page.tsx
localStorage.setItem('onboardingCompleted', 'true');

// placement/squad-test/page.tsx
localStorage.setItem('suggestDisplayName', 'true');
```

**Why Global:**
- ✅ Prevents duplicate onboarding
- ✅ Tracks user journey
- ✅ Important for UX flow
- ✅ Should persist across devices

**Recommendation:** **MIGRATE TO DATABASE**
Add columns to users table:
- `onboarding_completed`
- `placement_test_completed`

---

### **3. User Display Name** 👤
**Current:** Partially migrated (API exists, but still uses localStorage)
**Impact:** MEDIUM - Already has API but not fully migrated

**Examples Found:**
```typescript
// profile/ProfileView.tsx
localStorage.setItem('userDisplayName', displayName.trim());
localStorage.getItem('userDisplayName');

// onboarding/page.tsx
localStorage.setItem('userDisplayName', displayName.trim());
```

**Status:** ⚠️ **PARTIALLY MIGRATED**
- ✅ API endpoint exists
- ✅ Saves to database
- ❌ Still reads from localStorage first
- ❌ Not fully API-first

**Recommendation:** **COMPLETE MIGRATION**
Update to fetch from API first, cache in localStorage

---

## 📊 MEDIUM PRIORITY - Would Benefit from Global

### **4. Wallet Address Storage** 💰
**Current:** Stored in multiple localStorage keys
**Impact:** MEDIUM - Redundant, confusing

**Examples Found:**
```typescript
localStorage.setItem('walletAddress', address);
localStorage.setItem('connectedWallet', address);
localStorage.setItem('hoodie_academy_wallet', wallet);
```

**Issues:**
- ❌ Multiple keys for same data
- ❌ No single source of truth
- ❌ Can get out of sync
- ⚠️ Should use session/auth system

**Recommendation:** **STANDARDIZE**
- Use wallet hook as source of truth
- Single localStorage key as cache
- Consider JWT/session tokens instead

---

### **5. XP Refresh Flags** ⚡
**Current:** localStorage flags for XP updates
**Impact:** LOW-MEDIUM - Cosmetic, affects real-time updates

**Examples Found:**
```typescript
// utils/forceRefresh.ts
localStorage.setItem('xpRefreshRequired', Date.now().toString());
```

**Why Global:**
- ⚠️ Used for cross-tab communication
- ⚠️ Not critical for persistence
- ✅ Works fine as local flag

**Recommendation:** **KEEP LOCAL**
This is appropriate for localStorage (ephemeral state)

---

## 📝 LOW PRIORITY - OK to Stay Local

### **6. Admin Status Flags** 🛡️
**Current:** localStorage for admin bypass
**Impact:** LOW - Development/testing only

**Examples Found:**
```typescript
localStorage.setItem('hoodie_academy_is_admin', 'true');
```

**Recommendation:** **KEEP LOCAL**
This is for development/testing, appropriate for localStorage

---

### **7. UI State & Preferences** 🎨
**Current:** Various UI states
**Impact:** LOW - Cosmetic preferences

**Examples:**
- Sidebar collapsed state
- Theme preferences
- View modes
- Filters

**Recommendation:** **KEEP LOCAL**
UI preferences are fine in localStorage

---

## 🚀 MIGRATION PRIORITY PLAN

### **Phase 1: Course Progress (HIGH PRIORITY)** 📚

**What to Migrate:**
- All course lesson progress
- Course completion status
- Quiz results
- Lesson unlocks

**Database Schema:**
```sql
CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  lesson_index INTEGER NOT NULL,
  lesson_status TEXT CHECK (lesson_status IN ('locked', 'unlocked', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  quiz_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, course_slug, lesson_index)
);

CREATE INDEX idx_course_progress_wallet ON course_progress(wallet_address);
CREATE INDEX idx_course_progress_course ON course_progress(course_slug);
```

**API Endpoints Needed:**
- `GET /api/course-progress?wallet=xxx&course=xxx`
- `POST /api/course-progress` (update lesson status)
- `GET /api/course-progress/summary?wallet=xxx` (all courses)

**Affected Files:** ~15 course pages

---

### **Phase 2: User Profile Data (MEDIUM PRIORITY)** 👤

**What to Complete:**
- Full migration of display name to API-first
- Onboarding status
- Placement test status
- User preferences

**Database Columns to Add:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  onboarding_completed BOOLEAN DEFAULT FALSE,
  placement_test_completed BOOLEAN DEFAULT FALSE,
  profile_completed BOOLEAN DEFAULT FALSE;
```

**Affected Files:** 
- `src/components/profile/ProfileView.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/placement/squad-test/page.tsx`

---

### **Phase 3: Wallet Management (LOW PRIORITY)** 💰

**What to Standardize:**
- Single wallet storage key
- Consistent wallet hooks
- Possibly move to JWT tokens

**Recommendation:**
- Keep using wallet hooks
- Standardize localStorage key
- Consider session-based auth

---

## 📋 Detailed Migration Breakdown

### **Course Progress Migration**

**Current State:**
```typescript
// Each course does this:
const [lessonStatus, setLessonStatus] = useState<Array<'locked' | 'unlocked' | 'completed'>>([]);

useEffect(() => {
  const saved = localStorage.getItem('courseNameProgress');
  if (saved) setLessonStatus(JSON.parse(saved));
}, []);

const saveProgress = (status) => {
  localStorage.setItem('courseNameProgress', JSON.stringify(status));
};
```

**Problems:**
- ❌ Data lost on new device
- ❌ Can't track globally
- ❌ No analytics possible
- ❌ Affects XP/completion tracking

**Proposed Solution:**
```typescript
// New API-first approach:
const [lessonStatus, setLessonStatus] = useState<LessonProgress[]>([]);

useEffect(() => {
  // Show cached immediately
  const cached = getCachedCourseProgress(courseSlug);
  if (cached) setLessonStatus(cached);
  
  // Fetch from API
  const progress = await fetchCourseProgress(walletAddress, courseSlug);
  setLessonStatus(progress);
}, [walletAddress, courseSlug]);

const saveProgress = async (lessonIndex, status) => {
  await updateCourseProgress(walletAddress, courseSlug, lessonIndex, status);
  // Auto-caches in API utility
};
```

---

## 🎯 Benefits of Global Migration

### **Course Progress to Database:**

**User Benefits:**
- ✅ Progress syncs across devices
- ✅ Never lose progress
- ✅ Switch between desktop/mobile seamlessly
- ✅ Data survives cache clears

**Platform Benefits:**
- ✅ Track actual course completion
- ✅ Analytics on lesson difficulty
- ✅ See where users drop off
- ✅ Award XP accurately
- ✅ Validate completions

**Analytics Possible:**
- 📊 Course completion rates
- 📊 Average time per lesson
- 📊 Popular courses
- 📊 Difficult lessons (low completion)
- 📊 User learning paths

---

## 🔧 Recommended Implementation

### **Step 1: Database Schema**
```sql
-- Course progress table
CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  lesson_data JSONB NOT NULL,
  completion_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, course_slug)
);

-- User status flags
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  placement_test_completed BOOLEAN DEFAULT FALSE,
  placement_test_completed_at TIMESTAMP WITH TIME ZONE;
```

### **Step 2: API Utilities**
```typescript
// src/utils/course-progress-api.ts
export async function fetchCourseProgress(wallet, courseSlug);
export async function updateLessonProgress(wallet, courseSlug, lessonIndex, status);
export async function getCompletionPercentage(wallet, courseSlug);
export async function markCourseComplete(wallet, courseSlug);
```

### **Step 3: Component Updates**
- Update course pages to use API
- Keep localStorage as cache (5min validity)
- Show cached data immediately, fetch in background

---

## 📊 Migration Priority Summary

| Data Type | Priority | Impact | Effort | Recommendation |
|-----------|----------|--------|--------|----------------|
| **Course Progress** | 🔴 HIGH | Very High | Medium | **Migrate Now** |
| **Onboarding Status** | 🟡 MEDIUM | Medium | Low | **Migrate Soon** |
| **Display Name** | 🟡 MEDIUM | Low | Low | **Complete Migration** |
| **Wallet Address** | 🟢 LOW | Low | Low | **Standardize** |
| **XP Refresh Flags** | 🟢 LOW | Low | - | **Keep Local** |
| **Admin Flags** | 🟢 LOW | Low | - | **Keep Local** |
| **UI Preferences** | 🟢 LOW | Low | - | **Keep Local** |

---

## 🎯 Recommended Action Plan

### **Immediate (This Session):**
1. ✅ Squad system (DONE)
2. 🔴 Course progress system (NEXT)
3. 🟡 Onboarding flags

### **Next Session:**
1. Complete display name migration
2. Standardize wallet storage
3. Add progress analytics

### **Future:**
1. Real-time sync
2. Offline queue
3. Progress export/import

---

## 💡 Quick Win: Course Progress

**I can implement this now if you want!** It would give users:
- ✅ Cross-device course progress
- ✅ Never lose progress
- ✅ Better tracking and analytics
- ✅ Accurate completion rates

**Estimated Files to Update:** ~15 course pages
**Estimated Time:** 30-45 minutes
**Impact:** Very High for user experience

**Should I proceed with migrating course progress to the database?**

