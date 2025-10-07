'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useServerSentEvents } from '@/hooks/useServerSentEvents';

interface RealtimeData {
  users: any[];
  submissions: any[];
  bounties: any[];
  lastUpdate: Date | null;
}

interface RealtimeContextType {
  data: RealtimeData;
  isConnected: boolean;
  error: string | null;
  refresh: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeDataProviderProps {
  children: ReactNode;
  walletAddress: string | null;
  enabled?: boolean;
}

export function RealtimeDataProvider({ 
  children, 
  walletAddress, 
  enabled = true 
}: RealtimeDataProviderProps) {
  const [data, setData] = useState<RealtimeData>({
    users: [],
    submissions: [],
    bounties: [],
    lastUpdate: null
  });

  const { isConnected, error, lastMessage } = useServerSentEvents({
    url: walletAddress ? `/api/admin/realtime?wallet=${walletAddress}&type=all` : '',
    enabled: enabled && !!walletAddress,
    onMessage: (message) => {
      if (message.type === 'initial') {
        setData(prev => ({
          ...prev,
          users: message.users || prev.users,
          submissions: message.submissions || prev.submissions,
          bounties: message.bounties || prev.bounties,
          lastUpdate: new Date()
        }));
      } else if (message.type === 'user_change') {
        setData(prev => ({
          ...prev,
          users: updateArrayItem(prev.users, message.payload),
          lastUpdate: new Date()
        }));
      } else if (message.type === 'submission_change') {
        setData(prev => ({
          ...prev,
          submissions: updateArrayItem(prev.submissions, message.payload),
          lastUpdate: new Date()
        }));
      } else if (message.type === 'bounty_change') {
        setData(prev => ({
          ...prev,
          bounties: updateArrayItem(prev.bounties, message.payload),
          lastUpdate: new Date()
        }));
      }
    }
  });

  const updateArrayItem = (array: any[], payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        return [newRecord, ...array];
      case 'UPDATE':
        return array.map(item => 
          item.id === newRecord.id ? newRecord : item
        );
      case 'DELETE':
        return array.filter(item => item.id !== oldRecord.id);
      default:
        return array;
    }
  };

  const refresh = () => {
    // Force refresh by reconnecting
    window.location.reload();
  };

  return (
    <RealtimeContext.Provider value={{ data, isConnected, error, refresh }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeData() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtimeData must be used within a RealtimeDataProvider');
  }
  return context;
}
