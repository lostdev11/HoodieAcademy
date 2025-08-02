'use client';

import { useState } from 'react';
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
  Menu,
  X,
  BarChart3,
  Video,
  MessageCircle,
  Target
} from 'lucide-react';
import { fetchUserByWallet } from '@/lib/supabase';

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  dynamic?: boolean;
}

interface MobileNavigationProps {
  userSquad?: string | null;
  isAdmin?: boolean;
}

export function MobileNavigation({ userSquad, isAdmin }: MobileNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
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

  // Update squad chat URL when userSquad changes
  if (userSquad && squadChatUrl !== getSquadChatUrl(userSquad)) {
    setSquadChatUrl(getSquadChatUrl(userSquad));
  }

  // Create navigation items with dynamic squad chat
  const navItems: MobileNavItem[] = [
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
    // Only include Admin tab if isAdmin is true
    ...(isAdmin ? [{
      id: 'admin',
      label: 'Admin',
      icon: <Settings className="w-5 h-5" />,
      href: '/admin'
    }] : [])
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-2"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Navigation Panel */}
          <div className="absolute top-0 left-0 w-80 h-full bg-slate-900/95 border-r border-cyan-500/30 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-cyan-500/20">
              <div className="flex items-center justify-between">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.dynamic && pathname.includes('/squads/') && pathname.includes('/chat'));
                return (
                  <Link key={item.id} href={item.href} onClick={() => setIsOpen(false)}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`w-full justify-start transition-all duration-200 ${
                        isActive 
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                          : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                      } px-4 min-h-[44px]`}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
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
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-2">Current Time</div>
                <div className="text-sm text-cyan-400 font-mono">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 