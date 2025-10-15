'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Hook to prefetch routes on mount or interaction
 */
export function usePrefetchRoutes(routes: string[]) {
  const router = useRouter();

  useEffect(() => {
    // Prefetch routes after a short delay to avoid blocking initial render
    const timeoutId = setTimeout(() => {
      routes.forEach((route) => {
        router.prefetch(route);
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [routes, router]);
}

/**
 * Hook to prefetch a route on hover
 */
export function usePrefetchOnHover() {
  const router = useRouter();

  const prefetchRoute = (route: string) => {
    router.prefetch(route);
  };

  return { prefetchRoute };
}

/**
 * Common routes to prefetch for better navigation speed
 */
export const COMMON_ROUTES = {
  dashboard: '/dashboard',
  courses: '/courses',
  bounties: '/bounties',
  leaderboard: '/leaderboard',
  profile: '/profile',
  governance: '/governance',
  admin: '/admin-dashboard',
};

/**
 * Prefetch commonly visited routes
 */
export function usePrefetchCommonRoutes() {
  usePrefetchRoutes([
    COMMON_ROUTES.dashboard,
    COMMON_ROUTES.courses,
    COMMON_ROUTES.bounties,
    COMMON_ROUTES.leaderboard,
  ]);
}

