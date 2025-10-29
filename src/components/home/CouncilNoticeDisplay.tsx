'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

interface CouncilNotice {
  id: string;
  title: string;
  content: string;
  directive_date?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export default function CouncilNoticeDisplay() {
  const [notice, setNotice] = useState<CouncilNotice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestNotice();
  }, []);

  const fetchLatestNotice = async () => {
    try {
      const response = await fetch('/api/council-notices');
      const data = await response.json();
      if (data.success && data.notices.length > 0) {
        // Get the most recent active notice
        const latestNotice = data.notices[0];
        setNotice(latestNotice);
      }
    } catch (error) {
      console.error('Error fetching council notice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !notice) return null;

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-gradient-to-r from-red-900/40 to-red-800/30';
      case 'high':
        return 'border-orange-500 bg-gradient-to-r from-orange-900/40 to-orange-800/30';
      case 'normal':
        return 'border-blue-500 bg-gradient-to-r from-blue-900/40 to-blue-800/30';
      default:
        return 'border-purple-500 bg-gradient-to-r from-purple-900/40 to-purple-800/30';
    }
  };

  // Function to convert URLs in text to clickable links
  const renderContentWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Get the full URL
      let url = match[0];
      // Add https:// if it's a www. URL
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      }

      // Add the link
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline break-all"
        >
          {match[0]}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <Card className={`border-2 ${getPriorityStyles(notice.priority)} shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-orange-400">🗣️ Council Notice</span>
              {notice.priority === 'urgent' && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500/30 text-red-300 rounded uppercase animate-pulse">
                  Urgent
                </span>
              )}
              {notice.priority === 'high' && (
                <span className="px-2 py-0.5 text-xs font-bold bg-orange-500/30 text-orange-300 rounded uppercase">
                  High Priority
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{notice.title}</h3>
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {renderContentWithLinks(notice.content)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

