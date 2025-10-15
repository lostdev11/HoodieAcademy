// React Query configuration and utilities
import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    retry: 1, // Only retry once on failure
    staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Cache persists for 30 minutes (was cacheTime in v4)
  },
  mutations: {
    retry: 1,
  },
};

export const queryClient = new QueryClient({ defaultOptions: queryConfig });

// Query key factory for consistent cache keys
export const queryKeys = {
  // Course keys
  courses: {
    all: ['courses'] as const,
    list: (filters?: { squadId?: string; includeHidden?: boolean }) => 
      ['courses', 'list', filters] as const,
    detail: (slug: string) => ['courses', 'detail', slug] as const,
    progress: (wallet: string, courseId?: string) => 
      ['courses', 'progress', wallet, courseId] as const,
    sections: (courseId: string) => ['courses', 'sections', courseId] as const,
  },
  
  // XP keys
  xp: {
    all: ['xp'] as const,
    user: (wallet: string) => ['xp', 'user', wallet] as const,
    leaderboard: (filters?: any) => ['xp', 'leaderboard', filters] as const,
  },
  
  // Bounty keys
  bounties: {
    all: ['bounties'] as const,
    list: (filters?: { status?: string; showHidden?: boolean }) => 
      ['bounties', 'list', filters] as const,
    detail: (id: string) => ['bounties', 'detail', id] as const,
    submissions: (bountyId: string) => ['bounties', 'submissions', bountyId] as const,
    userBounties: (wallet: string) => ['bounties', 'user', wallet] as const,
  },
  
  // User keys
  user: {
    all: ['user'] as const,
    profile: (wallet: string) => ['user', 'profile', wallet] as const,
    admin: (wallet: string) => ['user', 'admin', wallet] as const,
  },
};

// Prefetch utility
export const prefetchQuery = async (
  key: readonly unknown[],
  fetcher: () => Promise<any>
) => {
  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fetcher,
  });
};

