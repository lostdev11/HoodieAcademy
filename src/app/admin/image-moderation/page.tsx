'use client';

import { useState, useEffect } from 'react';
import { ImageModerationPanel } from '@/components/admin/ImageModerationPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { 
  Shield, 
  Database, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export default function ImageModerationPage() {
  const { wallet: walletAddress, isAdmin, connectWallet, loading: walletLoading } = useWalletSupabase();
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const checkMigrationStatus = async () => {
    try {
      const response = await fetch('/api/admin/migrate-moderated-images');
      if (response.ok) {
        const data = await response.json();
        setMigrationStatus(data);
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
  };

  const runMigration = async () => {
    try {
      setIsMigrating(true);
      const response = await fetch('/api/admin/migrate-moderated-images', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Migration completed:', result);
        await checkMigrationStatus();
      } else {
        const error = await response.json();
        console.error('❌ Migration failed:', error);
        alert(`Migration failed: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Migration error:', error);
      alert('Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      checkMigrationStatus();
    }
  }, [isAdmin]);

  // Admin protection
  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            Please connect your wallet to access the image moderation panel.
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
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
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

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">
              🛡️ Image Moderation Panel
            </h1>
            <p className="text-gray-400">
              Review and moderate uploaded images for bounty submissions
            </p>
          </div>
          <Button
            onClick={checkMigrationStatus}
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Migration Status */}
        {migrationStatus && (
          <Card className="bg-slate-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant={migrationStatus.tablesExist ? "default" : "destructive"}>
                    {migrationStatus.tablesExist ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Tables Ready
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Tables Missing
                      </>
                    )}
                  </Badge>
                  <span className="text-gray-400">{migrationStatus.message}</span>
                </div>
                
                {!migrationStatus.tablesExist && (
                  <Button
                    onClick={runMigration}
                    disabled={isMigrating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isMigrating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating Tables...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Create Tables
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-yellow-500/30">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.pending_review || 0}
                </div>
                <div className="text-sm text-gray-400">Pending Review</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-green-500/30">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-400">
                  {stats.approved || 0}
                </div>
                <div className="text-sm text-gray-400">Approved</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-red-500/30">
              <CardContent className="p-4 text-center">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-400">
                  {stats.rejected || 0}
                </div>
                <div className="text-sm text-gray-400">Rejected</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-gray-500/30">
              <CardContent className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-400">
                  {stats.deleted || 0}
                </div>
                <div className="text-sm text-gray-400">Deleted</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Moderation Panel */}
        {migrationStatus?.tablesExist && (
          <ImageModerationPanel />
        )}
      </div>
    </div>
  );
}
