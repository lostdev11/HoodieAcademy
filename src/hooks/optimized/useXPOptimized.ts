'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { xpService, XPData } from '@/services/xp-service';
import { useToast } from '@/hooks/use-toast';
import { XPProfile } from '../useUserXP';

/**
 * Optimized hook for fetching user XP with React Query caching
 */
export function useXPOptimized(walletAddress?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: xpData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.xp.user(walletAddress || ''),
    queryFn: async () => {
      if (!walletAddress) {
        throw new Error('No wallet address provided');
      }

      const data: XPData = await xpService.getUserXP(walletAddress, {
        includeCourses: true,
        includeHistory: false,
        includeBounties: false,
      });

      const today = new Date().toISOString().split('T')[0];
      const completedCourses =
        data.courseCompletions?.map((course) => course.course_id) || [];

      const profile: XPProfile = {
        totalXP: data.totalXP,
        level: data.level,
        completedCourses,
        streak: 1,
        lastLogin: today,
        xpInCurrentLevel: data.xpInCurrentLevel,
        xpToNextLevel: data.xpToNextLevel,
        progressToNextLevel: data.progressToNextLevel,
        breakdown: data.breakdown,
      };

      return profile;
    },
    enabled: !!walletAddress,
    staleTime: 1000 * 30, // 30 seconds - XP changes frequently
    refetchInterval: 1000 * 60, // Auto-refetch every minute
  });

  // Mutation for completing courses with optimistic updates
  const completCourseMutation = useMutation({
    mutationFn: async ({
      slug,
      courseTitle,
      customXP,
    }: {
      slug: string;
      courseTitle: string;
      customXP?: number;
    }) => {
      if (!walletAddress) {
        throw new Error('No wallet address provided');
      }

      if (xpData?.completedCourses.includes(slug)) {
        throw new Error('Course already completed');
      }

      return await xpService.awardCourseXP(
        walletAddress,
        slug,
        courseTitle,
        customXP
      );
    },
    onMutate: async ({ slug, customXP = 100 }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.xp.user(walletAddress || ''),
      });

      // Snapshot the previous value
      const previousXP = queryClient.getQueryData(
        queryKeys.xp.user(walletAddress || '')
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        queryKeys.xp.user(walletAddress || ''),
        (old: XPProfile | undefined) => {
          if (!old) return old;
          
          const newTotalXP = old.totalXP + customXP;
          const newLevel = Math.floor(newTotalXP / 1000) + 1;
          const xpInCurrentLevel = newTotalXP % 1000;
          const xpToNextLevel = 1000 - xpInCurrentLevel;
          
          return {
            ...old,
            totalXP: newTotalXP,
            level: newLevel,
            completedCourses: [...old.completedCourses, slug],
            xpInCurrentLevel,
            xpToNextLevel,
            progressToNextLevel: (xpInCurrentLevel / 1000) * 100,
          };
        }
      );

      return { previousXP };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousXP) {
        queryClient.setQueryData(
          queryKeys.xp.user(walletAddress || ''),
          context.previousXP
        );
      }
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to award XP',
        variant: 'destructive',
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: '🎉 Course Completed!',
        description: `You earned XP for completing ${variables.courseTitle}!`,
      });
    },
    onSettled: () => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: queryKeys.xp.user(walletAddress || ''),
      });
    },
  });

  // Force refresh function
  const forceRefresh = () => {
    xpService.forceRefresh();
    refetch();
  };

  return {
    profile: xpData,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: refetch,
    forceRefresh,
    completeCourse: completCourseMutation.mutate,
    isCompletingCourse: completCourseMutation.isPending,
  };
}

