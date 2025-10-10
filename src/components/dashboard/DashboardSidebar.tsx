'use client';

import { useState, useEffect } from 'react';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  Users, 
  Settings, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Video,
  MessageCircle,
  Target,
  Sparkles
} from 'lucide-react';
import { fetchUserByWallet } from '@/lib/supabase';
import { getSquadNameFromCache, fetchUserSquad } from '@/utils/squad-api';
// Use canonical wallet types

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  dynamic?: boolean;
}

interface DashboardSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function DashboardSidebar({ isCollapsed = false, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [squadChatUrl, setSquadChatUrl] = useState<string>('/squads/hoodie-creators/chat');
  const { isAdmin } = useAdminStatus();

  // Helper function to get squad chat URL
  const getSquadChatUrl = (squadName: string): string => {
    if (!squadName) return '/squads/hoodie-creators/chat';
    
    // Map squad names to their URL paths (including emoji variations)
    const squadUrlMapping: { [key: string]: string } = {
      // Full names with emojis (from quiz.json)
      '🎨 Hoodie Creators': 'hoodie-creators',
      '🧠 Hoodie Decoders': 'hoodie-decoders',
      '🎤 Hoodie Speakers': 'hoodie-speakers', 
      '⚔️ Hoodie Raiders': 'hoodie-raiders',
      '🦅 Hoodie Rangers': 'hoodie-rangers',
      '🏦 Treasury Builders': 'treasury-builders',
      // Full names without emojis
      'Hoodie Creators': 'hoodie-creators',
      'Hoodie Decoders': 'hoodie-decoders',
      'Hoodie Speakers': 'hoodie-speakers',
      'Hoodie Raiders': 'hoodie-raiders',
      'Hoodie Rangers': 'hoodie-rangers',
      'Treasury Builders': 'treasury-builders',
      // Lowercase variations
      'hoodie creators': 'hoodie-creators',
      'hoodie decoders': 'hoodie-decoders',
      'hoodie speakers': 'hoodie-speakers',
      'hoodie raiders': 'hoodie-raiders',
      'hoodie rangers': 'hoodie-rangers',
      'treasury builders': 'treasury-builders',
      // Squad IDs (fallback)
      'creators': 'hoodie-creators',
      'decoders': 'hoodie-decoders',
      'speakers': 'hoodie-speakers',
      'raiders': 'hoodie-raiders',
      'rangers': 'hoodie-rangers',
      'treasury': 'treasury-builders'
    };

    // Try exact match first
    if (squadUrlMapping[squadName]) {
      return `/squads/${squadUrlMapping[squadName]}/chat`;
    }

    // Try normalized match (remove emojis and normalize)
    const normalized = squadName.replace(/^[🎨🧠🎤⚔️🦅🏦🔍🗣️]+\s*/, '').toLowerCase().trim();
    if (squadUrlMapping[normalized]) {
      return `/squads/${squadUrlMapping[normalized]}/chat`;
    }

    // Try squad ID match
    const squadMapping: { [key: string]: string } = {
      'hoodie creators': 'creators',
      'hoodie decoders': 'decoders', 
      'hoodie speakers': 'speakers',
      'hoodie raiders': 'raiders',
      'hoodie rangers': 'rangers',
      'treasury builders': 'treasury'
    };
    const squadId = squadMapping[normalized] || normalized;
    if (squadUrlMapping[squadId]) {
      return `/squads/${squadUrlMapping[squadId]}/chat`;
    }

    // Fallback: convert to URL-friendly format
    const urlFriendly = squadName
      .toLowerCase()
      .replace(/[🎨🧠🎤⚔️🦅🏦🔍🗣️]/g, '') // Remove emojis
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special characters
      .trim();
    
    return `/squads/${urlFriendly}/chat`;
  };

  // Load user's squad
  useEffect(() => {
    const loadSquad = async () => {
      // Show cached squad immediately
      const cachedSquad = getSquadNameFromCache();
      if (cachedSquad) {
        setUserSquad(cachedSquad);
        setSquadChatUrl(getSquadChatUrl(cachedSquad));
      }
      
      // Fetch from API for accuracy
      const walletAddress = localStorage.getItem('walletAddress');
      if (walletAddress) {
        const squadData = await fetchUserSquad(walletAddress);
        if (squadData && squadData.hasSquad && squadData.squad) {
          setUserSquad(squadData.squad.name);
          setSquadChatUrl(getSquadChatUrl(squadData.squad.name));
        }
      }
    };
    
    loadSquad();
  }, []);

  // Admin status is now managed by useAdminStatus hook

  const handleToggle = () => {
    setCollapsed(!collapsed);
    onToggle?.();
  };

  // Create sidebar items with dynamic squad chat
const sidebarItems: SidebarItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
    href: '/'
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/dashboard'
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: <BookOpen className="w-5 h-5" />,
    href: '/courses'
  },
  {
    id: 'bounties',
    label: 'Bounties',
    icon: <Target className="w-5 h-5" />,
    href: '/bounties'
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: <Sparkles className="w-5 h-5" />,
    href: '/feedback'
  },
  {
    id: 'squads',
    label: 'My Squad',
    icon: <Trophy className="w-5 h-5" />,
    href: '/choose-your-squad'
  },
    {
      id: 'squad-chat',
      label: userSquad ? `${userSquad} Chat` : 'Squad Chat',
      icon: <MessageCircle className="w-5 h-5" />,
      href: squadChatUrl,
      dynamic: true
    },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/leaderboard'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="w-5 h-5" />,
    href: '/profile'
  },
  {
    id: 'media',
    label: 'My Media',
    icon: <Video className="w-5 h-5" />,
    href: '/media'
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: <Trophy className="w-5 h-5" />,
    href: '/achievements'
  },
  // Always include Admin tab, but access will be restricted
  {
    id: 'admin',
    label: 'Admin',
    icon: <Settings className="w-5 h-5" />,
    href: '/admin-dashboard'
  }
];

  return (
    <div className={`bg-slate-900/80 border-r border-cyan-500/30 backdrop-blur-sm transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } min-h-screen flex flex-col hidden sm:flex`}>
      
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src="/images/hoodie-academy-pixel-art-logo.png"
                  alt="Hoodie Academy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Home className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-bold text-lg">Hoodie Academy</span>
                </div>
                <p className="text-xs text-gray-400">Web3 Learning Center</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-lg flex items-center justify-center overflow-hidden mx-auto">
              <img
                src="/images/hoodie-academy-pixel-art-logo.png"
                alt="Hoodie Academy"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || (item.dynamic && pathname.includes('/squads/') && pathname.includes('/chat'));
          return (
            <Link 
              key={item.id} 
              href={item.href}
            >
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start transition-all duration-200 ${
                  isActive 
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                    : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                } ${collapsed ? 'px-2' : 'px-4'}`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </div>
                {item.badge && !collapsed && (
                  <div className="ml-auto bg-pink-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {item.badge}
                  </div>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-cyan-500/20">
        {!collapsed && (
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-2">Current Time</div>
            <div className="text-sm text-cyan-400 font-mono">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 