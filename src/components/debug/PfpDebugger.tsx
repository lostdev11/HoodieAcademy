'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';

interface PfpDebuggerProps {
  walletAddress: string;
}

export default function PfpDebugger({ walletAddress }: PfpDebuggerProps) {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching profile for wallet:', walletAddress);
      const response = await fetch(`/api/user-profile?wallet=${walletAddress}`);
      const data = await response.json();
      
      console.log('📊 Profile API Response:', data);
      setProfileData(data);
      
      if (!response.ok) {
        setError(data.error || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchProfile();
    }
  }, [walletAddress]);

  return (
    <Card className="w-full max-w-2xl bg-slate-800 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          🔍 PFP Debugger
          <Badge variant="outline" className="text-xs">
            {walletAddress ? walletAddress.slice(0, 8) + '...' : 'No Wallet'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={fetchProfile} 
            disabled={loading || !walletAddress}
            variant="outline"
            size="sm"
          >
            {loading ? 'Loading...' : 'Refresh Profile'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">❌ Error: {error}</p>
          </div>
        )}

        {/* Profile Data */}
        {profileData && (
          <div className="space-y-4">
            {/* API Response Status */}
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <h4 className="text-white font-semibold mb-2">API Response Status</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Success:</span>
                  <Badge className={profileData.success ? 'bg-green-600' : 'bg-red-600'}>
                    {profileData.success ? '✅ Yes' : '❌ No'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400">Exists:</span>
                  <Badge className={profileData.exists ? 'bg-green-600' : 'bg-red-600'}>
                    {profileData.exists ? '✅ Yes' : '❌ No'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            {profileData.profile && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Profile Information</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Display Name:</span>
                      <span className="text-white ml-2">{profileData.profile.displayName || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Squad:</span>
                      <span className="text-white ml-2">{profileData.profile.squad?.name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Level:</span>
                      <span className="text-white ml-2">{profileData.profile.level || 1}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total XP:</span>
                      <span className="text-white ml-2">{profileData.profile.totalXP || 0}</span>
                    </div>
                  </div>
                </div>

                {/* PFP Information */}
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Profile Picture (PFP)</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">PFP URL:</span>
                      <div className="text-white text-sm mt-1 break-all">
                        {profileData.profile.pfp_url || 'Not set'}
                      </div>
                    </div>
                    
                    {/* PFP Preview */}
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400">Preview:</span>
                      <div className="w-16 h-16">
                        <ProfileAvatar pfpUrl={profileData.profile.pfp_url} size={64} />
                      </div>
                    </div>

                    {/* PFP Status */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Has PFP:</span>
                        <Badge className={profileData.profile.pfp_url ? 'bg-green-600' : 'bg-red-600'}>
                          {profileData.profile.pfp_url ? '✅ Yes' : '❌ No'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-400">Valid URL:</span>
                        <Badge className={profileData.profile.pfp_url && profileData.profile.pfp_url.startsWith('http') ? 'bg-green-600' : 'bg-red-600'}>
                          {profileData.profile.pfp_url && profileData.profile.pfp_url.startsWith('http') ? '✅ Yes' : '❌ No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Squad Badge Test */}
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Squad Badge Test</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400">Should Show PFP:</span>
                      <Badge className={profileData.profile.squad?.name === null && profileData.profile.pfp_url ? 'bg-green-600' : 'bg-yellow-600'}>
                        {profileData.profile.squad?.name === null && profileData.profile.pfp_url ? '✅ Yes (Academy Member with PFP)' : '❌ No (Squad member or no PFP)'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-400">
                      {profileData.profile.squad?.name === null 
                        ? 'You are an Academy Member - PFP should show in squad badge'
                        : `You are in ${profileData.profile.squad?.name} squad - squad badge will show instead of PFP`
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Raw Data */}
        {profileData && (
          <details className="p-3 bg-slate-700/30 rounded-lg">
            <summary className="text-white font-semibold cursor-pointer">Raw API Response</summary>
            <pre className="text-xs text-gray-300 mt-2 overflow-auto max-h-40">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
