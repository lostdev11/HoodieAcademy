'use client';

import { UserDataDebug } from '@/components/debug/UserDataDebug';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function DebugUserDataPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">User Data Debug</h1>
            <p className="text-gray-400">
              Debug tool to help identify user data loading issues
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              asChild
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-purple-500/30 text-purple-400 hover:text-purple-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Debug Component */}
        <UserDataDebug />

        {/* Instructions */}
        <Card className="mt-8 bg-slate-800/60 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-400">How to Use This Debug Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="text-white font-semibold">Steps to debug user data issues:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
                <li>Make sure your wallet is connected</li>
                <li>Click "Run Debug Test" to test all APIs and database connections</li>
                <li>Check the "Errors" section for any issues</li>
                <li>Review the API responses to see what data is being returned</li>
                <li>If there are errors, check the browser console for more details</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-white font-semibold">Common Issues:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li><strong>No wallet connected:</strong> Connect your wallet first</li>
                <li><strong>API errors:</strong> Check if the development server is running</li>
                <li><strong>Database errors:</strong> Verify Supabase configuration</li>
                <li><strong>Empty responses:</strong> User might not have data in the database</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-white font-semibold">Next Steps:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>If APIs are working but no data shows, create some test data</li>
                <li>If APIs are failing, check server logs and environment variables</li>
                <li>If wallet is not detected, check localStorage for wallet address</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
