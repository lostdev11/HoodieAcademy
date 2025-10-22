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
        console.log('🔄 useUserBounties: Fetching bounties for wallet:', walletAddress?.slice(0, 8) + '...');
        
                // Fetch user tracking data with simple cache-busting
                const response = await fetch(
                  `/api/users/track?wallet=${walletAddress}&t=${Date.now()}`,
                  { cache: 'no-store' }
                );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ useUserBounties: API response error:', response.status, errorText);
          throw new Error(`Failed to fetch user data: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('📊 useUserBounties: Received data:', data);
        
        // Extract bounty submissions from the user tracking data
        const bountySubmissions = data.submissions || [];
        const bountyCompletions = data.bountyCompletions || [];
        
        // Calculate stats
        const totalSubmissions = bountySubmissions.length;
        const totalXP = bountyCompletions.reduce((sum: number, completion: any) => sum + (completion.xp_awarded || 0), 0);
        const totalSOL = bountyCompletions.reduce((sum: number, completion: any) => sum + (completion.sol_prize || 0), 0);
        const wins = bountyCompletions.length; // Completed bounties count as wins
        const pendingSubmissions = bountySubmissions.filter((sub: any) => sub.status === 'pending').length;
        
        const newStats = {
          totalSubmissions,
          totalXP,
          totalSOL,
          wins,
          pendingSubmissions
        };
        
        console.log('✅ useUserBounties: Setting stats:', newStats);
        setSubmissions(bountySubmissions);
        setStats(newStats);
      } catch (err) {
        console.error('💥 useUserBounties: Error fetching user bounties:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user bounties');
        // Set default values on error
        setSubmissions([]);
        setStats({
          totalSubmissions: 0,
          totalXP: 0,
          totalSOL: 0,
          wins: 0,
          pendingSubmissions: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserBounties();
  }, [walletAddress]);

  // Auto-refresh bounties every 2 minutes (reduced frequency)
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(() => {
      console.log('⏰ [useUserBounties] Auto-refreshing...');
      const fetchUserBounties = async () => {
        try {
          const response = await fetch(
            `/api/users/track?wallet=${walletAddress}&t=${Date.now()}`,
            { cache: 'no-store' }
          );
          if (response.ok) {
            const data = await response.json();
            const bountySubmissions = data.submissions || [];
            const bountyCompletions = data.bountyCompletions || [];
            
            const totalSubmissions = bountySubmissions.length;
            const totalXP = bountyCompletions.reduce((sum: number, completion: any) => sum + (completion.xp_awarded || 0), 0);
            const totalSOL = bountyCompletions.reduce((sum: number, completion: any) => sum + (completion.sol_prize || 0), 0);
            const wins = bountyCompletions.length;
            const pendingSubmissions = bountySubmissions.filter((sub: any) => sub.status === 'pending').length;
            
            setSubmissions(bountySubmissions);
            setStats({ totalSubmissions, totalXP, totalSOL, wins, pendingSubmissions });
          }
        } catch (err) {
          console.error('Error auto-refreshing bounties:', err);
        }
      };
      fetchUserBounties();
    }, 120000); // 2 minutes instead of 30 seconds

    return () => clearInterval(interval);
  }, [walletAddress]);

  return {
    submissions,
    stats,
    loading,
    error
  };
}

