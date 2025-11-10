'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Users,
  Search,
  RefreshCw,
  Download,
  CheckCircle,
  Clock,
  Hourglass,
  Loader2,
  Mail,
} from 'lucide-react';

interface Participant {
  wallet_address: string;
  display_name: string | null;
  squad: string | null;
  total_xp: number | null;
  level: number | null;
  completion_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  started_at: string | null;
  last_updated: string | null;
  completed_at: string | null;
  last_active: string | null;
  preview_submission: {
    email: string | null;
    submitted_at: string | null;
  } | null;
}

interface Stats {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
  average_progress: number;
  completion_rate: number;
}

type StatusFilter = 'all' | 'completed' | 'in-progress' | 'not-started';

interface FreeCourseParticipantsManagerProps {
  courseSlug?: string;
}

const DEFAULT_COURSE_SLUG = 't100-chart-literacy';

export default function FreeCourseParticipantsManager({
  courseSlug = DEFAULT_COURSE_SLUG,
}: FreeCourseParticipantsManagerProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    in_progress: 0,
    not_started: 0,
    average_progress: 0,
    completion_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  useEffect(() => {
    fetchParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug]);

  const fetchParticipants = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/free-course-participants?course_slug=${encodeURIComponent(courseSlug)}`
      );
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Failed to fetch course participants');
      }

      setParticipants(data.participants || []);
      setStats(data.stats || stats);
      setLastRefreshed(data.last_updated || new Date().toISOString());
    } catch (err) {
      console.error('[FreeCourseParticipantsManager] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!participants.length) return;

    const headers = [
      'Display Name',
      'Wallet Address',
      'Status',
      'Completion %',
      'Completed Lessons',
      'Total Lessons',
      'Started At',
      'Last Updated',
      'Completed At',
      'Last Active',
      'Preview Email',
      'Preview Submitted',
    ];

    const rows = filteredParticipants.map((participant) => {
      const status = getStatus(participant);
      return [
        participant.display_name ?? '',
        participant.wallet_address,
        status,
        `${participant.completion_percentage}`,
        `${participant.completed_lessons}`,
        `${participant.total_lessons}`,
        participant.started_at ? new Date(participant.started_at).toISOString() : '',
        participant.last_updated ? new Date(participant.last_updated).toISOString() : '',
        participant.completed_at ? new Date(participant.completed_at).toISOString() : '',
        participant.last_active ? new Date(participant.last_active).toISOString() : '',
        participant.preview_submission?.email ?? '',
        participant.preview_submission?.submitted_at
          ? new Date(participant.preview_submission.submitted_at).toISOString()
          : '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `free-course-participants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatus = (participant: Participant): 'completed' | 'in-progress' | 'not-started' => {
    if (participant.completion_percentage >= 100) return 'completed';
    if (participant.completion_percentage > 0) return 'in-progress';
    return 'not-started';
  };

  const filteredParticipants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return participants.filter((participant) => {
      const status = getStatus(participant);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      if (!matchesStatus) return false;

      if (!term) return true;

      const walletMatch = participant.wallet_address.toLowerCase().includes(term);
      const displayNameMatch = participant.display_name
        ? participant.display_name.toLowerCase().includes(term)
        : false;
      const emailMatch = participant.preview_submission?.email
        ? participant.preview_submission.email.toLowerCase().includes(term)
        : false;
      const squadMatch = participant.squad
        ? participant.squad.toLowerCase().includes(term)
        : false;

      return walletMatch || displayNameMatch || emailMatch || squadMatch;
    });
  }, [participants, searchTerm, statusFilter]);

  const renderStatusBadge = (participant: Participant) => {
    const status = getStatus(participant);
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1">
            <Hourglass className="w-3 h-3" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Not Started
          </Badge>
        );
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardContent className="pt-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-slate-300">Loading free course participants...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            Free Course Participants
          </h2>
          <p className="text-slate-400">
            Track engagement and completion for the free course audience
          </p>
          {lastRefreshed && (
            <p className="text-xs text-slate-500">
              Last updated: {formatDate(lastRefreshed)}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={fetchParticipants}
            variant="outline"
            className="border-slate-600 text-slate-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="border-slate-600">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6">
            <p className="text-red-300 text-sm">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-slate-500">Wallets with tracked progress</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <p className="text-xs text-slate-500">At 100% completion</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.in_progress}</div>
            <p className="text-xs text-slate-500">Partially completed</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Avg Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">
              {stats.average_progress.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500">Mean completion rate</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {stats.completion_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500">Completed / total</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by wallet, name, squad, or email..."
                className="pl-10 bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-blue-600' : 'border-slate-600'}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
                className={
                  statusFilter === 'completed'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'border-slate-600'
                }
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === 'in-progress' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('in-progress')}
                className={
                  statusFilter === 'in-progress'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'border-slate-600'
                }
              >
                In Progress
              </Button>
              <Button
                variant={statusFilter === 'not-started' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('not-started')}
                className={
                  statusFilter === 'not-started'
                    ? 'bg-slate-600 hover:bg-slate-700'
                    : 'border-slate-600'
                }
              >
                Not Started
              </Button>
            </div>
          </div>

          <div className="text-sm text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Showing {filteredParticipants.length} of {participants.length} participants
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white">
            Participant Details ({filteredParticipants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No Participants Found</h3>
              <p className="text-slate-500">
                {searchTerm
                  ? 'Try adjusting your filters or search terms.'
                  : 'No wallet progress has been recorded yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParticipants.map((participant) => (
                <Card
                  key={`${participant.wallet_address}-${participant.last_updated ?? 'na'}`}
                  className="bg-slate-900 border-slate-700"
                >
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-white text-lg font-semibold">
                            {participant.display_name ||
                              `${participant.wallet_address.slice(0, 6)}...${participant.wallet_address.slice(-4)}`}
                          </h3>
                          {renderStatusBadge(participant)}
                          {participant.squad && (
                            <Badge variant="outline" className="text-xs uppercase tracking-wide">
                              {participant.squad}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
                          <span>{participant.wallet_address}</span>
                          <Badge variant="outline" className="text-xs">
                            {participant.wallet_address.slice(0, 4)}...
                            {participant.wallet_address.slice(-4)}
                          </Badge>
                        </div>

                        {participant.preview_submission?.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Mail className="w-4 h-4 text-blue-400" />
                            <span>{participant.preview_submission.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
                        <div>
                          <p className="uppercase text-xs tracking-wide text-slate-500">Progress</p>
                          <p className="text-white font-semibold">
                            {participant.completion_percentage.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="uppercase text-xs tracking-wide text-slate-500">
                            Lessons
                          </p>
                          <p className="text-white font-semibold">
                            {participant.completed_lessons}/{participant.total_lessons}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase text-xs tracking-wide text-slate-500">
                            Started
                          </p>
                          <p>{formatDate(participant.started_at)}</p>
                        </div>
                        <div>
                          <p className="uppercase text-xs tracking-wide text-slate-500">
                            Updated
                          </p>
                          <p>{formatDate(participant.last_updated)}</p>
                        </div>
                        <div>
                          <p className="uppercase text-xs tracking-wide text-slate-500">
                            Completed
                          </p>
                          <p>{formatDate(participant.completed_at)}</p>
                        </div>
                        <div>
                          <p className="uppercase text-xs tracking-wide text-slate-500">
                            Last Active
                          </p>
                          <p>{formatDate(participant.last_active)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Progress
                        value={participant.completion_percentage}
                        className="h-2 bg-slate-700"
                      />
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


