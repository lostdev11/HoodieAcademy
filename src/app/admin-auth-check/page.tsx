'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminAuthCheck() {
  const router = useRouter();
  const { wallet, isAdmin, loading, error, connectWallet, refreshAdminStatus } = useWalletSupabase();
  const [checking, setChecking] = useState(true);

  // Debug logging
  console.log('🔍 AdminAuthCheck - Current state:', { wallet, isAdmin, loading, error, checking });

  // Force admin status check when wallet is available
  useEffect(() => {
    if (wallet && !isAdmin && !loading) {
      console.log('🔍 Force checking admin status for wallet:', wallet);
      // Force a direct admin check using the hook's refresh function
      const forceAdminCheck = async () => {
        try {
          console.log('🔄 Calling refreshAdminStatus...');
          await refreshAdminStatus();
          
          // Wait a moment for state to update
          setTimeout(() => {
            console.log('⏳ Checking if admin status updated...');
            // Force a direct database check as backup
            const directCheck = async () => {
              try {
                const { supabase } = await import('@/lib/supabase');
                
                const { data, error: adminError } = await supabase
                  .from('users')
                  .select('is_admin')
                  .eq('wallet_address', wallet)
                  .single();
                
                                 if (!adminError && data?.is_admin) {
                   console.log('✅ Direct admin check successful, redirecting...');
                   // Use window.location.replace to avoid redirect loops
                   window.location.replace('/admin');
                 } else {
                  console.log('❌ Direct admin check failed or not admin:', adminError || data);
                  setChecking(false);
                }
              } catch (error) {
                console.error('Direct admin check error:', error);
                setChecking(false);
              }
            };
            
            directCheck();
          }, 500);
        } catch (error) {
          console.error('Force admin check error:', error);
          setChecking(false);
        }
      };
      
      forceAdminCheck();
    }
  }, [wallet, isAdmin, loading, router, refreshAdminStatus]);

    useEffect(() => {
    console.log('🔄 AdminAuthCheck - useEffect triggered:', { wallet, isAdmin, loading });
    
    // If wallet is connected and user is admin, redirect to admin dashboard
    if (wallet && isAdmin) {
      console.log('✅ Redirecting to admin dashboard...');
      // Use window.location directly to avoid redirect loops
      console.log('🔄 Using window.location to redirect to /admin');
      // Force redirect and prevent further rendering
      window.location.replace('/admin');
      return;
    }
    
    // If wallet is connected but not admin, show access denied
    if (wallet && !isAdmin && !loading) {
      console.log('❌ Wallet connected but not admin, showing access denied');
      setChecking(false);
      return;
    }
    
    // If no wallet and not loading, show connect prompt
    if (!wallet && !loading) {
      console.log('🔌 No wallet, showing connect prompt');
      setChecking(false);
    }
  }, [wallet, isAdmin, loading, router]);

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
            <CardTitle>Verifying Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-400">Checking wallet connection and admin status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Card className="bg-slate-800/50 border-red-500/30 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-red-400">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-400 mb-4">Failed to connect wallet:</p>
            <Badge variant="outline" className="border-red-500 text-red-400 mb-4">
              {error}
            </Badge>
            <Button onClick={handleConnectWallet} className="w-full">
              <User className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (wallet && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Card className="bg-slate-800/50 border-red-500/30 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-400 mb-4">
              Wallet connected but admin access is required.
            </p>
            <Badge variant="outline" className="border-blue-500 text-blue-400 mb-4">
              {wallet.slice(0, 4)}...{wallet.slice(-4)}
            </Badge>
            <p className="text-sm text-slate-500 mb-4">
              This wallet address is not registered as an admin.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={refreshAdminStatus} 
                className="w-full"
              >
                🔄 Refresh Admin Status
              </Button>
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

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <CardTitle>Admin Access Required</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-slate-400 mb-6">
            Please connect your admin wallet to access the admin dashboard.
          </p>
          <Button onClick={handleConnectWallet} className="w-full">
            <User className="w-4 h-4 mr-2" />
            Connect Admin Wallet
          </Button>
          <p className="text-xs text-slate-500 mt-4">
            Only wallets with admin privileges can access this area.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
