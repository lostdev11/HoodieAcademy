'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  Video, 
  ChevronLeft, 
  ChevronRight,
  Home,
  BookOpen,
  Trophy,
  TrendingUp,
  Shield
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

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
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: '/dashboard'
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: <BookOpen className="w-5 h-5" />,
    href: '/courses'
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: <TrendingUp className="w-5 h-5" />,
    href: '/leaderboard'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <Calendar className="w-5 h-5" />,
    href: '/calendar'
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
  {
    id: 'admin',
    label: 'Admin',
    icon: <Shield className="w-5 h-5" />,
    href: '/admin'
  }
];

interface DashboardSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function DashboardSidebar({ isCollapsed = false, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(isCollapsed);

  const handleToggle = () => {
    setCollapsed(!collapsed);
    onToggle?.();
  };

  return (
    <div className={`bg-slate-900/80 border-r border-cyan-500/30 backdrop-blur-sm transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } min-h-screen flex flex-col`}>
      
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
          const isActive = pathname === item.href;
          return (
            <Link key={item.id} href={item.href}>
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