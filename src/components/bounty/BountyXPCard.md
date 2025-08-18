# BountyXPCard Component

A clean, responsive frontend component to display XP earned per bounty submission, adaptable for multiple use cases across the Hoodie Academy platform.

## Features

✅ **Profile pages** - Detailed XP breakdown with bounty context  
✅ **Submission confirmation modals** - Compact version for immediate feedback  
✅ **Leaderboards** - Compact variant for list entries  
✅ **Bounty detail pages** - XP stat line in sidebars  

## Components

### BountyXPCard
Main component with detailed XP breakdown and optional bounty title.

### BountyXPCardCompact  
Compact variant for use in lists, sidebars, and leaderboards.

## Props

### BountyXPCard Props
```typescript
type BountyXPCardProps = {
  submissionCount: number;     // How many times user submitted to this bounty
  placement?: "1st" | "2nd" | "3rd";  // Optional - only for winners
  bountyTitle?: string;        // Optional bounty title for context
  className?: string;          // Optional className for styling
  showDetails?: boolean;       // Optional - show detailed breakdown (default: true)
};
```

### BountyXPCardCompact Props
```typescript
type BountyXPCardCompactProps = {
  submissionCount: number;     // How many times user submitted to this bounty
  placement?: "1st" | "2nd" | "3rd";  // Optional - only for winners
  totalXP: number;            // Total XP earned (calculated externally)
  className?: string;          // Optional className for styling
};
```

## XP Calculation Logic

### Base XP
- **10 XP per submission** (maximum 30 XP)
- Formula: `Math.min(submissionCount * 10, 30)`

### Placement Bonuses
- **🥇 1st Place**: +250 XP
- **🥈 2nd Place**: +100 XP  
- **🥉 3rd Place**: +50 XP

### Total XP
- **Base XP + Placement Bonus**
- Example: 3 submissions (30 XP) + 2nd place (100 XP) = 130 XP

## Usage Examples

### Basic Usage
```tsx
<BountyXPCard submissionCount={3} placement="2nd" />
```

### With Bounty Title
```tsx
<BountyXPCard 
  submissionCount={3} 
  placement="2nd" 
  bountyTitle="Hoodie Visual Design"
/>
```

### Compact Version
```tsx
<BountyXPCardCompact 
  submissionCount={5} 
  placement="1st"
  totalXP={280}
/>
```

### Submission Confirmation
```tsx
<BountyXPCard 
  submissionCount={1} 
  showDetails={false}
  className="bg-green-500/10 border-green-500/30"
/>
```

## Use Cases

| Use Case | Component | Features |
|----------|-----------|----------|
| Profile Page | `BountyXPCard` | Detailed breakdown, bounty title |
| Confirmation Modal | `BountyXPCard` | Compact mode, success styling |
| Leaderboard | `BountyXPCardCompact` | Minimal info, placement badges |
| Bounty Sidebar | `BountyXPCardCompact` | XP stat line |
| Squad Leaderboard | `BountyXPCardCompact` | Average XP per bounty |

## Demo

Visit `/bounties/bounty-xp-demo` to see all variants in action.

## Styling

The component uses Tailwind CSS classes and integrates with the existing UI components:
- `Card`, `CardContent`, `CardHeader`, `CardTitle` from `@/components/ui/card`
- `Badge` from `@/components/ui/badge`
- Lucide React icons for visual elements

## Responsive Design

- Mobile-first approach
- Adapts to different screen sizes
- Compact variant for smaller spaces
- Maintains readability across devices 