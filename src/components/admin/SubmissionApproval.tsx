'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Eye, CheckCircle, XCircle, Clock, AlertCircle, 
  Image as ImageIcon, FileText, User, Calendar,
  Award, Star, Zap, Trophy, Medal, Crown
} from 'lucide-react';
import Image from 'next/image';

interface BountySubmission {
  id: string;
  wallet_address: string;
  bounty_id: string;
  submission_id: string;
  xp_awarded: number;
  placement?: 'first' | 'second' | 'third';
  sol_prize: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  bounty?: {
    id: string;
    title: string;
    short_desc: string;
    reward: string;
    reward_type: 'XP' | 'SOL';
    status: 'active' | 'completed' | 'expired';
    squad_tag?: string;
  };
  submission?: {
    id: string;
    title: string;
    description: string;
    image_url?: string;
    created_at: string;
  };
}

interface SubmissionApprovalProps {
  walletAddress: string | null;
}

export default function SubmissionApproval({ walletAddress }: SubmissionApprovalProps) {
  const [submissions, setSubmissions] = useState<BountySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<BountySubmission | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  // Fetch all submissions for admin review
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/submissions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const data = await response.json();
        console.log('Fetched submissions for admin approval:', data);
        console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
        if (Array.isArray(data) && data.length > 0) {
          console.log('First submission structure:', data[0]);
        }
        
        // Transform the data to match the expected format
        const transformedSubmissions = Array.isArray(data) ? data.map(submission => ({
          id: submission.id,
          wallet_address: submission.walletAddress || submission.wallet_address || 'Unknown Wallet',
          bounty_id: submission.bountyId || submission.bounty_id,
          submission_id: submission.id,
          xp_awarded: 0,
          placement: null,
          sol_prize: 0,
          status: submission.status || 'pending',
          created_at: submission.timestamp || submission.created_at,
          updated_at: submission.timestamp || submission.updated_at,
          bounty: submission.bounty,
          submission: {
            id: submission.id,
            title: submission.title,
            description: submission.description,
            image_url: submission.imageUrl || submission.image_url,
            created_at: submission.timestamp || submission.created_at,
            status: submission.status || 'pending'
          }
        })) : [];
        
        setSubmissions(transformedSubmissions);
        console.log('Transformed submissions:', transformedSubmissions);
        console.log('Pending submissions count:', transformedSubmissions.filter(sub => sub.status === 'pending').length);

      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const handleApprove = async (submissionId: string) => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/submissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          walletAddress,
          action: 'approve'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve submission');
      }

      // Update local state
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: 'approved' as const, updated_at: new Date().toISOString() }
            : sub
        )
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve submission');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (submissionId: string) => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/submissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          walletAddress,
          action: 'reject'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject submission');
      }

      // Update local state
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: 'rejected' as const, updated_at: new Date().toISOString() }
            : sub
        )
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject submission');
    } finally {
      setLoading(false);
    }
  };

  const formatWalletAddress = (address: string | undefined) => {
    if (!address || address === 'undefined') {
      return 'Unknown Wallet';
    }
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const pendingSubmissions = submissions.filter(sub => sub.status === 'pending');
  const approvedSubmissions = submissions.filter(sub => sub.status === 'approved');
  const rejectedSubmissions = submissions.filter(sub => sub.status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Submission Approval
          </h2>
          <p className="text-slate-400">Review and approve bounty submissions</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{pendingSubmissions.length}</div>
            <p className="text-xs text-slate-500">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{approvedSubmissions.length}</div>
            <p className="text-xs text-slate-500">Accepted submissions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{rejectedSubmissions.length}</div>
            <p className="text-xs text-slate-500">Declined submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingSubmissions.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedSubmissions.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedSubmissions.length})</TabsTrigger>
        </TabsList>

        {/* Pending Submissions Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <Card className="bg-slate-800">
              <CardContent className="pt-6 text-center">
                <Clock className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Pending Submissions</h3>
                <p className="text-slate-500">All submissions have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <Card key={submission.id} className="bg-slate-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {submission.submission?.title || 'Untitled Submission'}
                            </h3>
                            <p className="text-sm text-gray-400">
                              By {formatWalletAddress(submission.wallet_address)} • {submission.bounty?.title || 'Unknown Bounty'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Submitted {new Date(submission.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-300 text-sm">
                            {submission.submission?.description || 'No description provided'}
                          </p>
                        </div>

                        {submission.submission?.image_url && (
                          <div className="mb-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                                  onClick={() => setSelectedSubmission(submission)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Image
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Submission Image</DialogTitle>
                                </DialogHeader>
                                <div className="relative w-full h-96">
                                  <Image
                                    src={submission.submission.image_url}
                                    alt={submission.submission.title || 'Submission image'}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {submission.bounty?.squad_tag && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              {submission.bounty.squad_tag}
                            </Badge>
                          )}
                          <Badge className={getStatusColor(submission.status)}>
                            {getStatusIcon(submission.status)}
                            <span className="ml-1">{submission.status}</span>
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          onClick={() => handleApprove(submission.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(submission.id)}
                          disabled={loading}
                          variant="outline"
                          className="border-red-500 text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Approved Submissions Tab */}
        <TabsContent value="approved" className="space-y-4">
          {approvedSubmissions.length === 0 ? (
            <Card className="bg-slate-800">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Approved Submissions</h3>
                <p className="text-slate-500">Approved submissions will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedSubmissions.map((submission) => (
                <Card key={submission.id} className="bg-slate-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {submission.submission?.title || 'Untitled Submission'}
                            </h3>
                            <p className="text-sm text-gray-400">
                              By {formatWalletAddress(submission.wallet_address)} • {submission.bounty?.title || 'Unknown Bounty'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Approved {new Date(submission.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge className={getStatusColor(submission.status)}>
                            {getStatusIcon(submission.status)}
                            <span className="ml-1">{submission.status}</span>
                          </Badge>
                          {submission.placement && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              <Trophy className="w-3 h-3 mr-1" />
                              {submission.placement.charAt(0).toUpperCase() + submission.placement.slice(1)} Place
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm">
                          <p className="text-green-400">+{submission.xp_awarded} XP</p>
                          {submission.sol_prize > 0 && (
                            <p className="text-green-400">+{submission.sol_prize} SOL</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rejected Submissions Tab */}
        <TabsContent value="rejected" className="space-y-4">
          {rejectedSubmissions.length === 0 ? (
            <Card className="bg-slate-800">
              <CardContent className="pt-6 text-center">
                <XCircle className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Rejected Submissions</h3>
                <p className="text-slate-500">Rejected submissions will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedSubmissions.map((submission) => (
                <Card key={submission.id} className="bg-slate-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-red-500/20 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {submission.submission?.title || 'Untitled Submission'}
                            </h3>
                            <p className="text-sm text-gray-400">
                              By {formatWalletAddress(submission.wallet_address)} • {submission.bounty?.title || 'Unknown Bounty'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Rejected {new Date(submission.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge className={getStatusColor(submission.status)}>
                            {getStatusIcon(submission.status)}
                            <span className="ml-1">{submission.status}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
