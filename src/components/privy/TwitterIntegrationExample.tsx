'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Twitter, Share2, ExternalLink, CheckCircle } from 'lucide-react';

export function TwitterIntegrationExample() {
  const { user, authenticated } = usePrivy();
  const [isSharing, setIsSharing] = useState(false);

  // Example: Share achievement to Twitter
  const shareToTwitter = async (achievement: string) => {
    if (!user?.twitter) {
      alert('Please connect your Twitter account first');
      return;
    }

    setIsSharing(true);
    
    try {
      const tweetText = `🎉 Just earned "${achievement}" in Hoodie Academy! 🚀 #HoodieAcademy #Web3Learning`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      
      window.open(twitterUrl, '_blank');
    } catch (error) {
      console.error('Error sharing to Twitter:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Example: Get user's Twitter data for profile enhancement
  const getTwitterProfileData = () => {
    if (!user?.twitter) return null;
    
    return {
      username: user.twitter.username,
      name: user.twitter.name,
      id: user.twitter.id,
      profileUrl: `https://twitter.com/${user.twitter.username}`,
    };
  };

  const twitterData = getTwitterProfileData();

  if (!authenticated || !user) {
    return (
      <Card className="bg-slate-800 border-slate-600">
        <CardContent className="p-6 text-center">
          <p className="text-slate-300">Please connect your wallet to access Twitter features.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Twitter Profile Display */}
      {twitterData && (
        <Card className="bg-slate-800 border-slate-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Twitter className="w-5 h-5 text-blue-400" />
              Your Twitter Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">@{twitterData.username}</p>
                  {twitterData.name && (
                    <p className="text-slate-300 text-sm">{twitterData.name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(twitterData.profileUrl, '_blank')}
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Sharing Features */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Share2 className="w-5 h-5 text-green-400" />
            Share Your Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 text-sm">
            Share your Hoodie Academy progress and achievements with your Twitter followers!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => shareToTwitter('Completed Solana Basics Course')}
              disabled={isSharing || !twitterData}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSharing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sharing...
                </>
              ) : (
                <>
                  <Twitter className="w-4 h-4 mr-2" />
                  Share Course Completion
                </>
              )}
            </Button>
            
            <Button
              onClick={() => shareToTwitter('Reached Level 5!')}
              disabled={isSharing || !twitterData}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSharing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sharing...
                </>
              ) : (
                <>
                  <Twitter className="w-4 h-4 mr-2" />
                  Share Level Up
                </>
              )}
            </Button>
          </div>

          {!twitterData && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-300 text-sm">
                Connect your Twitter account to enable social sharing features.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Examples */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white">Integration Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-slate-700 rounded-lg p-3">
              <h4 className="font-medium text-white mb-2">Profile Enhancement</h4>
              <p className="text-sm text-slate-300">
                Use Twitter data to enhance user profiles with social verification and cross-platform identity.
              </p>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-3">
              <h4 className="font-medium text-white mb-2">Social Features</h4>
              <p className="text-sm text-slate-300">
                Enable users to share achievements, invite friends, and build community through social connections.
              </p>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-3">
              <h4 className="font-medium text-white mb-2">Analytics & Engagement</h4>
              <p className="text-sm text-slate-300">
                Track social engagement, viral growth, and community building through Twitter integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
