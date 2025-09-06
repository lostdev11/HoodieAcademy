'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';

export default function AdminBypassPage() {
  const { wallet: walletAddress, isAdmin, connectWallet, loading: walletLoading } = useWalletSupabase();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    console.log('🔄 AdminBypass - State changed:', { walletAddress, isAdmin, walletLoading });
  }, [walletAddress, isAdmin, walletLoading]);

  const runDebugTests = async () => {
    console.log('🧪 Running debug tests...');
    const results: any = {};

    try {
      // Test 1: Check localStorage
      const storedWallet = localStorage.getItem('hoodie_academy_wallet');
      const storedAdmin = localStorage.getItem('hoodie_academy_is_admin');
      results.localStorage = { storedWallet, storedAdmin };

      // Test 2: Check RPC function directly
      const response = await fetch(`/api/admin-auth-check?wallet=${walletAddress || 'no-wallet'}`);
      const apiData = await response.json();
      results.apiCheck = apiData;

      // Test 3: Check if wallet is connected
      const provider = typeof window !== 'undefined' ? window.solana : undefined;
      results.walletProvider = {
        exists: !!provider,
        connected: !!provider?.publicKey,
        publicKey: provider?.publicKey?.toString() || 'none'
      };

      setTestResults(results);
      console.log('✅ Debug tests completed:', results);
    } catch (error) {
      console.error('❌ Debug tests failed:', error);
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const clearCache = () => {
    localStorage.removeItem('hoodie_academy_wallet');
    localStorage.removeItem('hoodie_academy_is_admin');
    sessionStorage.clear();
    console.log('🗑️ Cache cleared');
    window.location.reload();
  };

  const forceAdmin = () => {
    if (walletAddress) {
      localStorage.setItem('hoodie_academy_is_admin', 'true');
      console.log('🔧 Forced admin status to true');
      window.location.reload();
    }
  };

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">No Wallet Connected</h1>
          <p className="text-slate-400 mb-6">
            Please connect your wallet first.
          </p>
          <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Bypass Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Wallet:</strong> {walletAddress}</p>
              <p><strong>Admin Status:</strong> {isAdmin ? '✅ TRUE' : '❌ FALSE'}</p>
              <p><strong>Loading:</strong> {walletLoading ? 'Yes' : 'No'}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={runDebugTests} className="w-full">
                Run Debug Tests
              </Button>
              <Button onClick={clearCache} variant="outline" className="w-full">
                Clear Cache & Reload
              </Button>
              <Button onClick={forceAdmin} variant="destructive" className="w-full">
                Force Admin = True
              </Button>
            </CardContent>
          </Card>
        </div>

        {testResults && (
          <Card className="bg-slate-800 mb-8">
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {isAdmin ? (
          <Card className="bg-green-900 border-green-700">
            <CardHeader>
              <CardTitle className="text-green-400">✅ Admin Access Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You have admin access! You can now navigate to the admin dashboard.</p>
              <Button 
                onClick={() => window.location.href = '/admin'} 
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                Go to Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-red-900 border-red-700">
            <CardHeader>
              <CardTitle className="text-red-400">❌ Admin Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Admin access is not working. Try the debug tests and force admin options above.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
