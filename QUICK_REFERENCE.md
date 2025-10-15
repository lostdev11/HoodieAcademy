# ⚡️ Hoodie Academy - Performance Optimization Quick Reference

**Copy-paste examples for common patterns**

---

## 🔘 Optimized Button

### Basic Usage
```tsx
import { OptimizedButton } from '@/components/ui/optimized-button';

<OptimizedButton onClick={handleClick}>
  Click Me
</OptimizedButton>
```

### With Loading State
```tsx
const [isLoading, setIsLoading] = useState(false);

<OptimizedButton
  onClick={async () => {
    setIsLoading(true);
    await saveData();
    setIsLoading(false);
  }}
  isLoading={isLoading}
  loadingText="Saving..."
>
  Save
</OptimizedButton>
```

### Custom Debounce
```tsx
<OptimizedButton
  onClick={handleClick}
  debounceMs={500}
  showSpinner={true}
>
  Submit
</OptimizedButton>
```

---

## 🔗 Optimized Link

### Basic with Prefetch
```tsx
import { OptimizedLink } from '@/components/ui/optimized-link';

<OptimizedLink href="/courses" prefetchOnHover>
  View Courses
</OptimizedLink>
```

### With Delay
```tsx
<OptimizedLink 
  href="/dashboard" 
  prefetchOnHover
  prefetchDelay={200}
>
  Dashboard
</OptimizedLink>
```

---

## 📊 Data Fetching Hooks

### Courses
```tsx
import { useCoursesOptimized } from '@/hooks/optimized/useCoursesOptimized';

function MyComponent() {
  const { courses, isLoading, prefetchCourse } = useCoursesOptimized();
  
  if (isLoading) return <CourseListSkeleton />;
  
  return (
    <div onMouseEnter={() => prefetchCourse('course-slug')}>
      {courses.map(course => <CourseCard key={course.id} {...course} />)}
    </div>
  );
}
```

### Course Progress (with Optimistic Update)
```tsx
import { useCourseProgressOptimized } from '@/hooks/optimized/useCoursesOptimized';

function CourseProgress() {
  const { progress, updateProgress, isUpdating } = useCourseProgressOptimized();
  
  const handleUpdate = async () => {
    await updateProgress({
      courseId: 'course-123',
      progressData: { progress_percentage: 75 }
    });
  };
  
  return (
    <OptimizedButton 
      onClick={handleUpdate}
      isLoading={isUpdating}
    >
      Update Progress
    </OptimizedButton>
  );
}
```

### XP
```tsx
import { useXPOptimized } from '@/hooks/optimized/useXPOptimized';

function XPDisplay({ wallet }: { wallet: string }) {
  const { profile, completeCourse, isCompletingCourse } = useXPOptimized(wallet);
  
  return (
    <div>
      <p>XP: {profile?.totalXP || 0}</p>
      <OptimizedButton
        onClick={async () => {
          await completeCourse({
            slug: 'course-1',
            courseTitle: 'Web3 Basics',
            customXP: 100
          });
        }}
        isLoading={isCompletingCourse}
      >
        Complete Course
      </OptimizedButton>
    </div>
  );
}
```

### Bounties
```tsx
import { useBountiesOptimized } from '@/hooks/optimized/useBountiesOptimized';

function BountiesList() {
  const { bounties, isLoading, prefetchBounty } = useBountiesOptimized();
  
  if (isLoading) return <BountyListSkeleton />;
  
  return (
    <div>
      {bounties.map(bounty => (
        <div 
          key={bounty.id}
          onMouseEnter={() => prefetchBounty(bounty.id)}
        >
          {bounty.title}
        </div>
      ))}
    </div>
  );
}
```

---

## 💀 Skeleton Loaders

### Card Skeleton
```tsx
import { CardSkeleton } from '@/components/ui/skeleton';

{isLoading ? <CardSkeleton /> : <MyCard />}
```

### List of Cards
```tsx
import { CourseListSkeleton } from '@/components/ui/skeleton';

{isLoading ? (
  <CourseListSkeleton count={6} />
) : (
  <CourseGrid courses={courses} />
)}
```

### Dashboard
```tsx
import { DashboardSkeleton } from '@/components/ui/skeleton';

{isLoading ? <DashboardSkeleton /> : <Dashboard />}
```

### Custom Shimmer
```tsx
import { ShimmerSkeleton } from '@/components/ui/skeleton';

<ShimmerSkeleton className="h-8 w-48" />
<ShimmerSkeleton className="h-4 w-full mt-2" />
```

---

## 🎬 Animations

### Page Transition
```tsx
import { PageTransition } from '@/components/ui/page-transition';

export default function MyPage() {
  return (
    <PageTransition variant="slideUp" duration={0.3}>
      <div>Your content here</div>
    </PageTransition>
  );
}
```

### Stagger List
```tsx
import { StaggerChildren, StaggerItem } from '@/components/ui/page-transition';

<StaggerChildren staggerDelay={0.1}>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card>{item.title}</Card>
    </StaggerItem>
  ))}
</StaggerChildren>
```

### Fade In on Scroll
```tsx
import { FadeInWhenVisible } from '@/components/ui/page-transition';

<FadeInWhenVisible>
  <Card>This fades in when scrolled into view</Card>
</FadeInWhenVisible>
```

### Hover Animation
```tsx
import { motion } from 'framer-motion';

<motion.div
  whileHover={{ scale: 1.05, y: -5 }}
  transition={{ duration: 0.2 }}
>
  <Card>Hover me!</Card>
</motion.div>
```

---

## 🚀 Route Prefetching

### Auto-prefetch Common Routes
```tsx
import { usePrefetchCommonRoutes } from '@/lib/route-prefetch';

export default function Layout({ children }) {
  usePrefetchCommonRoutes(); // Prefetches dashboard, courses, bounties, leaderboard
  
  return <div>{children}</div>;
}
```

### Manual Prefetch
```tsx
import { usePrefetchOnHover } from '@/lib/route-prefetch';

function MyComponent() {
  const { prefetchRoute } = usePrefetchOnHover();
  
  return (
    <div onMouseEnter={() => prefetchRoute('/courses')}>
      Hover to prefetch
    </div>
  );
}
```

---

## 🔄 Suspense Boundaries

### Basic Suspense
```tsx
import { Suspense } from 'react';
import { CardSkeleton } from '@/components/ui/skeleton';

<Suspense fallback={<CardSkeleton />}>
  <AsyncComponent />
</Suspense>
```

### Multiple Suspense Boundaries
```tsx
<div className="grid gap-4">
  <Suspense fallback={<StatsCardSkeleton />}>
    <StatsCard />
  </Suspense>
  
  <Suspense fallback={<CourseListSkeleton count={6} />}>
    <CourseList />
  </Suspense>
</div>
```

---

## 🎨 Complete Component Example

```tsx
'use client';

import { useState } from 'react';
import { OptimizedButton } from '@/components/ui/optimized-button';
import { OptimizedLink } from '@/components/ui/optimized-link';
import { PageTransition, StaggerChildren, StaggerItem } from '@/components/ui/page-transition';
import { useCoursesOptimized } from '@/hooks/optimized/useCoursesOptimized';
import { CourseListSkeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function OptimizedCoursesPage() {
  const { courses, isLoading, prefetchCourse } = useCoursesOptimized();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  
  if (isLoading) return <CourseListSkeleton count={6} />;
  
  return (
    <PageTransition variant="slideUp">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Courses</h1>
        
        <StaggerChildren className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <StaggerItem key={course.id}>
              <Card 
                onMouseEnter={() => prefetchCourse(course.slug)}
                className="hover:shadow-lg transition-shadow"
              >
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                
                <div className="flex gap-2 mt-4">
                  <OptimizedLink href={`/courses/${course.slug}`}>
                    <OptimizedButton>
                      View Course
                    </OptimizedButton>
                  </OptimizedLink>
                  
                  <OptimizedButton
                    variant="outline"
                    onClick={async () => {
                      setSelectedCourse(course.id);
                      // Simulate async operation
                      await new Promise(r => setTimeout(r, 1000));
                      setSelectedCourse(null);
                    }}
                    isLoading={selectedCourse === course.id}
                    loadingText="Loading..."
                  >
                    Enroll
                  </OptimizedButton>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </PageTransition>
  );
}
```

---

## 🎯 Common Patterns

### Form Submission
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (data: FormData) => {
  setIsSubmitting(true);
  try {
    await submitForm(data);
    toast({ title: 'Success!' });
  } catch (error) {
    toast({ title: 'Error', variant: 'destructive' });
  } finally {
    setIsSubmitting(false);
  }
};

<OptimizedButton
  onClick={handleSubmit}
  isLoading={isSubmitting}
  loadingText="Submitting..."
>
  Submit
</OptimizedButton>
```

### Infinite Scroll with Prefetch
```tsx
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const loadMoreRef = useRef(null);
const isInView = useInView(loadMoreRef);

useEffect(() => {
  if (isInView) {
    loadMore();
  }
}, [isInView]);

<div ref={loadMoreRef}>
  {isLoading && <CardSkeleton />}
</div>
```

### Optimistic Delete
```tsx
const deleteMutation = useMutation({
  mutationFn: deleteItem,
  onMutate: async (id) => {
    // Optimistically remove from UI
    queryClient.setQueryData(['items'], (old) => 
      old.filter(item => item.id !== id)
    );
  },
  onError: (err, id, context) => {
    // Rollback on error
    queryClient.setQueryData(['items'], context.previousItems);
  }
});
```

---

## 📱 Responsive Patterns

### Mobile-Optimized Button
```tsx
<OptimizedButton
  size="sm"
  className="w-full md:w-auto"
  onClick={handleClick}
>
  <span className="hidden md:inline">Full Text</span>
  <span className="md:hidden">Short</span>
</OptimizedButton>
```

### Touch-Friendly Prefetch
```tsx
<OptimizedLink
  href="/courses"
  prefetchOnHover
  onTouchStart={(e) => {
    // Prefetch on touch for mobile
    router.prefetch('/courses');
  }}
>
  Courses
</OptimizedLink>
```

---

## 🐛 Error Handling

### With Error Boundary
```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <div>
          Error occurred!
          <OptimizedButton onClick={resetErrorBoundary}>
            Try again
          </OptimizedButton>
        </div>
      )}
    >
      <YourComponent />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

---

## 🔍 Debugging

### React Query Devtools
```tsx
// Already included in QueryProvider
// Open in browser with: Ctrl+Shift+J (Chrome) or Cmd+Option+J (Mac)
// Look for "React Query" tab
```

### Check Cache State
```tsx
import { queryClient } from '@/lib/react-query';

// Get all cached queries
console.log(queryClient.getQueryCache().getAll());

// Get specific query
console.log(queryClient.getQueryData(['courses']));

// Invalidate cache
queryClient.invalidateQueries({ queryKey: ['courses'] });
```

---

**Last Updated:** October 15, 2025  
**Quick Reference Version:** 1.0.0

