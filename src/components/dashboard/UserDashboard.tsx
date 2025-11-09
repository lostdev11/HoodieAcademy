"use client";

import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Target,
  Users,
  TrendingUp,
  Award,
  Star,
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  Crown,
  Shield,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Calendar,
  BarChart3,
  Activity,
  BookOpen,
  MessageSquare,
  Lock,
  Heart,
  ThumbsUp,
  Send,
  Sparkles as SparklesIcon
} from "lucide-react";
import Link from "next/link";
import { useUserBounties } from "@/hooks/useUserBounties";
import { useUserXP } from "@/hooks/useUserXP";
import { useUserTracking } from "@/hooks/useUserTracking";
import { useAutoDailyLogin } from "@/hooks/useAutoDailyLogin";
import { useDisplayNameReadOnly } from "@/hooks/use-display-name";
import { fetchUserSquad } from "@/utils/squad-api";
import { getSquadName as getSquadNameFromCache } from "@/utils/squad-storage";
import SquadBadge from "@/components/SquadBadge";
import FeedbackTrackerWidget from "@/components/feedback/FeedbackTrackerWidget";
import DailyLoginBonus from "@/components/xp/DailyLoginBonus";
import XPNotification from "@/components/xp/XPNotification";
import DailyXPProgress from "@/components/DailyXPProgress";

interface UserDashboardProps {
  walletAddress: string;
  className?: string;
}

interface DashboardStats {
  totalXP: number;
  level: number;
  totalBounties: number;
  completedBounties: number;
  totalSOL: number;
  globalRank: number;
  squadRank: number;
  streak: number;
  coursesCompleted: number;
}

export default function UserDashboard({ walletAddress, className = "" }: UserDashboardProps) {
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalXP: 0,
    level: 1,
    totalBounties: 0,
    completedBounties: 0,
    totalSOL: 0,
    globalRank: 0,
    squadRank: 0,
    streak: 0,
    coursesCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();

  // Hooks for data fetching
  const { submissions: bountySubmissions, stats: bountyStats, loading: bountiesLoading } = useUserBounties(walletAddress);
  const { profile: xpProfile, badges, loading: xpLoading, refresh: refreshXP } = useUserXP(walletAddress);
  const { data: trackingData, loading: trackingLoading } = useUserTracking(walletAddress);
  
  // Display name hook
  const { displayName, isLoading: displayNameLoading } = useDisplayNameReadOnly();
  
  // Auto daily login bonus
  useAutoDailyLogin(walletAddress);

  useEffect(() => {
    const fetchUserProfile = async () => {
      let squadName = 'Unassigned';
      try {
        console.log('🔄 UserDashboard: Fetching user profile for', walletAddress?.slice(0, 8) + '...');
        const profileResponse = await fetch(`/api/user-profile?wallet=${walletAddress}`);
        const profileData = await profileResponse.json();
        
        if (profileData.success && profileData.profile) {
          squadName = profileData.profile.squad?.name || 'Unassigned';
          console.log('✅ UserDashboard: Fetched user profile with squad:', squadName);
        }
      } catch (error) {
        console.error('❌ UserDashboard: Error fetching user profile:', error);
        // Fallback to old method
        const squadData = await fetchUserSquad(walletAddress);
        squadName = squadData?.hasSquad && squadData?.squad?.name ? squadData.squad.name : 'Unassigned';
      }
      
      // Final fallback: use cached/local squad if available
      if (!squadName || squadName === 'Unassigned') {
        const cachedSquad = getSquadNameFromCache();
        if (cachedSquad) {
          squadName = cachedSquad;
          console.log('📦 Using cached squad from localStorage:', cachedSquad);
        }
      }
      
      setUserSquad(squadName);
      return squadName;
    };

    const initializeDashboard = async () => {
      // Show cached squad immediately while API loads
      const cachedSquad = getSquadNameFromCache();
      if (cachedSquad) {
        setUserSquad(cachedSquad);
      }
      try {
        console.log('🔄 UserDashboard: Initializing dashboard...', {
          walletAddress: walletAddress?.slice(0, 8) + '...',
          hasXPProfile: !!xpProfile,
          hasBountyStats: !!bountyStats,
          xpProfile,
          bountyStats
        });
        
        setLoading(true);
        
        // Fetch complete user profile (includes squad, XP, level)
        const squadName = await fetchUserProfile();

        // Calculate level from XP (with fallback)
        const totalXP = xpProfile?.totalXP || 0;
        const level = Math.floor(totalXP / 1000) + 1;
        
        // Fetch actual user rank from leaderboard API
        let globalRank = 0;
        let squadRank = 0;
        try {
          const rankResponse = await fetch(`/api/leaderboard?wallet=${walletAddress}`);
          if (rankResponse.ok) {
            const rankData = await rankResponse.json();
            if (rankData.success && rankData.user) {
              globalRank = rankData.user.rank || 0;
              console.log('🏆 UserDashboard: Fetched user rank:', globalRank);
            }
          }

          // Get squad rank if user has a squad
          if (squadName && squadName !== 'Unassigned') {
            const squadRankResponse = await fetch(`/api/leaderboard?wallet=${walletAddress}&squad=${squadName}`);
            if (squadRankResponse.ok) {
              const squadRankData = await squadRankResponse.json();
              if (squadRankData.success && squadRankData.user) {
                squadRank = squadRankData.user.rank || 0;
                console.log('🎯 UserDashboard: Fetched squad rank:', squadRank);
              }
            }
          }
        } catch (error) {
          console.error('❌ UserDashboard: Error fetching ranks:', error);
        }

        const newStats = {
          totalXP,
          level,
          totalBounties: bountyStats?.totalSubmissions || 0,
          completedBounties: bountyStats?.wins || 0,
          totalSOL: bountyStats?.totalSOL || 0,
          globalRank,
          squadRank,
          streak: xpProfile?.streak || 0,
          coursesCompleted: xpProfile?.completedCourses?.length || 0
        };

        console.log('📊 UserDashboard: Setting stats:', newStats);
        setStats(newStats);
      } catch (error) {
        console.error("💥 UserDashboard: Error initializing dashboard:", error);
        // Set default stats on error
        setStats({
          totalXP: 0,
          level: 1,
          totalBounties: 0,
          completedBounties: 0,
          totalSOL: 0,
          globalRank: 0,
          squadRank: 0,
          streak: 0,
          coursesCompleted: 0
        });
      } finally {
        setLoading(false);
      }
    };

    // Initialize even if some data is missing (with fallbacks)
    if (walletAddress) {
      initializeDashboard();
    }
    
    // Listen for squad updates
    const handleSquadUpdate = () => {
      console.log('🔄 UserDashboard: Squad update event detected, refreshing...');
      if (walletAddress) {
        initializeDashboard();
      }
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userSquad' || e.key === null) {
        console.log('🔄 UserDashboard: Storage event detected, refreshing...');
        if (walletAddress) {
          initializeDashboard();
        }
      }
    };
    
    window.addEventListener('squadUpdated', handleSquadUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('squadUpdated', handleSquadUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [walletAddress, xpProfile, bountyStats]);

  // Separate effect to update stats when XP data becomes available
  useEffect(() => {
    if (xpProfile && xpProfile.totalXP !== undefined) {
      console.log('🔄 UserDashboard: Updating stats with XP data:', xpProfile.totalXP);
      setStats(prevStats => ({
        ...prevStats,
        totalXP: xpProfile.totalXP,
        level: Math.floor(xpProfile.totalXP / 1000) + 1,
        streak: xpProfile.streak || 0,
        coursesCompleted: xpProfile.completedCourses?.length || 0
      }));
    }
  }, [xpProfile?.totalXP, xpProfile?.streak, xpProfile?.completedCourses]);

  // Set up comprehensive refresh system
  useEffect(() => {
    const componentId = `user-dashboard-${walletAddress}`;
    
    // 1. Register for global refresh (if available)
    try {
      const { registerForRefresh, unregisterFromRefresh } = require('@/utils/globalRefresh');
      registerForRefresh(componentId, () => {
        console.log('🔄 [UserDashboard] Global refresh triggered');
        refreshXP();
      });
    } catch (error) {
      console.log('Global refresh system not available');
    }

    // 2. Set up force refresh listener
    const { setupXpRefreshListener, checkForXpRefresh } = require('@/utils/forceRefresh');
    
    // Check if refresh is needed on mount
    if (checkForXpRefresh()) {
      console.log('🔄 [UserDashboard] XP refresh required on mount');
      refreshXP();
    }
    
    // Set up listener for future refreshes
    const cleanup = setupXpRefreshListener(() => {
      console.log('🔄 [UserDashboard] Force refresh triggered');
      refreshXP();
    });

    // 3. Listen for XP award events for notifications (now handled by XPNotification component)
    const handleXpAwarded = (event: CustomEvent) => {
      // Safety check for event.detail
      if (!event.detail) {
        console.log('🎯 [UserDashboard] XP event without detail, refreshing anyway');
        refreshXP();
        return;
      }
      
      const { targetWallet } = event.detail;
      
      // If no targetWallet (general refresh) or if XP was awarded to this user, refresh
      if (!targetWallet || targetWallet === walletAddress) {
        console.log('🎯 [UserDashboard] XP event received, refreshing...', {
          targetWallet: targetWallet || 'general',
          myWallet: walletAddress?.slice(0, 10) + '...'
        });
        
        // Refresh immediately
        refreshXP();
      }
    };

    // Add event listeners
    window.addEventListener('xpAwarded', handleXpAwarded as EventListener);
    window.addEventListener('xpUpdated', handleXpAwarded as EventListener);
    window.addEventListener('forceRefresh', handleXpAwarded as EventListener);

    // Cleanup
    return () => {
      try {
        const { unregisterFromRefresh } = require('@/utils/globalRefresh');
        unregisterFromRefresh(componentId);
      } catch (error) {
        // Ignore if global refresh not available
      }
      cleanup();
      window.removeEventListener('xpAwarded', handleXpAwarded as EventListener);
      window.removeEventListener('xpUpdated', handleXpAwarded as EventListener);
      window.removeEventListener('forceRefresh', handleXpAwarded as EventListener);
    };
  }, [walletAddress, refreshXP]);

  // Show loading skeleton only on first load, not on subsequent refreshes
  const isFirstLoad = loading && !stats.totalXP && !bountyStats && !xpProfile;
  
  if (isFirstLoad) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-700 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-700 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* XP Notification System - Handles all XP toast notifications */}
      <XPNotification walletAddress={walletAddress} />
      
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30">
        <CardContent className="p-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <Crown className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-400 mb-1">
                Welcome back, {displayNameLoading ? '...' : (displayName || 'Scholar')}!
              </h1>
              <p className="text-gray-300">
                Ready to continue your Web3 journey?
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">Total XP</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.totalXP.toLocaleString()}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                    Level {stats.level}
                  </Badge>
                  {stats.globalRank > 0 && (
                    <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">
                      Rank #{stats.globalRank}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Target className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Bounties</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.completedBounties}/{stats.totalBounties}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-yellow-500/30 hover:border-yellow-400/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Global Rank</p>
                {stats.globalRank > 0 ? (
                  <>
                    <p className="text-2xl font-bold text-yellow-400">#{stats.globalRank}</p>
                    <Link href="/leaderboard">
                      <p className="text-xs text-gray-500 hover:text-yellow-400 transition-colors cursor-pointer flex items-center">
                        View Leaderboard <ExternalLink className="w-3 h-3 ml-1" />
                      </p>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-500">--</p>
                    <p className="text-xs text-gray-500">Loading...</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Squad Rank</p>
                {userSquad && userSquad !== 'Unassigned' && stats.squadRank > 0 ? (
                  <>
                    <p className="text-2xl font-bold text-purple-400">#{stats.squadRank}</p>
                    <p className="text-xs text-gray-500">{userSquad}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-gray-500">--</p>
                    <p className="text-xs text-gray-500">No squad yet</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily XP Progress */}
      <DailyXPProgress walletAddress={walletAddress} compact={false} showRecent={true} />

      {/* Daily Login Bonus */}
      <DailyLoginBonus walletAddress={walletAddress} className="mb-6" />

      {/* Feedback Tracker Widget */}
      <FeedbackTrackerWidget limit={5} showTitle={true} className="mb-6" />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="bounties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-slate-800/50">
          <TabsTrigger 
            value="bounties" 
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 cursor-pointer transition-all hover:bg-cyan-500/10"
          >
            <Target className="w-4 h-4 mr-2" />
            Bounties
            {bountiesLoading && <RefreshCw className="w-3 h-3 ml-2 animate-spin" />}
          </TabsTrigger>
          <TabsTrigger 
            value="squad" 
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 cursor-pointer transition-all hover:bg-purple-500/10"
          >
            <Users className="w-4 h-4 mr-2" />
            Squad
          </TabsTrigger>
          <TabsTrigger 
            value="xp" 
            className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 cursor-pointer transition-all hover:bg-yellow-500/10"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            XP & Progress
            {xpLoading && <RefreshCw className="w-3 h-3 ml-2 animate-spin" />}
          </TabsTrigger>
          <TabsTrigger 
            value="social" 
            className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 cursor-pointer transition-all hover:bg-pink-500/10 relative"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Social Feed
            {stats.totalXP < 1000 && (
              <Lock className="w-3 h-3 ml-2 text-orange-400" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bounties" className="space-y-4" forceMount={false}>
          <BountiesSection 
            submissions={bountySubmissions}
            stats={bountyStats}
            walletAddress={walletAddress}
          />
        </TabsContent>

        <TabsContent value="squad" className="space-y-4" forceMount={false}>
          <SquadSection 
            userSquad={userSquad}
            stats={stats}
            walletAddress={walletAddress}
          />
        </TabsContent>

        <TabsContent value="xp" className="space-y-4" forceMount={false}>
          <XPSection 
            profile={xpProfile}
            badges={badges}
            stats={stats}
            walletAddress={walletAddress}
            refreshXP={refreshXP}
          />
        </TabsContent>

        <TabsContent value="social" className="space-y-4" forceMount={false}>
          <SocialFeedPreview 
            stats={stats}
            walletAddress={walletAddress}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Bounties Section Component
const BountiesSection = memo(function BountiesSection({ submissions, stats, walletAddress }: {
  submissions: any[];
  stats: any;
  walletAddress: string;
}) {
  // Handle undefined stats
  const safeStats = stats || {
    totalSubmissions: 0,
    wins: 0,
    pendingSubmissions: 0
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Your Bounty Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <p className="text-2xl font-bold text-cyan-400">{safeStats.totalSubmissions}</p>
              <p className="text-sm text-gray-400">Total Submissions</p>
            </div>
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <p className="text-2xl font-bold text-green-400">{safeStats.wins}</p>
              <p className="text-sm text-gray-400">Wins</p>
            </div>
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-400">{safeStats.pendingSubmissions}</p>
              <p className="text-sm text-gray-400">Pending</p>
            </div>
          </div>

          {(submissions || []).length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-3">Recent Submissions</h3>
              {submissions.slice(0, 5).map((submission, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Target className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{submission.bounty?.title || "Unknown Bounty"}</p>
                      <p className="text-sm text-gray-400">
                        Submitted {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={submission.status === 'approved' ? 'default' : 'secondary'}
                      className={submission.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                    >
                      {submission.status}
                    </Badge>
                    {submission.xp_earned > 0 && (
                      <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                        +{submission.xp_earned} XP
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No bounty submissions yet</p>
              <Link href="/bounties">
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  <Target className="w-4 h-4 mr-2" />
                  Explore Bounties
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-700">
            <Link href="/bounties">
              <Button variant="outline" className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                <ExternalLink className="w-4 h-4 mr-2" />
                View All Bounties
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Squad Section Component
const SquadSection = memo(function SquadSection({ userSquad, stats, walletAddress }: {
  userSquad: string | null;
  stats: DashboardStats;
  walletAddress: string;
}) {
  const [squadStats, setSquadStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (userSquad && userSquad !== 'Unassigned') {
      fetchSquadStats();
    } else {
      setLoadingStats(false);
    }
  }, [userSquad]);

  const fetchSquadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/squad/activity?squad=${userSquad}&period=week`);
      const data = await response.json();
      
      if (data.success) {
        setSquadStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching squad stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Weekly goal is 50k XP
  const weeklyGoal = 50000;
  const currentWeekXP = squadStats?.periodXP || 0;

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-400 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Squad Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userSquad && userSquad !== 'Unassigned' ? (
            loadingStats ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
                <p className="text-gray-400">Loading squad stats...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SquadBadge squad={userSquad} walletAddress={walletAddress} />
                    <div>
                      <h3 className="text-xl font-bold text-white">{userSquad} Squad</h3>
                      <p className="text-gray-400">Your current squad assignment</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                    Rank #{stats.squadRank || '--'}
                  </Badge>
                </div>

                {squadStats && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-400">Squad Members</p>
                          <Users className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-2xl font-bold text-purple-400">
                          {squadStats.activeMembers}/{squadStats.totalMembers}
                        </p>
                        <p className="text-xs text-gray-500">
                          {squadStats.activeMemberRate}% Active
                        </p>
                      </div>

                      <div className="p-4 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-400">Squad XP</p>
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-2xl font-bold text-purple-400">
                          {squadStats.squadTotalXP?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">Total squad XP</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">Weekly Goal Progress</p>
                        <p className="text-sm text-purple-400">
                          {Math.round((currentWeekXP / weeklyGoal) * 100)}%
                        </p>
                      </div>
                      <Progress 
                        value={Math.min((currentWeekXP / weeklyGoal) * 100, 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500">
                        {currentWeekXP.toLocaleString()} / {weeklyGoal.toLocaleString()} XP this week
                      </p>
                    </div>

                    {/* Activity Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-700">
                      <div className="text-center p-2 bg-slate-700/30 rounded">
                        <Target className="w-4 h-4 text-green-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{squadStats.completedBounties || 0}</p>
                        <p className="text-xs text-gray-400">Bounties</p>
                      </div>
                      <div className="text-center p-2 bg-slate-700/30 rounded">
                        <MessageSquare className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{squadStats.socialPosts || 0}</p>
                        <p className="text-xs text-gray-400">Posts</p>
                      </div>
                      <div className="text-center p-2 bg-slate-700/30 rounded">
                        <Heart className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{squadStats.totalEngagement || 0}</p>
                        <p className="text-xs text-gray-400">Engagement</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-slate-700">
                  <Link href={`/squads/${userSquad.toLowerCase().replace(/\s+/g, '-')}/chat`}>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <Users className="w-4 h-4 mr-2" />
                      Join Squad Chat
                    </Button>
                  </Link>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <div className="mb-6">
                <SquadBadge squad={userSquad || 'Unassigned'} walletAddress={walletAddress} />
              </div>
              <p className="text-gray-400 mb-2">
                {userSquad && userSquad !== 'Unassigned' 
                  ? `You're currently a member of ${userSquad} Squad` 
                  : "You're currently an unassigned Academy Member"}
              </p>
              <p className="text-sm text-gray-500 mb-4">Join a squad to unlock exclusive features and compete with your team!</p>
              <Link href="/choose-your-squad">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Users className="w-4 h-4 mr-2" />
                  {userSquad && userSquad !== 'Unassigned' ? 'Change Your Squad' : 'Choose Your Squad'}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

// XP Section Component
const XPSection = memo(function XPSection({ profile, badges, stats, walletAddress, refreshXP }: {
  profile: any;
  badges: any[];
  stats: DashboardStats;
  walletAddress: string;
  refreshXP: () => void;
}) {
  // Handle undefined or null profile data - use stats as fallback
  const totalXP = profile?.totalXP || stats.totalXP || 0;
  const completedCourses = profile?.completedCourses || [];
  
  const xpToNextLevel = 1000 - (totalXP % 1000);
  const progressToNextLevel = ((totalXP % 1000) / 1000) * 100;

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            XP & Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Level Progress & Rank */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">Level {stats.level}</p>
                  <p className="text-sm text-gray-400">Current Level</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-cyan-400">{totalXP.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">Total XP</p>
                </div>
                {stats.globalRank > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-400">#{stats.globalRank}</p>
                    <p className="text-sm text-gray-400">Global Rank</p>
                  </div>
                )}
              </div>
              
              {/* Rank Badges */}
              {stats.globalRank > 0 && (
                <div className="flex justify-center items-center space-x-2 mb-4">
                  {stats.globalRank === 1 && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                      🥇 #1 Champion
                    </Badge>
                  )}
                  {stats.globalRank === 2 && (
                    <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">
                      🥈 #2 Runner Up
                    </Badge>
                  )}
                  {stats.globalRank === 3 && (
                    <Badge className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
                      🥉 #3 Third Place
                    </Badge>
                  )}
                  {stats.globalRank > 3 && stats.globalRank <= 10 && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                      ⭐ Top 10
                    </Badge>
                  )}
                  {stats.globalRank > 10 && stats.globalRank <= 100 && (
                    <Badge className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
                      💎 Top 100
                    </Badge>
                  )}
                  <Link href="/leaderboard">
                    <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors cursor-pointer">
                      View Full Leaderboard →
                    </Badge>
                  </Link>
                </div>
              )}
              
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Progress to Level {stats.level + 1}</p>
                  <p className="text-sm text-yellow-400">{xpToNextLevel} XP needed</p>
                </div>
                <Progress value={progressToNextLevel} className="h-3" />
                <p className="text-xs text-gray-500">
                  {totalXP % 1000} / 1000 XP to next level
                </p>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshXP}
                  className="text-xs text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10"
                >
                  <RefreshCw className="h-3 w-3 mr-2" /> Refresh XP
                </Button>
              </div>
            </div>

            {/* XP Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                <div className="p-2 bg-blue-500/20 rounded-lg w-fit mx-auto mb-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-lg font-bold text-blue-400">{stats.coursesCompleted}</p>
                <p className="text-sm text-gray-400">Courses Completed</p>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                <div className="p-2 bg-green-500/20 rounded-lg w-fit mx-auto mb-2">
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-lg font-bold text-green-400">{stats.completedBounties}</p>
                <p className="text-sm text-gray-400">Bounties Won</p>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                <div className="p-2 bg-purple-500/20 rounded-lg w-fit mx-auto mb-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-lg font-bold text-purple-400">{stats.streak}</p>
                <p className="text-sm text-gray-400">Day Streak</p>
              </div>
            </div>

            {/* Recent Badges */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Recent Achievements</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(badges || []).slice(0, 4).map((badge, index) => (
                  <div key={index} className={`p-3 rounded-lg text-center ${badge?.unlocked ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-slate-700/50'}`}>
                    <div className="text-2xl mb-1">{badge?.icon || '🏆'}</div>
                    <p className="text-xs font-medium text-white">{badge?.name || 'Achievement'}</p>
                    <p className="text-xs text-gray-400">{badge?.requirement || 'Complete tasks'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <Link href="/leaderboard">
                <Button variant="outline" className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Social Feed Preview Component
const SocialFeedPreview = memo(function SocialFeedPreview({ stats, walletAddress }: {
  stats: DashboardStats;
  walletAddress: string;
}) {
  const hasAccess = stats.totalXP >= 1000;
  const xpNeeded = 1000 - stats.totalXP;
  const progress = (stats.totalXP / 1000) * 100;
  const [hasUsedTrialPost, setHasUsedTrialPost] = useState(false);
  const [trialPostContent, setTrialPostContent] = useState('');
  const [postingTrial, setPostingTrial] = useState(false);

  useEffect(() => {
    // Legacy flag retained for compatibility; does not block posting anymore
    const trialKey = `trial_post_used_${walletAddress}`;
    const hasUsed = localStorage.getItem(trialKey) === 'true';
    setHasUsedTrialPost(hasUsed);
  }, [walletAddress]);

  const handleTrialPost = async () => {
    if (!trialPostContent.trim()) {
      alert('Please write something!');
      return;
    }

    try {
      setPostingTrial(true);
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          content: trialPostContent,
          postType: 'text',
          tags: ['trial'],
          squad: null // Will use squad from user profile in API
        })
      });

      const data = await response.json();
      
      console.log('📝 Trial post response:', data);

      if (data.success && data.post) {
        console.log('✅ Trial post saved successfully:', data.post);
        
        // Inform trial users; do not block future posts
        setTrialPostContent('');
        alert('🎉 Post created! You can keep posting until you reach 1,000 XP.');
      } else {
        console.error('Trial post creation failed:', data);
        alert('Failed to create post: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating trial post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setPostingTrial(false);
    }
  };

  // Mock preview posts
  const previewPosts = [
    {
      id: '1',
      author: 'CryptoNinja',
      level: 15,
      squad: 'Decoders',
      content: 'Just completed the advanced Solana course! The smart contract module was mind-blowing 🚀',
      likes: 24,
      comments: 8,
      timeAgo: '2h ago'
    },
    {
      id: '2',
      author: 'PixelMaster',
      level: 8,
      squad: 'Creators',
      content: 'Working on my first NFT collection. Any tips from the Creators squad?',
      likes: 15,
      comments: 12,
      timeAgo: '5h ago'
    },
    {
      id: '3',
      author: 'RaidBoss',
      level: 12,
      squad: 'Raiders',
      content: 'Market analysis: SOL looking bullish this week. Who else is watching the charts?',
      likes: 31,
      comments: 19,
      timeAgo: '1d ago'
    }
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-pink-500/30">
        <CardHeader>
          <CardTitle className="text-pink-400 flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Social Feed Preview
            </div>
            {!hasAccess && (
              <Badge className="bg-orange-600 text-white">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative min-h-[500px]">
          {/* Preview Posts (blurred if locked) */}
          <div className={`space-y-4 transition-all duration-500 ${!hasAccess ? 'blur-sm pointer-events-none' : ''}`}>
            {previewPosts.map(post => (
              <div key={post.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 hover:border-pink-500/50 transition-colors">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {post.author[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-white">{post.author}</span>
                      <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                        Level {post.level}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                        {post.squad}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400">{post.timeAgo}</span>
                  </div>
                </div>
                <p className="text-gray-200 mb-3 leading-relaxed">{post.content}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1 text-pink-400">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-cyan-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lock Overlay with Fade Effect */}
          {!hasAccess && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-slate-900/60 to-slate-900/95 rounded-lg">
              <Card className="bg-slate-800/95 border-orange-500/50 shadow-2xl max-w-lg mx-4 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Lock className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-orange-400 mb-2">
                    🔒 Unlock at 1,000 XP
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Join the conversation and connect with the Hoodie Academy community!
                  </p>

                  {/* Trial Post Feature */}
                  {true ? (
                    <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-lg p-4 border border-pink-500/30 mb-6">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <SparklesIcon className="w-4 h-4 text-pink-400" />
                        <p className="text-sm font-semibold text-pink-400">Trial access: post until 1,000 XP</p>
                        <SparklesIcon className="w-4 h-4 text-pink-400" />
                      </div>
                      <Textarea
                        value={trialPostContent}
                        onChange={(e) => setTrialPostContent(e.target.value)}
                        placeholder="Share your thoughts... (You can keep posting until you reach 1,000 XP)"
                        className="min-h-[80px] bg-slate-700/50 border-pink-500/30 text-white mb-3 resize-none"
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">{trialPostContent.length}/500 chars</span>
                        <Button
                          onClick={handleTrialPost}
                          disabled={postingTrial || !trialPostContent.trim()}
                          size="sm"
                          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                        >
                          {postingTrial ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3 mr-2" />
                              Post Trial
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">✨ Trial posts don’t grant XP</p>
                    </div>
                  ) : (
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-green-500/30 mb-6">
                      <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-green-400 font-semibold">Trial Post Used!</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Earn 1,000 XP to unlock unlimited posting
                      </p>
                    </div>
                  )}
                  
                  {/* Progress Bar */}
                  <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Your Progress</span>
                      <span className="text-sm font-semibold text-cyan-400">
                        {Math.min(100, Math.round(progress))}%
                      </span>
                    </div>
                    <Progress value={Math.min(100, progress)} className="h-3 mb-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-white">{stats.totalXP.toLocaleString()} XP</span>
                      <span className="text-lg font-bold text-orange-400">{xpNeeded.toLocaleString()} needed</span>
                    </div>
                  </div>

                  {/* XP Tips */}
                  <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
                    <div className="bg-slate-700/50 rounded p-3 text-left">
                      <BookOpen className="w-4 h-4 text-cyan-400 mb-1" />
                      <p className="text-white font-semibold">Courses</p>
                      <p className="text-gray-400">100 XP each</p>
                    </div>
                    <div className="bg-slate-700/50 rounded p-3 text-left">
                      <Trophy className="w-4 h-4 text-yellow-400 mb-1" />
                      <p className="text-white font-semibold">Bounties</p>
                      <p className="text-gray-400">15-500 XP</p>
                    </div>
                  </div>

                  <Link href="/courses">
                    <Button className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Start Earning XP
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>

                  <p className="text-xs text-gray-500 mt-4">
                    💡 Earn up to 300 XP per day
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Unlocked State - Full Access Button */}
          {hasAccess && (
            <div className="mt-4">
              <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 rounded-lg p-6 border border-green-500/30 text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-xl font-bold text-green-400">Social Feed Unlocked!</span>
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-gray-300 mb-4">
                  You've earned enough XP to join the conversation. Start posting, commenting, and connecting!
                </p>
                <Link href="/social">
                  <Button size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Open Social Feed
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <div className="mt-4 text-sm text-gray-400">
                  <p>Create posts (+5 XP) • Comment (+3 XP) • Get likes (+1 XP each)</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
