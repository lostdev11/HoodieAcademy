'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, Message, NewMessage } from '@/lib/supabase';
import MessageBubble from './MessageBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { useSNSResolution } from '@/hooks/use-sns-resolution';

interface ChatRoomProps {
  squad: string;
}

export default function ChatRoom({ squad }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string>('');
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user's wallet address and display name from database instead of localStorage
  useEffect(() => {
    const loadUserData = async () => {
      // TODO: Get wallet address and display name from database
      // For now, set empty values as we're removing localStorage
      console.log('Loading user data from database...');
    };
    
    loadUserData();
  }, []);

  // Helper function to resolve a single name
  const resolveName = async (walletAddress: string) => {
    try {
      // TODO: Implement SNS resolution from database or API
      // For now, just use a shortened version of the wallet address
      const shortAddress = walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4);
      setResolvedNames(prev => ({ ...prev, [walletAddress]: shortAddress }));
    } catch (error) {
      console.error('Error resolving name:', error);
    }
  };

  // Helper function to resolve multiple names
  const resolveMultipleNames = async (walletAddresses: string[]) => {
    try {
      // TODO: Implement batch SNS resolution from database or API
      // For now, resolve them one by one
      for (const address of walletAddresses) {
        await resolveName(address);
      }
    } catch (error) {
      console.error('Error resolving multiple names:', error);
    }
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Test connection first
        const { data: testData, error: testError } = await supabase
          .from('messages')
          .select('count')
          .limit(1);

        if (testError) {
          console.error('Supabase connection test failed:', testError);
          alert('Unable to connect to chat service. Please try again later.');
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('squad', squad)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          console.error('Error details:', error.message, error.details, error.hint);
          alert(`Error loading messages: ${error.message}`);
        } else {
          setMessages(data || []);
          
          // Resolve names for all message senders
          if (data) {
            const uniqueSenders = Array.from(new Set(data.map((msg: any) => msg.sender))) as string[];
            const nonCurrentSenders = uniqueSenders.filter(sender => sender !== currentUser);
            if (nonCurrentSenders.length > 0) {
              resolveMultipleNames(nonCurrentSenders);
            }
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        alert('Unexpected error loading messages. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [squad, currentUser, resolveMultipleNames]);

  // Subscribe to real-time messages
  useEffect(() => {
    const channel = supabase
      .channel(`squad-${squad}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'squad_chat',
          filter: `squad=eq.${squad}`,
        },
        (payload: any) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // Resolve name for new message sender
          if (newMessage.sender !== currentUser) {
            resolveName(newMessage.sender);
          }
        }
      )
      .subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          // Successfully subscribed
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel subscription error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [squad, currentUser, resolveName]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    setIsSending(true);
    try {
      const messageData: NewMessage = {
        text: newMessage.trim(),
        sender: currentUser,
        sender_display_name: currentUserDisplayName || 'Anonymous',
        squad: squad,
      };

      // Test connection before sending
      const { error: testError } = await supabase
        .from('messages')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Connection test failed before sending:', testError);
        alert('Connection lost. Please refresh the page and try again.');
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();

      if (error) {
        console.error('Error sending message:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        
        // Provide more specific error messages
        if (error.message.includes('row-level security policy')) {
          alert('Database permission error: Row-level security policy is blocking message insertion. Please contact the administrator to configure database permissions.');
          
          // Fallback: Store message locally
          const localMessage: Message = {
            id: Date.now().toString(),
            text: messageData.text,
            sender: messageData.sender,
            sender_display_name: messageData.sender_display_name,
            squad: messageData.squad,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, localMessage]);
          setNewMessage('');
          alert('Message stored locally. Database permissions need to be configured for persistent storage.');
        } else if (error.message.includes('permission')) {
          alert('Permission denied. You may not have access to send messages in this squad.');
        } else if (error.message.includes('network')) {
          alert('Network error. Please check your connection and try again.');
        } else {
          alert(`Failed to send message: ${error.message}`);
        }
      } else {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Unexpected error sending message. Please try again.');
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
        <h3 className="text-lg font-semibold text-cyan-400">
          {squad} Squad Chat
        </h3>
        <p className="text-sm text-gray-400">
          Real-time messaging for {squad} squad members
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet. Be the first to say something!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={{
                ...message,
                sender_display_name: resolvedNames[message.sender] || message.sender_display_name
              }}
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
        {currentUser && !currentUserDisplayName && (
          <p className="text-xs text-yellow-400 mt-2">
            Set a display name in your profile for better chat experience
          </p>
        )}
      </div>
    </div>
  );
} 