# 🎯 Hoodie Academy Bounty XP System

## Overview

The Hoodie Academy Bounty XP System rewards users for participating in bounty competitions with XP points and SOL prizes. This system encourages community engagement, skill development, and competitive participation.

## 🧠 XP for Participation

### Submission Rewards
- **+10 XP** for your first bounty submission
- **+10 XP** per additional submission (up to 3 total per bounty)
- **Max: +30 XP** per bounty (not including winner bonus)

> "Even if you don't win, you still level up. Submitting builds your rep."

### Submission Limits
- Maximum **3 submissions** per bounty per user
- XP is awarded immediately upon submission
- No XP for submissions beyond the 3-submission limit

## 🏆 XP + SOL for Winners

### Winner Bonuses
| Placement | XP Bonus | SOL Prize |
|-----------|----------|-----------|
| 🥇 1st Place | +250 XP | 0.05 SOL |
| 🥈 2nd Place | +100 XP | 0.03 SOL |
| 🥉 3rd Place | +50 XP | 0.02 SOL |

> "Your squad needs top reps. Earn SOL and climb the leaderboard."

### Winner Selection
- Winners are selected by admins based on submission quality
- XP and SOL prizes are awarded via admin panel
- Winners receive both participation XP and bonus XP

## 📐 XP Rules Summary

- **Max XP from participation**: 30 XP per bounty
- **XP bonuses for top 3** are stacked on top of participation XP
- **XP counts toward Squad Totals** and future Level Unlocks
- **SOL prizes** are tracked separately from XP

## 🔧 Backend Implementation

### Database Schema

#### Bounty Submissions Table
```sql
CREATE TABLE bounty_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  bounty_id TEXT NOT NULL,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  xp_awarded INTEGER DEFAULT 0,
  placement TEXT CHECK (placement IN ('first', 'second', 'third')),
  sol_prize DECIMAL(10, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, bounty_id, submission_id)
);
```

#### User XP Table
```sql
CREATE TABLE user_xp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  total_xp INTEGER DEFAULT 0,
  bounty_xp INTEGER DEFAULT 0,
  course_xp INTEGER DEFAULT 0,
  streak_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### XP Transactions Table
```sql
CREATE TABLE xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('bounty_submission', 'bounty_winner', 'course_completion', 'streak_bonus')),
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Functions

#### Award Bounty XP
```sql
CREATE OR REPLACE FUNCTION award_bounty_xp(
  p_wallet_address TEXT,
  p_bounty_id TEXT,
  p_submission_id TEXT,
  p_xp_amount INTEGER DEFAULT 10
)
RETURNS INTEGER AS $$
-- Awards XP for bounty submission and updates user totals
```

#### Award Winner Bonus
```sql
CREATE OR REPLACE FUNCTION award_winner_bonus(
  p_wallet_address TEXT,
  p_bounty_id TEXT,
  p_submission_id TEXT,
  p_placement TEXT,
  p_xp_bonus INTEGER,
  p_sol_prize DECIMAL(10, 8)
)
RETURNS INTEGER AS $$
-- Awards winner bonus XP and SOL prizes
```

## 🚀 API Endpoints

### Submit Bounty Entry
```
POST /api/submissions
```
- Validates submission limits (max 3 per bounty)
- Awards 10 XP immediately upon submission
- Returns submission data with XP awarded

### Award Winner
```
POST /api/submissions/award-winner
```
- Admin-only endpoint for awarding winners
- Awards XP bonus and SOL prize
- Updates placement and transaction history

### Get User XP
```
GET /api/user-xp?wallet={walletAddress}
```
- Returns user's XP breakdown
- Shows bounty submissions and transaction history
- Calculates participation vs winner XP

## 🎨 Frontend Components

### BountySubmissionForm
- Enhanced with XP system information
- Shows XP rules and winner bonuses
- Validates submission limits
- Displays XP awarded after submission

### BountyXPDisplay
- Shows user's bounty XP breakdown
- Displays recent submissions and awards
- Shows participation vs winner XP
- Tracks SOL prizes won

### WinnerAwardPanel
- Admin component for awarding winners
- Shows winner bonus breakdown
- Lists top submissions by upvotes
- Handles winner selection and award process

## 🔮 Future Expansion Ideas

### XP Milestones
- **100 XP**: Unlock "Bounty Hunter" badge
- **250 XP**: Unlock "Submission Master" badge  
- **500 XP**: Unlock "Winner's Circle" badge
- **1000 XP**: Unlock "Elite Bounty Hunter" badge

### Squad XP Dashboard
- Squad-wide XP leaderboards
- Squad vs Squad competitions
- Squad XP milestones and rewards

### XP Shop
- Redeem XP for Hoodie upgrades
- Purchase exclusive lore drops
- Buy special profile flair
- Unlock premium features

### Advanced Features
- **XP Multipliers**: Special events with 2x XP
- **Streak Bonuses**: Consecutive submission bonuses
- **Quality Bonuses**: Extra XP for high-quality submissions
- **Community Bonuses**: XP for helping other users

## 📊 Usage Examples

### Submitting to a Bounty
1. User connects wallet
2. Fills out submission form
3. System validates submission limit
4. Awards 10 XP immediately
5. Shows XP awarded confirmation

### Awarding Winners
1. Admin reviews submissions
2. Uses WinnerAwardPanel component
3. Selects submission and placement
4. System awards XP bonus + SOL prize
5. Updates user totals and transaction history

### Viewing XP
1. User visits profile or bounty page
2. BountyXPDisplay component loads
3. Shows total XP, bounty XP, submissions
4. Displays recent activity and stats

## 🛠️ Technical Notes

### XP Calculation Logic
```typescript
// Participation XP (max 30 per bounty)
const participationXP = Math.min(submissions.length, 3) * 10;

// Winner bonus XP
const winnerXP = placement ? winnerBonuses[placement].xp : 0;

// Total XP
const totalXP = participationXP + winnerXP;
```

### Database Triggers
- Automatic `updated_at` timestamps
- XP transaction logging
- User total XP updates

### Security Features
- Wallet-based identity verification
- Submission limit enforcement
- Admin-only winner awards
- Row-level security policies

## 🎯 Benefits

1. **Encourages Participation**: Users get XP even if they don't win
2. **Builds Reputation**: XP system creates long-term engagement
3. **Rewards Quality**: Winner bonuses incentivize high-quality submissions
4. **Squad Pride**: XP contributes to squad totals and leaderboards
5. **Future Foundation**: XP system enables future features and rewards

## 🔄 Integration Points

- **Leaderboard System**: XP contributes to user rankings
- **Squad System**: XP affects squad totals and competitions
- **Profile System**: XP displayed on user profiles
- **Badge System**: XP milestones unlock badges
- **Course System**: Bounty XP separate from course XP

This system creates a comprehensive reward structure that encourages participation, recognizes quality, and builds long-term community engagement. 