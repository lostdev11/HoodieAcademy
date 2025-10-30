'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mail, Wallet, Calendar, Search, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewSubmission {
  id: string;
  email: string | null;
  wallet_address: string | null;
  submitted_at: string;
  created_at: string;
}

export default function PreviewSubmissionsManager() {
  const [submissions, setSubmissions] = useState<PreviewSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'email' | 'wallet'>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/preview-submissions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching preview submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      (sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (sub.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'email' && sub.email) ||
      (filter === 'wallet' && sub.wallet_address);

    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const headers = ['Email', 'Wallet Address', 'Submitted At'];
    const rows = filteredSubmissions.map(sub => [
      sub.email || '',
      sub.wallet_address || '',
      new Date(sub.submitted_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preview-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatWalletAddress = (address: string | null) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardContent className="pt-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading preview submissions...</p>
        </CardContent>
      </Card>
    );
  }

  const emailSubmissions = submissions.filter(s => s.email).length;
  const walletSubmissions = submissions.filter(s => s.wallet_address).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Preview Academy Submissions
          </h2>
          <p className="text-slate-400">Track users interested in preview access</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{submissions.length}</div>
            <p className="text-xs text-slate-500">All submissions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Email Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{emailSubmissions}</div>
            <p className="text-xs text-slate-500">With email</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Wallet Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{walletSubmissions}</div>
            <p className="text-xs text-slate-500">With wallet</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by email or wallet address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="border-slate-600"
              >
                All
              </Button>
              <Button
                variant={filter === 'email' ? 'default' : 'outline'}
                onClick={() => setFilter('email')}
                className="border-slate-600"
              >
                Email Only
              </Button>
              <Button
                variant={filter === 'wallet' ? 'default' : 'outline'}
                onClick={() => setFilter('wallet')}
                className="border-slate-600"
              >
                Wallet Only
              </Button>
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="border-slate-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white">
            Submissions ({filteredSubmissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No Submissions Found</h3>
              <p className="text-slate-500">
                {searchTerm ? 'Try adjusting your search' : 'No preview submissions yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="bg-slate-900 border-slate-700">
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        {submission.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-400" />
                            <span className="text-white">{submission.email}</span>
                          </div>
                        )}
                        {submission.wallet_address && (
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-purple-400" />
                            <span className="text-white font-mono text-sm">
                              {formatWalletAddress(submission.wallet_address)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {submission.wallet_address.slice(0, 2)}...{submission.wallet_address.slice(-2)}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(submission.submitted_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {submission.email && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Email
                          </Badge>
                        )}
                        {submission.wallet_address && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            Wallet
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

