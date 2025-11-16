'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  LayoutDashboard,
  GraduationCap,
  Target,
  MessageSquare,
  Trophy,
  Image,
  Award,
  User,
  Shield,
  Menu,
  Sparkles,
  Video,
  Vote,
  Info
} from 'lucide-react';
import { getSquadNameFromCache, fetchUserSquad } from '@/utils/squad-api';

interface NavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
}

interface NavigationGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  primaryHref: string; // Main destination for the button
  items: NavigationItem[];
  badge?: string | number;
}

const navigationGroups: NavigationGroup[] = [
  {
    key: 'main',
    label: 'Main',
    icon: <Home className="h-4 w-4" />,
    primaryHref: '/',
    items: [
      { key: 'home', label: 'Home', icon: <Home className="h-4 w-4" />, href: '/' },
      { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, href: '/dashboard' },
      { key: 'about', label: 'About', icon: <Info className="h-4 w-4" />, href: '/about' },
      { key: 'courses', label: 'Courses', icon: <GraduationCap className="h-4 w-4" />, href: '/courses' },
      { key: 'bounties', label: 'Bounties', icon: <Target className="h-4 w-4" />, href: '/bounties' },
      { key: 'mentorship', label: 'Live Sessions', icon: <Video className="h-4 w-4" />, href: '/mentorship' },
      { key: 'governance', label: 'Governance', icon: <Vote className="h-4 w-4" />, href: '/governance' },
      { key: 'feedback', label: 'Feedback', icon: <Sparkles className="h-4 w-4" />, href: '/feedback' },
      { key: 'my-squad', label: 'My Squad', icon: <Trophy className="h-4 w-4" />, href: 'https://hoodieacademy.com/choose-your-squad' },
    ]
  },
  {
    key: 'squad',
    label: 'Squad',
    icon: <MessageSquare className="h-4 w-4" />,
    primaryHref: '/hoodie-squad-track',
    items: [
      { key: 'squad-track', label: 'Squad Track', icon: <MessageSquare className="h-4 w-4" />, href: '/hoodie-squad-track' },
      { key: 'squad-chat', label: 'Squad Chat', icon: <MessageSquare className="h-4 w-4" />, href: '/squads/hoodie-creators/chat' },
    ]
  },
  {
    key: 'social',
    label: 'Social',
    icon: <Trophy className="h-4 w-4" />,
    primaryHref: '/social',
    items: [
      { key: 'social-feed', label: 'Social Feed', icon: <MessageSquare className="h-4 w-4" />, href: '/social' },
      { key: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="h-4 w-4" />, href: '/leaderboard' },
      { key: 'media', label: 'My Media', icon: <Image className="h-4 w-4" />, href: '/media' },
      { key: 'achievements', label: 'Achievements', icon: <Award className="h-4 w-4" />, href: '/achievements' },
    ]
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: <User className="h-4 w-4" />,
    primaryHref: '/profile',
    items: [
      { key: 'profile', label: 'Profile', icon: <User className="h-4 w-4" />, href: '/profile' },
    ]
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: <Shield className="h-4 w-4" />,
    primaryHref: '/admin-dashboard',
    items: [
      { key: 'admin', label: 'Admin', icon: <Shield className="h-4 w-4" />, href: '/admin-dashboard' },
    ]
  }
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [squadChatUrl, setSquadChatUrl] = useState<string>('/squads/hoodie-creators/chat');

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

  // Load user's squad and generate squad chat URL
  useEffect(() => {
    const loadUserSquad = async () => {
      try {
        // Get wallet address
        const walletAddress = localStorage.getItem('hoodie_academy_wallet') || 
                             localStorage.getItem('walletAddress') || 
                             localStorage.getItem('connectedWallet');
        
        if (!walletAddress) {
          return;
        }

        // Try to get squad from cache first
        let userSquadName = getSquadNameFromCache();
        
        // If not in cache, fetch from database
        if (!userSquadName) {
          const squadData = await fetchUserSquad(walletAddress);
          if (squadData?.hasSquad && squadData?.squad?.name) {
            userSquadName = squadData.squad.name;
          }
        }

        // Update squad chat URL if we have a squad
        if (userSquadName) {
          const newSquadChatUrl = getSquadChatUrl(userSquadName);
          setSquadChatUrl(newSquadChatUrl);
        }
      } catch (error) {
        console.error('Error loading user squad:', error);
      }
    };

    loadUserSquad();
    
    // Set up interval to check for squad updates
    const interval = setInterval(loadUserSquad, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Check admin status on mount using hardcoded list
  useEffect(() => {
    const checkAdmin = () => {
      try {
        // Get connected wallet address
        const walletAddress = localStorage.getItem('hoodie_academy_wallet') || 
                             localStorage.getItem('walletAddress') || 
                             localStorage.getItem('connectedWallet');
        
        // Hardcoded admin wallets
        const adminWallets = [
          'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
          'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
          '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
          '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
        ];
        
        if (walletAddress) {
          const isAdminWallet = adminWallets.includes(walletAddress);
          setIsAdmin(isAdminWallet);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
    
    // Set up interval to check for wallet connections
    const interval = setInterval(checkAdmin, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getPathFromHref = (href: string) => {
    if (!href) return href;
    if (href.startsWith('http')) {
      try {
        return new URL(href).pathname;
      } catch {
        return href;
      }
    }
    return href;
  };

  const isActiveRoute = (href: string) => {
    const comparableHref = getPathFromHref(href);
    if (comparableHref === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(comparableHref);
  };

  const getActiveGroup = () => {
    for (const group of navigationGroups) {
      if (group.items.some(item => isActiveRoute(item.href))) {
        return group.key;
      }
    }
    return null;
  };

  const currentActiveGroup = getActiveGroup();

  // Create navigation groups with dynamic squad chat URL
  const navigationGroupsWithDynamicUrl = navigationGroups.map(group => {
    if (group.key === 'squad') {
      return {
        ...group,
        items: group.items.map(item => {
          if (item.key === 'squad-chat') {
            return {
              ...item,
              href: squadChatUrl
            };
          }
          return item;
        })
      };
    }
    return group;
  });

  // Always show all navigation groups, but admin access will be restricted
  const filteredNavigationGroups = navigationGroupsWithDynamicUrl;

  const handleMainButtonClick = (group: NavigationGroup) => {
    // Check if trying to access admin without permissions
    if (group.key === 'admin' && !isAdmin) {
      alert('Admin access required. Please contact an administrator.');
      return;
    }
    
    // Navigate to the primary destination
    router.push(group.primaryHref);
    // Close any open dropdown
    setActiveGroup(null);
  };

  const handleDropdownToggle = (groupKey: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation when toggling dropdown
    setActiveGroup(activeGroup === groupKey ? null : groupKey);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50">
        <div className="flex items-center justify-around px-2 py-2">
          {filteredNavigationGroups.map((group) => {
            const isActive = currentActiveGroup === group.key;
            const hasActiveItem = group.items.some(item => isActiveRoute(item.href));
            
            return (
              <div key={group.key} className="relative">
                                 <Button
                   variant={isActive ? "default" : "ghost"}
                   size="sm"
                   className={`flex flex-col items-center gap-1 h-16 px-2 ${
                     isActive 
                       ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                       : hasActiveItem 
                         ? 'text-blue-400 hover:text-blue-300' 
                         : group.key === 'admin' && !isAdmin
                           ? 'text-slate-500 cursor-not-allowed opacity-50'
                           : 'text-slate-400 hover:text-slate-300'
                   }`}
                   onClick={() => handleMainButtonClick(group)}
                 >
                  {group.icon}
                  <span className="text-xs font-medium">{group.label}</span>
                  {group.badge && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs">
                      {group.badge}
                    </Badge>
                  )}
                </Button>

                {/* Dropdown Toggle Button (smaller, positioned on the right) */}
                {group.items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-6 w-6 p-0 bg-slate-700/50 hover:bg-slate-600/50"
                    onClick={(e) => handleDropdownToggle(group.key, e)}
                    aria-label={`Toggle ${group.label} menu`}
                  >
                    <Menu className="h-3 w-3" />
                  </Button>
                )}

                {/* Dropdown Menu */}
                {activeGroup === group.key && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl min-w-[200px]">
                    <div className="p-2 space-y-1">
                      {group.items.map((item) => {
                        const isActive = isActiveRoute(item.href);
                        return (
                          <Link
                            key={item.key}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                            onClick={() => setActiveGroup(null)}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Spacer to prevent content from being hidden behind the navigation */}
      <div className="h-20" />
    </>
  );
}
