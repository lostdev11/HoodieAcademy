'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Gift,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StarterPackClaim {
  id: string;
  wallet_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'delivered' | 'failed';
  payment_tx_signature?: string;
  payment_amount_sol?: number;
  treasury_wallet?: string;
  payment_verified?: boolean;
  payment_verified_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  domain_tx_signature?: string;
  sol_send_tx_signature?: string;
  nft_mint_tx_signature?: string;
  delivery_started_at?: string;
  delivery_completed_at?: string;
  delivery_error?: string;
  domain_name?: string;
  sol_amount_sent?: number;
  nft_mint_address?: string;
  created_at: string;
  updated_at: string;
}

interface StarterPackManagerProps {
  adminWallet: string;
}

export default function StarterPackManager({ adminWallet }: StarterPackManagerProps) {
  const [claims, setClaims] = useState<StarterPackClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<StarterPackClaim | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // Fetch claims
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ walletAddress: adminWallet });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/starter-pack/admin?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch claims');
      }

      setClaims(data.claims || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch claims',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [adminWallet, statusFilter]);

  // Handle approve
  const handleApprove = async (claimId: string) => {
    setActionLoading(claimId);
    try {
      const response = await fetch('/api/starter-pack/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          action: 'approve',
          walletAddress: adminWallet,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve claim');
      }

      toast({
        title: 'Claim Approved',
        description: 'The claim has been approved and delivery will be processed shortly.',
      });

      await fetchClaims();
    } catch (error) {
      console.error('Error approving claim:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve claim',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedClaim || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(selectedClaim.id);
    try {
      const response = await fetch('/api/starter-pack/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: selectedClaim.id,
          action: 'reject',
          walletAddress: adminWallet,
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject claim');
      }

      toast({
        title: 'Claim Rejected',
        description: 'The claim has been rejected.',
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedClaim(null);
      await fetchClaims();
    } catch (error) {
      console.error('Error rejecting claim:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject claim',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/50">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">Approved</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">Delivered</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">Rejected</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const stats = {
    total: claims.length,
    pending: claims.filter(c => c.status === 'pending').length,
    approved: claims.filter(c => c.status === 'approved').length,
    delivered: claims.filter(c => c.status === 'delivered').length,
    rejected: claims.filter(c => c.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-400" />
            Starter Pack Claims
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage Web3 Starter Pack claims and approvals
          </p>
        </div>
        <Button onClick={fetchClaims} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-gray-400">Total Claims</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{stats.approved}</div>
            <div className="text-xs text-gray-400">Approved</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{stats.delivered}</div>
            <div className="text-xs text-gray-400">Delivered</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <div className="text-xs text-gray-400">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-400">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="delivered">Delivered</option>
          <option value="rejected">Rejected</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Claims List */}
      {loading ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-400" />
            <p className="text-gray-400 mt-4">Loading claims...</p>
          </CardContent>
        </Card>
      ) : claims.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">No claims found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <Card key={claim.id} className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(claim.status)}
                    <div>
                      <CardTitle className="text-lg">
                        {shortenAddress(claim.wallet_address)}
                      </CardTitle>
                      <CardDescription>
                        Created: {formatDate(claim.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  {claim.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleApprove(claim.id)}
                        disabled={actionLoading === claim.id}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading === claim.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedClaim(claim);
                          setShowRejectDialog(true);
                        }}
                        disabled={actionLoading === claim.id}
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Payment Amount</p>
                    <p className="font-medium">{claim.payment_amount_sol || 0.05} SOL</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Payment Status</p>
                    <div className="flex items-center gap-2">
                      {claim.payment_verified ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">Verified</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">Not Verified</span>
                        </>
                      )}
                    </div>
                  </div>
                  {claim.payment_tx_signature && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Payment Transaction</p>
                      <a
                        href={`https://solscan.io/tx/${claim.payment_tx_signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                      >
                        {shortenAddress(claim.payment_tx_signature)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Delivery Info */}
                {claim.status === 'delivered' && (
                  <div className="border-t border-slate-700 pt-4 space-y-2">
                    <p className="text-sm font-semibold text-green-400">Delivery Details</p>
                    {claim.domain_name && (
                      <div>
                        <p className="text-sm text-gray-400">Domain</p>
                        <p className="font-medium">{claim.domain_name}</p>
                      </div>
                    )}
                    {claim.sol_amount_sent && (
                      <div>
                        <p className="text-sm text-gray-400">SOL Sent</p>
                        <p className="font-medium">{claim.sol_amount_sent.toFixed(6)} SOL (~$3 USD)</p>
                      </div>
                    )}
                    {claim.sol_send_tx_signature && (
                      <div>
                        <p className="text-sm text-gray-400">SOL Transaction</p>
                        <a
                          href={`https://solscan.io/tx/${claim.sol_send_tx_signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                        >
                          {shortenAddress(claim.sol_send_tx_signature)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {claim.nft_mint_address && (
                      <div>
                        <p className="text-sm text-gray-400">NFT Mint</p>
                        <a
                          href={`https://solscan.io/token/${claim.nft_mint_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                        >
                          {shortenAddress(claim.nft_mint_address)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Info */}
                {claim.status === 'rejected' && claim.rejection_reason && (
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-sm text-gray-400 mb-1">Rejection Reason</p>
                    <p className="text-red-400">{claim.rejection_reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Rejected by: {shortenAddress(claim.rejected_by || '')} at {formatDate(claim.rejected_at)}
                    </p>
                  </div>
                )}

                {/* Error Info */}
                {claim.status === 'failed' && claim.delivery_error && (
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-sm text-gray-400 mb-1">Delivery Error</p>
                    <p className="text-red-400">{claim.delivery_error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Claim</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this claim. The user will see this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Rejection Reason</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="bg-slate-800 border-slate-700 text-white"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedClaim(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || actionLoading === selectedClaim?.id}
              variant="destructive"
            >
              {actionLoading === selectedClaim?.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Reject Claim'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

