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

// Local bulletin data
const localBulletinData: BulletinData = {
  global: [
    {
      id: '1',
      title: '🚨 Class Is In Session Campaign Launch',
      body: `# 🎓 Welcome to Hoodie Academy!

**Campaign Overview:**
- Each squad must drop a demo item by **Friday**
- Focus on the "Class Is In Session" theme
- All submissions will be reviewed by the community

**Important Dates:**
- **Submission Deadline:** Friday, 11:59 PM UTC
- **Community Review:** Saturday-Sunday
- **Winners Announced:** Monday

**Rewards:**
- Top 3 submissions get exclusive hoodie NFTs
- Featured placement on the main dashboard
- Recognition in the Great Hoodie Hall

*Good luck to all squads!* 🧢✨`,
      priority: 'high',
      createdAt: '2024-01-15T10:00:00Z',
      author: 'Hoodie Academy Admin'
    },
    {
      id: '2',
      title: '📢 New Discord Server Structure',
      body: `We've reorganized our Discord server to better support squad collaboration:

## 🏗️ New Channel Structure
- **#general** - Global announcements and discussions
- **#squad-chat** - Cross-squad collaboration
- **#resources** - Shared learning materials
- **#showcase** - Member submissions and highlights

## 🎯 Squad-Specific Channels
Each squad now has their own dedicated space:
- **#creators-workshop** - Meme and graphic creation
- **#decoders-library** - Educational content and TLDRs
- **#speakers-stage** - Community engagement and events
- **#raiders-hq** - Discord management and onboarding
- **#rangers-scout** - Partnership and opportunity hunting
- **#treasury-vault** - Financial strategy and metrics

*Join your squad's channel and start collaborating!* 🚀`,
      priority: 'medium',
      createdAt: '2024-01-14T15:30:00Z',
      author: 'Community Manager'
    },
    {
      id: '3',
      title: '🎉 Weekly Community Highlights',
      body: `## 🌟 This Week's Achievements

**Top Contributors:**
- @hoodie_creator_123 - Amazing meme collection
- @decoder_master - Comprehensive DeFi guide
- @speaker_pro - Engaging community discussions

**Squad Milestones:**
- **Creators:** 50+ memes created this week
- **Decoders:** 25 educational posts
- **Speakers:** 3 successful community events
- **Raiders:** Discord structure 90% complete
- **Rangers:** 5 new partnerships identified
- **Treasury:** 15% increase in community engagement

**Upcoming Events:**
- Friday: Squad submission deadline
- Saturday: Community voting opens
- Sunday: Live Q&A with top contributors

*Keep up the amazing work!* 🎊`,
      priority: 'low',
      createdAt: '2024-01-13T09:15:00Z',
      author: 'Community Manager'
    }
  ],
  squads: {
    creators: [
      {
        id: 'c1',
        title: '🎨 Creators Squad - Meme Assets Due Friday',
        body: `# 🎨 Creators Squad Update

**Priority Task:** Create meme assets for "Class Is In Session" campaign

## 📋 Requirements:
- **Format:** PNG/JPG, 1080x1080px minimum
- **Theme:** "Class Is In Session" - hoodie culture meets education
- **Style:** Pixel art, memes, or graphic design
- **Quantity:** 3-5 pieces per creator

## 🎯 Focus Areas:
- Hoodie + graduation cap combinations
- "Study hard, hoodie harder" variations
- Cyberpunk academic aesthetics
- Meme templates for community use

**Submission:** Post in #creators-workshop with #class-in-session tag`,
        priority: 'high',
        createdAt: '2024-01-15T14:00:00Z',
        author: 'Creators Squad Lead',
        squad: 'creators'
      }
    ],
    decoders: [
      {
        id: 'd1',
        title: '🧠 Decoders Squad - Market Analysis Due',
        body: `# 🧠 Decoders Squad Update

**Priority Task:** Complete market analysis for current trends

## 📊 Analysis Requirements:
- **Scope:** Top 3 trending sectors in Web3
- **Depth:** Technical analysis + fundamental research
- **Format:** Thread with charts and explanations
- **Deadline:** Friday EOD

## 🔍 Focus Areas:
- NFT market dynamics
- DeFi protocol analysis
- Gaming sector trends
- Cross-chain opportunities

**Submission:** Post in #decoders-library with #market-analysis tag`,
        priority: 'medium',
        createdAt: '2024-01-15T12:00:00Z',
        author: 'Decoders Squad Lead',
        squad: 'decoders'
      }
    ],
    speakers: [
      {
        id: 's1',
        title: '🎤 Speakers Squad - Community Event Planning',
        body: `# 🎤 Speakers Squad Update

**Priority Task:** Plan and host community engagement events

## 🎯 Event Requirements:
- **Type:** 15-minute community check-ins
- **Frequency:** 2-3 events this week
- **Focus:** Welcoming new members, sharing insights
- **Platform:** Discord voice channels

## 📋 Planning Checklist:
- Event topics and speakers
- Promotion strategy
- Engagement metrics tracking
- Follow-up content creation

**Coordination:** Use #speakers-stage for planning`,
        priority: 'medium',
        createdAt: '2024-01-15T11:00:00Z',
        author: 'Speakers Squad Lead',
        squad: 'speakers'
      }
    ],
    raiders: [
      {
        id: 'r1',
        title: '⚔️ Raiders Squad - Meta Analysis Due',
        body: `# ⚔️ Raiders Squad Update

**Priority Task:** Meta trend analysis and strategy development

## 📈 Analysis Requirements:
- **Scope:** 2 emerging meta trends
- **Depth:** Entry/exit strategies + risk assessment
- **Format:** Detailed thread with examples
- **Deadline:** Friday EOD

## 🎯 Focus Areas:
- Market psychology patterns
- Trait analysis methodologies
- Timing and execution strategies
- Risk management protocols

**Submission:** Post in #raiders-hq with #meta-analysis tag`,
        priority: 'high',
        createdAt: '2024-01-15T13:00:00Z',
        author: 'Raiders Squad Lead',
        squad: 'raiders'
      }
    ],
    rangers: [
      {
        id: 'rg1',
        title: '🦅 Rangers Squad - Cross-Squad Collaboration',
        body: `# 🦅 Rangers Squad Update

**Priority Task:** Facilitate cross-squad collaboration projects

## 🤝 Collaboration Requirements:
- **Scope:** Work with 2 different squads
- **Project:** Joint knowledge sharing or content creation
- **Duration:** This week
- **Output:** Shared resource or event

## 🎯 Focus Areas:
- Bridging squad expertise
- Creating shared resources
- Organizing cross-squad events
- Knowledge transfer sessions

**Coordination:** Use #rangers-scout for project planning`,
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        author: 'Rangers Squad Lead',
        squad: 'rangers'
      }
    ]
  }
};

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

  useEffect(() => {
    // Simulate loading delay for better UX
    const timer = setTimeout(() => {
      const global = localBulletinData.global || [];
      const squad = squadId && localBulletinData.squads?.[squadId] ? localBulletinData.squads[squadId] : [];
      
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
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
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