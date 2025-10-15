# 🚀 HOOD Governance System - Quick Start

## ✅ COMPLETE & READY!

Your HOOD Governance Hub is fully integrated into the admin dashboard with proposal creation, voting, and finalization!

---

## 🎯 Setup in 3 Steps

### Step 1: Run Database Setup (2 minutes)
```bash
# In Supabase SQL Editor:
Run: setup-hood-governance.sql
```

**This creates:**
- 5 database tables (proposals, votes, allocations, etc.)
- 4 governance functions (voting power, cast vote, finalize)
- Initial token allocations (Founder 60%, Community 20%, etc.)

---

### Step 2: Build & Test (1 minute)
```bash
npm run build
npm run dev
```

---

### Step 3: Access Governance (30 seconds)
1. Go to **Admin Dashboard**
2. Click **"Governance"** tab
3. ✅ **You're ready!**

---

## 🎯 What Admins Can Do

### Create Proposals
```
1. Click "New Proposal" button
2. Fill in:
   - Title: "Unlock 50M HOOD for Community Rewards"
   - Description: Detailed explanation
   - Type: Token Unlock / Course / Reward / Policy
   - Unlock Amount (if applicable): 50000000
   - Target Vault: Founder / Community
   - Voting Duration: 7 days
3. Click "Create Proposal"
4. ✅ Proposal live!
```

### Finalize Proposals
```
1. View active proposals
2. Wait for voting period
3. Click "Finalize Proposal"
4. Confirm
5. ✅ Result recorded (Passed/Rejected)
```

---

## 🗳️ Voting Power Formula

```
Voting Power = (HOOD Balance × 0.5) + (XP × 0.001 × 0.5)
```

**Example:**
- User has: 10,000 HOOD + 50,000 XP
- HOOD contribution: 10,000 × 0.5 = 5,000
- XP contribution: 50,000 × 0.001 × 0.5 = 25
- **Total Power: 5,025**

---

## 📊 Token Allocations

| Vault | Tokens | % | Status | Unlock Method |
|-------|---------|---|--------|---------------|
| **Founder** | 600M | 60% | 🔒 Locked | Governance votes |
| **Community** | 200M | 20% | 🔒 Locked | Academy votes |
| **Bonding Curve** | 150M | 15% | ✅ Unlocked | Immediate |
| **Partnerships** | 50M | 5% | 🔒 Locked | Vesting (6-12mo) |

**Total:** 1,000,000,000 $HOOD

---

## 🎨 What It Looks Like

### Governance Tab in Admin Dashboard
```
┌──────────────────────────────────────────────────┐
│  🧠 Governance Management        [New Proposal]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ⚡ Your Voting Power                            │
│  Total: 5,025                                    │
│  - HOOD: 5,000 (50%)                            │
│  - XP: 25 (50%)                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  🗳️ Active Proposals (2)                         │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ #1  UNLOCK  🟡 ACTIVE                      │ │
│  │ Unlock 50M HOOD for Community Rewards      │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ For: 65% (12,000)  Against: 35% (6,500)   │ │
│  │ [Vote For] [Vote Against]                  │ │
│  │ [Finalize Proposal]                        │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## 📝 Proposal Types

### 1. **Token Unlock** 🔓
Unlock HOOD from Founder or Community vaults

**Example:**
```
Title: "Unlock 50M HOOD for Q1 Rewards"
Description: "Proposal to unlock..."
Type: unlock
Amount: 50000000
Vault: Community Vault
```

### 2. **New Course** 📚
Propose new educational content

**Example:**
```
Title: "Add Advanced Solana Development Course"
Description: "Community requests..."
Type: course
```

### 3. **Reward Structure** 💰
Modify XP or token rewards

**Example:**
```
Title: "Increase Bounty XP by 50%"
Description: "To incentivize..."
Type: reward
```

### 4. **Policy Change** 📜
Governance rule modifications

**Example:**
```
Title: "Change voting period to 14 days"
Description: "Allow more time..."
Type: policy
```

### 5. **Treasury Management** 🏛️
Treasury allocation decisions

**Example:**
```
Title: "Allocate 10M HOOD for Partnerships"
Description: "Strategic partnerships..."
Type: treasury
```

---

## 🔧 API Endpoints

### Get Proposals
```javascript
fetch('/api/governance/proposals')
  .then(r => r.json())
  .then(data => console.log(data.proposals));
```

### Create Proposal
```javascript
fetch('/api/governance/proposals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Proposal Title",
    description: "Detailed description...",
    proposal_type: "unlock",
    requested_unlock_amount: 50000000,
    target_allocation: "Community Vault",
    voting_duration_days: 7,
    created_by: walletAddress
  })
});
```

### Cast Vote
```javascript
fetch('/api/governance/vote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    proposal_id: "uuid-here",
    voter_wallet: walletAddress,
    vote_choice: "for" // or "against"
  })
});
```

### Get Voting Power
```javascript
fetch(`/api/governance/voting-power?wallet=${walletAddress}`)
  .then(r => r.json())
  .then(data => console.log(data.voting_power));
```

---

## ✅ Features Checklist

### Admin Features
- [x] Create proposals with rich form
- [x] View all proposals (active + past)
- [x] See voting power breakdown
- [x] Finalize active proposals
- [x] View proposal results
- [x] Filter by status
- [x] Mobile responsive

### Voting Features  
- [x] Calculate voting power (HOOD + XP)
- [x] Cast vote (for/against)
- [x] Change vote before deadline
- [x] Real-time vote counts
- [x] Visual progress bars
- [x] Vote confirmation

### Data Management
- [x] Token allocation tracking
- [x] Proposal history
- [x] Vote records
- [x] Unlock history
- [x] User balances

---

## 🧪 Testing Guide

### Test as Admin

1. **Create Test Proposal**
```
Title: "Test Governance System"
Description: "Testing the voting mechanism"
Type: policy
Voting Days: 1
```

2. **View Voting Power**
- Check HOOD balance contribution
- Check XP contribution  
- Verify total power calculation

3. **Vote on Proposal**
- Click "Vote For"
- See vote reflected in totals
- Try changing vote to "Against"
- Verify update works

4. **Finalize Proposal**
- Wait or skip to end time
- Click "Finalize Proposal"
- Verify result (passed/rejected)
- Check status updated

---

## 🎯 User Flow

### For Admins
```
1. Access Admin Dashboard
2. Click "Governance" tab
3. See voting power card
4. Click "New Proposal"
5. Fill form & submit
6. Proposal appears in "Active" section
7. Users vote
8. Admin clicks "Finalize"
9. Result recorded
```

### For Voters (Future)
```
1. Visit /governance page
2. See voting power
3. Browse active proposals
4. Click "Vote For/Against"
5. Vote recorded
6. See updated totals
```

---

## 📱 Mobile Support

All governance features work on mobile:
- ✅ Scrollable proposal list
- ✅ Responsive form
- ✅ Touch-friendly buttons
- ✅ Readable vote bars
- ✅ Mobile dropdown navigation

---

## 🚨 Troubleshooting

### "No voting power"
**Solution:** User needs HOOD tokens or XP
```sql
-- Grant test HOOD
UPDATE hood_user_balances
SET hood_balance = 10000
WHERE wallet_address = 'YOUR_WALLET';
```

### "Cannot finalize"
**Solution:** Check admin status
```sql
SELECT is_admin FROM users
WHERE wallet_address = 'YOUR_WALLET';
```

### "Proposal creation fails"
**Solution:** Check all required fields filled
- Title ✅
- Description ✅
- Proposal type ✅
- Wallet address ✅

---

## 💡 Pro Tips

1. **Test with small amounts** first
2. **Set short voting periods** for testing (1 day)
3. **Use descriptive titles** for clarity
4. **Include unlock amounts** in title
5. **Explain rationale** in description

---

## 🔮 Future Enhancements

### Potential Additions
- Public governance page (`/governance`)
- Vote delegation
- Proposal comments
- Quorum requirements
- Automatic execution on pass
- Vote notifications
- Proposal templates
- Rich text editor
- Attachment support

---

## 📊 Success Metrics

After setup, you should see:
- ✅ Governance tab in admin dashboard
- ✅ Voting power card displaying
- ✅ "New Proposal" button working
- ✅ Proposals list rendering
- ✅ Vote buttons functional
- ✅ Finalize button available
- ✅ No console errors

---

## 🎉 You're Ready!

Your HOOD Governance system is:
- ✅ **Fully functional**
- ✅ **Admin integrated**
- ✅ **Database ready**
- ✅ **API complete**
- ✅ **UI polished**

**Just run the database setup and start creating proposals!** 🚀

---

**Built for Hoodie Academy** 🏛️

