'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Phone,
  Users,
  Settings,
  Maximize,
  Volume2,
  VolumeX
} from 'lucide-react';

interface VideoPlayerProps {
  roomUrl: string;
  isHost?: boolean;
  userName?: string;
  onLeave?: () => void;
}

// Global singleton to prevent duplicate instances
let globalDailyInstance: any = null;
let globalRoomUrl: string | null = null;
let isCreating = false; // Lock to prevent concurrent creation

export function VideoPlayer({ roomUrl, isHost = false, userName = 'Student', onLeave }: VideoPlayerProps) {
  const [daily, setDaily] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Check if this is demo mode (hoodie-academy.daily.co URLs are demo)
  const isDemoMode = roomUrl.includes('hoodie-academy.daily.co');

  useEffect(() => {
    // Dynamically import Daily.co (client-side only)
    const loadDaily = async () => {
      try {
        // If global instance exists for same room, reuse it
        if (globalDailyInstance && globalRoomUrl === roomUrl) {
          console.log('♻️ Reusing existing Daily instance');
          setDaily(globalDailyInstance);
          setIsLoading(false);
          return;
        }

        // If already creating, wait and retry
        if (isCreating) {
          console.log('⏳ Waiting for existing creation to complete...');
          await new Promise(resolve => setTimeout(resolve, 500));
          if (globalDailyInstance && globalRoomUrl === roomUrl) {
            console.log('♻️ Using instance created by another component');
            setDaily(globalDailyInstance);
            setIsLoading(false);
            return;
          }
        }

        // Lock creation
        isCreating = true;

        // Cleanup old instance if it exists for different room
        if (globalDailyInstance && globalRoomUrl !== roomUrl) {
          console.log('🧹 Destroying old Daily instance for different room');
          try {
            globalDailyInstance.destroy();
          } catch (e) {
            console.log('Note: Previous instance already destroyed');
          }
          globalDailyInstance = null;
          globalRoomUrl = null;
        }

        const DailyIframe = (await import('@daily-co/daily-js')).default;
        
        if (!videoContainerRef.current) {
          isCreating = false;
          return;
        }

        console.log('🎥 Creating new Daily.co video instance...');

        // Create Daily instance
        const callFrame = DailyIframe.createFrame(videoContainerRef.current, {
          showLeaveButton: false,
          showFullscreenButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '12px'
          }
        });

        // Store globally to prevent duplicates
        globalDailyInstance = callFrame;
        globalRoomUrl = roomUrl;
        setDaily(callFrame);
        
        // Unlock creation
        isCreating = false;

        // Event listeners
        callFrame.on('joined-meeting', () => {
          console.log('✅ Joined meeting');
          setIsJoined(true);
          setIsLoading(false);
        });

        callFrame.on('left-meeting', () => {
          console.log('👋 Left meeting');
          setIsJoined(false);
          onLeave?.();
        });

        callFrame.on('participant-joined', () => {
          updateParticipantCount(callFrame);
        });

        callFrame.on('participant-left', () => {
          updateParticipantCount(callFrame);
        });

        callFrame.on('error', (error: any) => {
          console.error('❌ Daily error:', error);
          setError('Failed to connect to video session');
          setIsLoading(false);
        });

        // Join the room
        try {
          await callFrame.join({ 
            url: roomUrl,
            userName: userName
          });
          console.log('✅ Successfully joined video room');
        } catch (joinError: any) {
          console.error('❌ Failed to join room:', joinError);
          
          // If demo mode (invalid room), show demo interface instead
          if (roomUrl.includes('hoodie-academy.daily.co')) {
            console.log('📺 Demo mode detected - showing demo video interface');
            setError(null); // Clear error
            setIsJoined(true); // Pretend we joined
            setIsLoading(false);
            setParticipantCount(1); // Show yourself
            
            // Simulate successful connection for demo purposes
            setTimeout(() => {
              console.log('✅ Demo video interface ready');
            }, 500);
            
            isCreating = false;
            return;
          }
          
          throw joinError; // Re-throw if not demo mode
        }

      } catch (err) {
        console.error('Failed to load Daily:', err);
        setError('Failed to initialize video player');
        setIsLoading(false);
        isCreating = false; // Unlock on error
      }
    };

    loadDaily();

    // Cleanup - only destroy if this is the last component using it
    return () => {
      console.log('🧹 Component unmounting...');
      // Don't destroy global instance on unmount - it will be reused
      // Only destroy when room URL changes or app closes
    };
  }, [roomUrl, userName]);

  const updateParticipantCount = (callFrame: any) => {
    const participants = callFrame.participants();
    const count = Object.keys(participants).length;
    setParticipantCount(count);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    if (daily && !isDemoMode) {
      daily.setLocalAudio(!newMutedState);
    }
    setIsMuted(newMutedState);
    console.log(newMutedState ? '🔇 Muted' : '🎙️ Unmuted');
  };

  const toggleVideo = () => {
    const newVideoState = !isVideoOff;
    if (daily && !isDemoMode) {
      daily.setLocalVideo(!newVideoState);
    }
    setIsVideoOff(newVideoState);
    console.log(newVideoState ? '📹 Camera Off' : '📹 Camera On');
  };

  const toggleScreenShare = async () => {
    if (!isHost) {
      alert('Screen sharing is only available for hosts');
      return;
    }
    
    if (isDemoMode) {
      // Demo mode - just toggle state
      setIsScreenSharing(!isScreenSharing);
      console.log(isScreenSharing ? '🖥️ Stopped screen share (demo)' : '🖥️ Started screen share (demo)');
      return;
    }
    
    if (!daily) return;
    
    try {
      if (isScreenSharing) {
        await daily.stopScreenShare();
        setIsScreenSharing(false);
        console.log('🖥️ Stopped screen share');
      } else {
        await daily.startScreenShare();
        setIsScreenSharing(true);
        console.log('🖥️ Started screen share');
      }
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  const toggleSpeaker = () => {
    const newSpeakerState = !isSpeakerOff;
    if (daily && !isDemoMode) {
      daily.setOutputDeviceId(newSpeakerState ? 'default' : 'mute');
    }
    setIsSpeakerOff(newSpeakerState);
    console.log(newSpeakerState ? '🔇 Speaker Off' : '🔊 Speaker On');
  };

  const leaveCall = () => {
    if (daily && !isDemoMode) {
      daily.leave();
    }
    if (onLeave) {
      onLeave();
    }
    console.log('👋 Left call');
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoContainerRef.current.requestFullscreen();
    }
  };

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/30 p-8 text-center">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-red-500/30 text-red-300"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative bg-slate-900 rounded-xl overflow-hidden border-2 border-cyan-500/30" style={{ minHeight: '600px' }}>
        {/* Demo Mode Visual Interface */}
        {isDemoMode && isJoined && (
          <div className="w-full h-full p-8">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Host (You) */}
              <div className="relative bg-gradient-to-br from-purple-900/40 to-cyan-900/40 rounded-lg border-2 border-purple-500/50 p-6 aspect-video flex flex-col items-center justify-center">
                <div className="absolute top-2 left-2 bg-purple-600 px-2 py-1 rounded text-xs font-bold">
                  👑 YOU (Host)
                </div>
                <VideoIcon className="w-24 h-24 text-purple-400 mb-4" />
                <p className="text-gray-300 text-lg font-semibold">{userName}</p>
                <p className="text-gray-500 text-sm">Camera {isVideoOff ? 'Off' : 'Active'}</p>
                {!isVideoOff && <div className="mt-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
              </div>

              {/* Demo Attendee 1 */}
              <div className="relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-lg border border-slate-600/50 p-6 aspect-video flex flex-col items-center justify-center opacity-60">
                <Users className="w-20 h-20 text-gray-500 mb-4" />
                <p className="text-gray-400 text-sm">Waiting for students to join...</p>
              </div>
            </div>

            {/* Demo Info Banner */}
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-center text-gray-300 text-sm">
                📺 <strong>Demo Video Interface</strong> - Your camera feed will appear here. Students who join will show in the grid.
                <br />
                <span className="text-xs text-gray-400 mt-1 block">To enable real video: Add DAILY_API_KEY to your .env.local file</span>
              </p>
            </div>
          </div>
        )}

        {/* Real Daily.co Interface */}
        {!isDemoMode && (
          <>
            <div ref={videoContainerRef} className="w-full h-full" />
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Connecting to video session...</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Participant Count Overlay */}
        {isJoined && !isDemoMode && (
          <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur px-3 py-2 rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-200">{participantCount} watching</span>
          </div>
        )}

        {/* Demo Mode Participant Count */}
        {isJoined && isDemoMode && (
          <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur px-3 py-2 rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-200">{participantCount} participant</span>
            <span className="text-xs text-blue-400">(Demo)</span>
          </div>
        )}
      </div>

      {/* Controls */}
      {isJoined && (
        <Card className="bg-slate-800/50 border-slate-600/30 p-4">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {/* Microphone */}
            <Button
              onClick={toggleMute}
              variant={isMuted ? 'destructive' : 'outline'}
              size="lg"
              className={isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'border-slate-600 hover:bg-slate-700'
              }
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {/* Camera */}
            <Button
              onClick={toggleVideo}
              variant={isVideoOff ? 'destructive' : 'outline'}
              size="lg"
              className={isVideoOff 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'border-slate-600 hover:bg-slate-700'
              }
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
            </Button>

            {/* Screen Share (Host only) */}
            {isHost && (
              <Button
                onClick={toggleScreenShare}
                variant={isScreenSharing ? 'default' : 'outline'}
                size="lg"
                className={isScreenSharing 
                  ? 'bg-cyan-600 hover:bg-cyan-700' 
                  : 'border-slate-600 hover:bg-slate-700'
                }
              >
                {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </Button>
            )}

            {/* Speaker */}
            <Button
              onClick={toggleSpeaker}
              variant={isSpeakerOff ? 'destructive' : 'outline'}
              size="lg"
              className={isSpeakerOff 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'border-slate-600 hover:bg-slate-700'
              }
            >
              {isSpeakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            {/* Fullscreen */}
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="lg"
              className="border-slate-600 hover:bg-slate-700"
            >
              <Maximize className="w-5 h-5" />
            </Button>

            {/* Leave Call */}
            <Button
              onClick={leaveCall}
              variant="destructive"
              size="lg"
              className="bg-red-600 hover:bg-red-700 ml-auto"
            >
              <Phone className="w-5 h-5 mr-2" />
              Leave
            </Button>
          </div>

          {/* Host Instructions */}
          {isHost && (
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm text-cyan-300">
                <strong>🎥 You're the host!</strong> You can screen share, mute others, and control the session.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

