'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, ChevronDown, ChevronUp } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'course' | 'event' | 'bounty' | 'system';
  is_expandable: boolean;
  posted_at: string;
}

export default function AnnouncementsDisplay() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      const data = await response.json();
      if (data.success) {
        // Show only the latest 2 announcements
        setAnnouncements(data.announcements.slice(0, 2));
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'course': return '📚';
      case 'event': return '🎉';
      case 'bounty': return '🎯';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'course': return 'border-cyan-500 bg-gradient-to-r from-cyan-900/30 to-cyan-800/20';
      case 'event': return 'border-purple-500 bg-gradient-to-r from-purple-900/30 to-purple-800/20';
      case 'bounty': return 'border-orange-500 bg-gradient-to-r from-orange-900/30 to-orange-800/20';
      case 'system': return 'border-red-500 bg-gradient-to-r from-red-900/30 to-red-800/20';
      default: return 'border-blue-500 bg-gradient-to-r from-blue-900/30 to-blue-800/20';
    }
  };

  if (loading) return null;
  if (announcements.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-red-400" />
        </div>
        <span className="text-lg font-semibold text-cyan-400">📢 Academy Announcements</span>
      </div>
      
      {announcements.map((announcement) => (
        <Card key={announcement.id} className={`border ${getCategoryColor(announcement.category)} shadow-lg`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-cyan-400">{announcement.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(announcement.category)}</span>
                    {announcement.is_expandable && (
                      <button
                        onClick={() => toggleExpanded(announcement.id)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {expanded.has(announcement.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                {announcement.is_expandable ? (
                  <>
                    <p className="text-gray-300 text-sm">
                      {expanded.has(announcement.id) 
                        ? announcement.content 
                        : announcement.content.slice(0, 100) + '...'}
                    </p>
                    {announcement.content.length > 100 && (
                      <button
                        onClick={() => toggleExpanded(announcement.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm mt-1 transition-colors"
                      >
                        {expanded.has(announcement.id) ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-gray-300 text-sm">{announcement.content}</p>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Posted: {new Date(announcement.posted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
