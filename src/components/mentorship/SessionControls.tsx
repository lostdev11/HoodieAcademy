'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  StopCircle, 
  Settings, 
  Users, 
  UserPlus,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SessionControlsProps {
  sessionId: string;
  walletAddress: string | null;
  currentStatus: string;
  onStatusChange?: () => void;
}

interface Permission {
  allowed: boolean;
  reason: string;
  role: string;
}

export function SessionControls({ 
  sessionId, 
  walletAddress, 
  currentStatus,
  onStatusChange 
}: SessionControlsProps) {
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [goingLive, setGoingLive] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      checkPermissions();
    } else {
      setLoading(false);
    }
  }, [walletAddress, sessionId]);

  const checkPermissions = async () => {
    if (!walletAddress) return;

    try {
      const res = await fetch('/api/mentorship/check-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          session_id: sessionId
        })
      });

      const data = await res.json();
      setPermission(data);
      console.log('🔐 Permissions:', data);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet');
      return;
    }

    setGoingLive(true);
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
        alert('🎉 Session is now LIVE!');
        onStatusChange?.();
      } else {
        alert(`❌ Failed to go live: ${data.error || data.reason}`);
      }
    } catch (error) {
      console.error('Error going live:', error);
      alert('Failed to go live. Please try again.');
    } finally {
      setGoingLive(false);
    }
  };

  const handleEndSession = async () => {
    if (!walletAddress) return;

    const recordingUrl = prompt('Enter recording URL (optional):');

    setEnding(true);
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
        onStatusChange?.();
      } else {
        alert(`❌ Failed to end session: ${data.error}`);
      }
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session. Please try again.');
    } finally {
      setEnding(false);
    }
  };

  // Don't show anything if loading
  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-600/30">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Checking permissions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show if user has no permissions
  if (!permission?.allowed) {
    return null;
  }

  // Show controls
  return (
    <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-cyan-300 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Session Controls
            </CardTitle>
            <CardDescription>
              You have {permission.role} access
            </CardDescription>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            {permission.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Current Status:</span>
            <Badge className={
              currentStatus === 'live' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
              currentStatus === 'scheduled' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
              currentStatus === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
              'bg-gray-500/20 text-gray-300 border-gray-500/30'
            }>
              {currentStatus === 'live' && '🔴 '}
              {currentStatus.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Go Live Button */}
        {currentStatus === 'scheduled' && (
          <Button
            onClick={handleGoLive}
            disabled={goingLive}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-lg py-6"
          >
            {goingLive ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Going Live...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                🎬 GO LIVE NOW
              </>
            )}
          </Button>
        )}

        {/* End Session Button */}
        {currentStatus === 'live' && (
          <Button
            onClick={handleEndSession}
            disabled={ending}
            variant="outline"
            className="w-full border-red-500/30 text-red-300 hover:bg-red-500/20 font-semibold py-4"
          >
            {ending ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Ending...
              </>
            ) : (
              <>
                <StopCircle className="w-4 h-4 mr-2" />
                End Session
              </>
            )}
          </Button>
        )}

        {/* Info Message */}
        {currentStatus === 'scheduled' && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1">Ready to go live?</p>
                <p className="text-blue-200">
                  When you click "GO LIVE", students will see the stream and can join immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStatus === 'live' && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mt-1"></span>
              <div className="text-sm text-red-300">
                <p className="font-semibold">Session is LIVE</p>
                <p className="text-red-200">Students can join now. Click "End Session" when done.</p>
              </div>
            </div>
          </div>
        )}

        {currentStatus === 'completed' && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div className="text-sm text-green-300">
                <p className="font-semibold">Session Completed</p>
                <p className="text-green-200">This session has ended.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

