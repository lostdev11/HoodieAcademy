'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Save, User, Award, BookOpen, Wallet, Users, Calendar, ChevronDown, ChevronUp, CheckCircle, TrendingUp, Home, Copy, ExternalLink } from 'lucide-react';
import { squadTracks } from '@/lib/squadData';
import Link from 'next/link';
import { getSNSResolver, formatWalletAddress, isValidSolanaAddress, isSolDomain } from '@/services/sns-resolver';
import { Connection } from '@solana/web3.js';

// Mock user data - in production, this would come from user profile/backend
const mockUser = {
  displayName: 'HoodieScholar',
  squad: 'hoodie-creators',
  joined: '2024-06-01',
  rank: 'Scholar',
  completedCourses: [
    { id: 'wallet-wizardry', title: 'Wallet Wizardry', progress: 100, score: 92 },
    { id: 'nft-mastery', title: 'NFT Mastery', progress: 100, score: 88 },
    { id: 'meme-coin-mania', title: 'Meme Coin Mania', progress: 100, score: 95 }
  ],
  badges: [
    { id: 'vault-keeper', label: 'Vault Keeper', icon: <Award className="w-4 h-4 text-yellow-400" /> },
    { id: 'nft-ninja', label: 'NFT Ninja', icon: <Award className="w-4 h-4 text-pink-400" /> },
    { id: 'moon-merchant', label: 'Moon Merchant', icon: <Award className="w-4 h-4 text-cyan-400" /> }
  ]
};

export function ProfileView() {
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(mockUser.displayName);
  const [squad, setSquad] = useState(mockUser.squad);
  const [wallet, setWallet] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [solDomain, setSolDomain] = useState<string | null>(null);
  const [isLoadingDomain, setIsLoadingDomain] = useState(false);

  const snsResolver = getSNSResolver();
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');

  // Auto-detect connected wallet from localStorage or session
  useEffect(() => {
    const detectConnectedWallet = () => {
      // Check localStorage for connected wallet (from TokenGate)
      const connectedWallet = localStorage.getItem('connectedWallet');
      const walletAddress = localStorage.getItem('walletAddress');
      
      if (walletAddress) {
        setWallet(walletAddress);
      } else if (connectedWallet) {
        setWallet(connectedWallet);
      } else {
        // For demo purposes, use a test wallet that has a .sol domain
        setWallet('JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU');
      }
    };

    detectConnectedWallet();
  }, []);

  // Resolve .sol domain when wallet changes
  useEffect(() => {
    const resolveSolDomain = async () => {
      if (wallet && isValidSolanaAddress(wallet)) {
        setIsLoadingDomain(true);
        try {
          const domain = await snsResolver.reverseResolve(connection, wallet);
          setSolDomain(domain);
        } catch (error) {
          console.error('Error resolving .sol domain:', error);
        } finally {
          setIsLoadingDomain(false);
        }
      } else {
        setSolDomain(null);
      }
    };

    if (wallet) {
      resolveSolDomain();
    }
  }, [wallet, snsResolver, connection]);

  const handleSave = () => {
    setEditMode(false);
    // Save logic here
  };

  const getSquadName = (squadId: string) => {
    const squad = squadTracks.find(s => s.id === squadId);
    return squad ? squad.name : squadId;
  };

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy wallet address:', err);
    }
  };

  const handleDisconnectWallet = () => {
    setWallet('');
    setSolDomain(null);
    
    // Clear wallet data from storage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    sessionStorage.removeItem('wifhoodie_verification_session');
    
    // Disconnect from wallet providers
    if (typeof window !== 'undefined') {
      if (window.solana?.disconnect) {
        window.solana.disconnect();
      }
      if (window.solflare?.disconnect) {
        window.solflare.disconnect();
      }
    }
  };

  const getWalletDisplay = () => {
    if (!wallet) {
      return <span className="text-gray-500">No wallet connected</span>;
    }

    if (isLoadingDomain) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono">{formatWalletAddress(wallet)}</span>
          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (solDomain) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-semibold">{solDomain}</span>
          <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
            .sol
          </Badge>
          <span className="text-gray-500 text-sm">({formatWalletAddress(wallet)})</span>
        </div>
      );
    }

    return <span className="text-green-400 font-mono">{formatWalletAddress(wallet)}</span>;
  };

  const overallProgress = Math.round(
    mockUser.completedCourses.reduce((acc, c) => acc + c.progress, 0) / (mockUser.completedCourses.length * 100) * 100
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex-1 flex flex-col items-center py-12 px-4">
        {/* Back to Dashboard Button */}
        <div className="w-full max-w-2xl mb-6">
          <Button
            asChild
            variant="outline"
            className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-2xl bg-slate-800/60 border-cyan-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <User className="w-6 h-6" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Display Name:</span>
                  {editMode ? (
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-40 bg-slate-700/50 border-cyan-500/30 text-white" />
                  ) : (
                    <span className="text-cyan-300 font-semibold">{displayName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Squad:</span>
                  {editMode ? (
                    <Select value={squad} onValueChange={setSquad}>
                      <SelectTrigger className="w-40 bg-slate-700/50 border-cyan-500/30 text-white">
                        <SelectValue placeholder="Select a squad" />
                      </SelectTrigger>
                      <SelectContent>
                        {squadTracks.map(track => (
                          <SelectItem key={track.id} value={track.id}>
                            {track.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-yellow-400 font-semibold">{getSquadName(squad)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Wallet:</span>
                  {editMode ? (
                    <Input value={wallet} onChange={e => setWallet(e.target.value)} className="w-40 bg-slate-700/50 border-cyan-500/30 text-white" />
                  ) : (
                    <div className="flex items-center gap-2">
                      {getWalletDisplay()}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCopyWallet}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-green-400 hover:bg-green-500/10"
                          title="Copy wallet address"
                        >
                          {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                          title="View on Solscan"
                        >
                          <a 
                            href={`https://solscan.io/account/${wallet}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleDisconnectWallet}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                          title="Disconnect wallet"
                        >
                          <Wallet className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Joined:</span>
                  <span className="text-cyan-400 font-mono">{mockUser.joined}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Rank:</span>
                  <span className="text-pink-400 font-semibold">{mockUser.rank}</span>
                </div>
                <div className="mt-4">
                  {editMode ? (
                    <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 text-white mr-2">
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                  ) : (
                    <Button onClick={() => setEditMode(true)} variant="outline" className="text-cyan-400 border-cyan-500/30 hover:text-cyan-300 hover:bg-cyan-500/10">
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-pink-400 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                  🧑‍🎓
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {mockUser.badges.map(badge => (
                    <Badge key={badge.id} className="flex items-center gap-1 px-3 py-1 border border-cyan-500/30 bg-slate-900/60 text-cyan-300">
                      {badge.icon} {badge.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-2xl bg-slate-800/60 border-green-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Completed Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUser.completedCourses.map(course => (
                <div key={course.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    <span className="font-semibold text-white">{course.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">{course.progress}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">{course.score}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-2xl bg-slate-800/60 border-purple-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Progress</span>
                <span className="text-purple-400">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 