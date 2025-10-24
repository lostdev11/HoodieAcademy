'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Twitter, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export function TwitterConnection() {
  const { user, linkTwitter, unlinkTwitter, ready } = usePrivy();
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const handleLinkTwitter = async () => {
    try {
      setIsLinking(true);
      await linkTwitter();
    } catch (error) {
      console.error('Error linking Twitter:', error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkTwitter = async () => {
    try {
      setIsUnlinking(true);
      await unlinkTwitter();
    } catch (error) {
      console.error('Error unlinking Twitter:', error);
    } finally {
      setIsUnlinking(false);
    }
  };

  if (!ready) {
    return (
      <Card className="bg-slate-800 border-slate-600">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-slate-300">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const twitterAccount = user?.twitter;
  const isConnected = !!twitterAccount;

  return (
    <Card className="bg-slate-800 border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Twitter className="w-5 h-5 text-blue-400" />
          Twitter/X Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Connected to Twitter</span>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-300">Username:</span>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                  @{twitterAccount.username}
                </Badge>
              </div>
              
              {twitterAccount.name && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">Name:</span>
                  <span className="text-white">{twitterAccount.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <span className="text-slate-300">ID:</span>
                <span className="text-slate-400 font-mono text-sm">
                  {twitterAccount.id}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUnlinkTwitter}
                disabled={isUnlinking}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                {isUnlinking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Unlinking...
                  </>
                ) : (
                  'Unlink Twitter'
                )}
              </Button>
              
              <Button
                onClick={() => window.open(`https://twitter.com/${twitterAccount.username}`, '_blank')}
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <AlertCircle className="w-4 h-4" />
              <span>Not connected to Twitter</span>
            </div>
            
            <p className="text-slate-300 text-sm">
              Connect your Twitter account to unlock social features, share achievements, 
              and participate in community discussions.
            </p>
            
            <Button
              onClick={handleLinkTwitter}
              disabled={isLinking}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLinking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Twitter className="w-4 h-4 mr-2" />
                  Connect Twitter
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
