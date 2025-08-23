'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DBAnnouncement } from '@/types/database';
import { useSupabase } from '@/hooks/useSupabase';

interface GlobalAnnouncementBannerProps {
  initialAnnouncements?: DBAnnouncement[];
}

export default function GlobalAnnouncementBanner({ 
  initialAnnouncements = [] 
}: GlobalAnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<DBAnnouncement[]>(initialAnnouncements);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const supabase = useSupabase();

  useEffect(() => {
    // Set initial announcements
    setAnnouncements(initialAnnouncements);

    // Subscribe to realtime changes
    const channel = supabase
      .channel('announcements-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'announcements' 
      }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const newAnnouncement = payload.new as DBAnnouncement;
          if (newAnnouncement.is_published && isAnnouncementActive(newAnnouncement)) {
            setAnnouncements(prev => [newAnnouncement, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedAnnouncement = payload.new as DBAnnouncement;
          setAnnouncements(prev => 
            prev.map(ann => 
              ann.id === updatedAnnouncement.id ? updatedAnnouncement : ann
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedAnnouncement = payload.old as DBAnnouncement;
          setAnnouncements(prev => 
            prev.filter(ann => ann.id !== deletedAnnouncement.id)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, initialAnnouncements]);

  const isAnnouncementActive = (announcement: DBAnnouncement): boolean => {
    if (!announcement.is_published) return false;
    
    const now = new Date();
    const startsAt = announcement.starts_at ? new Date(announcement.starts_at) : null;
    const endsAt = announcement.ends_at ? new Date(announcement.ends_at) : null;
    
    if (startsAt && now < startsAt) return false;
    if (endsAt && now > endsAt) return false;
    
    return true;
  };

  const dismissAnnouncement = (announcementId: string) => {
    setDismissedAnnouncements(prev => new Set(prev).add(announcementId));
  };

  const activeAnnouncements = announcements.filter(announcement => 
    isAnnouncementActive(announcement) && 
    !dismissedAnnouncements.has(announcement.id)
  );

  if (activeAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
      {activeAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto"
        >
          <div className="flex items-center gap-3 flex-1">
            <Megaphone className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {announcement.title}
              </h3>
              {announcement.content && (
                <p className="text-xs sm:text-sm text-orange-100 truncate">
                  {announcement.content}
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismissAnnouncement(announcement.id)}
            className="text-white hover:bg-orange-700 hover:text-white ml-4 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
