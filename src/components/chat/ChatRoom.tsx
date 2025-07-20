'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, Message, NewMessage } from '@/lib/supabase';
import MessageBubble from './MessageBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Wifi, WifiOff } from 'lucide-react';

interface ChatRoomProps {
  squad: string;
}

// Local storage key for squad messages
const getSquadMessagesKey = (squad: string) => `squad_messages_${squad}`;

export default function ChatRoom({ squad }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user's wallet address and display name
  useEffect(() => {
    const walletAddress = localStorage.getItem('walletAddress');
    const displayName = localStorage.getItem('userDisplayName');
    
    if (walletAddress) {
      setCurrentUser(walletAddress);
    } else if (displayName) {
      setCurrentUser(displayName);
    } else {
      setCurrentUser('Anonymous');
    }
  }, []);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from localStorage
  const loadLocalMessages = () => {
    try {
      const messagesKey = getSquadMessagesKey(squad);
      const savedMessages = localStorage.getItem(messagesKey);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } else {
        // Add welcome message if no messages exist
        const welcomeMessage: Message = {
          id: 'welcome-1',
          text: `Welcome to the ${squad} squad chat! 🎉 Start the conversation with your squad members.`,
          sender: 'Hoodie Academy',
          squad: squad,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        saveLocalMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading local messages:', error);
    }
  };

  // Save messages to localStorage
  const saveLocalMessages = (messages: Message[]) => {
    try {
      const messagesKey = getSquadMessagesKey(squad);
      localStorage.setItem(messagesKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving local messages:', error);
    }
  };

  // Add message to local storage
  const addLocalMessage = (text: string, sender: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: sender,
      squad: squad,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveLocalMessages(updatedMessages);
  };

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        console.log('Loading messages for squad:', squad);
        
        // First, try to load from localStorage
        loadLocalMessages();
        
        // Test Supabase connection with more detailed logging
        console.log('Testing Supabase connection...');
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mchwxspjjgyboshzqrsd.supabase.co');
        console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        
        const { data: testData, error: testError } = await supabase
          .from('messages')
          .select('count')
          .limit(1);

        if (testError) {
          console.log('Supabase connection failed:', testError);
          console.log('Error details:', {
            message: testError.message,
            details: testError.details,
            hint: testError.hint,
            code: testError.code
          });
          setUseLocalStorage(true);
          setIsOnline(false);
          setIsLoading(false);
          return;
        }

        console.log('Supabase connection successful');
        console.log('Test data:', testData);
        setIsOnline(true);
        setUseLocalStorage(false);
        
        // Load messages from Supabase
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('squad', squad)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages from Supabase:', error);
          console.log('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          setUseLocalStorage(true);
          setIsOnline(false);
        } else {
          console.log('Loaded messages from Supabase:', data);
          setMessages(data || []);
          // Also save to localStorage as backup
          if (data) {
            saveLocalMessages(data);
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setUseLocalStorage(true);
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [squad]);

  // Subscribe to real-time messages (only if online)
  useEffect(() => {
    if (!isOnline || useLocalStorage) return;

    console.log('Setting up real-time subscription for squad:', squad);
    
    const channel = supabase
      .channel(`squad-${squad}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `squad=eq.${squad}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel subscription error');
          setUseLocalStorage(true);
          setIsOnline(false);
        }
      });

    return () => {
      console.log('Cleaning up subscription for squad:', squad);
      supabase.removeChannel(channel);
    };
  }, [squad, isOnline, useLocalStorage]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    setIsSending(true);
    try {
      if (useLocalStorage || !isOnline) {
        // Use localStorage
        addLocalMessage(newMessage, currentUser);
        setNewMessage('');
        console.log('Message sent to localStorage');
      } else {
        // Try Supabase
        const messageData: NewMessage = {
          text: newMessage.trim(),
          sender: currentUser,
          squad: squad,
        };

        console.log('Attempting to send message to Supabase:', messageData);

        const { data, error } = await supabase
          .from('messages')
          .insert([messageData])
          .select();

        if (error) {
          console.error('Error sending message to Supabase:', error);
          // Fallback to localStorage
          addLocalMessage(newMessage, currentUser);
          setUseLocalStorage(true);
          setIsOnline(false);
        } else {
          console.log('Message sent successfully to Supabase:', data);
          setNewMessage('');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback to localStorage
      addLocalMessage(newMessage, currentUser);
      setUseLocalStorage(true);
      setIsOnline(false);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-800/30 rounded-lg border border-slate-600/30">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-600/30 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400">
              {squad} Squad Chat
            </h3>
            <p className="text-sm text-gray-400">
              {useLocalStorage ? 'Local messaging' : 'Real-time messaging'} for {squad} squad members
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 text-green-400">
                <Wifi className="w-4 h-4" />
                <span className="text-xs">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs">Offline</span>
              </div>
            )}
            <Button
              onClick={async () => {
                console.log('=== TESTING SUPABASE CONNECTION ===');
                try {
                  const { data, error } = await supabase
                    .from('messages')
                    .select('count')
                    .limit(1);
                  
                  if (error) {
                    console.error('Supabase test failed:', error);
                    alert(`Supabase test failed: ${error.message}`);
                  } else {
                    console.log('Supabase test successful:', data);
                    alert('Supabase connection successful!');
                  }
                } catch (err) {
                  console.error('Supabase test error:', err);
                  alert(`Supabase test error: ${err}`);
                }
              }}
              variant="outline"
              size="sm"
              className="border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs"
            >
              Test DB
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {error && (
          <div className="text-center text-red-400 py-4">
            <p>{error}</p>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet. Be the first to say something!</p>
            {useLocalStorage && (
              <p className="text-xs text-yellow-400 mt-2">
                Messages are stored locally on your device
              </p>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.sender === currentUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-slate-600/30 bg-slate-800/50">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-slate-700/50 border-slate-600/30 text-white placeholder-gray-400"
            disabled={isSending || !currentUser}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending || !currentUser}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {!currentUser && (
          <p className="text-xs text-red-400 mt-2">
            Please connect your wallet to send messages
          </p>
        )}
        {useLocalStorage && (
          <p className="text-xs text-yellow-400 mt-2">
            💡 Messages are stored locally. Connect to database for persistent storage.
          </p>
        )}
      </div>
    </div>
  );
} 