"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { useUserBounties } from "@/hooks/useUserBounties";
import { useUserXP } from "@/hooks/useUserXP";
import { useUserTracking } from "@/hooks/useUserTracking";
import { useAutoDailyLogin } from "@/hooks/useAutoDailyLogin";
import { getSquadName } from "@/utils/squad-storage";
import SquadBadge from "@/components/SquadBadge";
import FeedbackTrackerWidget from "@/components/feedback/FeedbackTrackerWidget";
import DailyLoginBonus from "@/components/xp/DailyLoginBonus";
import XPNotification from "@/components/xp/XPNotification";

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
  
  // Auto daily login bonus
  useAutoDailyLogin(walletAddress);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log('🔄 UserDashboard: Initializing dashboard...', {
          walletAddress: walletAddress?.slice(0, 8) + '...',
          hasXPProfile: !!xpProfile,
          hasBountyStats: !!bountyStats,
          xpProfile,
          bountyStats
        });
        
        setLoading(true);
        
        // Get squad information
        const squadName = getSquadName();
        setUserSquad(squadName);

        // Calculate level from XP (with fallback)
        const totalXP = xpProfile?.totalXP || 0;
        const level = Math.floor(totalXP / 1000) + 1;
        
        // Calculate squad rank (mock for now)
        const squadRank = Math.floor(Math.random() * 50) + 1;

        const newStats = {
          totalXP,
          level,
          totalBounties: bountyStats?.totalSubmissions || 0,
          completedBounties: bountyStats?.wins || 0,
          totalSOL: bountyStats?.totalSOL || 0,
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
      const { targetWallet } = event.detail;
      
      // If XP was awarded to this user, refresh
      if (targetWallet === walletAddress) {
        console.log('🎯 [UserDashboard] XP awarded, refreshing...');
        
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
    <div className={`space-y-6 ${className}`}>
      {/* XP Notification System - Handles all XP toast notifications */}
      <XPNotification walletAddress={walletAddress} />
      
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Crown className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-400 mb-1">
                  Welcome back, Scholar!
                </h1>
                <p className="text-gray-300">
                  Ready to continue your Web3 journey?
                </p>
              </div>
            </div>
            {userSquad && (
              <SquadBadge squad={userSquad} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total XP</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.totalXP.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Level {stats.level}</p>
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

        <Card className="bg-slate-800/50 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">SOL Earned</p>
                <p className="text-2xl font-bold text-green-400">{stats.totalSOL.toFixed(2)}</p>
                <p className="text-xs text-gray-500">From bounties</p>
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
                <p className="text-2xl font-bold text-purple-400">#{stats.squadRank}</p>
                <p className="text-xs text-gray-500">{userSquad || "No Squad"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Login Bonus */}
      <DailyLoginBonus walletAddress={walletAddress} className="mb-6" />

      {/* Feedback Tracker Widget */}
      <FeedbackTrackerWidget limit={5} showTitle={true} className="mb-6" />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="bounties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="bounties" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Target className="w-4 h-4 mr-2" />
            Bounties
          </TabsTrigger>
          <TabsTrigger value="squad" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Users className="w-4 h-4 mr-2" />
            Squad
          </TabsTrigger>
          <TabsTrigger value="xp" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            <TrendingUp className="w-4 h-4 mr-2" />
            XP & Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bounties" className="space-y-4">
          <BountiesSection 
            submissions={bountySubmissions}
            stats={bountyStats}
            walletAddress={walletAddress}
          />
        </TabsContent>

        <TabsContent value="squad" className="space-y-4">
          <SquadSection 
            userSquad={userSquad}
            stats={stats}
            walletAddress={walletAddress}
          />
        </TabsContent>

        <TabsContent value="xp" className="space-y-4">
          <XPSection 
            profile={xpProfile}
            badges={badges}
            stats={stats}
            walletAddress={walletAddress}
            refreshXP={refreshXP}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Bounties Section Component
function BountiesSection({ submissions, stats, walletAddress }: {
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
}

// Squad Section Component
function SquadSection({ userSquad, stats, walletAddress }: {
  userSquad: string | null;
  stats: DashboardStats;
  walletAddress: string;
}) {
  const squadStats = {
    totalMembers: 42,
    activeMembers: 38,
    squadXP: 125000,
    weeklyGoal: 50000,
    currentWeekXP: 32000
  };

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
          {userSquad ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SquadBadge squad={userSquad} />
                  <div>
                    <h3 className="text-xl font-bold text-white">{userSquad} Squad</h3>
                    <p className="text-gray-400">Your current squad assignment</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                  Rank #{stats.squadRank}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Squad Members</p>
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-400">{squadStats.activeMembers}/{squadStats.totalMembers}</p>
                  <p className="text-xs text-gray-500">Active members</p>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Squad XP</p>
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-400">{squadStats.squadXP.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total squad XP</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Weekly Goal Progress</p>
                  <p className="text-sm text-purple-400">{Math.round((squadStats.currentWeekXP / squadStats.weeklyGoal) * 100)}%</p>
                </div>
                <Progress 
                  value={(squadStats.currentWeekXP / squadStats.weeklyGoal) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  {squadStats.currentWeekXP.toLocaleString()} / {squadStats.weeklyGoal.toLocaleString()} XP this week
                </p>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <Link href={`/squads/${userSquad.toLowerCase().replace(/\s+/g, '-')}/chat`}>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Users className="w-4 h-4 mr-2" />
                    Join Squad Chat
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">You haven't joined a squad yet</p>
              <Link href="/choose-your-squad">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Users className="w-4 h-4 mr-2" />
                  Choose Your Squad
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// XP Section Component
function XPSection({ profile, badges, stats, walletAddress, refreshXP }: {
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
            {/* Level Progress */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">Level {stats.level}</p>
                  <p className="text-sm text-gray-400">Current Level</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">{totalXP.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">Total XP</p>
                </div>
              </div>
              
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
}

