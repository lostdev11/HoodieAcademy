'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { checkAdminStatus } from '@/lib/admin-utils';

export default function AdminDebugPage() {
  const { wallet, isAdmin, connectWallet, loading, error } = useWalletSupabase();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [manualAdminCheck, setManualAdminCheck] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // Hardcoded admin wallets for reference
  const adminWallets = [
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
    '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
    '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
  ];

  useEffect(() => {
    // Update debug info when wallet or admin status changes
    setDebugInfo({
      wallet: wallet || 'Not connected',
      isAdmin: isAdmin,
      loading: loading,
      error: error,
      timestamp: new Date().toISOString(),
      localStorage: {
        storedWallet: typeof window !== 'undefined' ? localStorage.getItem('hoodie_academy_wallet') : 'N/A',
        storedAdmin: typeof window !== 'undefined' ? localStorage.getItem('hoodie_academy_is_admin') : 'N/A'
      },
      phantom: {
        connected: typeof window !== 'undefined' && window.solana?.publicKey ? true : false,
        publicKey: typeof window !== 'undefined' && window.solana?.publicKey ? window.solana.publicKey.toString() : 'N/A'
      }
    });
  }, [wallet, isAdmin, loading, error]);

  const handleManualAdminCheck = async () => {
    if (!wallet) return;
    
    setCheckingAdmin(true);
    try {
      const result = await checkAdminStatus(wallet);
      setManualAdminCheck(result);
      console.log('Manual admin check result:', result);
    } catch (err) {
      console.error('Manual admin check failed:', err);
      setManualAdminCheck(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const forceAdminAccess = () => {
    if (wallet) {
      localStorage.setItem('hoodie_academy_is_admin', 'true');
      localStorage.setItem('hoodie_academy_wallet', wallet);
      window.location.reload();
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('hoodie_academy_wallet');
    localStorage.removeItem('hoodie_academy_is_admin');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              Admin Access Debug
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-700 rounded-lg">
                <h3 className="font-medium text-white mb-2">Wallet Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Connected:</span>
                    <Badge variant={wallet ? "default" : "secondary"}>
                      {wallet ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Address:</span>
                    <code className="text-xs bg-slate-600 px-2 py-1 rounded">
                      {wallet ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : 'None'}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Loading:</span>
                    <Badge variant={loading ? "default" : "secondary"}>
                      {loading ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-700 rounded-lg">
                <h3 className="font-medium text-white mb-2">Admin Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Hook Result:</span>
                    <Badge variant={isAdmin ? "default" : "secondary"} className={isAdmin ? "bg-green-600" : "bg-red-600"}>
                      {isAdmin ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {isAdmin ? 'Admin' : 'Not Admin'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Manual Check:</span>
                    {manualAdminCheck !== null ? (
                      <Badge variant={manualAdminCheck ? "default" : "secondary"} className={manualAdminCheck ? "bg-green-600" : "bg-red-600"}>
                        {manualAdminCheck ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {manualAdminCheck ? 'Admin' : 'Not Admin'}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Not checked</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={connectWallet} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Connect Wallet
              </Button>
              
              <Button 
                onClick={handleManualAdminCheck} 
                disabled={!wallet || checkingAdmin}
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${checkingAdmin ? 'animate-spin' : ''}`} />
                Check Admin Status
              </Button>
              
              <Button 
                onClick={forceAdminAccess} 
                disabled={!wallet}
                variant="outline"
                className="bg-orange-600 hover:bg-orange-700"
              >
                Force Admin Access
              </Button>
              
              <Button 
                onClick={clearStorage} 
                variant="outline"
                className="bg-red-600 hover:bg-red-700"
              >
                Clear Storage
              </Button>
            </div>

            {/* Admin Wallets List */}
            <div className="p-4 bg-slate-700 rounded-lg">
              <h3 className="font-medium text-white mb-3">Configured Admin Wallets</h3>
              <div className="grid grid-cols-1 gap-2">
                {adminWallets.map((adminWallet, index) => (
                  <div key={adminWallet} className="flex items-center justify-between p-2 bg-slate-600 rounded">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-slate-300">
                        {adminWallet.slice(0, 12)}...{adminWallet.slice(-8)}
                      </code>
                      {wallet === adminWallet && (
                        <Badge variant="outline" className="text-blue-400 border-blue-400">
                          Current
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(adminWallet)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Debug Information */}
            <div className="p-4 bg-slate-700 rounded-lg">
              <h3 className="font-medium text-white mb-3">Debug Information</h3>
              <pre className="text-xs text-slate-300 bg-slate-800 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            {/* Quick Access */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => window.open('/admin', '_blank')} variant="outline">
                Open Admin Dashboard
              </Button>
              <Button onClick={() => window.open('/admin-bypass', '_blank')} variant="outline">
                Open Admin Bypass
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
