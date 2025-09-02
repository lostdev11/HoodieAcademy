'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Clock, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  starts_at?: string;
  ends_at?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementsDisplay() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/announcements?published=true');
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Filter for published announcements and check if they're currently active
        const activeAnnouncements = result.announcements.filter((announcement: Announcement) => {
          if (!announcement.is_published) return false;
          
          const now = new Date();
          const startsAt = announcement.starts_at ? new Date(announcement.starts_at) : null;
          const endsAt = announcement.ends_at ? new Date(announcement.ends_at) : null;
          
          // If no start date, announcement is active
          if (!startsAt && !endsAt) return true;
          
          // If has start date, check if it's started
          if (startsAt && now < startsAt) return false;
          
          // If has end date, check if it's not ended
          if (endsAt && now > endsAt) return false;
          
          return true;
        });
        
        setAnnouncements(activeAnnouncements);
      } else {
        setError('Failed to load announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const toggleAnnouncement = (announcementId: string) => {
    setExpandedAnnouncements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(announcementId)) {
        newSet.delete(announcementId);
      } else {
        newSet.add(announcementId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isAnnouncementUrgent = (announcement: Announcement) => {
    if (!announcement.ends_at) return false;
    const endDate = new Date(announcement.ends_at);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <span className="ml-3 text-cyan-400">Loading announcements...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center text-red-400">
            <X className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return null; // Don't show anything if no announcements
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card 
          key={announcement.id} 
          className={`bg-slate-800/50 border-cyan-500/30 ${
            isAnnouncementUrgent(announcement) ? 'border-orange-500/50 bg-orange-900/20' : ''
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-full">
                  <Megaphone className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg text-cyan-400 flex items-center gap-2">
                    {announcement.title}
                    {isAnnouncementUrgent(announcement) && (
                      <Badge variant="destructive" className="text-xs">
                        Urgent
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <span>Posted: {formatDate(announcement.created_at)}</span>
                    {announcement.starts_at && (
                      <span>Starts: {formatDate(announcement.starts_at)}</span>
                    )}
                    {announcement.ends_at && (
                      <span className={isAnnouncementUrgent(announcement) ? 'text-orange-400' : ''}>
                        Ends: {formatDate(announcement.ends_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleAnnouncement(announcement.id)}
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                {expandedAnnouncements.has(announcement.id) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          
          {expandedAnnouncements.has(announcement.id) && (
            <CardContent className="pt-0">
              <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
