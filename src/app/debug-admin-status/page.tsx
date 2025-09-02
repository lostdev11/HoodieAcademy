'use client';

import { useEffect, useState } from 'react';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { checkAdminStatus, getAdminWallets } from '@/lib/admin-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Database, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DebugAdminStatus() {
  const { wallet, isAdmin, loading, error, connectWallet } = useWalletSupabase();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [checking, setChecking] = useState(false);

  const runDebugCheck = async () => {
    if (!wallet) return;
    
    setChecking(true);
    try {
      // Check admin status directly
      const adminStatus = await checkAdminStatus(wallet);
      
      // Get all admin wallets
      const adminWallets = await getAdminWallets();
      
      setDebugInfo({
        walletAddress: wallet,
        adminStatus,
        adminWallets,
        timestamp: new Date().toISOString(),
        isInAdminList: adminWallets.includes(wallet)
      });
    } catch (err) {
      setDebugInfo({
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (wallet) {
      runDebugCheck();
    }
  }, [wallet]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Admin Status Debug</h1>
        
        {/* Wallet Connection Status */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Wallet Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!wallet ? (
              <div className="text-center">
                <p className="text-slate-400 mb-4">No wallet connected</p>
                <Button onClick={connectWallet}>
                  <User className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Wallet Address:</span>
                  <Badge variant="outline" className="font-mono">
                    {wallet}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Hook Admin Status:</span>
                  <Badge variant={isAdmin ? "default" : "destructive"}>
                    {isAdmin ? "✅ Admin" : "❌ Not Admin"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Loading:</span>
                  <Badge variant="outline">
                    {loading ? "🔄 Loading" : "✅ Ready"}
                  </Badge>
                </div>
                {error && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Error:</span>
                    <Badge variant="destructive">{error}</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Information */}
        {wallet && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Admin Check
                <Button 
                  size="sm" 
                  onClick={runDebugCheck} 
                  disabled={checking}
                  variant="outline"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checking ? (
                <div className="text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-slate-400">Checking admin status...</p>
                </div>
              ) : Object.keys(debugInfo).length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Direct Database Check</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Admin Status:</span>
                          <Badge variant={debugInfo.adminStatus ? "default" : "destructive"}>
                            {debugInfo.adminStatus ? "✅ Admin" : "❌ Not Admin"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">In Admin List:</span>
                          <Badge variant={debugInfo.isInAdminList ? "default" : "destructive"}>
                            {debugInfo.isInAdminList ? "✅ Yes" : "❌ No"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Admin Wallets in Database</h4>
                      <div className="space-y-1">
                        {debugInfo.adminWallets && debugInfo.adminWallets.length > 0 ? (
                          debugInfo.adminWallets.map((adminWallet: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <Badge 
                                variant={adminWallet === wallet ? "default" : "outline"}
                                className="font-mono text-xs"
                              >
                                {adminWallet === wallet ? "✅ " : ""}{adminWallet.slice(0, 6)}...{adminWallet.slice(-4)}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 text-sm">No admin wallets found</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {debugInfo.error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                      <h4 className="font-semibold text-red-400 mb-2">Database Error:</h4>
                      <p className="text-red-300 text-sm">{debugInfo.error}</p>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-500">
                    Last checked: {debugInfo.timestamp}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400">Click refresh to check admin status</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Troubleshooting Tips */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Troubleshooting Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-yellow-400">1.</span>
                <p className="text-slate-300">
                  <strong>Wallet Format:</strong> Make sure the wallet address format matches exactly between your wallet and the database.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400">2.</span>
                <p className="text-slate-300">
                  <strong>Database Admin Flag:</strong> Verify that your wallet address has <code className="bg-slate-700 px-1 rounded">is_admin = true</code> in the users table.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400">3.</span>
                <p className="text-slate-300">
                  <strong>Database Connection:</strong> Check if there are any database connection issues or RLS policy restrictions.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400">4.</span>
                <p className="text-slate-300">
                  <strong>Case Sensitivity:</strong> Wallet addresses are case-sensitive - ensure exact matching.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
