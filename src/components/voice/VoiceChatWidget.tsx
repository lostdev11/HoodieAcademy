'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Mic, MicOff, PhoneOff, Users, Plus, X, Send, 
  Volume2, VolumeX, MessageSquare, ChevronDown, ChevronUp,
  Radio
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VoiceRoom {
  id: string;
  room_name: string;
  room_description?: string;
  created_by: string;
  creator_name: string;
  squad?: string;
  room_type: string;
  max_participants: number;
  current_participants: number;
  is_full: boolean;
  created_at: string;
  tags?: string[];
}

interface VoiceMessage {
  id: string;
  wallet_address: string;
  content: string;
  message_type: string;
  created_at: string;
  users: {
    display_name: string;
    level: number;
    squad: string;
  };
}

interface VoiceChatWidgetProps {
  walletAddress: string;
  userSquad?: string;
  className?: string;
}

export default function VoiceChatWidget({ walletAddress, userSquad, className = '' }: VoiceChatWidgetProps) {
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRoomList, setShowRoomList] = useState(true);
  
  // Room state
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Messages
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Create room form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomType, setNewRoomType] = useState<string>('casual');

  useEffect(() => {
    if (walletAddress) {
      fetchRooms();
      const interval = setInterval(fetchRooms, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [walletAddress, userSquad]);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Refresh messages every 3 seconds
      return () => clearInterval(interval);
    }
  }, [activeRoom]);

  const fetchRooms = async () => {
    try {
      const url = `/api/voice/rooms${userSquad ? `?squad=${userSquad}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching voice rooms:', error);
    }
  };

  const fetchMessages = async () => {
    if (!activeRoom) return;
    
    try {
      const response = await fetch(`/api/voice/messages?room_id=${activeRoom.id}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/voice/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_name: newRoomName,
          room_description: newRoomDescription,
          created_by: walletAddress,
          squad: userSquad,
          room_type: newRoomType,
          max_participants: 10,
          is_public: true,
          tags: [newRoomType, userSquad].filter(Boolean)
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateDialog(false);
        setNewRoomName('');
        setNewRoomDescription('');
        setNewRoomType('casual');
        await fetchRooms();
        await joinRoom(data.room.id);
      } else {
        alert(data.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/voice/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          wallet_address: walletAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          setActiveRoom(room);
          setShowRoomList(false);
        }
        await fetchRooms();
      } else {
        alert(data.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async () => {
    if (!activeRoom) return;

    setLoading(true);
    try {
      const response = await fetch('/api/voice/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: activeRoom.id,
          wallet_address: walletAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        setActiveRoom(null);
        setShowRoomList(true);
        setShowChat(false);
        await fetchRooms();
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!activeRoom || !newMessage.trim()) return;

    try {
      const response = await fetch('/api/voice/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: activeRoom.id,
          wallet_address: walletAddress,
          content: newMessage,
          message_type: 'text'
        })
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getRoomTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      casual: <Radio className="w-4 h-4" />,
      study: <Users className="w-4 h-4" />,
      gaming: <Volume2 className="w-4 h-4" />,
      meeting: <MessageSquare className="w-4 h-4" />,
      qa: <MessageSquare className="w-4 h-4" />
    };
    return icons[type] || <Radio className="w-4 h-4" />;
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 ${className}`}>
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
        >
          <Volume2 className="w-6 h-6" />
          {activeRoom && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 ${className}`}>
      <Card className="bg-slate-800 border-purple-500/30 shadow-2xl">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-400" />
              <CardTitle className="text-lg text-white">
                {activeRoom ? activeRoom.room_name : 'Voice Chat'}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRoomList(!showRoomList)}
                className="hover:bg-slate-700"
              >
                {showRoomList ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(true)}
                className="hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* Active Room View */}
          {activeRoom && !showRoomList ? (
            <div className="space-y-4">
              {/* Room Info */}
              <div className="flex items-center gap-2 text-sm text-slate-400">
                {getRoomTypeIcon(activeRoom.room_type)}
                <span className="capitalize">{activeRoom.room_type}</span>
                <span>•</span>
                <Users className="w-4 h-4" />
                <span>{activeRoom.current_participants}/{activeRoom.max_participants}</span>
                {activeRoom.squad && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">{activeRoom.squad}</Badge>
                  </>
                )}
              </div>

              {/* Voice Controls */}
              <div className="flex items-center justify-center gap-3 py-4 bg-slate-700/50 rounded-lg">
                <Button
                  size="sm"
                  variant={isMuted ? "default" : "outline"}
                  onClick={() => setIsMuted(!isMuted)}
                  className={isMuted ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={isDeafened ? "default" : "outline"}
                  onClick={() => setIsDeafened(!isDeafened)}
                  className={isDeafened ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={showChat ? "default" : "outline"}
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={leaveRoom}
                  disabled={loading}
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </div>

              {/* Chat Messages */}
              {showChat && (
                <div className="space-y-2">
                  <div className="h-48 overflow-y-auto bg-slate-700/30 rounded-lg p-3 space-y-2">
                    {messages.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">No messages yet</p>
                    ) : (
                      messages.slice().reverse().map(msg => (
                        <div key={msg.id} className="text-sm">
                          <span className="font-semibold text-purple-400">{msg.users.display_name}:</span>
                          <span className="text-slate-300 ml-2">{msg.content}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Button size="sm" onClick={sendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Voice Note */}
              <p className="text-xs text-slate-400 text-center">
                🎤 Voice chat requires WebRTC-enabled browser
              </p>
            </div>
          ) : (
            /* Room List */
            <div className="space-y-3">
              {/* Create Room Button */}
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Voice Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-purple-500/30">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create Voice Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400">Room Name</label>
                      <Input
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="My Voice Room"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Description (Optional)</label>
                      <Textarea
                        value={newRoomDescription}
                        onChange={(e) => setNewRoomDescription(e.target.value)}
                        placeholder="Describe your room..."
                        className="bg-slate-700 border-slate-600"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Room Type</label>
                      <Select value={newRoomType} onValueChange={setNewRoomType}>
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casual">Casual Hangout</SelectItem>
                          <SelectItem value="study">Study Session</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="qa">Q&A / AMA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={createRoom}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {loading ? 'Creating...' : 'Create Room'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Active Rooms */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {rooms.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="text-sm text-slate-400">No active voice rooms</p>
                    <p className="text-xs text-slate-500">Create one to get started!</p>
                  </div>
                ) : (
                  rooms.map(room => (
                    <Card key={room.id} className="bg-slate-700/50 border-slate-600 hover:border-purple-500/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getRoomTypeIcon(room.room_type)}
                              <h4 className="font-semibold text-white text-sm">{room.room_name}</h4>
                            </div>
                            {room.room_description && (
                              <p className="text-xs text-slate-400 mb-2 line-clamp-1">{room.room_description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Users className="w-3 h-3" />
                              <span>{room.current_participants}/{room.max_participants}</span>
                              {room.squad && (
                                <Badge variant="outline" className="text-xs">{room.squad}</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => joinRoom(room.id)}
                            disabled={loading || room.is_full}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {room.is_full ? 'Full' : 'Join'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

