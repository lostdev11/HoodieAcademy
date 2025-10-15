'use client';

/**
 * ===========================================
 * HOODIE ACADEMY OPTIMIZATION SHOWCASE
 * ===========================================
 * 
 * This file demonstrates all the optimization patterns
 * implemented for fast button response and page loading.
 */

import { useState } from 'react';
import { OptimizedButton } from '@/components/ui/optimized-button';
import { OptimizedLink } from '@/components/ui/optimized-link';
import { PageTransition, StaggerChildren, StaggerItem, FadeInWhenVisible } from '@/components/ui/page-transition';
import { 
  ShimmerSkeleton, 
  CardSkeleton, 
  StatsCardSkeleton, 
  DashboardSkeleton 
} from '@/components/ui/skeleton';
import { useCourses } from '@/hooks/useCourses';
import { useUserXP } from '@/hooks/useUserXP';
import { useUserBounties } from '@/hooks/useUserBounties';
import { usePrefetchCommonRoutes } from '@/lib/route-prefetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * ========================================
 * EXAMPLE 1: Optimized Button with Debouncing
 * ========================================
 */
export function OptimizedButtonExample() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setCount(prev => prev + 1);
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-cyan-400">✨ Optimized Button (Auto Debouncing)</h3>
      <p className="text-sm text-gray-300">
        Try clicking multiple times rapidly - the button automatically debounces and shows loading state
      </p>
      
      <OptimizedButton
        onClick={handleClick}
        isLoading={isLoading}
        loadingText="Processing..."
        debounceMs={300}
        className="bg-cyan-600 hover:bg-cyan-700"
      >
        Click Me (Count: {count})
      </OptimizedButton>
    </div>
  );
}

/**
 * ========================================
 * EXAMPLE 2: React Query Caching & Optimistic Updates
 * ========================================
 */
export function ReactQueryExample({ walletAddress }: { walletAddress: string }) {
  const { courses, loading, error } = useCourses();
  const { profile, completeCourse, isCompletingCourse } = useUserXP();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-cyan-400">🔄 React Query Caching</h3>
      <p className="text-sm text-gray-300">
        Data is cached for 5 minutes. Hover over courses to prefetch details.
        Completing a course uses optimistic updates for instant feedback.
      </p>
      
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.slice(0, 2).map(course => (
            <Card 
              key={course.id}
              onMouseEnter={() => prefetchCourse(course.slug)}
              className="bg-slate-800/50 border-slate-700"
            >
              <CardHeader>
                <CardTitle className="text-white">{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <OptimizedButton
                  onClick={async () => {
                    await completeCourse({
                      slug: course.slug,
                      courseTitle: course.title,
                      customXP: 100
                    });
                  }}
                  isLoading={isCompletingCourse}
                  loadingText="Awarding XP..."
                  size="sm"
                  className="w-full"
                >
                  Complete Course
                </OptimizedButton>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="p-4 bg-slate-700/50 rounded-lg">
        <p className="text-sm text-cyan-400">
          Your XP: <span className="font-bold">{profile?.totalXP || 0}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Updates instantly with optimistic UI
        </p>
      </div>
    </div>
  );
}

/**
 * ========================================
 * EXAMPLE 3: Skeleton Loaders
 * ========================================
 */
export function SkeletonExample() {
  const [showLoading, setShowLoading] = useState(true);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-cyan-400">💀 Shimmer Skeleton Loaders</h3>
      <p className="text-sm text-gray-300">
        Beautiful loading states improve perceived performance
      </p>
      
      <OptimizedButton
        onClick={() => setShowLoading(!showLoading)}
        size="sm"
        variant="outline"
      >
        Toggle Loading State
      </OptimizedButton>
      
      {showLoading ? (
        <div className="space-y-4">
          <ShimmerSkeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        </div>
      ) : (
        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
          <p className="text-green-400 font-bold">✅ Content Loaded!</p>
        </div>
      )}
    </div>
  );
}

/**
 * ========================================
 * EXAMPLE 4: Route Prefetching
 * ========================================
 */
export function PrefetchingExample() {
  // Automatically prefetches common routes on mount
  usePrefetchCommonRoutes();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-cyan-400">🚀 Route Prefetching</h3>
      <p className="text-sm text-gray-300">
        Hover over these links - they prefetch instantly for faster navigation
      </p>
      
      <div className="flex flex-wrap gap-2">
        <OptimizedLink href="/courses" prefetchOnHover>
          <OptimizedButton variant="outline" size="sm">
            📚 Courses (Prefetch on Hover)
          </OptimizedButton>
        </OptimizedLink>
        
        <OptimizedLink href="/bounties" prefetchOnHover>
          <OptimizedButton variant="outline" size="sm">
            🎯 Bounties (Prefetch on Hover)
          </OptimizedButton>
        </OptimizedLink>
        
        <OptimizedLink href="/leaderboard" prefetchOnHover>
          <OptimizedButton variant="outline" size="sm">
            🏆 Leaderboard (Prefetch on Hover)
          </OptimizedButton>
        </OptimizedLink>
      </div>
      
      <p className="text-xs text-gray-400">
        Common routes are also prefetched in the background after page load
      </p>
    </div>
  );
}

/**
 * ========================================
 * EXAMPLE 5: Framer Motion Transitions
 * ========================================
 */
export function AnimationExample() {
  const [show, setShow] = useState(true);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-cyan-400">✨ Smooth Transitions</h3>
      <p className="text-sm text-gray-300">
        All page transitions and interactions use Framer Motion for smooth UX
      </p>
      
      <OptimizedButton
        onClick={() => setShow(!show)}
        size="sm"
        variant="outline"
      >
        Toggle Animation
      </OptimizedButton>
      
      {show && (
        <PageTransition variant="slideUp">
          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-400">Animated Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">This card slides up smoothly</p>
            </CardContent>
          </Card>
        </PageTransition>
      )}
      
      <div className="mt-4">
        <h4 className="text-sm font-bold text-cyan-400 mb-2">Stagger Animation:</h4>
        <StaggerChildren>
          {[1, 2, 3, 4].map(i => (
            <StaggerItem key={i}>
              <div className="p-3 bg-slate-700/50 rounded-lg mb-2">
                Item {i} - Animates in sequence
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </div>
  );
}

/**
 * ========================================
 * MAIN SHOWCASE COMPONENT
 * ========================================
 */
export default function OptimizationShowcase({ walletAddress }: { walletAddress?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4">
            ⚡️ Hoodie Academy Optimization Showcase
          </h1>
          <p className="text-gray-300 text-lg">
            Fast button response, optimistic updates, and smooth transitions
          </p>
        </div>

        <div className="grid gap-8">
          <Card className="bg-slate-800/50 border-cyan-500/30">
            <CardContent className="p-6">
              <OptimizedButtonExample />
            </CardContent>
          </Card>

          {walletAddress && (
            <Card className="bg-slate-800/50 border-cyan-500/30">
              <CardContent className="p-6">
                <ReactQueryExample walletAddress={walletAddress} />
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-800/50 border-cyan-500/30">
            <CardContent className="p-6">
              <SkeletonExample />
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-cyan-500/30">
            <CardContent className="p-6">
              <PrefetchingExample />
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-cyan-500/30">
            <CardContent className="p-6">
              <AnimationExample />
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border-cyan-500/50">
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-400">📋 Implementation Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-green-400">✅</span>
              <div>
                <strong>React Query Integration:</strong> All data fetching uses caching, 
                automatic refetching, and optimistic updates
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400">✅</span>
              <div>
                <strong>Optimized Buttons:</strong> Automatic debouncing (300ms default), 
                loading states, and disabled states prevent multiple clicks
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400">✅</span>
              <div>
                <strong>Route Prefetching:</strong> Links prefetch on hover, 
                common routes prefetch on mount
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400">✅</span>
              <div>
                <strong>Skeleton Loaders:</strong> Shimmer effects for all loading states 
                improve perceived performance
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400">✅</span>
              <div>
                <strong>Framer Motion:</strong> Smooth page transitions, stagger animations, 
                and fade-in effects throughout the app
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400">✅</span>
              <div>
                <strong>Lazy Loading:</strong> Heavy components load only when needed 
                with proper fallbacks
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

