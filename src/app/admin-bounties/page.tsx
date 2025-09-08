'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import BountyManagerSimple from '@/components/admin/BountyManagerSimple';

interface Bounty {
  id?: string;
  title: string;
  short_desc: string;
  reward: string;
  reward_type: 'XP' | 'SOL' | 'NFT';
  start_date?: string;
  deadline?: string;
  status: 'active' | 'completed' | 'expired';
  hidden: boolean;
  squad_tag?: string;
  submissions?: number;
  nft_prize?: string;
  nft_prize_image?: string;
  nft_prize_description?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminBountiesPage() {
  const { wallet: walletAddress, isAdmin, connectWallet, loading: walletLoading } = useWalletSupabase();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bounties on component mount
  useEffect(() => {
    const fetchBounties = async () => {
      try {
        const response = await fetch('/api/bounties');
        if (response.ok) {
          const data = await response.json();
          setBounties(data);
        }
      } catch (error) {
        console.error('Error fetching bounties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();
  }, []);

  // Client-side admin protection
  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            Please connect your wallet to access the admin dashboard.
          </p>
          <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Admin Access Required</h1>
          <p className="text-slate-400 mb-6">
            This wallet ({walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}) does not have admin privileges.
          </p>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Fetching bounties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <BountyManagerSimple 
          bounties={bounties} 
          onBountiesChange={setBounties}
          walletAddress={walletAddress}
        />
      </div>
    </div>
  );
}
