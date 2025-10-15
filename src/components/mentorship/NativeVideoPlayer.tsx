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
  Phone,
  Users,
  Maximize
} from 'lucide-react';

interface NativeVideoPlayerProps {
  sessionId: string;
  isHost?: boolean;
  userName?: string;
  userWallet?: string;
  onLeave?: () => void;
}

export function NativeVideoPlayer({ sessionId, isHost = false, userName = 'Host', userWallet, onLeave }: NativeVideoPlayerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Student permission states
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('none'); // 'none', 'waiting', 'approved', 'denied'
  const [requestingPermission, setRequestingPermission] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check student permissions on mount
  useEffect(() => {
    if (!isHost && userWallet) {
      checkPermissions();
    } else if (isHost) {
      // Host always has permission
      setHasPermission(true);
      setPermissionStatus('approved');
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isHost, userWallet]);

  // Start camera when permission is granted for students
  useEffect(() => {
    if (!isHost && hasPermission && permissionStatus === 'approved') {
      startCamera();
    }
  }, [hasPermission, permissionStatus]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      console.log('📹 Requesting camera and microphone access...');
      
      // Request camera and microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      console.log('✅ Camera and microphone access granted!');
      setStream(mediaStream);
      setPermissionGranted(true);
      setIsLoading(false);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('❌ Failed to access camera:', err);
      setError(err.message || 'Failed to access camera and microphone');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      console.log('🛑 Camera stopped');
    }
  };

  const checkPermissions = async () => {
    if (!userWallet) return;

    try {
      const response = await fetch(
        `/api/mentorship/permissions/check?session_id=${sessionId}&student_wallet=${userWallet}`
      );
      const data = await response.json();

      if (data.success && data.permissions) {
        setHasPermission(data.permissions.has_permission);
        setPermissionStatus(data.permissions.status);
        console.log('✅ Permission status:', data.permissions);
      }
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
    }
  };

  const requestPermission = async () => {
    if (!userWallet || requestingPermission) return;

    try {
      setRequestingPermission(true);
      const response = await fetch('/api/mentorship/permissions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          student_wallet: userWallet,
          student_name: userName
        })
      });

      const data = await response.json();

      if (data.success) {
        setPermissionStatus('waiting');
        console.log('✅ Permission requested');
        // Poll for approval
        pollForApproval();
      } else {
        alert('Failed to request permission');
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      alert('Failed to request permission');
    } finally {
      setRequestingPermission(false);
    }
  };

  const pollForApproval = () => {
    const interval = setInterval(async () => {
      if (!userWallet) return;

      try {
        const response = await fetch(
          `/api/mentorship/permissions/check?session_id=${sessionId}&student_wallet=${userWallet}`
        );
        const data = await response.json();

        if (data.success && data.permissions) {
          if (data.permissions.status === 'approved') {
            setHasPermission(true);
            setPermissionStatus('approved');
            clearInterval(interval);
            console.log('🎉 Permission approved!');
          } else if (data.permissions.status === 'denied') {
            setPermissionStatus('denied');
            clearInterval(interval);
            console.log('❌ Permission denied');
          }
        }
      } catch (error) {
        console.error('Error polling permissions:', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const toggleMute = () => {
    if (!stream) return;
    
    const audioTracks = stream.getAudioTracks();
    const newMutedState = !isMuted;
    
    audioTracks.forEach(track => {
      track.enabled = !newMutedState;
    });
    
    setIsMuted(newMutedState);
    console.log(newMutedState ? '🔇 Muted' : '🎙️ Unmuted');
  };

  const toggleVideo = () => {
    if (!stream) return;
    
    const videoTracks = stream.getVideoTracks();
    const newVideoState = !isVideoOff;
    
    videoTracks.forEach(track => {
      track.enabled = !newVideoState;
    });
    
    setIsVideoOff(newVideoState);
    console.log(newVideoState ? '📹 Camera Off' : '📹 Camera On');
  };

  const shareScreen = async () => {
    if (!isHost) {
      alert('Screen sharing is only available for hosts');
      return;
    }

    try {
      console.log('🖥️ Starting screen share...');
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      // Switch video element to screen share
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
      }

      // When screen share stops, switch back to camera
      screenStream.getVideoTracks()[0].onended = () => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      };

      console.log('✅ Screen sharing started');
      alert('🖥️ Screen sharing active! Click "Stop Sharing" in your browser to end.');
    } catch (err) {
      console.error('Screen share error:', err);
      alert('Screen sharing canceled or not supported');
    }
  };

  const leaveCall = () => {
    stopCamera();
    if (onLeave) {
      onLeave();
    }
    console.log('👋 Left call');
  };

  const endLiveSession = async () => {
    if (!isHost || !userWallet) return;

    const confirmed = confirm(
      '🛑 End Live Session?\n\n' +
      'This will:\n' +
      '• Stop the live stream\n' +
      '• Disconnect all students\n' +
      '• Mark the session as completed\n\n' +
      'Are you sure?'
    );

    if (!confirmed) return;

    try {
      console.log('🛑 Ending live session...');

      const response = await fetch('/api/mentorship/end-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          wallet_address: userWallet
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Session ended successfully');
        alert('✅ Live session ended successfully!');
        
        // Stop camera
        stopCamera();

        // Redirect to session page or dashboard
        window.location.href = '/admin-dashboard';
      } else {
        console.error('❌ Failed to end session:', data.error);
        alert(`❌ Failed to end session: ${data.error}`);
      }
    } catch (error) {
      console.error('💥 Error ending session:', error);
      alert('Failed to end session. Please try again.');
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/30 p-8 text-center">
        <p className="text-red-400 text-lg mb-4">⚠️ Camera Access Required</p>
        <p className="text-gray-300 mb-4">{error}</p>
        <div className="space-y-2 text-sm text-gray-400 mb-4">
          <p>To go live, please:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Allow camera and microphone access when prompted</li>
            <li>Check browser settings if access was previously denied</li>
            <li>Make sure your camera is not being used by another application</li>
          </ul>
        </div>
        <Button
          onClick={() => {
            setError(null);
            startCamera();
          }}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  // Student waiting for permission
  if (!isHost && !hasPermission) {
    if (permissionStatus === 'none') {
      return (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 p-12 text-center">
          <div className="space-y-6">
            <div className="w-24 h-24 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto border-2 border-purple-500/50">
              <Users className="w-12 h-12 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-200 mb-3">🎓 Join the Live Session</h3>
              <p className="text-gray-400 mb-2">You're viewing this live session</p>
              <p className="text-gray-500 text-sm">To speak and show your video, you need host approval</p>
            </div>
            <Button
              onClick={requestPermission}
              disabled={requestingPermission}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-lg text-lg"
            >
              {requestingPermission ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Requesting...
                </>
              ) : (
                <>✋ Raise Hand to Speak</>
              )}
            </Button>
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-gray-300">
                💡 Click "Raise Hand" and the host will be notified. Once approved, you'll be able to turn on your camera and microphone.
              </p>
            </div>
          </div>
        </Card>
      );
    } else if (permissionStatus === 'waiting') {
      return (
        <Card className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border-orange-500/30 p-12 text-center">
          <div className="space-y-6">
            <div className="w-24 h-24 bg-orange-900/30 rounded-full flex items-center justify-center mx-auto border-2 border-orange-500/50 animate-pulse">
              <span className="text-5xl">✋</span>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-200 mb-3">⏳ Waiting for Host Approval</h3>
              <p className="text-gray-400 mb-2">Your hand is raised!</p>
              <p className="text-gray-500 text-sm">The host will approve your request shortly</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-gray-300">
                ⏰ Checking for approval every few seconds...
              </p>
            </div>
          </div>
        </Card>
      );
    } else if (permissionStatus === 'denied') {
      return (
        <Card className="bg-gradient-to-br from-red-900/20 to-slate-900 border-red-500/30 p-12 text-center">
          <div className="space-y-6">
            <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/50">
              <span className="text-5xl">⛔</span>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-200 mb-3">❌ Request Denied</h3>
              <p className="text-gray-400 mb-2">The host declined your request to speak</p>
              <p className="text-gray-500 text-sm">You can continue watching the session</p>
            </div>
            <Button
              onClick={requestPermission}
              variant="outline"
              className="border-gray-600 hover:bg-slate-700"
            >
              Try Requesting Again
            </Button>
          </div>
        </Card>
      );
    }
  }

  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-xl border-2 border-cyan-500/30 p-12 text-center" style={{ minHeight: '600px' }}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">
            {isHost ? 'Requesting Camera Access' : 'Getting Ready...'}
          </h3>
          <p className="text-gray-400">
            {isHost 
              ? 'Please allow camera and microphone access when prompted by your browser'
              : 'Setting up your video and audio...'}
          </p>
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg max-w-md">
            <p className="text-sm text-gray-300">
              🔔 Your browser will ask for permission to use your camera and microphone. 
              Click <strong>"Allow"</strong> to start streaming.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative bg-slate-900 rounded-xl overflow-hidden border-2 border-cyan-500/30" style={{ minHeight: '600px' }}>
        {/* Host Video Feed (Your Webcam) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full">
          {/* Your Video */}
          <div className="relative bg-slate-800 rounded-lg overflow-hidden border-2 border-purple-500/50">
            <div className="absolute top-2 left-2 bg-purple-600 px-3 py-1 rounded-lg text-sm font-bold z-10 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              👑 YOU (Host)
            </div>
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted // Mute own audio to prevent feedback
              className="w-full h-full object-cover"
              style={{ minHeight: '400px', transform: 'scaleX(-1)' }} // Mirror effect
            />

            {isVideoOff && (
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="w-24 h-24 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Camera Off</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-2 left-2 bg-slate-900/80 px-2 py-1 rounded text-xs text-gray-300">
              {userName}
            </div>
          </div>

          {/* Student Slots */}
          <div className="relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-lg border border-slate-600/50 flex items-center justify-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Users className="w-20 h-20 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Waiting for students to join...</p>
              <p className="text-gray-500 text-sm mt-2">Share the session link to invite participants</p>
            </div>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="absolute top-4 right-4 bg-red-600/90 backdrop-blur px-4 py-2 rounded-lg flex items-center gap-2 z-10">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span className="text-sm text-white font-bold">LIVE</span>
        </div>

        {/* Participant Count */}
        <div className="absolute top-16 right-4 bg-slate-800/90 backdrop-blur px-3 py-2 rounded-lg flex items-center gap-2 z-10">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-gray-200">1 participant</span>
        </div>
      </div>

      {/* Controls */}
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
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="ml-2">{isMuted ? 'Unmute' : 'Mute'}</span>
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
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
            <span className="ml-2">{isVideoOff ? 'Camera Off' : 'Camera On'}</span>
          </Button>

          {/* Screen Share (Host Only) */}
          {isHost && (
            <Button
              onClick={shareScreen}
              variant="outline"
              size="lg"
              className="border-purple-500/50 hover:bg-purple-500/20 text-purple-300"
              title="Share your screen"
            >
              <Monitor className="w-5 h-5" />
              <span className="ml-2">Share Screen</span>
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="lg"
            className="border-slate-600 hover:bg-slate-700"
            title="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </Button>

          {/* End Live Session (Host Only) */}
          {isHost && (
            <Button
              onClick={endLiveSession}
              variant="destructive"
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 border-2 border-orange-500/50 font-bold"
              title="End the live session for everyone"
            >
              <span className="mr-2">🛑</span>
              <span>End Live</span>
            </Button>
          )}

          {/* Leave */}
          <Button
            onClick={leaveCall}
            variant="destructive"
            size="lg"
            className="bg-red-600 hover:bg-red-700"
            title="Leave session"
          >
            <Phone className="w-5 h-5" />
            <span className="ml-2">Leave</span>
          </Button>
        </div>

        {/* Host Info */}
        {isHost && (
          <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg text-center">
            <p className="text-sm text-gray-300">
              👑 <strong>Host Controls Active</strong> - You can share your screen, manage permissions, and click <strong>🛑 End Live</strong> to close the session for everyone
            </p>
          </div>
        )}
      </Card>

      {/* Info Banner */}
      <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
        <p className="text-center text-gray-300 text-sm">
          🎥 <strong>Native Webcam Active</strong> - Your camera feed is showing above. 
          Students will appear in the grid when they join this session.
        </p>
      </div>
    </div>
  );
}

