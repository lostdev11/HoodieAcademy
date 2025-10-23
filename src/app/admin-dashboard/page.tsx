'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import BountyManagerSimple from '@/components/admin/BountyManagerSimple';
import BountyXPManager from '@/components/admin/BountyXPManager';
import SubmissionApproval from '@/components/admin/SubmissionApproval';
import XPManagement from '@/components/admin/XPManagement';
import { EnhancedUsersManager } from '@/components/admin/EnhancedUsersManager';
import ConnectedUsersList from '@/components/admin/ConnectedUsersList';
import AdminOverviewDashboard from '@/components/admin/AdminOverviewDashboard';
import AdminSettings from '@/components/admin/AdminSettings';
import { 
  Users, BookOpen, Trophy, Settings, Shield, BarChart3, 
  Target, Megaphone, Bell, Database, Activity, Zap, 
  FileText, Star, CheckCircle, Sparkles, MessageSquare,
  Crown, ScrollText, Flag, Video, Vote
} from 'lucide-react';
import CouncilNoticesManager from '@/components/admin/CouncilNoticesManager';
import AnnouncementsManager from '@/components/admin/AnnouncementsManager';
import SpotlightManager from '@/components/admin/SpotlightManager';
import UserFeedbackManager from '@/components/admin/UserFeedbackManager';
import ExamApprovalManager from '@/components/admin/ExamApprovalManager';
import CommunityManagement from '@/components/admin/CommunityManagement';
import LoreLogManager from '@/components/admin/LoreLogManager';
import AcademyMilestonesManager from '@/components/admin/AcademyMilestonesManager';
import { MentorshipManager } from '@/components/admin/MentorshipManager';
import { GovernanceManager } from '@/components/admin/GovernanceManager';
import SocialFeedManager from '@/components/admin/SocialFeedManager';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import CourseManagementTab from '@/components/admin/CourseManagementTab';

interface Bounty {
  id?: string;
  title: string;
  short_desc: string;
  reward: string;
  reward_type: 'XP' | 'SOL' | 'NFT';
  start_date?: string;
  deadline?: string;
  status: 'active' | 'completed' | 'expired';
  hidden: boolean;
  squad_tag?: string;
  submissions?: number;
  nft_prize?: string;
  nft_prize_image?: string;
  nft_prize_description?: string;
  created_at?: string;
  updated_at?: string;
}

// Inner component that uses notifications
function AdminDashboardContent({ walletAddress }: { walletAddress: string }) {
  const { counts, markAsRead } = useNotifications();

  const getTabDisplayName = (tab: string) => {
    const tabNames: Record<string, string> = {
      'overview': 'Overview',
      'bounties': 'Bounties',
      'submissions': 'Submissions',
      'exams': 'Exam Approval',
      'bounty-xp': 'Bounty XP',
      'xp-management': 'XP Management',
      'users': 'Users',
      'connected-users': 'Connected Users',
      'settings': 'Settings',
      'council-notices': 'Council Notices',
      'announcements': 'Announcements',
      'spotlight': 'Spotlight',
      'feedback': 'User Feedback',
      'social-feed': 'Social Feed',
      'community': 'Community',
      'lore': 'Lore Log',
      'milestones': 'Milestones',
      'mentorship': 'Mentorship',
      'governance': 'Governance',
      'courses': 'Courses'
    };
    return tabNames[tab] || 'Select a section...';
  };
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');


  // Fetch bounties on component mount
  useEffect(() => {
    const fetchBounties = async () => {
      try {
        console.log('🎯 [ADMIN DASHBOARD] Fetching bounties...');
        const response = await fetch('/api/bounties');
        console.log('📊 [ADMIN DASHBOARD] Response status:', response.status);
        console.log('📊 [ADMIN DASHBOARD] Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [ADMIN DASHBOARD] Bounties fetched:', data.length);
          setBounties(data);
        } else {
          const errorText = await response.text();
          console.error('❌ [ADMIN DASHBOARD] API error:', response.status, errorText);
        }
      } catch (error) {
        console.error('💥 [ADMIN DASHBOARD] Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-16 py-4 sm:py-0 gap-4 sm:gap-0">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-slate-400">Manage your academy</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-400">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="outline" 
                  size="sm"
                  className="border-slate-600 text-slate-300"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile: Dropdown for tabs */}
          <div className="block sm:hidden mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-slate-800 border-slate-600 text-white">
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    {activeTab === 'overview' && <BarChart3 className="w-4 h-4" />}
                    {activeTab === 'bounties' && <Target className="w-4 h-4" />}
                    {activeTab === 'submissions' && <FileText className="w-4 h-4" />}
                    {activeTab === 'exams' && <Trophy className="w-4 h-4" />}
                    {activeTab === 'bounty-xp' && <Zap className="w-4 h-4" />}
                    {activeTab === 'users' && <Users className="w-4 h-4" />}
                    {activeTab === 'connected-users' && <Activity className="w-4 h-4" />}
                    {activeTab === 'settings' && <Settings className="w-4 h-4" />}
                    {activeTab === 'council-notices' && <Bell className="w-4 h-4" />}
                    {activeTab === 'announcements' && <Megaphone className="w-4 h-4" />}
                    {activeTab === 'spotlight' && <Sparkles className="w-4 h-4" />}
                    {activeTab === 'feedback' && <MessageSquare className="w-4 h-4" />}
                    {activeTab === 'social-feed' && <MessageSquare className="w-4 h-4" />}
                    {activeTab === 'community' && <Crown className="w-4 h-4" />}
                    {activeTab === 'lore' && <ScrollText className="w-4 h-4" />}
                    {activeTab === 'milestones' && <Flag className="w-4 h-4" />}
                    {activeTab === 'mentorship' && <Video className="w-4 h-4" />}
                    {activeTab === 'governance' && <Vote className="w-4 h-4" />}
                    {activeTab === 'courses' && <BookOpen className="w-4 h-4" />}
                    <span>{getTabDisplayName(activeTab)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {/* Core Management */}
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 border-b border-slate-600">Core Management</div>
                <SelectItem value="overview">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview</span>
                  </div>
                </SelectItem>
                <SelectItem value="users">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Users & XP</span>
                  </div>
                </SelectItem>
                <SelectItem value="connected-users">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Connected Users</span>
                  </div>
                </SelectItem>
                
                {/* Content & Bounties */}
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 border-b border-slate-600 mt-2">Content & Bounties</div>
                <SelectItem value="bounties">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Bounties</span>
                  </div>
                </SelectItem>
                <SelectItem value="submissions">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Submissions</span>
                  </div>
                </SelectItem>
                <SelectItem value="bounty-xp">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Bounty XP</span>
                  </div>
                </SelectItem>
                <SelectItem value="exams">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4" />
                    <span>Exam Approval</span>
                  </div>
                </SelectItem>
                <SelectItem value="courses">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Courses</span>
                  </div>
                </SelectItem>
                
                {/* Community & Communication */}
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 border-b border-slate-600 mt-2">Community & Communication</div>
                <SelectItem value="announcements">
                  <div className="flex items-center space-x-2">
                    <Megaphone className="w-4 h-4" />
                    <span>Announcements</span>
                  </div>
                </SelectItem>
                <SelectItem value="council-notices">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <span>Council Notices</span>
                  </div>
                </SelectItem>
                <SelectItem value="social-feed">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Social Feed</span>
                  </div>
                </SelectItem>
                <SelectItem value="feedback">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>User Feedback</span>
                  </div>
                </SelectItem>
                <SelectItem value="community">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4" />
                    <span>Community</span>
                  </div>
                </SelectItem>
                
                {/* Content & Events */}
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 border-b border-slate-600 mt-2">Content & Events</div>
                <SelectItem value="spotlight">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Spotlight</span>
                  </div>
                </SelectItem>
                <SelectItem value="lore">
                  <div className="flex items-center space-x-2">
                    <ScrollText className="w-4 h-4" />
                    <span>Lore Log</span>
                  </div>
                </SelectItem>
                <SelectItem value="milestones">
                  <div className="flex items-center space-x-2">
                    <Flag className="w-4 h-4" />
                    <span>Milestones</span>
                  </div>
                </SelectItem>
                
                {/* System & Governance */}
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 border-b border-slate-600 mt-2">System & Governance</div>
                <SelectItem value="governance">
                  <div className="flex items-center space-x-2">
                    <Vote className="w-4 h-4" />
                    <span>Governance</span>
                  </div>
                </SelectItem>
                <SelectItem value="settings">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Desktop: Organized Tab Groups */}
          <div className="hidden sm:block space-y-4 mb-6">
            {/* Core Management */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Core Management</h3>
              <div className="flex flex-wrap gap-2">
                <Button
              variant={activeTab === "overview" ? "default" : "outline"}
              onClick={() => setActiveTab("overview")}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
                </Button>
                <Button
                  variant={activeTab === "users" ? "default" : "outline"}
                  onClick={() => {
                    setActiveTab("users");
                    if (counts.newUsers > 0) markAsRead('newUsers');
                  }}
                  className="flex items-center space-x-2 relative"
                >
                  <Users className="w-4 h-4" />
                  <span>Users & XP</span>
                  {counts.newUsers > 0 && (
                    <NotificationBadge count={counts.newUsers} position="top-right" size="sm" />
                  )}
                </Button>
                <Button
                  variant={activeTab === "connected-users" ? "default" : "outline"}
                  onClick={() => setActiveTab("connected-users")}
                  className="flex items-center space-x-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Connected Users</span>
                </Button>
              </div>
            </div>

            {/* Content & Bounties */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Content & Bounties</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeTab === "bounties" ? "default" : "outline"}
                  onClick={() => setActiveTab("bounties")}
                  className="flex items-center space-x-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Bounties</span>
                </Button>
            <Button
              variant={activeTab === "submissions" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("submissions");
                if (counts.newSubmissions > 0) markAsRead('newSubmissions');
              }}
              className="flex items-center space-x-2 relative"
            >
              <FileText className="w-4 h-4" />
              <span>Submissions</span>
              {counts.newSubmissions > 0 && (
                <NotificationBadge count={counts.newSubmissions} position="top-right" size="sm" />
              )}
            </Button>
            <Button
              variant={activeTab === "bounty-xp" ? "default" : "outline"}
              onClick={() => setActiveTab("bounty-xp")}
              className="flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Bounty XP</span>
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("users");
                if (counts.newUsers > 0) markAsRead('newUsers');
              }}
              className="flex items-center space-x-2 relative"
            >
              <Users className="w-4 h-4" />
              <span>Users & XP</span>
              {counts.newUsers > 0 && (
                <NotificationBadge count={counts.newUsers} position="top-right" size="sm" />
              )}
            </Button>
            <Button
              variant={activeTab === "connected-users" ? "default" : "outline"}
              onClick={() => setActiveTab("connected-users")}
              className="flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>Connected Users</span>
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "outline"}
              onClick={() => setActiveTab("settings")}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
            <Button
              variant={activeTab === "council-notices" ? "default" : "outline"}
              onClick={() => setActiveTab("council-notices")}
              className="flex items-center space-x-2"
            >
              <Bell className="w-4 h-4" />
              <span>Council Notices</span>
            </Button>
            <Button
              variant={activeTab === "announcements" ? "default" : "outline"}
              onClick={() => setActiveTab("announcements")}
              className="flex items-center space-x-2"
            >
              <Megaphone className="w-4 h-4" />
              <span>Announcements</span>
            </Button>
            <Button
              variant={activeTab === "spotlight" ? "default" : "outline"}
              onClick={() => setActiveTab("spotlight")}
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Spotlight</span>
            </Button>
            <Button
              variant={activeTab === "feedback" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("feedback");
                if (counts.newFeedback > 0) markAsRead('newFeedback');
              }}
              className="flex items-center space-x-2 relative"
            >
              <MessageSquare className="w-4 h-4" />
              <span>User Feedback</span>
              {counts.newFeedback > 0 && (
                <NotificationBadge count={counts.newFeedback} position="top-right" size="sm" />
              )}
            </Button>
            <Button
              variant={activeTab === "social-feed" ? "default" : "outline"}
              onClick={() => setActiveTab("social-feed")}
              className="flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Social Feed</span>
            </Button>
            <Button
              variant={activeTab === "community" ? "default" : "outline"}
              onClick={() => setActiveTab("community")}
              className="flex items-center space-x-2"
            >
              <Crown className="w-4 h-4" />
              <span>Community</span>
            </Button>
            <Button
              variant={activeTab === "lore" ? "default" : "outline"}
              onClick={() => setActiveTab("lore")}
              className="flex items-center space-x-2"
            >
              <ScrollText className="w-4 h-4" />
              <span>Lore Log</span>
            </Button>
            <Button
              variant={activeTab === "milestones" ? "default" : "outline"}
              onClick={() => setActiveTab("milestones")}
              className="flex items-center space-x-2"
            >
              <Flag className="w-4 h-4" />
              <span>Milestones</span>
            </Button>
            <Button
              variant={activeTab === "mentorship" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("mentorship");
                if (counts.pendingPermissions > 0) markAsRead('pendingPermissions');
              }}
              className="flex items-center space-x-2 relative"
            >
              <Video className="w-4 h-4" />
              <span>Live Sessions</span>
              {counts.pendingPermissions > 0 && (
                <NotificationBadge count={counts.pendingPermissions} position="top-right" size="sm" />
              )}
            </Button>
            <Button
              variant={activeTab === "governance" ? "default" : "outline"}
              onClick={() => setActiveTab("governance")}
              className="flex items-center space-x-2"
            >
              <Vote className="w-4 h-4" />
              <span>Governance</span>
            </Button>
            <Button
              variant={activeTab === "courses" ? "default" : "outline"}
              onClick={() => setActiveTab("courses")}
              className="flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Courses</span>
            </Button>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <AdminOverviewDashboard walletAddress={walletAddress} />
          </TabsContent>

          {/* Bounties Tab */}
          <TabsContent value="bounties">
            <BountyManagerSimple 
              bounties={bounties} 
              onBountiesChange={setBounties}
              walletAddress={walletAddress}
            />
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <SubmissionApproval walletAddress={walletAddress} />
          </TabsContent>

          <TabsContent value="exams">
            <ExamApprovalManager adminWallet={walletAddress || ''} />
          </TabsContent>

          {/* Bounty XP Tab */}
          <TabsContent value="bounty-xp">
            <BountyXPManager walletAddress={walletAddress} />
          </TabsContent>

          {/* Users & XP Management Tab */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Management - 2/3 width */}
              <div className="lg:col-span-2">
                <EnhancedUsersManager 
                  walletAddress={walletAddress}
                  onViewUserSubmissions={(user) => {
                    // Switch to submissions tab and filter by user
                    setActiveTab('submissions');
                    // You could add a filter mechanism here to show only this user's submissions
                    console.log('Viewing submissions for user:', user.displayName);
                  }}
                />
              </div>
              
              {/* XP Management - 1/3 width */}
              <div className="lg:col-span-1">
                <XPManagement walletAddress={walletAddress} />
              </div>
            </div>
          </TabsContent>

          {/* Connected Users Tab */}
          <TabsContent value="connected-users">
            <ConnectedUsersList />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettings walletAddress={walletAddress} />
          </TabsContent>

          {/* Council Notices Tab */}
          <TabsContent value="council-notices">
            <CouncilNoticesManager walletAddress={walletAddress} />
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <AnnouncementsManager walletAddress={walletAddress} />
          </TabsContent>

          {/* Spotlight Tab */}
          <TabsContent value="spotlight">
            <SpotlightManager walletAddress={walletAddress} />
          </TabsContent>

          {/* User Feedback Tab */}
          <TabsContent value="feedback">
            <UserFeedbackManager walletAddress={walletAddress} />
          </TabsContent>

          {/* Social Feed Moderation Tab */}
          <TabsContent value="social-feed">
            <SocialFeedManager adminWallet={walletAddress} />
          </TabsContent>

          {/* Community Management Tab */}
          <TabsContent value="community">
            <CommunityManagement walletAddress={walletAddress} />
          </TabsContent>

          {/* Lore Log Tab */}
          <TabsContent value="lore">
            <LoreLogManager walletAddress={walletAddress} />
          </TabsContent>

          {/* Academy Milestones Tab */}
          <TabsContent value="milestones">
            <AcademyMilestonesManager walletAddress={walletAddress} />
          </TabsContent>

          {/* Mentorship Tab */}
          <TabsContent value="mentorship">
            <MentorshipManager walletAddress={walletAddress} />
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance">
            <GovernanceManager walletAddress={walletAddress} />
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <CourseManagementTab adminWallet={walletAddress} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Main export with wallet and notification provider
export default function AdminDashboardPage() {
  const { wallet: walletAddress, isAdmin, connectWallet, loading: walletLoading } = useWalletSupabase();

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Connecting wallet...</p>
        </div>
      </div>
    );
  }

  if (!walletAddress || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="mb-4 text-slate-300">Please connect your admin wallet</p>
          <Button onClick={connectWallet}>Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider walletAddress={walletAddress} isAdmin={true}>
      <AdminDashboardContent walletAddress={walletAddress} />
    </NotificationProvider>
  );
}
