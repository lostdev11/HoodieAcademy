'use client';

import { useDisplayNameReadOnly } from '@/hooks/use-display-name';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Debug component to test display name synchronization
 * Shows the current display name from the global hook
 */
export function DisplayNameSyncTest() {
  const { displayName, isLoading, error } = useDisplayNameReadOnly();

  return (
    <Card className="w-full max-w-md bg-slate-800/60 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="text-cyan-400 text-sm">
          🔄 Display Name Sync Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-400">Status: </span>
            <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
              {isLoading ? 'Loading...' : 'Ready'}
            </span>
          </div>
          
          <div>
            <span className="text-gray-400">Display Name: </span>
            <span className="text-white font-mono">
              {displayName || 'Not set'}
            </span>
          </div>
          
          {error && (
            <div>
              <span className="text-gray-400">Error: </span>
              <span className="text-red-400 text-xs">{error}</span>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            This component uses the global display name hook.
            Update your name in the profile to see it change here instantly.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
