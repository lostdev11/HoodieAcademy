'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';
import { DashboardSkeleton, CardSkeleton, BountyListSkeleton } from '@/components/ui/skeleton';

/**
 * Lazy-loaded components with appropriate loading states
 */

// Dashboard components
export const LazyUserDashboard = dynamic(
  () => import('@/components/dashboard/UserDashboard'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false, // Disable SSR for client-only components
  }
);

export const LazyDashboardSidebar = dynamic(
  () => import('@/components/dashboard/DashboardSidebar').then(mod => ({ default: mod.DashboardSidebar })),
  {
    loading: () => <div className="w-64 h-screen bg-slate-800/50 animate-pulse" />,
    ssr: true,
  }
);

// Bounties components
export const LazyBountiesGrid = dynamic(
  () => import('@/components/BountiesGrid'),
  {
    loading: () => <BountyListSkeleton count={6} />,
    ssr: false,
  }
);

// Admin components (heavy, should be lazy loaded)
export const LazyAdminDashboard = dynamic(
  () => import('@/app/admin/AdminDashboard'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false,
  }
);

export const LazyAdminCoursesClient = dynamic(
  () => import('@/app/admin/courses/AdminCoursesClient'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false,
  }
);

/**
 * Wrapper for lazy components with Suspense boundary
 */
export function LazyWrapper<P extends object>({
  Component,
  fallback,
  ...props
}: {
  Component: ComponentType<P>;
  fallback?: React.ReactNode;
} & P) {
  return (
    <Suspense fallback={fallback || <CardSkeleton />}>
      <Component {...(props as P)} />
    </Suspense>
  );
}

