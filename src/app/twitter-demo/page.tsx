'use client';

import { PrivyProvider } from '@/components/privy/PrivyProvider';
import { EnhancedProfile } from '@/components/privy/EnhancedProfile';
import { TwitterConnection } from '@/components/privy/TwitterConnection';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Twitter, 
  Wallet, 
  User, 
  LogOut, 
  LogIn,
  ExternalLink,
  Share2
} from 'lucide-react';

function TwitterDemoContent() {
  const { user, login, logout, authenticated, ready } = usePrivy();

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading Privy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Twitter className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Twitter/X Integration Demo</h1>
                <p className="text-slate-400">Connect your Twitter account with Privy</p>
              </div>
            </div>
            
            {authenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">
                  {user?.wallet?.address.slice(0, 6)}...{user?.wallet?.address.slice(-4)}
                </span>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={login}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!authenticated ? (
          <div className="text-center py-12">
            <Card className="bg-slate-800 border-slate-600 max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-white">
                  <Twitter className="w-6 h-6 text-blue-400" />
                  Get Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  Connect your wallet to access Twitter integration features.
                </p>
                <Button
                  onClick={login}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Features Overview */}
            <Card className="bg-slate-800 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Twitter Integration Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <User className="w-8 h-8 text-purple-400 mb-2" />
                    <h3 className="font-semibold text-white mb-2">Profile Linking</h3>
                    <p className="text-sm text-slate-300">
                      Link your Twitter account to your wallet for seamless identity management.
                    </p>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-4">
                    <Share2 className="w-8 h-8 text-blue-400 mb-2" />
                    <h3 className="font-semibold text-white mb-2">Social Sharing</h3>
                    <p className="text-sm text-slate-300">
                      Share your achievements and progress directly to Twitter.
                    </p>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-4">
                    <ExternalLink className="w-8 h-8 text-green-400 mb-2" />
                    <h3 className="font-semibold text-white mb-2">Cross-Platform</h3>
                    <p className="text-sm text-slate-300">
                      Access your data across web3 and social platforms seamlessly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile and Twitter Connection */}
            <EnhancedProfile />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TwitterDemoPage() {
  return (
    <PrivyProvider>
      <TwitterDemoContent />
    </PrivyProvider>
  );
}
