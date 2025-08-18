# 🛍️ Retailstar Incentive System

## Overview

The Retailstar Incentive System is a non-monetary reward system designed to motivate squad members through lore-backed, utility-rich incentives that build the Hoodie Academy universe while reinforcing commitment and engagement.

## 🎯 Purpose

Reward squad members who go above and beyond—without cash payouts. Instead, use lore-backed, utility-rich incentives that build the universe while reinforcing commitment.

## 🧾 Core Rewards Menu

| Incentive | Description | Squad Alignment | Notes |
|-----------|-------------|-----------------|-------|
| 🎟️ **Retail Tickets** | Entry into raffles, future domain deals, or special mall events | All | Can be gamified later as a full loyalty system |
| 🪪 **Domain PFP Upgrade** | Custom banner + PFP design tied to a .sol domain | Creators, Speakers | Adds status flair; visual reward |
| 🧱 **1-Page Landing Page Build** | Fully built landing site for their own project or personal identity | Creators, Decoders | High-impact reward, easy to templatize |
| 🔐 **Unlock Hidden Lore / Access** | Reveal secret rooms in Retailstar Mall or unlock cipher-gated paths | Raiders, Decoders | Incentivizes puzzle-solving + engagement |
| 📦 **Mallcore Asset Pack** | Drops of pre-built design assets (icons, buttons, templates) for their own use | Creators | Position it like a branding boost |
| 📣 **Public Spotlight** | Featured in Academy post or quoted in homepage banner | Speakers | Increases perceived status |
| 🧢 **Squad Role Upgrades** | Early access to special squad badges or emoji flair | All | Just enough cosmetic value to drive ego-based motivation |

## 🧠 Squad Assignment Connection

Each task can include a tiered bonus reward:

### Example: YouTube Channel Task

- **✅ Basic Completion**: 1 Retail Ticket
- **🔥 Excellent Execution**: + PFP domain banner + Discord role badge
- **🧠 Creative Extra**: Eligible for 1-pager site or lore unlock

## 🏗️ Technical Implementation

### Database Schema

The system uses several database tables:

1. **`retailstar_rewards`** - Catalog of all available rewards
2. **`user_retailstar_rewards`** - User's claimed rewards tracking
3. **`retailstar_tasks`** - Task assignments with tiered rewards
4. **`user_task_completions`** - User task completion tracking

### Service Layer

The `RetailstarIncentiveService` provides:

- Reward calculation based on user performance
- Squad-specific reward filtering
- Tiered bonus system management
- Eligibility checking

### API Endpoints

- `POST /api/retailstar-rewards/claim` - Claim a reward
- `GET /api/retailstar-rewards/claim` - Get user's claimed rewards

## 🎨 UI Components

### RetailstarRewardCard
Displays individual rewards with:
- Rarity indicators (⭐ to ⭐⭐⭐⭐⭐)
- Squad alignment badges
- Requirements display
- Claim functionality

### RetailstarBountyIntegration
Integrates with existing bounty system to show:
- Performance overview
- Available rewards based on performance
- Tiered bonus system
- Squad-specific rewards

### Main Incentives Page
Complete interface at `/retailstar-incentives` featuring:
- Stats overview
- Filterable reward catalog
- Tiered bonus system display
- Claimed rewards tracking

## 🎯 Reward Tiers

### Rarity System
- **Common** ⭐ - Basic rewards (Retail Tickets, Role Upgrades)
- **Uncommon** ⭐⭐ - Mid-tier rewards (Domain PFP, Asset Packs)
- **Rare** ⭐⭐⭐ - High-value rewards (Landing Pages, Spotlight)
- **Epic** ⭐⭐⭐⭐ - Exclusive rewards (Lore Access)
- **Legendary** ⭐⭐⭐⭐⭐ - Ultimate rewards (Future implementation)

### Performance Tiers
- **Basic** - Meet minimum requirements
- **Excellent** - Go above and beyond
- **Creative** - Show exceptional creativity

## 🧠 Squad-Specific Rewards

### 🎨 Creators
- Domain PFP Upgrades
- Landing Page Builds
- Asset Packs
- Role Upgrades

### 🧠 Decoders
- Landing Page Builds
- Lore Access
- Asset Packs
- Role Upgrades

### 🎤 Speakers
- Domain PFP Upgrades
- Public Spotlight
- Role Upgrades
- Retail Tickets

### ⚔️ Raiders
- Lore Access
- Role Upgrades
- Retail Tickets
- Special raid-specific rewards

## 💡 Bonus Ideas

- **Custom domain roast** from Retailrunner (funny, sarcastic, collectible)
- **AI-generated pixel art avatars** tied to their task (Visual + Twitter flex)
- **Mini "store" stall** inside the Mall with their work shown
- **Encrypted rewards** only unlocked by solving a cipher after task completion

## 🚀 Getting Started

### 1. Database Setup
Run the SQL schema in `src/lib/retailstar-incentive-schema.sql` to create the necessary tables.

### 2. Service Integration
Import and use the `RetailstarIncentiveService` in your components:

```typescript
import { retailstarIncentiveService } from '@/services/retailstar-incentive-service';

// Get squad rewards
const squadRewards = retailstarIncentiveService.getSquadRewards('creators');

// Calculate available rewards
const availableRewards = retailstarIncentiveService.calculateAvailableRewards(
  walletAddress,
  userSquad,
  submissionCount,
  placement
);
```

### 3. Component Usage
Add the integration component to bounty pages:

```typescript
import { RetailstarBountyIntegration } from '@/components/bounty/RetailstarBountyIntegration';

<RetailstarBountyIntegration
  bountyId="example-bounty"
  submissionCount={2}
  placement="second"
  userSquad="creators"
  walletAddress={userWallet}
/>
```

### 4. Navigation
Add the incentives page to your navigation:

```typescript
// In your navigation component
<Link href="/retailstar-incentives">
  🛍️ Retailstar Incentives
</Link>
```

## 🔧 Configuration

### Adding New Rewards
Edit the `RetailstarIncentiveService` constructor to add new rewards:

```typescript
{
  id: 'new_reward_id',
  type: 'reward_type',
  name: '🎁 New Reward Name',
  description: 'Description of the reward',
  squadAlignment: ['creators', 'speakers'],
  rarity: 'uncommon',
  requirements: {
    minSubmissions: 1,
    minPlacement: 'second'
  }
}
```

### Modifying Requirements
Update the `isRewardEligible` method to add new requirement types or modify existing logic.

## 🎯 Future Enhancements

1. **Gamification Layer** - Add points, levels, and progression
2. **Lore Integration** - Connect rewards to story elements
3. **Community Features** - Allow users to showcase rewards
4. **Analytics Dashboard** - Track reward distribution and engagement
5. **Automated Rewards** - Trigger rewards based on on-chain activity

## 📊 Analytics & Monitoring

Track key metrics:
- Reward claim rates by squad
- Most popular reward types
- Performance tier distribution
- Squad engagement levels

## 🔒 Security Considerations

- Validate wallet ownership before claiming
- Prevent duplicate claims
- Rate limiting on claim requests
- Admin oversight for high-value rewards

## 🎨 Design Principles

- **Lore-First**: All rewards tie back to the Hoodie Academy universe
- **Utility-Rich**: Rewards provide real value beyond cosmetics
- **Squad-Aligned**: Rewards support each squad's mission
- **Progressive**: Clear path from basic to legendary rewards
- **Engaging**: Visual feedback and satisfying claim process

---

*The Retailstar Incentive System transforms participation into progression, turning every submission into a step toward legendary status in the Hoodie Academy universe.* 