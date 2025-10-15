# 🧠 HOOD Governance System - Implementation Guide

## ✅ COMPLETED

### 1. Database Schema ✅
**File**: `setup-hood-governance.sql`

**Tables Created:**
- `hood_token_allocations` - Token distribution breakdown
- `governance_proposals` - All governance proposals
- `governance_votes` - User votes on proposals
- `hood_unlock_history` - Token unlock tracking
- `hood_user_balances` - User HOOD + XP balances

**Functions Created:**
- `calculate_voting_power()` - Formula: 0.5 × HOOD + 0.5 × (XP × 0.001)
- `get_user_voting_power()` - Get user's voting power
- `cast_governance_vote()` - Cast/update vote on proposal
- `finalize_proposal()` - Admin finalize proposal (admin only)

### 2. API Endpoints ✅
**Created:**
- `GET/POST /api/governance/proposals` - List/create proposals
- `GET/POST /api/governance/vote` - Get/cast votes
- `GET /api/governance/voting-power` - Get user's voting power
- `GET /api/governance/tokenomics` - Get token allocations
- `POST /api/governance/finalize` - Finalize proposal (admin)

---

## 🚀 NEXT STEPS

### Frontend Components to Create

#### 1. Main Governance Hub Page
**Location**: `src/app/governance/page.tsx`

**Features:**
- List of active proposals
- Proposal cards with vote counts
- Filter by status (active, passed, rejected)
- Voting buttons (Approve/Reject)
- Personal voting power display
- Tokenomics overview

#### 2. Proposal Creation Form
**Location**: `src/components/governance/ProposalForm.tsx`

**Fields:**
- Title
- Description (rich text)
- Proposal type (dropdown)
- Unlock amount (if unlock type)
- Target allocation (if unlock type)
- Voting duration (default 7 days)

#### 3. Voting Power Card
**Location**: `src/components/governance/VotingPowerCard.tsx`

**Displays:**
- Total voting power
- HOOD contribution (50%)
- XP contribution (50%)
- Breakdown visualization

#### 4. Tokenomics Dashboard
**Location**: `src/components/governance/TokenomicsDashboard.tsx`

**Shows:**
- Pie chart of allocations
- Progress bars for locked/unlocked
- Unlock history timeline
- Total supply stats

#### 5. Proposal Card Component
**Location**: `src/components/governance/ProposalCard.tsx`

**Features:**
- Proposal title + description
- Vote progress bars
- Time remaining
- Vote buttons
- Status badge
- Vote count

---

## 📊 Tokenomics Breakdown

| Allocation | Tokens | % | Status | Unlock Method |
|------------|---------|---|--------|---------------|
| **Founder Vault** | 600M | 60% | 🔒 Locked | Governance votes |
| **Community Vault** | 200M | 20% | 🔒 Locked | Academy votes |
| **Bonding Curve** | 150M | 15% | ✅ Unlocked | Immediate |
| **Partnerships** | 50M | 5% | 🔒 Locked | 6-12 month vest |

**Total Supply:** 1,000,000,000 $HOOD

---

## 🎯 Voting Power Formula

```
Voting Power = (HOOD Balance × 0.5) + (XP × 0.001 × 0.5)
```

**Example:**
- User has: 10,000 HOOD + 50,000 XP
- HOOD contribution: 10,000 × 0.5 = 5,000
- XP contribution: 50,000 × 0.001 × 0.5 = 25
- **Total Voting Power: 5,025**

---

## 🗳️ Proposal Types

1. **Unlock** - Request token unlock from vaults
2. **Course** - Propose new course/content
3. **Reward** - Modify reward structures
4. **Policy** - Change governance rules
5. **Treasury** - Treasury management decisions

---

## 🔐 Permission Levels

### Regular Users Can:
- ✅ View all proposals
- ✅ Create proposals
- ✅ Vote on proposals
- ✅ See their voting power
- ✅ View tokenomics

### Admins Can:
- ✅ All user permissions
- ✅ Finalize proposals
- ✅ Execute token unlocks
- ✅ Cancel proposals
- ✅ Manual balance adjustments

---

## 🎨 UI Design Guidelines

### Color Scheme
- **Primary**: Cyan (#06b6d4) - Vote buttons, active states
- **Secondary**: Purple (#9333ea) - Proposal cards, accents
- **Success**: Green (#22c55e) - Passed proposals
- **Danger**: Red (#ef4444) - Rejected proposals
- **Warning**: Yellow (#eab308) - Active voting

### Components
- Use Card components for proposals
- Badge for status (Active, Passed, Rejected)
- Progress bars for vote counts
- Gradient backgrounds for hero sections

---

## 📱 Page Structure

### `/governance` - Main Hub
```
┌─────────────────────────────────────┐
│  🧠 HOOD Governance Hub             │
│  Your voting power: 5,025           │
├─────────────────────────────────────┤
│  📊 Tokenomics Overview             │
│  [Pie Chart + Stats]                │
├─────────────────────────────────────┤
│  🗳️ Active Proposals                │
│  ┌───────────────────────────┐     │
│  │ Proposal #1               │     │
│  │ Unlock 50M for Rewards    │     │
│  │ For: 60% | Against: 40%   │     │
│  │ [Vote For] [Vote Against] │     │
│  └───────────────────────────┘     │
└─────────────────────────────────────┘
```

---

## 🔧 Implementation Steps

### Step 1: Run Database Setup
```bash
# In Supabase SQL Editor
Run: setup-hood-governance.sql
```

### Step 2: Test APIs
```bash
# Test proposals endpoint
curl http://localhost:3000/api/governance/proposals

# Test voting power
curl http://localhost:3000/api/governance/voting-power?wallet=YOUR_WALLET

# Test tokenomics
curl http://localhost:3000/api/governance/tokenomics
```

### Step 3: Create Frontend Components
1. Create `src/app/governance/page.tsx`
2. Create proposal components
3. Create voting components
4. Create tokenomics dashboard
5. Add navigation links

### Step 4: Integration
1. Add "Governance" to sidebar navigation
2. Link from admin dashboard
3. Add notification badges for new proposals
4. Connect to wallet system

---

## 📝 Sample Proposal Data

```json
{
  "title": "Unlock 50M HOOD for Community Rewards",
  "description": "Proposal to unlock 50 million HOOD tokens from the Community Vault to fund Q1 2025 rewards program...",
  "proposal_type": "unlock",
  "requested_unlock_amount": 50000000,
  "target_allocation": "Community Vault",
  "voting_duration_days": 7,
  "created_by": "wallet_address_here"
}
```

---

## 🧪 Testing Checklist

### Database
- [ ] Tables created successfully
- [ ] Functions work correctly
- [ ] Initial allocations inserted
- [ ] Permissions set correctly

### API
- [ ] Can fetch proposals
- [ ] Can create proposal
- [ ] Can cast vote
- [ ] Can get voting power
- [ ] Can get tokenomics
- [ ] Admin can finalize

### Frontend
- [ ] Governance page loads
- [ ] Proposals display correctly
- [ ] Can create new proposal
- [ ] Can vote on proposals
- [ ] Voting power shows correctly
- [ ] Tokenomics chart displays
- [ ] Admin controls work

---

## 🚀 Deployment Checklist

- [ ] Database migrations run
- [ ] API endpoints tested
- [ ] Frontend components built
- [ ] Navigation integrated
- [ ] Admin permissions verified
- [ ] Mobile responsive
- [ ] Error handling complete
- [ ] Loading states added

---

## 📚 Related Documentation

- Token allocation strategy
- Governance voting rules
- Proposal creation guidelines
- Admin finalization process
- Integration with XP system

---

## 🎉 Success Criteria

✅ Users can view active proposals
✅ Users can create new proposals
✅ Users can vote with HOOD + XP power
✅ Voting power calculated correctly
✅ Tokenomics displayed accurately
✅ Admins can finalize proposals
✅ System tracks unlock history
✅ Mobile responsive design

---

**Your HOOD Governance system backend is COMPLETE!**
**Ready for frontend implementation!** 🚀

