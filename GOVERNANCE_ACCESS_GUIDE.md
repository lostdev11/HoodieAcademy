# 🗳️ How to Access HOOD Governance

## Quick Access Guide

---

## 🌐 Public Governance Page

### For All Users:

**URL:**
```
http://localhost:3000/governance
```

**Or click:**
- Desktop sidebar → "🗳️ Governance"
- Mobile menu → "Governance"
- Bottom navigation → Main → "Governance"

**What you can do:**
- ✅ View all proposals
- ✅ Vote on active proposals
- ✅ See your voting power
- ✅ View tokenomics
- ✅ Track results

---

## 👑 Admin Governance Dashboard

### For Admins Only:

**Access:**
```
1. Go to Admin Dashboard
2. Click "Governance" tab
```

**Or directly:**
```
http://localhost:3000/admin-dashboard
(then click Governance tab)
```

**What you can do:**
- ✅ Everything users can do PLUS:
- ✅ Create new proposals
- ✅ Finalize active proposals
- ✅ View all proposal details
- ✅ Execute governance decisions

---

## 🚀 Quick Start

### Setup (1 time only)
```bash
# Run in Supabase SQL Editor:
setup-hood-governance.sql
```

### For Users
```
1. Navigate to /governance
2. Connect wallet
3. View voting power
4. Vote on proposals!
```

### For Admins
```
1. Admin Dashboard > Governance
2. Click "New Proposal"
3. Fill form & submit
4. Proposal goes live!
```

---

## 📍 All Access Points

### 1. Main Sidebar (Desktop)
```
🏠 Home
📊 Dashboard
📚 Courses
💰 Bounties
🎥 Live Sessions
🗳️ Governance     ← Click here!
🏆 Leaderboard
👤 Profile
```

### 2. Mobile Navigation
```
☰ Menu
├─ Main
│  ├─ Dashboard
│  ├─ Courses
│  ├─ Bounties
│  ├─ Mentorship
│  └─ Governance  ← Click here!
```

### 3. Admin Dashboard
```
Overview | Bounties | Submissions | ... | Governance
                                            ↑
                                      Click here!
```

### 4. Bottom Navigation (Mobile)
```
[Home] [Main Menu ▼] [Leaderboard] [Profile]
          ↓
       Governance ← In dropdown
```

---

## ✅ URLs

| Page | URL | Who Can Access |
|------|-----|----------------|
| **Public Governance** | `/governance` | Everyone |
| **Admin Governance** | `/admin-dashboard` (tab) | Admins only |
| **Proposals API** | `/api/governance/proposals` | Everyone |
| **Vote API** | `/api/governance/vote` | Connected wallets |
| **Tokenomics API** | `/api/governance/tokenomics` | Everyone |

---

## 🎯 What You'll See

### Public Page:
- Hero section with stats
- Your voting power card
- Tokenomics breakdown
- Tabbed proposal list:
  - Active (vote here!)
  - Passed (history)
  - Rejected (history)

### Admin Page:
- Voting power card
- Create proposal form
- Active proposals list
- Finalize buttons
- Past proposals archive

---

## 💡 Pro Tips

1. **Bookmark** `/governance` for quick access
2. **Check daily** for new proposals
3. **Vote early** to influence results
4. **Read descriptions** before voting
5. **Share proposals** with community

---

## 🚨 Troubleshooting

### Can't see Governance link?
**Solution:** Refresh page (`Ctrl + Shift + R`)

### Page shows errors?
**Solution:** Run `setup-hood-governance.sql` first

### Can't vote?
**Solution:** Connect wallet + ensure you have HOOD or XP

### Admin can't create proposals?
**Solution:** Verify admin status in database

---

## 🎊 You're Ready!

Your governance system is **fully accessible** from:
- ✅ Public governance page (`/governance`)
- ✅ Main sidebar navigation
- ✅ Mobile navigation
- ✅ Admin dashboard tab
- ✅ Bottom navigation

**Just navigate to `/governance` to see it in action!** 🚀

