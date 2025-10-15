'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hand, Check, X, User } from 'lucide-react';

interface PendingRequest {
  id: string;
  student_wallet: string;
  student_name: string;
  requested_at: string;
  status: string;
}

interface HostPermissionPanelProps {
  sessionId: string;
  hostWallet: string;
}

export function HostPermissionPanel({ sessionId, hostWallet }: HostPermissionPanelProps) {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequests();

    // Poll for new requests every 5 seconds
    const interval = setInterval(fetchPendingRequests, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`/api/mentorship/permissions/pending?session_id=${sessionId}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const handleApprove = async (permissionId: string) => {
    setProcessing(permissionId);
    try {
      const response = await fetch('/api/mentorship/permissions/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permission_id: permissionId,
          host_wallet: hostWallet,
          action: 'approve',
          can_speak: true,
          can_show_video: true
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Permission approved');
        // Remove from list
        setRequests(prev => prev.filter(r => r.id !== permissionId));
      } else {
        alert('Failed to approve: ' + data.error);
      }
    } catch (error) {
      console.error('Error approving permission:', error);
      alert('Failed to approve permission');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (permissionId: string) => {
    setProcessing(permissionId);
    try {
      const response = await fetch('/api/mentorship/permissions/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permission_id: permissionId,
          host_wallet: hostWallet,
          action: 'deny'
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('❌ Permission denied');
        // Remove from list
        setRequests(prev => prev.filter(r => r.id !== permissionId));
      } else {
        alert('Failed to deny: ' + data.error);
      }
    } catch (error) {
      console.error('Error denying permission:', error);
      alert('Failed to deny permission');
    } finally {
      setProcessing(null);
    }
  };

  if (requests.length === 0) {
    return null; // Don't show panel if no requests
  }

  return (
    <Card className="bg-gradient-to-r from-orange-900/30 to-purple-900/30 border-orange-500/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center animate-pulse">
          <Hand className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
            ✋ Students Waiting to Speak
            <Badge className="bg-orange-600 text-white">{requests.length}</Badge>
          </h3>
          <p className="text-sm text-gray-400">Approve or deny their requests below</p>
        </div>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-900/40 rounded-full flex items-center justify-center border border-purple-500/50">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-200 font-semibold">{request.student_name}</p>
                <p className="text-xs text-gray-500">{request.student_wallet.slice(0, 16)}...</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(request.id)}
                disabled={processing === request.id}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {processing === request.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleDeny(request.id)}
                disabled={processing === request.id}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                size="sm"
              >
                <X className="w-4 h-4 mr-1" />
                Deny
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-xs text-gray-300 text-center">
          💡 <strong>Tip:</strong> Approved students will be able to turn on their camera and microphone
        </p>
      </div>
    </Card>
  );
}

