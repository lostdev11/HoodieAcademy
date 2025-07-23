'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertCircle, Clock, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  author?: string;
  squad?: string;
}

interface BulletinData {
  global: Message[];
  squads: Record<string, Message[]>;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'text-red-400';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-green-400';
    default: return 'text-gray-400';
  }
};

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'border-red-500 text-red-400 bg-red-500/10';
    case 'medium': return 'border-yellow-500 text-yellow-400 bg-yellow-500/10';
    case 'low': return 'border-green-500 text-green-400 bg-green-500/10';
    default: return 'border-gray-500 text-gray-400 bg-gray-500/10';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface GlobalBulletinBoardProps {
  squadId: string | null;
}

export default function GlobalBulletinBoard({ squadId }: GlobalBulletinBoardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBulletinData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const res = await fetch('/api/getBulletins');
        if (!res.ok) {
          throw new Error('Failed to fetch bulletin data');
        }
        
        const data: BulletinData = await res.json();
        const global = data.global || [];
        const squad = squadId && data.squads?.[squadId] ? data.squads[squadId] : [];
        
        // Combine global and squad-specific messages, with global first
        const allMessages = [...global, ...squad];
        
        // Sort by priority (high first) and then by creation date (newest first)
        const sortedMessages = allMessages.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setMessages(sortedMessages);
      } catch (err) {
        console.error('Failed to load bulletin data:', err);
        setError('Failed to load announcements. Please try again later.');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBulletinData();
  }, [squadId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-slate-800/50 border border-slate-600/40 animate-pulse">
            <CardHeader>
              <div className="h-6 bg-slate-700/50 rounded mb-2"></div>
              <div className="h-4 bg-slate-700/30 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-slate-700/30 rounded"></div>
                <div className="h-4 bg-slate-700/30 rounded w-2/3"></div>
                <div className="h-4 bg-slate-700/30 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border border-red-500/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Announcements</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <Card key={msg.id} className="bg-slate-800/50 border border-slate-600/40 hover:border-slate-500/60 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className={`flex items-center gap-2 ${getPriorityColor(msg.priority)} text-lg`}>
                <Bell className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{msg.title}</span>
              </CardTitle>
              <Badge 
                variant="outline" 
                className={`ml-auto text-xs ${getPriorityBadgeColor(msg.priority)}`}
              >
                {msg.priority.toUpperCase()}
              </Badge>
            </div>
            
            {/* Meta information */}
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(msg.createdAt)}
              </div>
              {msg.author && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {msg.author}
                </div>
              )}
              {msg.squad && (
                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                  {msg.squad}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-gray-300 leading-relaxed">
                                <ReactMarkdown 
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-bold text-cyan-400 mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold text-cyan-300 mb-2 mt-4">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold text-cyan-200 mb-2 mt-3">{children}</h3>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-300">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-cyan-500/50 pl-4 my-3 italic text-gray-200">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-slate-700/50 px-1 py-0.5 rounded text-cyan-300 text-sm">
                        {children}
                      </code>
                    ),
                    p: ({ children }) => <p className="mb-3 text-gray-300">{children}</p>
                  }}
                >
                  {msg.body}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {messages.length === 0 && (
        <Card className="bg-slate-800/50 border border-slate-600/40">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Announcements</h3>
            <p className="text-gray-400">
              {squadId 
                ? `No announcements for your squad at this time. Check back later for updates!`
                : 'No announcements at this time. Check back later for updates!'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 