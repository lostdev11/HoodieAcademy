'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Home, 
  Copy, 
  ExternalLink, 
  Users, 
  Trophy, 
  BookOpen, 
  Star, 
  Shield,
  UserPlus,
  UserMinus,
  CheckCircle,
  Wallet
} from 'lucide-react';
import { squadTracks } from '@/lib/squadData';
import Link from 'next/link';
import { formatWalletAddress } from '@/lib/utils';
import SquadBadge from '@/components/SquadBadge';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';

interface PublicProfileViewProps {
  walletAddress: string;
}

export default function PublicProfileView({ walletAddress }: PublicProfileViewProps) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendsStats, setFriendsStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const { wallet: currentUserWallet } = useWalletSupabase();

  useEffect(() => {
    loadProfile();
  }, [walletAddress]);

  useEffect(() => {
    if (currentUserWallet && walletAddress) {
      checkFollowingStatus();
    }
  }, [currentUserWallet, walletAddress]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await fetch(`/api/user-profile?wallet=${walletAddress}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success) {
          setUserProfile(profileData.profile);
        }
      }

      // Fetch friends stats
      const statsResponse = await fetch(`/api/friends/stats?wallet=${walletAddress}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setFriendsStats(statsData.stats);
        }
      }

      // Fetch friends list (top followers)
      const friendsResponse = await fetch(`/api/friends?wallet=${walletAddress}&type=followers`);
      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        if (friendsData.success) {
          setFriends(friendsData.friends.slice(0, 6)); // Top 6
        }
      }

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowingStatus = async () => {
    if (!currentUserWallet) return;
    
    try {
      const response = await fetch(`/api/friends/check?follower=${currentUserWallet}&following=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsFollowing(data.isFollowing);
        }
      }
    } catch (error) {
      console.error('Error checking following status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserWallet) {
      alert('Please connect your wallet to follow users');
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(
          `/api/friends?follower=${currentUserWallet}&following=${walletAddress}`,
          { method: 'DELETE' }
        );
        
        if (response.ok) {
          setIsFollowing(false);
          // Refresh stats
          loadProfile();
        }
      } else {
        // Follow
        const response = await fetch('/api/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            followerWallet: currentUserWallet,
            followingWallet: walletAddress
          })
        });
        
        if (response.ok) {
          setIsFollowing(true);
          // Refresh stats
          loadProfile();
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status');
    }
  };

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy wallet address:', err);
    }
  };

  const getSquadName = (squadId: string) => {
    const squad = squadTracks.find(s => s.id === squadId);
    return squad ? squad.name : squadId;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
          <Card className="w-full max-w-4xl bg-slate-800/60 border-cyan-500/30">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold text-cyan-400 mb-4">Loading Profile...</h2>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
          <Card className="w-full max-w-4xl bg-slate-800/60 border-red-500/30">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-red-400 mb-4">Profile Not Found</h2>
              <p className="text-gray-300 mb-4">
                This user profile doesn't exist yet.
              </p>
              <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex-1 flex flex-col items-center py-12 px-4">
        {/* Navigation */}
        <div className="w-full max-w-4xl mb-6 flex gap-3">
          <Button
            asChild
            variant="outline"
            className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 hover:border-cyan-400/50"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          {currentUserWallet && (
            <Button
              asChild
              variant="outline"
              className="bg-slate-800/50 hover:bg-slate-700/50 text-purple-400 hover:text-purple-300 border-purple-500/30 hover:border-purple-400/50"
            >
              <Link href="/profile">
                <User className="w-4 h-4 mr-2" />
                My Profile
              </Link>
            </Button>
          )}
        </div>

        {/* Profile Header Card */}
        <Card className="w-full max-w-4xl bg-slate-800/60 border-cyan-500/30 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-6xl">
                  {userProfile.profile_picture || '🧑‍🎓'}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-cyan-400 mb-2">
                      {userProfile.display_name || `User ${walletAddress.slice(0, 6)}...`}
                    </h1>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                        <Wallet className="w-4 h-4" />
                        {formatWalletAddress(walletAddress)}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyWallet}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-green-400"
                      >
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400"
                      >
                        <a 
                          href={`https://solscan.io/account/${walletAddress}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Squad Badge */}
                {userProfile.squad && (
                  <div className="flex items-center gap-3">
                    <SquadBadge squad={getSquadName(userProfile.squad)} walletAddress={walletAddress} />
                    <span className="text-yellow-400 font-medium">{getSquadName(userProfile.squad)}</span>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">{userProfile.totalXP || 0}</p>
                    <p className="text-xs text-gray-400">Total XP</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">{userProfile.level || 1}</p>
                    <p className="text-xs text-gray-400">Level</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">{friendsStats.followers}</p>
                    <p className="text-xs text-gray-400">Followers</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <User className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">{friendsStats.following}</p>
                    <p className="text-xs text-gray-400">Following</p>
                  </div>
                </div>

                {/* Follow Button */}
                {currentUserWallet && currentUserWallet !== walletAddress && (
                  <div className="pt-4">
                    <Button
                      onClick={handleFollowToggle}
                      variant={isFollowing ? "outline" : "default"}
                      className={
                        isFollowing
                          ? "border-gray-500 text-gray-400"
                          : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400"
                      }
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Friends Card */}
        <Card className="w-full max-w-4xl bg-slate-800/60 border-purple-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Top Friends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {friends.map((friend: any) => {
                  const user = friend.follower_user;
                  if (!user) return null;
                  
                  return (
                    <Link
                      key={friend.id}
                      href={`/profile/${user.wallet_address}`}
                      className="block"
                    >
                      <Card className="bg-slate-700/30 border-slate-600/30 hover:border-purple-500/50 transition-all cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                              {user.profile_picture || '🧑‍🎓'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">
                                {user.display_name || `User ${user.wallet_address.slice(0, 6)}...`}
                              </p>
                              {user.squad && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs mt-1">
                                  {getSquadName(user.squad)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No followers yet</p>
            )}
          </CardContent>
        </Card>

        {/* XP Progress Card */}
        {userProfile.totalXP > 0 && (
          <Card className="w-full max-w-4xl bg-slate-800/60 border-cyan-500/30 mb-8">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <Star className="w-6 h-6" />
                Experience Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Level {userProfile.level || 1}</span>
                  <span className="text-cyan-400">{userProfile.totalXP || 0} XP</span>
                </div>
                <Progress 
                  value={((userProfile.totalXP || 0) % 1000) / 10} 
                  className="h-3 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-purple-500"
                />
                <p className="text-xs text-gray-400 text-center">
                  {((userProfile.totalXP || 0) % 1000)} / 1,000 XP to next level
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

