'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTracking } from '@/components/TrackingProvider';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';

// Prevent static generation - this page requires client-side providers
export const dynamic = 'force-dynamic';

export default function TrackingDemoPage() {
  const { wallet, connectWallet, disconnectWallet } = useWalletSupabase();
  const { 
    sessionId, 
    isActive, 
    isLoading, 
    error,
    onCourseStart,
    onCourseComplete,
    onLessonStart,
    onLessonComplete,
    onExamStarted,
    onExamSubmitted,
    onPlacementStarted,
    onPlacementCompleted
  } = useTracking();

  const [events, setEvents] = useState<Array<{ type: string; timestamp: string; success: boolean }>>([]);

  const logEvent = async (eventType: string, eventFn: () => Promise<{ success: boolean; error?: string }>) => {
    const result = await eventFn();
    setEvents(prev => [...prev, {
      type: eventType,
      timestamp: new Date().toLocaleTimeString(),
      success: result.success
    }]);
  };

  const handleCourseStart = () => logEvent('Course Start', () => onCourseStart('solana-basics'));
  const handleCourseComplete = () => logEvent('Course Complete', () => onCourseComplete('solana-basics'));
  const handleLessonStart = () => logEvent('Lesson Start', () => onLessonStart('solana-basics', 'lesson-1'));
  const handleLessonComplete = () => logEvent('Lesson Complete', () => onLessonComplete('solana-basics', 'lesson-1'));
  const handleExamStarted = () => logEvent('Exam Started', () => onExamStarted('exam-1'));
  const handleExamSubmitted = () => logEvent('Exam Submitted', () => onExamSubmitted('exam-1'));
  const handlePlacementStarted = () => logEvent('Placement Started', () => onPlacementStarted());
  const handlePlacementCompleted = () => logEvent('Placement Completed', () => onPlacementCompleted());

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Tracking System Demo</h1>
        <p className="text-muted-foreground">
          Test the comprehensive tracking system for Hoodie Academy
        </p>
      </div>

      {/* Wallet Status */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {wallet ? (
                <div>
                  <p className="font-medium">Connected: {wallet}</p>
                  <Badge variant="default">Connected</Badge>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground">No wallet connected</p>
                  <Badge variant="secondary">Disconnected</Badge>
                </div>
              )}
            </div>
            <div className="space-x-2">
              {wallet ? (
                <Button onClick={disconnectWallet} variant="outline">
                  Disconnect
                </Button>
              ) : (
                <Button onClick={connectWallet}>
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle>Session Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Session ID</p>
              <p className="font-mono text-xs">{sessionId || 'None'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loading</p>
              <Badge variant={isLoading ? 'default' : 'secondary'}>
                {isLoading ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Error</p>
              <Badge variant={error ? 'destructive' : 'secondary'}>
                {error ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Event Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Event Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={handleCourseStart} disabled={!wallet}>
              Course Start
            </Button>
            <Button onClick={handleCourseComplete} disabled={!wallet}>
              Course Complete
            </Button>
            <Button onClick={handleLessonStart} disabled={!wallet}>
              Lesson Start
            </Button>
            <Button onClick={handleLessonComplete} disabled={!wallet}>
              Lesson Complete
            </Button>
            <Button onClick={handleExamStarted} disabled={!wallet}>
              Exam Started
            </Button>
            <Button onClick={handleExamSubmitted} disabled={!wallet}>
              Exam Submitted
            </Button>
            <Button onClick={handlePlacementStarted} disabled={!wallet}>
              Placement Started
            </Button>
            <Button onClick={handlePlacementCompleted} disabled={!wallet}>
              Placement Completed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Log */}
      <Card>
        <CardHeader>
          <CardTitle>Event Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No events logged yet. Try connecting your wallet and clicking the buttons above.
              </p>
            ) : (
              events.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{event.type}</span>
                    <span className="text-muted-foreground ml-2">at {event.timestamp}</span>
                  </div>
                  <Badge variant={event.success ? 'default' : 'destructive'}>
                    {event.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))
            )}
          </div>
          {events.length > 0 && (
            <Button 
              onClick={() => setEvents([])} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Clear Log
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Connect your wallet using the "Connect Wallet" button</li>
            <li>Wait for the session to initialize (you'll see "Active" status)</li>
            <li>Click any of the event buttons to test tracking</li>
            <li>Check the event log to see if events were logged successfully</li>
            <li>Visit the admin dashboard to see the tracked data</li>
          </ol>
          <div className="mt-4 p-3 bg-muted rounded">
            <p className="text-sm">
              <strong>Note:</strong> This demo requires a connected wallet and proper Supabase setup. 
              Make sure you have run the database schema and configured your environment variables.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
