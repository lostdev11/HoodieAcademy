'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminDirect() {
  const router = useRouter();
  const { wallet, isAdmin, loading, error, connectWallet, refreshAdminStatus } = useWalletSupabase();
  const [redirecting, setRedirecting] = useState(false);

  // Debug logging
  console.log('🔍 AdminDirect - Current state:', { wallet, isAdmin, loading, error, redirecting });

  // Auto-redirect if admin
  useEffect(() => {
    if (wallet && isAdmin && !redirecting) {
      console.log('✅ Admin confirmed, redirecting to admin dashboard...');
      setRedirecting(true);
      // Force redirect
      window.location.replace('/admin');
    }
  }, [wallet, isAdmin, redirecting]);

  // Manual admin check
  const handleCheckAdmin = async () => {
    if (wallet) {
      console.log('🔄 Manually checking admin status...');
      await refreshAdminStatus();
    }
  };

  // Force admin redirect
  const handleForceAdmin = () => {
    console.log('🚀 Force redirecting to admin...');
    window.location.replace('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-400">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle>Redirecting to Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-400">Please wait while we redirect you...</p>
            <Button 
              onClick={handleForceAdmin} 
              className="mt-4 w-full"
            >
              🚀 Force Redirect Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <CardTitle>Direct Admin Access</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {wallet ? (
            <>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                {wallet.slice(0, 4)}...{wallet.slice(-4)}
              </Badge>
              <p className="text-slate-400">
                Wallet connected. Admin status: <strong>{isAdmin ? '✅ Admin' : '❌ Not Admin'}</strong>
              </p>
              <div className="space-y-3">
                <Button onClick={handleCheckAdmin} className="w-full">
                  🔄 Check Admin Status
                </Button>
                <Button onClick={handleForceAdmin} className="w-full">
                  🚀 Force Admin Access
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-400 mb-6">
                Please connect your admin wallet to access the admin dashboard.
              </p>
              <Button onClick={connectWallet} className="w-full">
                <User className="w-4 h-4 mr-2" />
                Connect Admin Wallet
              </Button>
            </>
          )}
          
          <div className="pt-4 border-t border-slate-600">
            <Button 
              onClick={() => router.push('/')} 
              variant="outline" 
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
