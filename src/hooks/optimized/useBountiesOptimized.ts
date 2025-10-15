'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWalletSupabase } from '../use-wallet-supabase';
import { queryKeys } from '@/lib/react-query';
import { useToast } from '@/hooks/use-toast';

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: string;
  xp_reward: number;
  status: 'active' | 'completed' | 'expired';
  submissions: number;
  deadline?: string;
  hidden: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Optimized hook for fetching bounties with React Query caching
 */
export function useBountiesOptimized(showHidden = false) {
  const { wallet } = useWalletSupabase();
  const queryClient = useQueryClient();

  const {
    data: bounties = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bounties.list({ showHidden }),
    queryFn: async () => {
      const response = await fetch('/api/bounties');

      if (!response.ok) {
        throw new Error('Failed to fetch bounties');
      }

      const data = await response.json();
      const allBounties = Array.isArray(data) ? data : [];

      // Filter based on showHidden
      return showHidden
        ? allBounties
        : allBounties.filter((b: Bounty) => !b.hidden);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Prefetch bounty details when hovering
  const prefetchBounty = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.bounties.detail(id),
      queryFn: async () => {
        const response = await fetch(`/api/bounties/${id}`);
        if (!response.ok) throw new Error('Failed to fetch bounty');
        return response.json();
      },
    });
  };

  return {
    bounties,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    prefetchBounty,
  };
}

/**
 * Optimized hook for user-specific bounties
 */
export function useUserBountiesOptimized() {
  const { wallet } = useWalletSupabase();

  const {
    data: userBounties = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bounties.userBounties(wallet || ''),
    queryFn: async () => {
      if (!wallet) return [];

      const response = await fetch(`/api/user-bounties?wallet=${wallet}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user bounties');
      }

      const data = await response.json();
      return data.bounties || [];
    },
    enabled: !!wallet,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    userBounties,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

/**
 * Mutation for submitting bounties with optimistic updates
 */
export function useBountySubmission() {
  const { wallet } = useWalletSupabase();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const submitBountyMutation = useMutation({
    mutationFn: async ({
      bountyId,
      submissionData,
    }: {
      bountyId: string;
      submissionData: {
        submission_url?: string;
        submission_text?: string;
        image_url?: string;
      };
    }) => {
      if (!wallet) throw new Error('Wallet not connected');

      const response = await fetch(`/api/bounties/${bountyId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: wallet,
          ...submissionData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit bounty');
      }

      return response.json();
    },
    onMutate: async ({ bountyId }) => {
      // Optimistically increment submission count
      await queryClient.cancelQueries({
        queryKey: queryKeys.bounties.detail(bountyId),
      });

      const previousBounty = queryClient.getQueryData(
        queryKeys.bounties.detail(bountyId)
      );

      queryClient.setQueryData(
        queryKeys.bounties.detail(bountyId),
        (old: Bounty | undefined) => {
          if (!old) return old;
          return { ...old, submissions: old.submissions + 1 };
        }
      );

      return { previousBounty };
    },
    onError: (err, variables, context) => {
      if (context?.previousBounty) {
        queryClient.setQueryData(
          queryKeys.bounties.detail(variables.bountyId),
          context.previousBounty
        );
      }
      toast({
        title: 'Submission Failed',
        description: err instanceof Error ? err.message : 'Failed to submit bounty',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: '🎉 Bounty Submitted!',
        description: 'Your submission has been recorded. Good luck!',
      });
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bounties.detail(variables.bountyId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bounties.userBounties(wallet || ''),
      });
    },
  });

  return {
    submitBounty: submitBountyMutation.mutate,
    isSubmitting: submitBountyMutation.isPending,
  };
}

