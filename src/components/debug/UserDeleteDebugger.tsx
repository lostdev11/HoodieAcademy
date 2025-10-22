'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface UserDeleteDebuggerProps {
  adminWallet: string;
}

export default function UserDeleteDebugger({ adminWallet }: UserDeleteDebuggerProps) {
  const [targetWallet, setTargetWallet] = useState('');
  const [debugResults, setDebugResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debugUserDeletion = async () => {
    if (!targetWallet.trim()) {
      alert('Please enter a target wallet address');
      return;
    }

    setLoading(true);
    setDebugResults(null);

    try {
      console.log('🔍 Debugging user deletion for:', targetWallet);

      // Step 1: Check if target user exists
      const userCheckResponse = await fetch(`/api/user-profile?wallet=${targetWallet}`);
      const userCheckData = await userCheckResponse.json();
      console.log('👤 User check result:', userCheckData);

      // Step 2: Check admin status
      const adminCheckResponse = await fetch(`/api/user-profile?wallet=${adminWallet}`);
      const adminCheckData = await adminCheckResponse.json();
      console.log('👑 Admin check result:', adminCheckData);

      // Step 3: Try the actual deletion API
      const deleteResponse = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_wallet: adminWallet,
          target_wallet: targetWallet
        })
      });

      const deleteData = await deleteResponse.json();
      console.log('🗑️ Delete API result:', deleteData);

      setDebugResults({
        targetUser: userCheckData,
        adminUser: adminCheckData,
        deleteResult: deleteData,
        deleteStatus: deleteResponse.status
      });

    } catch (error) {
      console.error('❌ Debug error:', error);
      setDebugResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl bg-slate-800 border-red-500/30">
      <CardHeader>
        <CardTitle className="text-red-400 flex items-center gap-2">
          🗑️ User Deletion Debugger
          <Badge variant="outline" className="text-xs">
            Admin: {adminWallet.slice(0, 8)}...
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter target wallet address to debug..."
            value={targetWallet}
            onChange={(e) => setTargetWallet(e.target.value)}
            className="bg-slate-700 border-slate-600"
          />
          <Button 
            onClick={debugUserDeletion} 
            disabled={loading || !targetWallet.trim()}
            variant="destructive"
          >
            {loading ? 'Debugging...' : 'Debug Deletion'}
          </Button>
        </div>

        {/* Results */}
        {debugResults && (
          <div className="space-y-4">
            {/* Target User Check */}
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Target User Check</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">User Exists:</span>
                  <Badge className={debugResults.targetUser?.success ? 'bg-green-600' : 'bg-red-600'}>
                    {debugResults.targetUser?.success ? '✅ Yes' : '❌ No'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400">Display Name:</span>
                  <span className="text-white ml-2">{debugResults.targetUser?.profile?.displayName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Squad:</span>
                  <span className="text-white ml-2">{debugResults.targetUser?.profile?.squad?.name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Level:</span>
                  <span className="text-white ml-2">{debugResults.targetUser?.profile?.level || 'N/A'}</span>
                </div>
              </div>
              {debugResults.targetUser?.error && (
                <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">
                  Error: {debugResults.targetUser.error}
                </div>
              )}
            </div>

            {/* Admin Check */}
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Admin Check</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Admin Exists:</span>
                  <Badge className={debugResults.adminUser?.success ? 'bg-green-600' : 'bg-red-600'}>
                    {debugResults.adminUser?.success ? '✅ Yes' : '❌ No'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400">Is Admin:</span>
                  <Badge className={debugResults.adminUser?.profile?.isAdmin ? 'bg-green-600' : 'bg-red-600'}>
                    {debugResults.adminUser?.profile?.isAdmin ? '✅ Yes' : '❌ No'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400">Display Name:</span>
                  <span className="text-white ml-2">{debugResults.adminUser?.profile?.displayName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Same Wallet:</span>
                  <Badge className={adminWallet === targetWallet ? 'bg-yellow-600' : 'bg-green-600'}>
                    {adminWallet === targetWallet ? '⚠️ Yes (Cannot delete self)' : '✅ No'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Delete API Result */}
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Delete API Result</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Status Code:</span>
                  <Badge className={debugResults.deleteStatus === 200 ? 'bg-green-600' : 'bg-red-600'}>
                    {debugResults.deleteStatus}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400">Success:</span>
                  <Badge className={debugResults.deleteResult?.success ? 'bg-green-600' : 'bg-red-600'}>
                    {debugResults.deleteResult?.success ? '✅ Yes' : '❌ No'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Message:</span>
                  <div className="text-white mt-1">
                    {debugResults.deleteResult?.message || debugResults.deleteResult?.error || 'No message'}
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Analysis</h4>
              <div className="text-sm space-y-1">
                {!debugResults.targetUser?.success && (
                  <div className="text-red-400">❌ Target user not found in database</div>
                )}
                {!debugResults.adminUser?.profile?.isAdmin && (
                  <div className="text-red-400">❌ Admin user is not marked as admin</div>
                )}
                {adminWallet === targetWallet && (
                  <div className="text-yellow-400">⚠️ Cannot delete your own account</div>
                )}
                {debugResults.deleteResult?.success && (
                  <div className="text-green-400">✅ User deletion successful</div>
                )}
                {debugResults.deleteResult?.error && (
                  <div className="text-red-400">❌ Delete failed: {debugResults.deleteResult.error}</div>
                )}
              </div>
            </div>

            {/* Raw Data */}
            <details className="p-3 bg-slate-700/30 rounded-lg">
              <summary className="text-white font-semibold cursor-pointer">Raw Debug Data</summary>
              <pre className="text-xs text-gray-300 mt-2 overflow-auto max-h-60">
                {JSON.stringify(debugResults, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Quick Test Buttons */}
        <div className="p-3 bg-slate-700/30 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Quick Tests</h4>
          <div className="flex gap-2 flex-wrap">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setTargetWallet('test-wallet-123')}
            >
              Test with Fake Wallet
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setTargetWallet(adminWallet)}
            >
              Test Self-Deletion
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
