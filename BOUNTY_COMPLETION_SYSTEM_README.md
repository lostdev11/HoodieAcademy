# Bounty Completion System

This system tracks when users complete bounties by having their submissions approved by admins. When a bounty submission is approved, the system automatically marks the bounty as completed for that user and awards the appropriate XP.

## 🏗️ Database Schema

### user_bounty_completions Table

```sql
CREATE TABLE user_bounty_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  bounty_id TEXT NOT NULL,
  submission_id UUID NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_awarded INTEGER DEFAULT 0,
  sol_prize DECIMAL(10, 8) DEFAULT 0,
  placement TEXT CHECK (placement IN ('first', 'second', 'third')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, bounty_id)
);
```

### Database Function

The `mark_bounty_completed` function handles:
- Checking if the bounty exists
- Preventing duplicate completions
- Recording the completion
- Awarding XP to the user

```sql
CREATE OR REPLACE FUNCTION mark_bounty_completed(
  p_wallet_address TEXT,
  p_bounty_id TEXT,
  p_submission_id UUID,
  p_xp_awarded INTEGER DEFAULT 10,
  p_sol_prize DECIMAL(10, 8) DEFAULT 0,
  p_placement TEXT DEFAULT NULL
)
RETURNS BOOLEAN
```

## 🔧 API Endpoints

### 1. Admin Submission Approval
**Endpoint:** `POST /api/admin/submissions/approve`

**Updated Behavior:**
- When a bounty submission is approved, automatically marks the bounty as completed
- Fetches bounty details to determine XP reward
- Calls `mark_bounty_completed` function
- Awards XP based on bounty reward type

**Request Body:**
```json
{
  "submissionId": "uuid",
  "action": "approve",
  "walletAddress": "wallet_address"
}
```

### 2. User Bounty Completions
**Endpoint:** `GET /api/users/bounty-completions?wallet=wallet_address`

**Response:**
```json
{
  "completions": [
    {
      "id": "uuid",
      "wallet_address": "wallet_address",
      "bounty_id": "bounty_id",
      "submission_id": "submission_id",
      "completed_at": "timestamp",
      "xp_awarded": 10,
      "sol_prize": 0,
      "placement": null,
      "bounties": {
        "id": "bounty_id",
        "title": "Bounty Title",
        "short_desc": "Description",
        "reward": "10",
        "reward_type": "XP",
        "squad_tag": "squad"
      }
    }
  ],
  "totalCompleted": 1,
  "totalBountyXP": 10,
  "success": true
}
```

## 🎯 User Tracking Integration

### Updated UserTrackingData Interface

```typescript
export interface UserTrackingData {
  // ... existing fields
  stats: {
    // ... existing stats
    totalBountyCompletions: number;
    totalBountyXP: number;
  };
  bountyCompletions: any[];
}
```

### New Hook Functions

- `fetchBountyCompletions()` - Fetch user's completed bounties
- `recordBountyCompletion()` - Record bounty completion activity

## 🚀 Setup Instructions

### 1. Database Setup

Run the SQL script to create the necessary tables and functions:

```bash
# In Supabase SQL Editor, run:
create-user-bounty-completions-table.sql
```

### 2. Test the System

```bash
# Run the test script
node test-bounty-completion.js
```

### 3. Verify Integration

1. Submit a bounty submission
2. Approve it through the admin panel
3. Check that the bounty is marked as completed
4. Verify XP is awarded to the user

## 🔄 Workflow

1. **User submits bounty** → Submission created in `bounty_submissions` table
2. **Admin reviews submission** → Uses admin approval interface
3. **Admin approves submission** → 
   - Submission status updated to 'approved'
   - `mark_bounty_completed` function called
   - Bounty marked as completed in `user_bounty_completions`
   - XP awarded to user
   - Activity logged

## 📊 Features

- **Duplicate Prevention**: Users can only complete each bounty once
- **XP Tracking**: Automatic XP calculation based on bounty reward type
- **Activity Logging**: All completions are logged for tracking
- **Admin Integration**: Seamless integration with existing admin approval system
- **User Dashboard**: Bounty completions visible in user tracking

## 🛠️ Error Handling

- Graceful handling of missing bounties
- Non-blocking completion tracking (approval succeeds even if completion tracking fails)
- Comprehensive error logging
- Fallback XP values for missing reward data

## 📈 Analytics

The system provides:
- Total completed bounties per user
- Total XP earned from bounties
- Completion history with timestamps
- Bounty details for each completion

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Admin-only completion recording
- Wallet address validation
- Input sanitization and validation
