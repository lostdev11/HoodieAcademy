import { useState, useEffect } from 'react';

export interface BountySubmission {
  id: string;
  wallet_address: string;
  bounty_id: string;
  submission_id: string;
  xp_awarded: number;
  placement?: 'first' | 'second' | 'third';
  sol_prize: number;
  created_at: string;
  updated_at: string;
  bounty?: {
    id: string;
    title: string;
    short_desc: string;
    reward: string;
    reward_type: 'XP' | 'SOL' | 'NFT';
    status: 'active' | 'completed' | 'expired';
    squad_tag?: string;
  };
  submission?: {
    id: string;
    title: string;
    description: string;
    image_url?: string;
    created_at: string;
  };
}

export interface BountyStats {
  totalSubmissions: number;
  totalXP: number;
  totalSOL: number;
  wins: number;
  pendingSubmissions: number;
}

export function useUserBounties(walletAddress?: string) {
  const [submissions, setSubmissions] = useState<BountySubmission[]>([]);
  const [stats, setStats] = useState<BountyStats>({
    totalSubmissions: 0,
    totalXP: 0,
    totalSOL: 0,
    wins: 0,
    pendingSubmissions: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setSubmissions([]);
      setStats({
        totalSubmissions: 0,
        totalXP: 0,
        totalSOL: 0,
        wins: 0,
        pendingSubmissions: 0
      });
      return;
    }

    const fetchUserBounties = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch user tracking data which includes bounty submissions
        const response = await fetch(`/api/users/track?wallet=${walletAddress}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract bounty submissions from the user tracking data
        const bountySubmissions = data.submissions || [];
        const bountyCompletions = data.bountyCompletions || [];
        
        // Calculate stats
        const totalSubmissions = bountySubmissions.length;
        const totalXP = bountyCompletions.reduce((sum: number, completion: any) => sum + (completion.xp_awarded || 0), 0);
        const totalSOL = bountyCompletions.reduce((sum: number, completion: any) => sum + (completion.sol_prize || 0), 0);
        const wins = bountyCompletions.length; // Completed bounties count as wins
        const pendingSubmissions = bountySubmissions.filter((sub: any) => sub.status === 'pending').length;
        
        setSubmissions(bountySubmissions);
        setStats({
          totalSubmissions,
          totalXP,
          totalSOL,
          wins,
          pendingSubmissions
        });
      } catch (err) {
        console.error('Error fetching user bounties:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user bounties');
      } finally {
        setLoading(false);
      }
    };

    fetchUserBounties();
  }, [walletAddress]);

  return {
    submissions,
    stats,
    loading,
    error
  };
}

