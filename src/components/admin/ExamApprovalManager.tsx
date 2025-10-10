'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, XCircle, Clock, AlertCircle, Trophy,
  User, Calendar, Award, Target, Zap, BookOpen
} from 'lucide-react';

interface ExamSubmission {
  id: string;
  exam_id: string;
  wallet_address: string;
  score: number;
  passed: boolean;
  status: 'pending' | 'approved' | 'rejected';
  attempt_number: number;
  submitted_at: string;
  time_taken_seconds?: number;
  xp_awarded: number;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  answers: Record<string, any>;
  
  exam: {
    id: string;
    course_id: string;
    course_slug: string;
    title: string;
    description?: string;
    passing_score: number;
    xp_reward: number;
    bonus_xp: number;
    total_questions: number;
    squad_restricted: boolean;
    allowed_squads?: string[];
  };
  
  user: {
    wallet_address: string;
    username?: string;
    squad?: string;
    total_xp: number;
    level?: number;
  };
}

interface ExamApprovalManagerProps {
  adminWallet: string;
}

export default function ExamApprovalManager({ adminWallet }: ExamApprovalManagerProps) {
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/exams?wallet=${adminWallet}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exam submissions');
      }

      const data = await response.json();
      console.log('[EXAM SUBMISSIONS]', data);
      
      setSubmissions(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error('[FETCH ERROR]', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    setProcessing(submissionId);

    try {
      const response = await fetch('/api/admin/exams/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          admin_wallet: adminWallet,
          action: 'approve',
          admin_notes: adminNotes[submissionId] || ''
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve submission');
      }

      const result = await response.json();
      
      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? { 
                ...sub, 
                status: 'approved',
                reviewed_by: adminWallet,
                reviewed_at: new Date().toISOString(),
                xp_awarded: result.xp_awarded,
                admin_notes: adminNotes[submissionId]
              }
            : sub
        )
      );

      // Clear notes
      setAdminNotes(prev => {
        const updated = { ...prev };
        delete updated[submissionId];
        return updated;
      });

      alert(`✅ Exam approved! ${result.xp_awarded} XP awarded.`);

    } catch (err) {
      console.error('[APPROVE ERROR]', err);
      alert(`❌ ${err instanceof Error ? err.message : 'Failed to approve'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    setProcessing(submissionId);

    try {
      const response = await fetch('/api/admin/exams/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          admin_wallet: adminWallet,
          action: 'reject',
          admin_notes: adminNotes[submissionId] || 'Did not meet requirements'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject submission');
      }

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? { 
                ...sub, 
                status: 'rejected',
                reviewed_by: adminWallet,
                reviewed_at: new Date().toISOString(),
                admin_notes: adminNotes[submissionId]
              }
            : sub
        )
      );

      // Clear notes
      setAdminNotes(prev => {
        const updated = { ...prev };
        delete updated[submissionId];
        return updated;
      });

      alert('Exam submission rejected');

    } catch (err) {
      console.error('[REJECT ERROR]', err);
      alert(`❌ ${err instanceof Error ? err.message : 'Failed to reject'}`);
    } finally {
      setProcessing(null);
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatWallet = (address: string) => {
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

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return 'text-green-400';
    if (score >= passingScore - 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const approvedSubmissions = submissions.filter(s => s.status === 'approved');
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading exam submissions...</p>
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

  const SubmissionCard = ({ submission }: { submission: ExamSubmission }) => {
    const xpToAward = submission.score === 100 
      ? submission.exam.xp_reward + submission.exam.bonus_xp 
      : submission.exam.xp_reward;

    return (
      <Card className="bg-slate-800/50 border-cyan-500/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {submission.exam.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {submission.user.username || formatWallet(submission.wallet_address)}
                      {submission.user.squad && ` • ${submission.user.squad}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(submission.submitted_at).toLocaleString()}</span>
                  {submission.time_taken_seconds && (
                    <>
                      <span>•</span>
                      <span>⏱️ {formatTime(submission.time_taken_seconds)}</span>
                    </>
                  )}
                </div>
              </div>

              <Badge className={getStatusColor(submission.status)}>
                {submission.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                {submission.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                {submission.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                {submission.status}
              </Badge>
            </div>

            {/* Score and Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(submission.score, submission.exam.passing_score)}`}>
                  {submission.score}%
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Status</div>
                <div className={`text-sm font-semibold ${submission.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {submission.passed ? '✅ Passed' : '❌ Failed'}
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Attempt</div>
                <div className="text-sm font-semibold text-cyan-400">
                  {submission.attempt_number} / {submission.exam.total_questions}
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">XP Reward</div>
                <div className="text-sm font-semibold text-purple-400">
                  {submission.xp_awarded > 0 ? submission.xp_awarded : xpToAward} XP
                  {submission.score === 100 && <span className="text-xs ml-1">+Bonus</span>}
                </div>
              </div>
            </div>

            {/* Exam Details */}
            <div className="bg-slate-700/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300">
                  Passing Score: <span className="text-cyan-400 font-semibold">{submission.exam.passing_score}%</span>
                </span>
              </div>
              
              {submission.exam.squad_restricted && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">
                    Squad Restricted: <span className="text-purple-400 font-semibold">
                      {submission.exam.allowed_squads?.join(', ') || 'None'}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Admin Notes (for pending only) */}
            {submission.status === 'pending' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Admin Notes (Optional)</label>
                <Textarea
                  value={adminNotes[submission.id] || ''}
                  onChange={(e) => setAdminNotes(prev => ({
                    ...prev,
                    [submission.id]: e.target.value
                  }))}
                  placeholder="Add notes about this submission..."
                  className="bg-slate-700/30 border-slate-600 text-gray-200 text-sm"
                  rows={2}
                />
              </div>
            )}

            {/* Reviewed Info */}
            {submission.status !== 'pending' && (
              <div className="bg-slate-700/20 rounded-lg p-3 text-sm">
                <div className="text-gray-400">
                  Reviewed by: <span className="text-cyan-400">{formatWallet(submission.reviewed_by || 'Unknown')}</span>
                </div>
                {submission.reviewed_at && (
                  <div className="text-gray-400 text-xs mt-1">
                    {new Date(submission.reviewed_at).toLocaleString()}
                  </div>
                )}
                {submission.admin_notes && (
                  <div className="text-gray-300 mt-2 italic">
                    "{submission.admin_notes}"
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons (for pending only) */}
            {submission.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleApprove(submission.id)}
                  disabled={processing !== null}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {processing === submission.id ? 'Approving...' : 'Approve & Award XP'}
                </Button>
                
                <Button
                  onClick={() => handleReject(submission.id)}
                  disabled={processing !== null}
                  variant="outline"
                  className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {processing === submission.id ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-cyan-400" />
            Exam Approval
          </h2>
          <p className="text-slate-400">Review and approve course final exam submissions</p>
        </div>
        
        <Button
          onClick={fetchSubmissions}
          variant="outline"
          size="sm"
          disabled={loading}
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
        >
          <Zap className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{pendingSubmissions.length}</div>
            <p className="text-xs text-slate-500">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{approvedSubmissions.length}</div>
            <p className="text-xs text-slate-500">XP awarded</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{rejectedSubmissions.length}</div>
            <p className="text-xs text-slate-500">Did not pass</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/20">
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-green-500/20">
            Approved ({approvedSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-red-500/20">
            Rejected ({rejectedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6 text-center">
                <Clock className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Pending Submissions</h3>
                <p className="text-slate-500">All exam submissions have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            pendingSubmissions.map(sub => (
              <SubmissionCard key={sub.id} submission={sub} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedSubmissions.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Approved Submissions</h3>
                <p className="text-slate-500">Approved submissions will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            approvedSubmissions.map(sub => (
              <SubmissionCard key={sub.id} submission={sub} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedSubmissions.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6 text-center">
                <XCircle className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Rejected Submissions</h3>
                <p className="text-slate-500">Rejected submissions will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            rejectedSubmissions.map(sub => (
              <SubmissionCard key={sub.id} submission={sub} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

