'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { 
  Shield, 
  UserPlus, 
  UserMinus, 
  Users,
  Video,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Presenter {
  wallet_address: string;
  role_name: string;
  can_create_sessions: boolean;
  can_go_live: boolean;
  can_manage_all_sessions: boolean;
  granted_at: string;
  expires_at: string | null;
  display_name: string | null;
  sessions_created: number;
}

export default function AdminMentorshipPage() {
  const { wallet, isAdmin, loading: walletLoading } = useWalletSupabase();
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Grant presenter form
  const [newWallet, setNewWallet] = useState('');
  const [newRole, setNewRole] = useState('presenter');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchPresenters();
    }
  }, [isAdmin]);

  const fetchPresenters = async () => {
    try {
      const res = await fetch('/api/mentorship/presenters');
      const data = await res.json();
      setPresenters(data.presenters || []);
    } catch (error) {
      console.error('Error fetching presenters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWallet.trim()) {
      alert('Please enter a wallet address');
      return;
    }

    setGranting(true);
    try {
      const res = await fetch('/api/mentorship/presenters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: newWallet,
          role_name: newRole,
          can_create_sessions: true,
          can_go_live: true,
          assigned_by: wallet
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Presenter access granted!');
        setNewWallet('');
        fetchPresenters();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error granting access:', error);
      alert('Failed to grant access. Please try again.');
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAccess = async (walletAddress: string) => {
    if (!confirm(`Revoke presenter access for ${walletAddress}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/mentorship/presenters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          admin_wallet: wallet
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Presenter access revoked');
        fetchPresenters();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Failed to revoke access. Please try again.');
    }
  };

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-red-500/10 border-red-500/30 p-8 max-w-md">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-300 mb-2">Admin Access Required</h2>
            <p className="text-gray-400 mb-4">
              You need admin permissions to access this page.
            </p>
            <Link href="/mentorship">
              <Button variant="outline" className="border-cyan-500/30 text-cyan-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sessions
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin-dashboard">
            <Button variant="outline" className="mb-4 border-cyan-500/30 text-cyan-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            🎬 Mentorship Session Management
          </h1>
          <p className="text-gray-300">
            Manage presenters and control who can go live
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Grant Access Card */}
          <Card className="bg-slate-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-400 flex items-center gap-2">
                <UserPlus className="w-6 h-6" />
                Grant Presenter Access
              </CardTitle>
              <CardDescription>
                Allow users to create sessions and go live
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGrantAccess} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Wallet Address
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter wallet address..."
                    value={newWallet}
                    onChange={(e) => setNewWallet(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-gray-200"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-gray-200"
                  >
                    <option value="presenter">Presenter (Can go live on own sessions)</option>
                    <option value="mentor">Mentor (Can create sessions)</option>
                    <option value="admin">Admin (Full control)</option>
                    <option value="guest">Guest (Limited access)</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Permissions granted:</strong>
                  </p>
                  <ul className="text-sm text-blue-200 mt-2 space-y-1">
                    <li>✓ Create sessions</li>
                    <li>✓ Go live on their sessions</li>
                    <li>✓ Manage their own content</li>
                    {newRole === 'admin' && <li className="text-cyan-300">✓ Manage ALL sessions (admin only)</li>}
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={granting || !newWallet.trim()}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
                >
                  {granting ? 'Granting...' : 'Grant Access'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Presenters List */}
          <Card className="bg-slate-800/50 border-slate-600/30">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-200 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Active Presenters ({presenters.length})
              </CardTitle>
              <CardDescription>
                Users who can create sessions and go live
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading presenters...</p>
                </div>
              ) : presenters.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">No presenters yet</p>
                  <p className="text-gray-500 text-sm">Grant access to users to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {presenters.map((presenter) => (
                    <div
                      key={presenter.wallet_address}
                      className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-mono text-sm text-gray-300">
                              {presenter.wallet_address.slice(0, 8)}...{presenter.wallet_address.slice(-6)}
                            </p>
                            <Badge className={
                              presenter.role_name === 'admin' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                              presenter.role_name === 'mentor' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                              'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }>
                              {presenter.role_name}
                            </Badge>
                          </div>
                          {presenter.display_name && (
                            <p className="text-xs text-gray-500">{presenter.display_name}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="flex items-center gap-1">
                          {presenter.can_create_sessions ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-600" />
                          )}
                          <span className="text-gray-400">Create Sessions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {presenter.can_go_live ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-600" />
                          )}
                          <span className="text-gray-400">Go Live</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {presenter.can_manage_all_sessions ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-600" />
                          )}
                          <span className="text-gray-400">Manage All</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="w-3 h-3 text-cyan-400" />
                          <span className="text-gray-400">{presenter.sessions_created} sessions</span>
                        </div>
                      </div>

                      {presenter.expires_at && (
                        <div className="flex items-center gap-1 text-xs text-yellow-400 mb-2">
                          <Calendar className="w-3 h-3" />
                          <span>Expires: {new Date(presenter.expires_at).toLocaleDateString()}</span>
                        </div>
                      )}

                      <Button
                        onClick={() => handleRevokeAccess(presenter.wallet_address)}
                        variant="outline"
                        size="sm"
                        className="w-full border-red-500/30 text-red-300 hover:bg-red-500/20"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Revoke Access
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6 bg-slate-800/50 border-slate-600/30">
          <CardHeader>
            <CardTitle className="text-lg text-gray-200">📝 How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-cyan-400 mb-2">1. Grant Presenter Access</h3>
              <p className="text-gray-400">
                Enter a user's wallet address and select their role. They'll be able to create sessions and go live.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-cyan-400 mb-2">2. Roles Explained</h3>
              <ul className="space-y-2 text-gray-400">
                <li><strong className="text-blue-300">Presenter:</strong> Can create and go live on their own sessions</li>
                <li><strong className="text-purple-300">Mentor:</strong> Same as presenter, designated title</li>
                <li><strong className="text-red-300">Admin:</strong> Full control over all sessions</li>
                <li><strong className="text-gray-300">Guest:</strong> Limited access (view only)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-cyan-400 mb-2">3. Session Control</h3>
              <p className="text-gray-400">
                When a presenter visits their session page, they'll see a "GO LIVE" button. Only authorized users can go live.
              </p>
            </div>

            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-cyan-300">
                <strong>💡 Tip:</strong> Grant yourself presenter access first to test the "GO LIVE" feature!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

