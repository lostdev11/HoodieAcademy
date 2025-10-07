'use client';

import { EnhancedTrackingDashboard } from '@/components/admin/EnhancedTrackingDashboard';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';

export default function AdminTrackingPage() {
  const { wallet, isAdmin, loading } = useWalletSupabase();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Wallet Required</h1>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to access the tracking dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You need admin privileges to access the tracking dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <EnhancedTrackingDashboard />
    </div>
  );
}
