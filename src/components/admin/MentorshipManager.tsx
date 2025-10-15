'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  UserPlus, 
  UserMinus, 
  Users,
  Video,
  CheckCircle,
  XCircle,
  Calendar,
  Play,
  StopCircle,
  Clock,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface MentorshipSession {
  id: string;
  title: string;
  mentor_name: string;
  scheduled_date: string;
  status: string;
  current_rsvps: number;
  stream_platform: string;
}

interface MentorshipManagerProps {
  walletAddress: string | null;
}

export function MentorshipManager({ walletAddress }: MentorshipManagerProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'presenters' | 'sessions'>('presenters');
  
  // Presenters state
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [loadingPresenters, setLoadingPresenters] = useState(true);
  const [newWallet, setNewWallet] = useState('');
  const [newRole, setNewRole] = useState('presenter');
  const [granting, setGranting] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    fetchPresenters();
    fetchAllSessions();
  }, []);

  // Separate effect for auto-granting admin access after presenters are loaded
  useEffect(() => {
    if (walletAddress && !loadingPresenters) {
      autoGrantAdminAccess();
    }
  }, [walletAddress, loadingPresenters, presenters.length]);

  const fetchPresenters = async () => {
    try {
      const res = await fetch('/api/mentorship/presenters');
      const data = await res.json();
      setPresenters(data.presenters || []);
    } catch (error) {
      console.error('Error fetching presenters:', error);
    } finally {
      setLoadingPresenters(false);
    }
  };

  const fetchAllSessions = async () => {
    try {
      // Fetch both upcoming and past
      const upcomingRes = await fetch('/api/mentorship/sessions?type=upcoming&limit=50');
      const upcomingData = await upcomingRes.json();
      
      const pastRes = await fetch('/api/mentorship/sessions?type=past&limit=20');
      const pastData = await pastRes.json();
      
      setSessions([...(upcomingData.sessions || []), ...(pastData.sessions || [])]);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const autoGrantAdminAccess = async () => {
    if (!walletAddress) return;
    
    try {
      // Check if user is admin and not already a presenter
      const isAdmin = await checkAdminStatus(walletAddress);
      const isAlreadyPresenter = presenters.some(p => p.wallet_address === walletAddress);
      
      if (isAdmin && !isAlreadyPresenter) {
        // Auto-grant admin presenter access
        const response = await fetch('/api/mentorship/presenters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: walletAddress,
            role: 'admin',
            can_create_sessions: true,
            can_go_live: true,
            can_manage_all_sessions: true,
            granted_by: walletAddress,
            notes: 'Auto-granted admin access'
          })
        });
        
        if (response.ok) {
          console.log('✅ Admin automatically granted presenter access');
          fetchPresenters(); // Reload to show the new presenter
        }
      }
    } catch (error) {
      console.error('Failed to auto-grant admin access:', error);
    }
  };

  const checkAdminStatus = async (wallet: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: wallet })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.isAdmin || false;
      }
      return false;
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWallet.trim() || !walletAddress) {
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
          assigned_by: walletAddress
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

  const handleRevokeAccess = async (targetWallet: string) => {
    if (!walletAddress) {
      alert('❌ Admin wallet not connected');
      return;
    }

    if (!confirm(`Revoke presenter access for ${targetWallet}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/mentorship/presenters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: targetWallet,
          admin_wallet: walletAddress
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

  const handleGoLive = async (sessionId: string) => {
    if (!walletAddress) return;

    if (!confirm('Ready to go live? This will open the live streaming interface.')) return;

    try {
      const res = await fetch('/api/mentorship/go-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          wallet_address: walletAddress
        })
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to live session page
        console.log('🎬 Redirecting to live session interface...');
        router.push(`/mentorship/${sessionId}`);
      } else {
        alert(`❌ Failed: ${data.error || data.reason}`);
      }
    } catch (error) {
      console.error('Error going live:', error);
      alert('Failed to go live. Please try again.');
    }
  };

  const handleEndSession = async (sessionId: string) => {
    if (!walletAddress) return;

    const recordingUrl = prompt('Enter recording URL (optional):');

    try {
      const res = await fetch('/api/mentorship/end-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          wallet_address: walletAddress,
          recording_url: recordingUrl || undefined
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Session ended successfully!');
        fetchAllSessions();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session. Please try again.');
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'live': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Mentorship Management</h2>
          <p className="text-gray-400">Manage presenters and control live sessions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'presenters' ? 'default' : 'outline'}
            onClick={() => setActiveView('presenters')}
            className={activeView === 'presenters' ? 'bg-cyan-600' : 'border-slate-600'}
          >
            <Users className="w-4 h-4 mr-2" />
            Presenters
          </Button>
          <Button
            variant={activeView === 'sessions' ? 'default' : 'outline'}
            onClick={() => setActiveView('sessions')}
            className={`${activeView === 'sessions' ? 'bg-cyan-600' : 'border-slate-600'} relative`}
          >
            <Video className="w-4 h-4 mr-2" />
            Sessions
            {sessions.filter(s => s.status === 'live').length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">
                  {sessions.filter(s => s.status === 'live').length}
                </span>
              </span>
            )}
            {sessions.filter(s => s.status === 'scheduled' || !s.status).length > 0 && sessions.filter(s => s.status === 'live').length === 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="relative inline-flex rounded-full h-5 w-5 bg-orange-500 text-white text-xs items-center justify-center">
                  {sessions.filter(s => s.status === 'scheduled' || !s.status).length}
                </span>
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Presenters View */}
      {activeView === 'presenters' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Grant Access Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
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
                    <option value="presenter">Presenter</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                    <option value="guest">Guest (Temporary)</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300 font-semibold mb-1">
                    Permissions granted:
                  </p>
                  <ul className="text-sm text-blue-200 space-y-1">
                    <li>✓ Create sessions</li>
                    <li>✓ Go live on own sessions</li>
                    {newRole === 'admin' && <li className="text-cyan-300">✓ Full control (all sessions)</li>}
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={granting || !newWallet.trim()}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  {granting ? 'Granting...' : 'Grant Access'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Presenters List */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                Active Presenters ({presenters.length})
              </CardTitle>
              <CardDescription>
                Users who can create sessions and go live
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPresenters ? (
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
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {presenters.map((presenter) => (
                    <div
                      key={presenter.wallet_address}
                      className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
      )}

      {/* Sessions View */}
      {activeView === 'sessions' && (
        <>
          {/* Quick Go Live Section */}
          {sessions.filter(s => s.status === 'scheduled' || s.status === null || s.status === undefined).length > 0 && (
            <Card className="bg-gradient-to-r from-red-900/40 to-slate-800 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Play className="w-5 h-5 text-red-400 animate-pulse" />
                  Ready to Go Live
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {sessions.filter(s => s.status === 'scheduled' || s.status === null || s.status === undefined).length} session(s) scheduled and ready to broadcast
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sessions.filter(s => s.status === 'scheduled' || s.status === null || s.status === undefined).map((session) => (
                    <div
                      key={session.id}
                      className="p-3 bg-slate-900/70 rounded-lg border border-red-500/20 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-200">{session.title}</h4>
                        <p className="text-xs text-gray-400">
                          {new Date(session.scheduled_date).toLocaleString()} • {session.current_rsvps} RSVPs
                        </p>
                      </div>
                      <Button
                        onClick={() => handleGoLive(session.id)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-500/30"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Go Live Now
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              All Sessions ({sessions.length})
            </CardTitle>
            <CardDescription>
              View and control all mentorship sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSessions ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No sessions yet</p>
                <p className="text-gray-500 text-sm">Create sessions via SQL or API</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-200 mb-1">{session.title}</h4>
                        <p className="text-sm text-gray-400">by {session.mentor_name}</p>
                      </div>
                      <Badge className={`${getStatusColor(session.status || 'scheduled')} border`}>
                        {session.status === 'live' && '🔴 '}
                        {(session.status || 'scheduled').toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.scheduled_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {session.current_rsvps} RSVPs
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {session.stream_platform}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/mentorship/${session.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-slate-600 hover:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>

                      {(session.status === 'scheduled' || !session.status) && (
                        <Button
                          onClick={() => handleGoLive(session.id)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Go Live
                        </Button>
                      )}

                      {session.status === 'live' && (
                        <Button
                          onClick={() => handleEndSession(session.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                        >
                          <StopCircle className="w-4 h-4 mr-2" />
                          End
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{presenters.length}</p>
              <p className="text-sm text-gray-400">Active Presenters</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {sessions.filter(s => s.status === 'scheduled' || !s.status).length}
              </p>
              <p className="text-sm text-gray-400">Scheduled</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <Play className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {sessions.filter(s => s.status === 'live').length}
              </p>
              <p className="text-sm text-gray-400">Live Now</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {sessions.filter(s => s.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

