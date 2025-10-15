'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  ArrowLeft, 
  CheckCircle, 
  Play,
  ThumbsUp,
  Send,
  Download,
  Share2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import VideoPlayer (client-side only)
const VideoPlayer = dynamic(
  () => import('@/components/mentorship/VideoPlayer').then(mod => ({ default: mod.VideoPlayer })),
  { ssr: false }
);

// Dynamically import NativeVideoPlayer (client-side only)
const NativeVideoPlayer = dynamic(
  () => import('@/components/mentorship/NativeVideoPlayer').then(mod => ({ default: mod.NativeVideoPlayer })),
  { ssr: false }
);

// Import SessionControls
import { SessionControls } from '@/components/mentorship/SessionControls';

// Import HostPermissionPanel
import { HostPermissionPanel } from '@/components/mentorship/HostPermissionPanel';

interface MentorshipSession {
  id: string;
  title: string;
  description: string;
  mentor_name: string;
  mentor_wallet?: string;
  scheduled_date: string;
  duration_minutes: number;
  session_type: string;
  topic_tags: string[];
  stream_platform: string;
  stream_url: string;
  recording_url?: string;
  recording_available: boolean;
  status: string;
  current_rsvps: number;
  max_attendees: number | null;
}

interface Question {
  id: string;
  question: string;
  wallet_address: string;
  category?: string;
  is_anonymous: boolean;
  upvotes: number;
  is_answered: boolean;
  answer?: string;
  submitted_at: string;
}

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const { wallet, isAdmin } = useWalletSupabase();
  const router = useRouter();
  const [session, setSession] = useState<MentorshipSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userRSVP, setUserRSVP] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  
  // Question submission
  const [newQuestion, setNewQuestion] = useState('');
  const [questionCategory, setQuestionCategory] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Video room state
  const [videoRoomUrl, setVideoRoomUrl] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSessionDetails();
      fetchQuestions();
      if (wallet) {
        checkUserRSVP();
      }
    }
  }, [params.id, wallet]);

  const fetchSessionDetails = async () => {
    try {
      const res = await fetch(`/api/mentorship/sessions/${params.id}`);
      const data = await res.json();
      setSession(data.session);
      
      // If session uses native streaming and is live, create video room
      if (data.session?.stream_platform === 'native' && data.session?.status === 'live') {
        await createVideoRoom(data.session.id, data.session.title);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const createVideoRoom = async (sessionId: string, sessionTitle: string) => {
    if (videoRoomUrl || creatingRoom) return;
    
    setCreatingRoom(true);
    try {
      const res = await fetch('/api/mentorship/video-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          session_title: sessionTitle
        })
      });

      const data = await res.json();
      if (data.room_url) {
        setVideoRoomUrl(data.room_url);
        console.log('✅ Video room ready:', data.room_url);
      }
    } catch (error) {
      console.error('Error creating video room:', error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/mentorship/questions?session_id=${params.id}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const checkUserRSVP = async () => {
    // Check if user already RSVP'd
    // This would be a new API endpoint or check in existing data
    // For now, placeholder
  };

  const handleRSVP = async () => {
    if (!wallet) {
      alert('Please connect your wallet to RSVP');
      return;
    }

    setRsvpLoading(true);
    try {
      const res = await fetch('/api/mentorship/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: params.id,
          wallet_address: wallet
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setUserRSVP(true);
        alert('✅ RSVP confirmed! You\'ll receive a reminder before the session.');
        fetchSessionDetails(); // Refresh RSVP count
      } else if (data.waitlist) {
        alert('⏳ Session is full. You\'ve been added to the waitlist.');
      } else {
        alert(data.error || 'Failed to RSVP');
      }
    } catch (error) {
      console.error('Error RSVPing:', error);
      alert('Failed to RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!wallet) {
      alert('Please connect your wallet to submit questions');
      return;
    }

    if (!newQuestion.trim()) {
      alert('Please enter a question');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/mentorship/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: params.id,
          wallet_address: wallet,
          question: newQuestion,
          category: questionCategory,
          is_anonymous: isAnonymous
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setNewQuestion('');
        setQuestionCategory('general');
        setIsAnonymous(false);
        alert('✅ Question submitted!');
        fetchQuestions(); // Refresh questions list
      } else {
        alert(data.error || 'Failed to submit question');
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('Failed to submit question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    try {
      const res = await fetch(`/api/mentorship/questions/${questionId}/upvote`, {
        method: 'POST'
      });

      const data = await res.json();
      
      if (data.success) {
        // Update local state
        setQuestions(questions.map(q => 
          q.id === questionId ? { ...q, upvotes: data.upvotes } : q
        ));
      }
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  const downloadCalendar = () => {
    if (!session) return;

    const event = {
      title: session.title,
      description: session.description,
      start: new Date(session.scheduled_date),
      duration: session.duration_minutes,
      url: session.stream_url
    };

    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, '-')}.ics`;
    a.click();
  };

  const generateICS = (event: any) => {
    const startDate = event.start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(event.start.getTime() + event.duration * 60000)
      .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Hoodie Academy//Mentorship Sessions//EN
BEGIN:VEVENT
UID:${params.id}@hoodieacademy.xyz
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
URL:${event.url}
LOCATION:${event.url}
END:VEVENT
END:VCALENDAR`;
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

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'live_qa': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'workshop': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'office_hours': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'ama': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Session not found</p>
          <Link href="/mentorship">
            <Button variant="outline" className="border-cyan-500/30 text-cyan-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isLive = session.status === 'live';
  const isCompleted = session.status === 'completed';
  const isUpcoming = session.status === 'scheduled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link href="/mentorship">
          <Button variant="outline" className="mb-6 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Sessions
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Header */}
            <Card className="bg-slate-800/50 border-cyan-500/30">
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={`${getSessionTypeColor(session.session_type)} border`}>
                    {session.session_type.replace('_', ' ')}
                  </Badge>
                  {session.stream_platform && (
                    <Badge variant="outline" className="border-gray-500/30 text-gray-400">
                      <Video className="w-3 h-3 mr-1" />
                      {session.stream_platform}
                    </Badge>
                  )}
                  {isLive && (
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30 border animate-pulse">
                      🔴 LIVE NOW
                    </Badge>
                  )}
                  {isCompleted && session.recording_available && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Recording Available
                    </Badge>
                  )}
                </div>

                <CardTitle className="text-3xl text-cyan-400 mb-2">{session.title}</CardTitle>
                <CardDescription className="text-lg text-gray-300">
                  with <span className="text-cyan-300 font-semibold">{session.mentor_name}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-2">About This Session</h3>
                  <p className="text-gray-300 leading-relaxed">{session.description}</p>
                </div>

                {/* Date & Time Info */}
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-cyan-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Date</p>
                      <p className="text-gray-200 font-medium">{formatDate(session.scheduled_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-cyan-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Time</p>
                      <p className="text-gray-200 font-medium">{formatTime(session.scheduled_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-cyan-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Attendees</p>
                      <p className="text-gray-200 font-medium">
                        {session.current_rsvps} 
                        {session.max_attendees ? ` / ${session.max_attendees}` : ''} attending
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-cyan-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Duration</p>
                      <p className="text-gray-200 font-medium">{session.duration_minutes} minutes</p>
                    </div>
                  </div>
                </div>

                {/* Topics */}
                {session.topic_tags && session.topic_tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Topics Covered</h3>
                    <div className="flex flex-wrap gap-2">
                      {session.topic_tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-slate-700/50 text-cyan-300 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Stream / Recording */}
                {isLive && session.stream_platform === 'native' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-red-300">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        <h3 className="text-2xl font-bold">🔴 LIVE NOW</h3>
                      </div>
                      {(session.mentor_wallet === wallet || isAdmin) && (
                        <Badge className="bg-purple-600 text-white border-purple-500 text-lg px-4 py-2">
                          👑 Host
                        </Badge>
                      )}
                    </div>

                    {/* Host Permission Panel - Only shown to host */}
                    {(session.mentor_wallet === wallet || isAdmin) && wallet && (
                      <HostPermissionPanel 
                        sessionId={session.id}
                        hostWallet={wallet}
                      />
                    )}

                    {/* Native Webcam Interface */}
                    <NativeVideoPlayer 
                      sessionId={session.id}
                      isHost={session.mentor_wallet === wallet || isAdmin}
                      userName={wallet ? `${wallet.slice(0, 8)}...` : 'Student'}
                      userWallet={wallet || undefined}
                    />
                  </div>
                )}

                {/* Additional Streaming Platforms (if set) - Works alongside native */}
                {isLive && session.stream_url && (
                  <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                      🌐 Also Streaming On External Platform
                    </h4>
                    <Button 
                      asChild
                      variant="outline"
                      className="w-full border-blue-500/50 hover:bg-blue-500/10"
                    >
                      <a href={session.stream_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in {session.stream_platform || 'External Platform'}
                      </a>
                    </Button>
                  </div>
                )}

                {/* Fallback: External Platform Only (no native video) */}
                {isLive && session.stream_platform !== 'native' && !videoRoomUrl && session.stream_url && (
                  <div className="p-6 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/30 rounded-lg">
                    <h3 className="text-xl font-bold text-red-300 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      Session is Live on {session.stream_platform}!
                    </h3>
                    <p className="text-gray-300 mb-4">Join the session now to participate in real-time!</p>
                    <Button 
                      asChild
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-6"
                    >
                      <a href={session.stream_url} target="_blank" rel="noopener noreferrer">
                        <Play className="w-5 h-5 mr-2" />
                        Join Live Stream on {session.stream_platform}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}

                {isCompleted && session.recording_available && session.recording_url && (
                  <div className="p-6 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-2 border-green-500/30 rounded-lg">
                    <h3 className="text-xl font-bold text-green-300 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Recording Available
                    </h3>
                    <p className="text-gray-300 mb-4">Watch the recording of this session anytime</p>
                    <Button 
                      asChild
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6"
                    >
                      <a href={session.recording_url} target="_blank" rel="noopener noreferrer">
                        <Play className="w-5 h-5 mr-2" />
                        Watch Recording
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Q&A Section */}
            <Card className="bg-slate-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-400">Questions & Answers</CardTitle>
                <CardDescription>Submit your questions or upvote existing ones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Submit Question */}
                {isUpcoming && (
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <h3 className="font-semibold text-gray-200 mb-3">Submit a Question</h3>
                    <Textarea
                      placeholder="What would you like to ask?"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="mb-3 bg-slate-800 border-slate-600 text-gray-200"
                      rows={3}
                    />
                    <div className="flex flex-wrap gap-3 items-center">
                      <select
                        value={questionCategory}
                        onChange={(e) => setQuestionCategory(e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded text-gray-200"
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical</option>
                        <option value="strategy">Strategy</option>
                        <option value="other">Other</option>
                      </select>
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded"
                        />
                        Submit anonymously
                      </label>
                      <Button
                        onClick={handleSubmitQuestion}
                        disabled={submitting || !newQuestion.trim()}
                        className="ml-auto bg-cyan-600 hover:bg-cyan-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {submitting ? 'Submitting...' : 'Submit Question'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Questions List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-200">
                    {questions.length} Question{questions.length !== 1 ? 's' : ''}
                  </h3>
                  {questions.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      No questions yet. Be the first to ask!
                    </p>
                  ) : (
                    questions.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleUpvote(q.id)}
                            className="flex flex-col items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors"
                          >
                            <ThumbsUp className="w-5 h-5" />
                            <span className="text-sm font-semibold">{q.upvotes}</span>
                          </button>
                          <div className="flex-1">
                            <p className="text-gray-200 mb-2">{q.question}</p>
                            <div className="flex flex-wrap gap-2 items-center text-sm">
                              {q.category && (
                                <Badge variant="outline" className="text-xs">
                                  {q.category}
                                </Badge>
                              )}
                              <span className="text-gray-500">
                                {q.is_anonymous ? 'Anonymous' : `by ${q.wallet_address.slice(0, 8)}...`}
                              </span>
                              {q.is_answered && (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                  ✓ Answered
                                </Badge>
                              )}
                            </div>
                            {q.answer && (
                              <div className="mt-3 p-3 bg-green-500/10 border-l-4 border-green-500 rounded">
                                <p className="text-sm font-semibold text-green-300 mb-1">Answer:</p>
                                <p className="text-gray-300">{q.answer}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Session Controls for Admins/Presenters */}
            <SessionControls
              sessionId={params.id}
              walletAddress={wallet}
              currentStatus={session.status}
              onStatusChange={() => {
                fetchSessionDetails();
              }}
            />

            {/* RSVP Card */}
            {isUpcoming && (
              <Card className="bg-slate-800/50 border-cyan-500/30 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-400">Reserve Your Spot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userRSVP ? (
                    <div className="p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg text-center">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                      <p className="text-green-300 font-semibold">You're Registered!</p>
                      <p className="text-sm text-gray-400 mt-1">We'll remind you before the session starts</p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleRSVP}
                      disabled={rsvpLoading}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-6 text-lg"
                    >
                      {rsvpLoading ? 'Processing...' : 'RSVP Now'}
                    </Button>
                  )}

                  <Button
                    onClick={downloadCalendar}
                    variant="outline"
                    className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Add to Calendar
                  </Button>

                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }}
                    variant="outline"
                    className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Session
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Session Stats */}
            <Card className="bg-slate-800/50 border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-lg text-gray-200">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">RSVPs</span>
                  <span className="text-cyan-300 font-semibold">{session.current_rsvps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Questions</span>
                  <span className="text-cyan-300 font-semibold">{questions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <Badge className={
                    isLive ? 'bg-red-500/20 text-red-300' :
                    isCompleted ? 'bg-green-500/20 text-green-300' :
                    'bg-blue-500/20 text-blue-300'
                  }>
                    {session.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

