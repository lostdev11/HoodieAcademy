'use client';

import { useState, useEffect } from 'react';
import { Pin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PinnedMessageProps {
  squad: string;
}

export default function PinnedMessage({ squad }: PinnedMessageProps) {
  const [pinnedMessage, setPinnedMessage] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);

  // Helper function to get squad ID from name (same logic as in squad chat page)
  const getSquadId = (name: string): string => {
    const normalized = name.replace(/^[🎨🧠🎤⚔️🦅🏦]+\s*/, '').toLowerCase().trim();
    const squadMapping: { [key: string]: string } = {
      'hoodie creators': 'creators',
      'hoodie decoders': 'decoders', 
      'hoodie speakers': 'speakers',
      'hoodie raiders': 'raiders',
      'hoodie rangers': 'rangers',
      'treasury builders': 'treasury'
    };
    return squadMapping[normalized] || normalized;
  };

  useEffect(() => {
    const loadPinnedMessage = async () => {
      try {
        // Import the pinned messages data
        const pinnedMessages = await import('@/lib/pinnedMessages.json');
        const squadId = getSquadId(squad);
        const message = pinnedMessages[squadId as keyof typeof pinnedMessages] as string;
        
        if (message) {
          setPinnedMessage(message);
        } else {
          // Fallback message if no specific message is found
          setPinnedMessage("🚨 **Class Is In Session** campaign is live — each squad must drop a demo item by Friday. Check Discord for the assignment list. 💼🧢");
        }
      } catch (error) {
        console.error('Error loading pinned message:', error);
        // Fallback message
        setPinnedMessage("🚨 **Class Is In Session** campaign is live — each squad must drop a demo item by Friday. Check Discord for the assignment list. 💼🧢");
      }
    };

    loadPinnedMessage();
  }, [squad]);

  if (!isVisible || !pinnedMessage) {
    return null;
  }

  return (
    <div className="mb-6 bg-slate-800/50 border-l-4 border-cyan-500 p-4 rounded-lg shadow-md relative">
      {/* Close button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-white hover:bg-slate-700/50"
      >
        <X className="w-4 h-4" />
      </Button>
      
      {/* Pinned message content */}
      <div className="flex items-start gap-3">
        <Pin className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-cyan-300 font-bold text-lg mb-2">📌 Pinned Message</h2>
          <p className="text-gray-200 leading-relaxed">
            {pinnedMessage}
          </p>
        </div>
      </div>
    </div>
  );
} 