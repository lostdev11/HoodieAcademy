'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video, ArrowRight, CheckCircle, Play, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { formatDistanceToNow } from 'date-fns';

interface MentorshipSession {
  id: string;
  title: string;
  description: string;
  mentor_name: string;
  scheduled_date: string;
  duration_minutes: number;
  session_type: string;
  topic_tags: string[];
  stream_platform: string;
  stream_url: string;
  status: string;
  current_rsvps: number;
  max_attendees: number | null;
  time_until_start?: string;
  recording_url?: string;
  recording_available?: boolean;
}

export default function MentorshipPage() {
  const { wallet } = useWalletSupabase();
  const [upcomingSessions, setUpcomingSessions] = useState<MentorshipSession[]>([]);
  const [pastSessions, setPastSessions] = useState<MentorshipSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Fetch sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      // Fetch upcoming sessions
      const upcomingRes = await fetch('/api/mentorship/sessions?type=upcoming&limit=20');
      const upcomingData = await upcomingRes.json();
      setUpcomingSessions(upcomingData.sessions || []);

      // Fetch past sessions
      const pastRes = await fetch('/api/mentorship/sessions?type=past&limit=20');
      const pastData = await pastRes.json();
      setPastSessions(pastData.sessions || []);

    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'live_qa': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'workshop': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'office_hours': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'ama': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back/Home Navigation */}
        <div className="flex gap-3 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-4">
            🎓 Live Mentorship Sessions
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join weekly live sessions with expert mentors. Learn, ask questions, and level up your Web3 skills.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={activeTab === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upcoming')}
            className={activeTab === 'upcoming' 
              ? 'bg-cyan-600 hover:bg-cyan-700' 
              : 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Upcoming Sessions ({upcomingSessions.length})
          </Button>
          <Button
            variant={activeTab === 'past' ? 'default' : 'outline'}
            onClick={() => setActiveTab('past')}
            className={activeTab === 'past' 
              ? 'bg-cyan-600 hover:bg-cyan-700' 
              : 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'}
          >
            <Play className="w-4 h-4 mr-2" />
            Past Sessions ({pastSessions.length})
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading sessions...</p>
          </div>
        )}

        {/* Upcoming Sessions */}
        {!loading && activeTab === 'upcoming' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingSessions.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No upcoming sessions scheduled</p>
                <p className="text-gray-500 text-sm mt-2">Check back soon for new mentorship opportunities!</p>
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <Card key={session.id} className="bg-slate-800/50 border-cyan-500/30 hover:border-cyan-500 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`${getSessionTypeColor(session.session_type)} border`}>
                        {session.session_type.replace('_', ' ')}
                      </Badge>
                      {session.stream_platform && (
                        <Badge variant="outline" className="border-gray-500/30 text-gray-400">
                          {session.stream_platform}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-cyan-400">{session.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      with {session.mentor_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {session.description}
                    </p>

                    {/* Date & Time */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(session.scheduled_date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTime(session.scheduled_date)} • {session.duration_minutes} min
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Users className="w-4 h-4 mr-2" />
                        {session.current_rsvps} 
                        {session.max_attendees ? ` / ${session.max_attendees}` : ''} attending
                      </div>
                    </div>

                    {/* Tags */}
                    {session.topic_tags && session.topic_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {session.topic_tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-1 bg-slate-700/50 text-cyan-300 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <Link href={`/mentorship/${session.id}`}>
                      <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                        View Details & RSVP
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Past Sessions */}
        {!loading && activeTab === 'past' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastSessions.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Play className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No past sessions yet</p>
                <p className="text-gray-500 text-sm mt-2">Recordings will appear here after sessions complete</p>
              </div>
            ) : (
              pastSessions.map((session) => (
                <Card key={session.id} className="bg-slate-800/50 border-slate-600/30 hover:border-slate-500 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`${getSessionTypeColor(session.session_type)} border`}>
                        {session.session_type.replace('_', ' ')}
                      </Badge>
                      {session.recording_available && (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Recording
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-gray-300">{session.title}</CardTitle>
                    <CardDescription className="text-gray-500">
                      with {session.mentor_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {session.description}
                    </p>

                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(session.scheduled_date)}
                    </div>

                    {/* Tags */}
                    {session.topic_tags && session.topic_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {session.topic_tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-1 bg-slate-700/50 text-gray-400 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {session.recording_available ? (
                      <Link href={`/mentorship/${session.id}`}>
                        <Button className="w-full bg-slate-700 hover:bg-slate-600">
                          <Play className="w-4 h-4 mr-2" />
                          Watch Recording
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled className="w-full" variant="outline">
                        Recording Coming Soon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

