'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAdminStatus() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const wallet = localStorage.getItem('walletAddress') || localStorage.getItem('connectedWallet');
    setWalletAddress(wallet);
  }, []);

  const checkAdminStatus = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      console.log('🔍 Testing admin status for wallet:', walletAddress);
      
      // Use direct admin check to bypass RLS policy issues
      const { checkAdminStatusDirect, getUserByWallet } = await import('@/lib/admin-check');
      const user = await getUserByWallet(walletAddress);
      
      console.log('🔍 User data:', user);
      setUserData(user);
      
      const adminStatus = await checkAdminStatusDirect(walletAddress);
      console.log('🔍 Admin status:', adminStatus);
      setIsAdmin(adminStatus);
      
    } catch (error) {
      console.error('💥 Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-cyan-400">Admin Status Test Page</h1>
        
        <Card className="bg-slate-800/50">
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Wallet Address:</strong> {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Not connected'}
            </div>
            
            <div>
              <strong>Admin Status:</strong> {isAdmin === null ? 'Not checked' : isAdmin ? '✅ Admin' : '❌ Not Admin'}
            </div>
            
            <Button 
              onClick={checkAdminStatus} 
              disabled={!walletAddress || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Checking...' : 'Check Admin Status'}
            </Button>
          </CardContent>
        </Card>

        {userData && (
          <Card className="bg-slate-800/50">
            <CardHeader>
              <CardTitle>User Data from Database</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-800/50">
          <CardHeader>
            <CardTitle>Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>Make sure you're connected with a wallet that has admin privileges</li>
              <li>Click "Check Admin Status" button</li>
              <li>Check the browser console for detailed logs</li>
              <li>Look for the user data above to see if <code>is_admin</code> is true</li>
              <li>If you see admin status as true but no Admin tab, there's a UI issue</li>
              <li>If admin status is false, check your database user record</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
