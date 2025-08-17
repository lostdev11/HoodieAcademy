'use client';

import { Message } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { formatWalletAddress } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'just now';
    }
  };

  // Import formatWalletAddress from utils instead of local definition

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
              : 'bg-slate-700/50 text-gray-200 border border-slate-600/30'
          }`}
        >
          <div className="text-sm font-medium mb-1">
            {formatWalletAddress(message.sender) || 'Unknown'}
          </div>
          <div className="text-sm leading-relaxed break-words">
            {message.text}
          </div>
        </div>
        <div
          className={`text-xs text-gray-400 mt-1 ${
            isOwnMessage ? 'text-right' : 'text-left'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
} 