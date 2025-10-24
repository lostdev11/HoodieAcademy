'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TwitterConnection } from './TwitterConnection';
import { 
  User, 
  Wallet, 
  Twitter, 
  Mail, 
  Shield, 
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useState } from 'react';

export function EnhancedProfile() {
  const { user, ready, authenticated } = usePrivy();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authenticated || !user) {
    return (
      <Card className="bg-slate-800 border-slate-600">
        <CardContent className="p-6 text-center">
          <p className="text-slate-300">Please connect your wallet to view your profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-5 h-5 text-purple-400" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Address */}
          {user.wallet && (
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Wallet Address</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white">
                    {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(user.wallet.address, 'wallet')}
                    className="h-8 w-8 p-0"
                  >
                    {copied === 'wallet' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Email */}
          {user.email && (
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300">Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white">{user.email.address}</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                    {user.email.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Twitter Account */}
          {user.twitter && (
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300">Twitter</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white">@{user.twitter.username}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`https://twitter.com/${user.twitter.username}`, '_blank')}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Account Status */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">Account Status</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Twitter Connection Card */}
      <TwitterConnection />
    </div>
  );
}
