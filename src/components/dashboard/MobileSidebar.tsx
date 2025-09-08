'use client';

import { useState, useEffect } from 'react';
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
  X,
  BarChart3,
  Video,
  MessageCircle,
  Menu
} from 'lucide-react';
import { fetchUserByWallet } from '@/lib/supabase';
import { getSquadName } from '@/utils/squad-storage';
// Use canonical wallet types

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  dynamic?: boolean;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profileImage?: string;
}

export function MobileSidebar({ isOpen, onClose, profileImage = "🧑‍🎓" }: MobileSidebarProps) {
  const pathname = usePathname();
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [squadChatUrl, setSquadChatUrl] = useState<string>('/squads/hoodie-creators/chat');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string>("Hoodie Scholar");
  const [userProfileImage, setUserProfileImage] = useState<string>(profileImage);
  const [currentTime, setCurrentTime] = useState<string>("");

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

  // Load user's squad and display name
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load squad data using utility
        const userSquadName = getSquadName();
        if (userSquadName) {
          setUserSquad(userSquadName);
          setSquadChatUrl(getSquadChatUrl(userSquadName));
        }

        // Load user display name and SNS domain
        const savedDisplayName = localStorage.getItem('userDisplayName');
        if (savedDisplayName) {
          setUserDisplayName(savedDisplayName);
        } else {
          // Try to resolve SNS domain if no display name is set
          const storedWallet = localStorage.getItem('walletAddress');
          if (storedWallet) {
            try {
              // const { getDisplayNameWithSNS } = await import('@/services/sns-resolver');
              // const resolvedName = await getDisplayNameWithSNS(storedWallet);
              const resolvedName = storedWallet;
              console.log('MobileSidebar: Resolved SNS name:', resolvedName);
              setUserDisplayName(resolvedName);
            } catch (error) {
              console.error('MobileSidebar: Error resolving SNS domain:', error);
              // Fallback to default name
              setUserDisplayName('Hoodie Scholar');
            }
          }
        }

        // Load saved profile image
        const savedProfileImage = localStorage.getItem('userProfileImage');
        if (savedProfileImage) {
          setUserProfileImage(savedProfileImage);
        }
      } catch (error) {
        console.error('MobileSidebar: Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const checkAdmin = () => {
      try {
        const adminStatus = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
        setIsAdmin(adminStatus);
        if (adminStatus) {
          console.log('✅ MobileSidebar: Admin status: true');
        } else {
          console.log('✅ MobileSidebar: Admin status: false');
        }
      } catch (err) {
        setIsAdmin(false);
        console.error('💥 MobileSidebar: Failed to check admin:', err);
      }
    };
    checkAdmin();
  }, []);

  // Update current time
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

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
      id: 'squad-chat',
      label: userSquad ? `${userSquad.replace(/^[🎨🧠🎤⚔️🦅🏦]+\s*/, '')} Chat` : 'Squad Chat',
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
      href: '/admin-dashboard'
    }] : [])
  ];

  // Handle navigation and close sidebar
  const handleNavigation = (href: string) => {
    onClose();
    // Small delay to allow the close animation to start
    setTimeout(() => {
      window.location.href = href;
    }, 100);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-slate-900/95 border-r border-cyan-500/30 
        backdrop-blur-md z-50 transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src="/images/hoodie-academy-pixel-art-logo.png"
                  alt="Hoodie Academy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Home className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-bold text-xl">Hoodie Academy</span>
                </div>
                <p className="text-sm text-gray-400">Web3 Learning Center</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          {/* Profile Section */}
          <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-lg flex items-center justify-center text-xl">
              {userProfileImage}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{userDisplayName}</p>
              <p className="text-xs text-gray-400">Web3 Student</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-6 space-y-3">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.dynamic && pathname.includes('/squads/') && pathname.includes('/chat'));
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start h-12 transition-all duration-200 ${
                  isActive 
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                    : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                }`}
                onClick={() => handleNavigation(item.href)}
              >
                <div className="flex items-center space-x-4">
                  {item.icon}
                  <span className="font-medium text-base">{item.label}</span>
                </div>
                {item.badge && (
                  <div className="ml-auto bg-pink-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {item.badge}
                  </div>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-cyan-500/20">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Current Time</div>
            <div className="text-lg text-cyan-400 font-mono">
              {currentTime}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
