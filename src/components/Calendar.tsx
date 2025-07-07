'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, AlertTriangle, Clock, MapPin, Users } from 'lucide-react';
import { 
  getUpcomingEvents, 
  getActiveAnnouncements, 
  CalendarEvent, 
  Announcement 
} from '@/lib/utils';

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCalendarData = () => {
    try {
      setEvents(getUpcomingEvents());
      setAnnouncements(getActiveAnnouncements());
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleCalendarUpdate = () => {
      loadCalendarData();
    };

    window.addEventListener('calendarEventsUpdated', handleCalendarUpdate);
    window.addEventListener('announcementsUpdated', handleCalendarUpdate);
    
    return () => {
      window.removeEventListener('calendarEventsUpdated', handleCalendarUpdate);
      window.removeEventListener('announcementsUpdated', handleCalendarUpdate);
    };
  }, []);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'class': return 'bg-blue-600';
      case 'event': return 'bg-purple-600';
      case 'announcement': return 'bg-yellow-600';
      case 'holiday': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'important': return 'bg-red-600';
      case 'warning': return 'bg-yellow-600';
      case 'success': return 'bg-green-600';
      case 'info': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendar & Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Events */}
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-white">{event.title}</h4>
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type}
                        </Badge>
                        {event.recurring && (
                          <Badge variant="outline" className="border-green-500 text-green-400">
                            Recurring
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(event.date)}</span>
                          {event.time && <span>• {formatTime(event.time)}</span>}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.maxParticipants && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{event.currentParticipants || 0}/{event.maxParticipants}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {events.length > 5 && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    className="border-purple-500 text-purple-400"
                    onClick={() => {
                      // For now, just show a message - could be expanded to show more events
                      alert(`Showing ${events.length} total events. This feature will be expanded soon!`);
                    }}
                  >
                    View All Events ({events.length})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming events</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Announcements */}
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-white">{announcement.title}</h4>
                        <Badge className={getAnnouncementTypeColor(announcement.type)}>
                          {announcement.type}
                        </Badge>
                        <Badge variant="outline" className="border-purple-500 text-purple-400">
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{announcement.content}</p>
                      <div className="text-xs text-gray-400">
                        <span>Active from {formatDate(announcement.startDate)}</span>
                        {announcement.endDate && (
                          <span> to {formatDate(announcement.endDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {announcements.length > 3 && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    className="border-purple-500 text-purple-400"
                    onClick={() => {
                      // For now, just show a message - could be expanded to show more announcements
                      alert(`Showing ${announcements.length} total announcements. This feature will be expanded soon!`);
                    }}
                  >
                    View All Announcements ({announcements.length})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active announcements</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 