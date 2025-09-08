'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  FileText, Search, Filter, Eye, CheckSquare, XSquare, RefreshCw, 
  Calendar, User, Target, Image as ImageIcon, ChevronLeft, ChevronRight,
  MoreVertical, Download, Trash2, AlertCircle, CheckCircle, Clock, Trophy, TrendingUp
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Submission {
  id: string;
  title: string;
  description: string;
  squad?: string;
  courseRef?: string;
  bountyId?: string;
  walletAddress?: string;
  imageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  upvotes?: Record<string, any>;
  totalUpvotes?: number;
  timestamp: string;
  bounty?: {
    id: string;
    title: string;
    description: string;
    xp_reward: number;
  };
}

interface SubmissionsManagerProps {
  walletAddress?: string;
}

export function SubmissionsManager({ walletAddress }: SubmissionsManagerProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  const itemsPerPage = 10;

  // Fetch submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/submissions?wallet=${walletAddress || ''}`);
      
      if (!response.ok) {
        console.error('Failed to fetch submissions:', response.status, response.statusText);
        setSubmissions([]);
        return;
      }

      const data = await response.json();
      console.log('Fetched submissions for admin:', data);
      
      // Transform the admin API data to match the expected format
      const transformedSubmissions = Array.isArray(data) ? data.map(item => ({
        id: item.id,
        title: item.submission.title,
        description: item.submission.description,
        squad: item.bounty?.squad_tag || 'Unknown',
        courseRef: item.submission.course_ref || '',
        bountyId: item.bounty_id,
        walletAddress: item.wallet_address,
        imageUrl: item.submission.image_url,
        status: item.status,
        upvotes: {},
        totalUpvotes: 0,
        timestamp: item.created_at,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) : [];
      
      setSubmissions(transformedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Filter and search submissions
  useEffect(() => {
    let filtered = submissions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }

    // Squad filter
    if (squadFilter !== 'all') {
      filtered = filtered.filter(submission => submission.squad === squadFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'most_upvotes':
          return (b.totalUpvotes || 0) - (a.totalUpvotes || 0);
        case 'least_upvotes':
          return (a.totalUpvotes || 0) - (b.totalUpvotes || 0);
        default:
          return 0;
      }
    });

    setFilteredSubmissions(filtered);
    setCurrentPage(1);
  }, [submissions, searchTerm, statusFilter, squadFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  // Get unique squads for filter
  const uniqueSquads = Array.from(new Set(submissions.map(s => s.squad).filter(Boolean))) as string[];

  // Calculate statistics
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  // Handle submission actions
  const handleSubmissionAction = async (submissionId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(submissionId);
      
      // Use the admin API endpoint for approval actions
      const response = await fetch('/api/admin/submissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          walletAddress,
          action
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} submission`);
      }

      // Update local state
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: action === 'approve' ? 'approved' : 'rejected' }
            : sub
        )
      );
    } catch (error) {
      console.error(`Error ${action}ing submission:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const selectedIds = currentSubmissions.map(s => s.id);
    try {
      setActionLoading('bulk');
      
      // Process each submission individually using the admin API
      const promises = selectedIds.map(submissionId => 
        fetch('/api/admin/submissions/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            walletAddress,
            action
          })
        })
      );
      
      await Promise.all(promises);

      // Update local state
      setSubmissions(prev => 
        prev.map(sub => 
          selectedIds.includes(sub.id)
            ? { ...sub, status: action === 'approve' ? 'approved' : 'rejected' }
            : sub
        )
      );
    } catch (error) {
      console.error(`Error bulk ${action}ing submissions:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  // Export submissions to CSV
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const csvData = filteredSubmissions.map(submission => ({
        'ID': submission.id,
        'Title': submission.title,
        'Description': submission.description.replace(/\n/g, ' '),
        'Status': submission.status,
        'Squad': submission.squad || 'No Squad',
        'Bounty': submission.bounty?.title || 'No Bounty',
        'Wallet Address': submission.walletAddress,
        'Upvotes': submission.totalUpvotes,
        'Created At': new Date(submission.timestamp).toLocaleString(),
        'Updated At': new Date(submission.timestamp).toLocaleString(),
        'Has Image': submission.imageUrl ? 'Yes' : 'No'
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `submissions-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting submissions:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XSquare className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-400">Loading submissions...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <CardTitle>Bounty Submissions</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleExport} 
                variant="outline" 
                size="sm"
                disabled={exportLoading || filteredSubmissions.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button onClick={fetchSubmissions} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Review and manage bounty submissions from users. Approve or reject submissions to award XP and prizes.
          </p>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Submissions</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Approved</p>
                <p className="text-2xl font-bold text-white">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XSquare className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Rejected</p>
                <p className="text-2xl font-bold text-white">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={squadFilter} onValueChange={setSquadFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by squad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Squads</SelectItem>
                {uniqueSquads.map(squad => (
                  <SelectItem key={squad} value={squad}>{squad}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="most_upvotes">Most Upvotes</SelectItem>
                <SelectItem value="least_upvotes">Least Upvotes</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                onClick={() => handleBulkAction('approve')}
                disabled={actionLoading === 'bulk'}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                Approve All
              </Button>
              <Button
                onClick={() => handleBulkAction('reject')}
                disabled={actionLoading === 'bulk'}
                size="sm"
                variant="destructive"
              >
                <XSquare className="w-4 h-4 mr-1" />
                Reject All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Submissions ({filteredSubmissions.length})
            </CardTitle>
            <div className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No Submissions Found</h3>
              <p className="text-slate-500">
                {searchTerm || statusFilter !== 'all' || squadFilter !== 'all'
                  ? 'No submissions match your current filters.'
                  : 'No submissions have been made yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentSubmissions.map((submission) => (
                <div key={submission.id} className="border border-slate-700 rounded-lg p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(submission.status)}
                        <h3 className="font-semibold text-lg">{submission.title}</h3>
                        <Badge variant={getStatusBadgeVariant(submission.status)}>
                          {submission.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                        {submission.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{submission.walletAddress?.slice(0, 8)}...{submission.walletAddress?.slice(-6)}</span>
                        </div>
                        {submission.squad && (
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{submission.squad}</span>
                          </div>
                        )}
                        {submission.bounty && (
                          <div className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            <span>{submission.bounty.title}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(submission.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>{submission.totalUpvotes} upvotes</span>
                        </div>
                        {submission.imageUrl && (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>Has Image</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Dialog open={isDetailModalOpen && selectedSubmission?.id === submission.id} onOpenChange={(open) => {
                        if (open) {
                          setSelectedSubmission(submission);
                          setIsDetailModalOpen(true);
                        } else {
                          setIsDetailModalOpen(false);
                          setSelectedSubmission(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {getStatusIcon(submission.status)}
                              {submission.title}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Description</h4>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                {submission.description}
                              </p>
                            </div>
                            
                            {submission.imageUrl && (
                              <div>
                                <h4 className="font-semibold mb-2">Image</h4>
                                <img 
                                  src={submission.imageUrl} 
                                  alt={submission.title}
                                  className="max-w-full h-auto rounded-lg border border-slate-600"
                                />
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-400">Submitted by:</span>
                                <p className="font-mono">{submission.walletAddress}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Squad:</span>
                                <p>{submission.squad || 'No Squad'}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Bounty:</span>
                                <p>{submission.bounty?.title || 'No Bounty'}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Upvotes:</span>
                                <p>{submission.totalUpvotes}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Created:</span>
                                <p>{new Date(submission.timestamp).toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Updated:</span>
                                <p>{new Date(submission.timestamp).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleSubmissionAction(submission.id, 'approve')}
                            disabled={actionLoading === submission.id || submission.status === 'approved'}
                            className="text-green-600"
                          >
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSubmissionAction(submission.id, 'reject')}
                            disabled={actionLoading === submission.id || submission.status === 'rejected'}
                            className="text-red-600"
                          >
                            <XSquare className="w-4 h-4 mr-2" />
                            Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredSubmissions.length)} of {filteredSubmissions.length} submissions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
