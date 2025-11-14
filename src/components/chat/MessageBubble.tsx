'use client';

import { Message } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { formatWalletAddress } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
            {message.sender_display_name || formatWalletAddress(message.sender) || 'Unknown'}
          </div>
          <div className={`text-sm leading-relaxed break-words prose prose-invert prose-sm max-w-none ${
            isOwnMessage ? 'prose-headings:text-white prose-p:text-white prose-strong:text-white' : ''
          }`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs font-semibold mb-1">{children}</h3>,
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className={`px-1 py-0.5 rounded text-xs font-mono ${
                      isOwnMessage 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-900/50 text-cyan-300'
                    }`}>
                      {children}
                    </code>
                  ) : (
                    <code className={`block p-2 rounded text-xs font-mono overflow-x-auto border mb-1 ${
                      isOwnMessage
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-slate-900 text-cyan-300 border-slate-700'
                    }`}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className={`p-2 rounded overflow-x-auto mb-1 text-xs border ${
                    isOwnMessage
                      ? 'bg-white/10 border-white/20'
                      : 'bg-slate-900 border-slate-700'
                  }`}>
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className={`border-l-2 pl-2 py-1 rounded-r mb-1 italic ${
                    isOwnMessage
                      ? 'border-white/30 bg-white/10 text-white/90'
                      : 'border-purple-500 bg-purple-900/20 text-purple-200'
                  }`}>
                    {children}
                  </blockquote>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li>{children}</li>,
                a: ({ children, href }) => (
                  <a 
                    href={href} 
                    className={`underline ${
                      isOwnMessage
                        ? 'text-white/90 hover:text-white'
                        : 'text-cyan-400 hover:text-cyan-300'
                    }`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                hr: () => <hr className={`my-1 ${isOwnMessage ? 'border-white/20' : 'border-slate-700'}`} />,
              }}
            >
              {message.text}
            </ReactMarkdown>
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