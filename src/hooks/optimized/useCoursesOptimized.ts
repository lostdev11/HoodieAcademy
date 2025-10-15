'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWalletSupabase } from '../use-wallet-supabase';
import { queryKeys } from '@/lib/react-query';
import { Course, CourseProgress } from '../useCourses';
import { useToast } from '@/hooks/use-toast';

/**
 * Optimized hook for fetching courses with React Query caching
 */
export function useCoursesOptimized(squadId?: string, includeHidden = false) {
  const { wallet } = useWalletSupabase();
  const queryClient = useQueryClient();

  const {
    data: courses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.courses.list({ squadId, includeHidden }),
    queryFn: async () => {
      if (!wallet) return [];

      const params = new URLSearchParams({
        wallet_address: wallet,
        include_hidden: includeHidden.toString(),
      });

      if (squadId) {
        params.append('squad_id', squadId);
      }

      const response = await fetch(`/api/courses?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      return (data.courses || []) as Course[];
    },
    enabled: !!wallet,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Prefetch course details when hovering over a course
  const prefetchCourse = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.courses.detail(slug),
      queryFn: async () => {
        const response = await fetch(`/api/courses/${slug}?wallet_address=${wallet}`);
        if (!response.ok) throw new Error('Failed to fetch course');
        return response.json();
      },
    });
  };

  return {
    courses,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    prefetchCourse,
  };
}

/**
 * Optimized hook for course progress with React Query
 */
export function useCourseProgressOptimized(courseId?: string) {
  const { wallet } = useWalletSupabase();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: progress = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.courses.progress(wallet || '', courseId),
    queryFn: async () => {
      if (!wallet) return [];

      const params = new URLSearchParams({
        wallet_address: wallet,
      });

      if (courseId) {
        params.append('course_id', courseId);
      }

      const response = await fetch(`/api/courses/progress?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch course progress');
      }

      const data = await response.json();
      return Array.isArray(data.progress)
        ? data.progress
        : [data.progress].filter(Boolean);
    },
    enabled: !!wallet,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Mutation for updating progress with optimistic updates
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      courseId,
      progressData,
    }: {
      courseId: string;
      progressData: {
        progress_percentage?: number;
        current_section?: string;
        notes?: string;
        time_spent?: number;
      };
    }) => {
      if (!wallet) throw new Error('Wallet not connected');

      const response = await fetch('/api/courses/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: wallet,
          course_id: courseId,
          ...progressData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update course progress');
      }

      return response.json();
    },
    onMutate: async ({ courseId, progressData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.courses.progress(wallet || '', courseId),
      });

      // Snapshot the previous value
      const previousProgress = queryClient.getQueryData(
        queryKeys.courses.progress(wallet || '', courseId)
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        queryKeys.courses.progress(wallet || '', courseId),
        (old: CourseProgress[] = []) => {
          const existing = old.find((p) => p.course_id === courseId);
          if (existing) {
            return old.map((p) =>
              p.course_id === courseId ? { ...p, ...progressData } : p
            );
          }
          return old;
        }
      );

      return { previousProgress };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProgress) {
        queryClient.setQueryData(
          queryKeys.courses.progress(wallet || '', variables.courseId),
          context.previousProgress
        );
      }
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update progress',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Progress Updated',
        description: 'Your course progress has been saved',
      });
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.progress(wallet || '', variables.courseId),
      });
    },
  });

  return {
    progress,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    updateProgress: updateProgressMutation.mutate,
    isUpdating: updateProgressMutation.isPending,
  };
}

