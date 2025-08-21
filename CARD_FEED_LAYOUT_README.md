# Vertical Card Feed Layout & Navigation Drawer System

This document explains how to implement the consistent vertical card feed layout and navigation drawer across all Hoodie Academy pages.

## Overview

The new system provides:
- **Consistent Layout**: Every page uses the same vertical card feed structure
- **Navigation Drawer**: Collapsible sidebar with contextual navigation
- **Admin Access Control**: Admin-only navigation items and sections
- **SNS Domain Resolution**: Automatic display name resolution from Solana Name Service
- **Card Components**: Reusable card types for different content
- **Responsive Design**: Works seamlessly on mobile and desktop

## Recent Fixes

### ✅ Admin Access Control
- **Fixed**: Admin navigation items now only show for admin users
- **Added**: `adminOnly` property for navigation sections and items
- **Enhanced**: Admin detection using `isCurrentUserAdmin()` utility
- **Visual**: Admin items show "ADMIN" badge for clarity

### ✅ SNS Domain Resolution
- **Fixed**: SNS domains now properly resolve to display names
- **Fallback**: Shows wallet address if no SNS domain is found
- **Integration**: Works across all pages (Dashboard, Courses, Main)
- **Caching**: Resolved names are cached for performance

## Components

### 1. PageLayout Component

The main layout wrapper that provides:
- Background and header
- Navigation drawer toggle
- Vertical card feed container
- Mobile sidebar integration
- Admin access control

```tsx
import PageLayout from "@/components/layouts/PageLayout";

export default function MyPage() {
  return (
    <PageLayout
      title="Page Title"
      subtitle="Page description"
      showHomeButton={true}
      showBackButton={true}
      backHref="/dashboard"
      navigationSections={customNavigation}
      navigationDrawerTitle="Custom Navigation"
      navigationDrawerSubtitle="Custom subtitle"
    >
      {/* Your page content using card components */}
    </PageLayout>
  );
}
```

### 2. Card Feed Components

#### CardFeedLayout
Main container for organizing cards in a vertical feed:

```tsx
import { CardFeedLayout } from "@/components/layouts/CardFeedLayout";

<CardFeedLayout>
  {/* Your card components */}
</CardFeedLayout>
```

#### CardFeedItem
Individual card for displaying content:

```tsx
import { CardFeedItem } from "@/components/layouts/CardFeedLayout";

<CardFeedItem
  title="Card Title"
  subtitle="Card description"
  badge="NEW"
  badgeVariant="secondary"
  interactive={true}
  onClick={() => handleClick()}
>
  <p>Card content goes here</p>
</CardFeedItem>
```

#### CardFeedSection
Groups related cards with a section header:

```tsx
import { CardFeedSection } from "@/components/layouts/CardFeedLayout";

<CardFeedSection
  title="Section Title"
  subtitle="Section description"
>
  {/* Cards in this section */}
</CardFeedSection>
```

#### CardFeedGrid
Arranges cards in responsive grid layouts:

```tsx
import { CardFeedGrid } from "@/components/layouts/CardFeedLayout";

<CardFeedGrid cols={3}>
  {/* Cards will be arranged in 3 columns on large screens */}
</CardFeedGrid>
```

#### InfoCard
Specialized card for displaying information:

```tsx
import { InfoCard } from "@/components/layouts/CardFeedLayout";

<InfoCard
  title="Information Title"
  icon={<Star className="w-5 h-5" />}
  variant="success" // default, success, warning, error
>
  <p>Information content</p>
</InfoCard>
```

#### ActionCard
Interactive card with action buttons:

```tsx
import { ActionCard } from "@/components/layouts/CardFeedLayout";

<ActionCard
  title="Action Title"
  subtitle="Action description"
  action={<Button>Action Button</Button>}
>
  <p>Action content</p>
</ActionCard>
```

### 3. Navigation Drawer

#### Basic Usage
```tsx
import { NavigationDrawer, academyNavigationSections } from "@/components/layouts/NavigationDrawer";

<NavigationDrawer
  sections={academyNavigationSections}
  title="Quick Navigation"
  subtitle="Navigate through the academy"
  showSearch={true}
  onItemClick={(item) => console.log('Clicked:', item)}
/>
```

#### Admin-Only Navigation
```tsx
const adminNavigation = [
  {
    id: 'admin-tools',
    title: 'Admin Tools',
    icon: <Shield className="w-4 h-4" />,
    adminOnly: true, // This section only shows for admin users
    items: [
      {
        id: 'admin-dashboard',
        label: 'Admin Dashboard',
        icon: <BarChart3 className="w-4 h-4" />,
        href: '/admin',
        description: 'Manage academy settings',
        adminOnly: true // This item only shows for admin users
      }
    ]
  }
];
```

#### Predefined Navigation Sections

**Academy Navigation** (`academyNavigationSections`):
- Main Navigation (Home, Dashboard)
- Learning (Courses, Tracks, Achievements)
- Community (Squads, Leaderboard, Bounties)
- Tools & Resources (Media, Profile)
- **Admin Tools** (Admin Dashboard, User Management, Course Management, Placement Progress) - *Admin Only*

**Course Page Navigation** (`coursePageNavigation`):
- Course Progress (Current Lesson, Completed)
- Related Courses (Prerequisites, Next Steps)

**Dashboard Navigation** (`dashboardNavigation`):
- Quick Actions (Resume Course, Take Quiz)
- Recent Activity (Last Visited)

#### Custom Navigation Sections
```tsx
const customNavigation = [
  {
    id: 'custom-section',
    title: 'Custom Section',
    icon: <CustomIcon className="w-4 h-4" />,
    items: [
      {
        id: 'custom-item',
        label: 'Custom Item',
        icon: <ItemIcon className="w-4 h-4" />,
        href: '/custom-path',
        description: 'Item description',
        isNew: true,
        isFeatured: true,
        badge: '5',
        adminOnly: false // Set to true for admin-only items
      }
    ],
    collapsible: true,
    defaultExpanded: false,
    adminOnly: false // Set to true for admin-only sections
  }
];
```

## SNS Domain Resolution

### Automatic Resolution
The system automatically resolves Solana Name Service (SNS) domains for connected wallets:

```tsx
// In your component
useEffect(() => {
  const loadUserDisplayName = async () => {
    try {
      // Check if user has a custom display name set
      const customDisplayName = localStorage.getItem('userDisplayName');
      if (customDisplayName) {
        setUserDisplayName(customDisplayName);
        return;
      }

      // Try to resolve SNS domain for the wallet
      const storedWallet = localStorage.getItem('walletAddress');
      if (storedWallet) {
        const { getDisplayNameWithSNS } = await import('@/services/sns-resolver');
        const resolvedName = await getDisplayNameWithSNS(storedWallet);
        setUserDisplayName(resolvedName);
      }
    } catch (error) {
      console.error('Error resolving SNS domain:', error);
      // Fallback to default name
      setUserDisplayName('Hoodie Scholar');
    }
  };

  loadUserDisplayName();
}, []);
```

### Fallback Behavior
- **Primary**: User's custom display name (if set)
- **Secondary**: SNS domain resolution (e.g., "hoodie.sol")
- **Fallback**: Formatted wallet address (e.g., "JCUG...toU")
- **Default**: Generic name (e.g., "Hoodie Scholar")

## Implementation Examples

### Example 1: Simple Page
```tsx
import PageLayout from "@/components/layouts/PageLayout";
import { CardFeedItem, InfoCard } from "@/components/layouts/CardFeedLayout";

export default function SimplePage() {
  return (
    <PageLayout
      title="Simple Page"
      subtitle="A basic example"
    >
      <CardFeedItem title="Welcome" subtitle="Welcome to the page">
        <p>This is a simple page with basic content.</p>
      </CardFeedItem>
      
      <InfoCard title="Important Info" icon="ℹ️">
        <p>This is important information for users.</p>
      </InfoCard>
    </PageLayout>
  );
}
```

### Example 2: Complex Dashboard with Admin Access
```tsx
import PageLayout from "@/components/layouts/PageLayout";
import { 
  CardFeedSection, 
  CardFeedGrid, 
  InfoCard, 
  ActionCard 
} from "@/components/layouts/CardFeedLayout";
import { dashboardNavigation } from "@/components/layouts/NavigationDrawer";

export default function DashboardPage() {
  return (
    <PageLayout
      title="Dashboard"
      subtitle="Your learning overview"
      navigationSections={dashboardNavigation}
    >
      <CardFeedSection title="Quick Stats" subtitle="Your progress at a glance">
        <CardFeedGrid cols={3}>
          <InfoCard title="XP" icon="⭐" variant="default">
            <div className="text-3xl font-bold text-yellow-400">1,250</div>
          </InfoCard>
          <InfoCard title="Courses" icon="📚" variant="success">
            <div className="text-3xl font-bold text-green-400">5</div>
          </InfoCard>
          <InfoCard title="Streak" icon="🔥" variant="warning">
            <div className="text-3xl font-bold text-orange-400">7</div>
          </InfoCard>
        </CardFeedGrid>
      </CardFeedSection>

      <ActionCard title="Quick Actions" subtitle="Jump into learning">
        <div className="grid grid-cols-2 gap-3">
          <Button>Continue Course</Button>
          <Button>Take Quiz</Button>
        </div>
      </ActionCard>
    </PageLayout>
  );
}
```

### Example 3: Course Page with Course-Specific Navigation
```tsx
import PageLayout from "@/components/layouts/PageLayout";
import { 
  CardFeedSection, 
  CardFeedGrid, 
  InfoCard 
} from "@/components/layouts/CardFeedLayout";
import { coursePageNavigation } from "@/components/layouts/NavigationDrawer";

export default function CoursePage() {
  return (
    <PageLayout
      title="Course Title"
      subtitle="Course description"
      navigationSections={coursePageNavigation}
      navigationDrawerTitle="Course Navigation"
    >
      <CardFeedSection title="Course Content" subtitle="Your learning path">
        <CardFeedGrid cols={2}>
          {lessons.map(lesson => (
            <InfoCard
              key={lesson.id}
              title={lesson.title}
              icon={<BookOpen className="w-5 h-5" />}
              variant={lesson.completed ? 'success' : 'default'}
            >
              <p>{lesson.description}</p>
            </InfoCard>
          ))}
        </CardFeedGrid>
      </CardFeedSection>
    </PageLayout>
  );
}
```

## Testing Admin Access

### Test Page
Visit `/test-admin` to verify admin detection and navigation:

```tsx
// Navigate to /test-admin to test:
// 1. Admin status detection
// 2. Navigation drawer admin items
// 3. Debug information
```

### Admin Detection
The system uses session storage for admin authentication:

```tsx
// Check admin status
const isAdmin = await isCurrentUserAdmin();

// Set admin authentication (for testing)
setAdminAuthenticated(true);

// Remove admin access
setAdminAuthenticated(false);
```

## Styling and Customization

### Card Variants
- **default**: Standard card with cyan accent
- **success**: Green accent for positive information
- **warning**: Yellow accent for warnings
- **error**: Red accent for errors

### Admin Badges
- **Admin Sections**: Purple "ADMIN" badge on section headers
- **Admin Items**: Purple "ADMIN" badge on navigation items
- **Visual Distinction**: Clear identification of admin-only content

### Responsive Behavior
- **Mobile**: Single column layout with mobile sidebar
- **Tablet**: 2-column grid where appropriate
- **Desktop**: Full grid layout with navigation drawer

### Custom Styling
```tsx
<CardFeedItem className="custom-card-class">
  {/* Custom styled content */}
</CardFeedItem>
```

## Best Practices

### 1. Consistent Structure
- Always use `PageLayout` as the main wrapper
- Group related content in `CardFeedSection`
- Use appropriate card types for different content

### 2. Navigation Design
- Provide contextual navigation for each page type
- Use descriptive titles and subtitles
- Include search functionality for complex navigation
- Mark admin-only sections and items with `adminOnly: true`

### 3. Admin Access Control
- Always check admin status before showing admin content
- Use `adminOnly` property for admin navigation items
- Provide clear visual indicators for admin content
- Test admin access on both admin and non-admin accounts

### 4. SNS Integration
- Implement SNS resolution for user display names
- Provide fallbacks for failed resolution
- Cache resolved names for performance
- Handle errors gracefully

### 5. Content Organization
- Use `CardFeedGrid` for related items
- Limit grid columns to 4 maximum
- Provide clear section headers and descriptions

### 6. Accessibility
- Include proper ARIA labels
- Use semantic HTML structure
- Ensure keyboard navigation works

### 7. Performance
- Lazy load navigation sections when possible
- Use appropriate card types for content
- Optimize images and media content

## Migration Guide

### From Old Layout
1. Replace custom layout with `PageLayout`
2. Convert existing cards to use new card components
3. Add navigation drawer with appropriate sections
4. Update imports and component usage
5. Add admin access control where needed
6. Integrate SNS domain resolution

### Example Migration
```tsx
// Old way
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  <div className="max-w-7xl mx-auto px-4 py-8">
    <Card className="mb-6">
      {/* content */}
    </Card>
  </div>
</div>

// New way
<PageLayout title="Page Title">
  <CardFeedItem title="Content Title">
    {/* content */}
  </CardFeedItem>
</PageLayout>
```

## Troubleshooting

### Common Issues

1. **Navigation drawer not showing**
   - Ensure `showNavigationDrawer={true}`
   - Check that navigation sections are provided

2. **Admin items not visible**
   - Verify admin status with `isCurrentUserAdmin()`
   - Check session storage for `adminAuthenticated`
   - Ensure `adminOnly: true` is set on admin items

3. **SNS domains not resolving**
   - Check browser console for errors
   - Verify wallet connection
   - Check SNS resolver service status

4. **Cards not aligned properly**
   - Use `CardFeedGrid` for grid layouts
   - Check column count settings

5. **Mobile layout issues**
   - Verify `PageLayout` is wrapping content
   - Check mobile sidebar integration

### Debug Tips
- Use browser dev tools to inspect layout structure
- Check console for component import errors
- Verify all required props are provided
- Test admin access on `/test-admin` page
- Check session storage for admin authentication

## Conclusion

The vertical card feed layout and navigation drawer system provides a consistent, professional experience across all Hoodie Academy pages. With recent fixes for admin access control and SNS domain resolution, the system now offers:

- **Secure Admin Access**: Admin-only navigation items and sections
- **Smart Display Names**: Automatic SNS domain resolution
- **Consistent Design**: Professional card-based layout
- **Enhanced Navigation**: Contextual navigation with search
- **Responsive Design**: Seamless mobile and desktop experience

By following these guidelines and using the provided components, you can create engaging, well-organized pages that maintain the academy's visual identity while providing excellent user experience and proper access control.

For additional support or questions, refer to the component source code or contact the development team.
