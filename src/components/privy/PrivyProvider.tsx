'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { privyConfig } from '@/lib/privy-config';
import { useEffect, useState } from 'react';

interface PrivyProviderProps {
  children: React.ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything during SSR/build time
  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If no app ID is configured, render children without Privy
  if (!privyConfig.appId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Privy Configuration Required</h1>
          <p className="text-gray-300 mb-4">
            To use this feature, you need to configure your Privy App ID.
          </p>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Setup Instructions:</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to <a href="https://privy.io" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">privy.io</a> and create an account</li>
              <li>Create a new app in the Privy dashboard</li>
              <li>Copy your App ID from the dashboard</li>
              <li>Create a <code className="bg-gray-700 px-1 rounded">.env.local</code> file in your project root</li>
              <li>Add <code className="bg-gray-700 px-1 rounded">NEXT_PUBLIC_PRIVY_APP_ID=your_app_id_here</code></li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BasePrivyProvider
      appId={privyConfig.appId}
      config={privyConfig}
    >
      {children}
    </BasePrivyProvider>
  );
}
