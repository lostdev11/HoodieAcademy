'use client';

import { useRealtimeData } from './RealtimeDataProvider';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function RealtimeStatus() {
  const { isConnected, error, lastUpdate } = useRealtimeData();

  return (
    <div className="flex items-center space-x-2 text-sm">
      {isConnected ? (
        <div className="flex items-center space-x-1 text-green-400">
          <Wifi className="w-4 h-4" />
          <span>Live</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-red-400">
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
        </div>
      )}
      
      {lastUpdate && (
        <div className="flex items-center space-x-1 text-slate-400">
          <RefreshCw className="w-3 h-3" />
          <span>{lastUpdate.toLocaleTimeString()}</span>
        </div>
      )}
      
      {error && (
        <div className="text-red-400 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
