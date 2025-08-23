'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DBEvent } from '@/types/database';

interface EventsListProps {
  initialEvents?: DBEvent[];
}

export default function EventsList({ initialEvents = [] }: EventsListProps) {
  const [events, setEvents] = useState<DBEvent[]>(initialEvents);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
          return;
        }

        setEvents(data || []);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return 'TBD';
    return timeString;
  };

  const getEventTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'class':
        return 'bg-blue-500';
      case 'workshop':
        return 'bg-green-500';
      case 'meetup':
        return 'bg-purple-500';
      case 'competition':
        return 'bg-red-500';
      case 'space':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Events Scheduled</h3>
        <p className="text-gray-500">Check back later for upcoming events and workshops.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(event.time)}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge 
                className={`${getEventTypeColor(event.type)} text-white capitalize`}
              >
                {event.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{event.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Open to all squads</span>
              </div>
              <div className="text-xs text-gray-400">
                Created {new Date(event.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
