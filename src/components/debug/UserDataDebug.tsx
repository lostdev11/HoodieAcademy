'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

interface DebugData {
  walletAddress: string | null;
  userTrackingData: any;
  userXPData: any;
  userBountyData: any;
  apiResponses: {
    track: any;
    bountyCompletions: any;
  };
  errors: string[];
}

export function UserDataDebug() {
  const [debugData, setDebugData] = useState<DebugData>({
    walletAddress: null,
    userTrackingData: null,
    userXPData: null,
    userBountyData: null,
    apiResponses: {
      track: null,
      bountyCompletions: null
    },
    errors: []
  });
  const [loading, setLoading] = useState(false);

  // Get wallet address from localStorage
  useEffect(() => {
    const wallet = typeof window !== 'undefined' 
      ? localStorage.getItem('walletAddress') || localStorage.getItem('hoodie_academy_wallet') || ''
      : '';
    setDebugData(prev => ({ ...prev, walletAddress: wallet || null }));
  }, []);

  const runDebugTest = async () => {
    if (!debugData.walletAddress) {
      setDebugData(prev => ({ 
        ...prev, 
        errors: [...prev.errors, 'No wallet address found'] 
      }));
      return;
    }

    setLoading(true);
    const errors: string[] = [];

    try {
      // Test 1: User Tracking API
      console.log('Testing user tracking API...');
      const trackResponse = await fetch(`/api/users/track?wallet=${debugData.walletAddress}`);
      const trackData = trackResponse.ok ? await trackResponse.json() : null;
      
      if (!trackResponse.ok) {
        errors.push(`User tracking API failed: ${trackResponse.status}`);
      }

      // Test 2: Bounty Completions API
      console.log('Testing bounty completions API...');
      const bountyResponse = await fetch(`/api/users/bounty-completions?wallet=${debugData.walletAddress}`);
      const bountyData = bountyResponse.ok ? await bountyResponse.json() : null;
      
      if (!bountyResponse.ok) {
        errors.push(`Bounty completions API failed: ${bountyResponse.status}`);
      }

      // Test 3: Direct Supabase queries (simulate what the hooks do)
      console.log('Testing direct database queries...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Test users table
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', debugData.walletAddress)
        .single();

      if (usersError) {
        errors.push(`Users table error: ${usersError.message}`);
      }

      // Test user_xp table
      const { data: userXP, error: xpError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('wallet_address', debugData.walletAddress)
        .single();

      if (xpError && xpError.code !== 'PGRST116') {
        errors.push(`User XP table error: ${xpError.message}`);
      }

      // Test bounty_submissions table
      const { data: bountySubmissions, error: bountyError } = await supabase
        .from('bounty_submissions')
        .select('*')
        .eq('wallet_address', debugData.walletAddress);

      if (bountyError) {
        errors.push(`Bounty submissions table error: ${bountyError.message}`);
      }

      setDebugData(prev => ({
        ...prev,
        userTrackingData: trackData,
        apiResponses: {
          track: trackData,
          bountyCompletions: bountyData
        },
        errors: [...prev.errors, ...errors]
      }));

    } catch (error) {
      console.error('Debug test failed:', error);
      setDebugData(prev => ({
        ...prev,
        errors: [...prev.errors, `Debug test failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = () => {
    setDebugData(prev => ({ ...prev, errors: [] }));
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/60 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            User Data Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={runDebugTest} 
              disabled={loading || !debugData.walletAddress}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Run Debug Test
            </Button>
            {debugData.errors.length > 0 && (
              <Button 
                onClick={clearErrors} 
                variant="outline"
                className="border-red-500/30 text-red-400"
              >
                Clear Errors
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-white font-semibold mb-2">Wallet Address:</h4>
              <p className="text-gray-300 font-mono text-sm">
                {debugData.walletAddress || 'Not connected'}
              </p>
            </div>

            {debugData.errors.length > 0 && (
              <div>
                <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Errors ({debugData.errors.length}):
                </h4>
                <div className="space-y-1">
                  {debugData.errors.map((error, index) => (
                    <div key={index} className="text-red-300 text-sm bg-red-900/20 p-2 rounded border border-red-500/30">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugData.apiResponses.track && (
              <div>
                <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  User Tracking API Response:
                </h4>
                <div className="bg-slate-700/30 p-3 rounded border border-slate-600/30">
                  <pre className="text-xs text-gray-300 overflow-auto">
                    {JSON.stringify(debugData.apiResponses.track, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {debugData.apiResponses.bountyCompletions && (
              <div>
                <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Bounty Completions API Response:
                </h4>
                <div className="bg-slate-700/30 p-3 rounded border border-slate-600/30">
                  <pre className="text-xs text-gray-300 overflow-auto">
                    {JSON.stringify(debugData.apiResponses.bountyCompletions, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {!debugData.walletAddress && (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-amber-400 text-sm">
                  Please connect your wallet to run debug tests
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
