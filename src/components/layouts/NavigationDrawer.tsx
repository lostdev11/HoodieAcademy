'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  ChevronDown, 
  Home, 
  BookOpen, 
  Trophy, 
  Users, 
  Settings, 
  User, 
  BarChart3, 
  Video, 
  MessageCircle,
  Star,
  Target,
  Zap,
  Shield,
  Globe,
  Heart,
  TrendingUp,
  Calendar,
  Award,
  Lightbulb,
  Bookmark,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowUp,
  ArrowRight,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isCurrentUserAdmin } from "@/lib/utils";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number | string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: NavigationItem[];
  description?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isComingSoon?: boolean;
  adminOnly?: boolean; // New property to mark admin-only items
}

interface NavigationSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  adminOnly?: boolean; // New property to mark admin-only sections
}

interface NavigationDrawerProps {
  sections: NavigationSection[];
  title?: string;
  subtitle?: string;
  className?: string;
  showSearch?: boolean;
  onItemClick?: (item: NavigationItem) => void;
}

export function NavigationDrawer({ 
  sections, 
  title = "Quick Navigation", 
  subtitle = "Navigate through the academy",
  className,
  showSearch = false,
  onItemClick
}: NavigationDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.filter(s => s.defaultExpanded).map(s => s.id))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status on mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Get connected wallet address
        const walletAddress = localStorage.getItem('walletAddress') || localStorage.getItem('connectedWallet');
        
        if (walletAddress) {
          // Import here to avoid circular dependencies
          const { fetchUserByWallet } = await import('@/lib/supabase');
          const user = await fetchUserByWallet(walletAddress);
          const adminStatus = user?.is_admin === true;
          
          // Only update and log if status changed
          if (adminStatus !== isAdmin) {
            setIsAdmin(adminStatus);
            console.log('✅ NavigationDrawer: Admin status changed to:', adminStatus);
          }
        } else {
          if (isAdmin !== false) {
            setIsAdmin(false);
            console.log('✅ NavigationDrawer: No wallet connected');
          }
        }
      } catch (error) {
        if (isAdmin !== false) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
    };
    
    // Check immediately
    checkAdmin();
    
    // Set up interval to check for wallet connections (less frequent)
    const interval = setInterval(checkAdmin, 10000); // Changed from 2000ms to 10000ms
    
    return () => clearInterval(interval);
  }, [isAdmin]); // Add isAdmin as dependency to track changes

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Filter sections and items based on admin status and search query
  const filteredSections = sections
    .filter(section => {
      // Hide admin-only sections for non-admin users
      if (section.adminOnly && !isAdmin) return false;
      return true;
    })
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Hide admin-only items for non-admin users
        if (item.adminOnly && !isAdmin) return false;
        
        // Filter by search query
        if (searchQuery) {
          return item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
    }))
    .filter(section => section.items.length > 0);

  const handleItemClick = (item: NavigationItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <Card className={cn("bg-slate-800/50 backdrop-blur-sm border-slate-700/50 sticky top-6", className)}>
      <CardHeader className="border-b border-slate-700/50 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-xl text-cyan-400">
            {title}
          </CardTitle>
        </div>
        {subtitle && (
          <p className="text-sm text-gray-400">
            {subtitle}
          </p>
        )}
        
        {showSearch && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4">
        <nav className="space-y-4">
          {filteredSections.map((section) => (
            <div key={section.id} className="space-y-2">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {section.icon && (
                    <span className="text-purple-400">
                      {section.icon}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                    {section.title}
                  </h3>
                  {section.adminOnly && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-purple-500 text-purple-400">
                      ADMIN
                    </Badge>
                  )}
                </div>
                {section.collapsible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(section.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* Section Items */}
              {(section.collapsible ? expandedSections.has(section.id) : true) && (
                <div className="space-y-1 ml-4">
                  {section.items.map((item) => (
                    <div key={item.id} className="relative">
                      <Link
                        href={item.href}
                        onClick={() => handleItemClick(item)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all duration-200 group",
                          "hover:bg-slate-700/50 hover:border-slate-600/50",
                          "border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-cyan-400 group-hover:text-cyan-300 transition-colors flex-shrink-0">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white group-hover:text-cyan-100 transition-colors font-medium truncate">
                                {item.label}
                              </span>
                              {item.isNew && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  NEW
                                </Badge>
                              )}
                              {item.isFeatured && (
                                <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500">
                                  <Star className="w-3 h-3 mr-1" />
                                  FEATURED
                                </Badge>
                              )}
                              {item.isComingSoon && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-gray-500 text-gray-400">
                                  COMING SOON
                                </Badge>
                              )}
                              {item.adminOnly && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-purple-500 text-purple-400">
                                  ADMIN
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-400 truncate mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.badge && (
                            <Badge 
                              variant={item.badgeVariant || 'default'} 
                              className="text-xs px-2 py-1 min-w-[20px] text-center"
                            >
                              {item.badge}
                            </Badge>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                        </div>
                      </Link>

                      {/* Nested Children */}
                      {item.children && item.children.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.id}
                              href={child.href}
                              onClick={() => handleItemClick(child)}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-all duration-200 group"
                            >
                              <div className="text-slate-400 group-hover:text-cyan-300 transition-colors">
                                {child.icon}
                              </div>
                              <span className="text-slate-300 group-hover:text-cyan-100 transition-colors text-sm">
                                {child.label}
                              </span>
                              {child.badge && (
                                <Badge 
                                  variant={child.badgeVariant || 'default'} 
                                  className="ml-auto text-xs px-1.5 py-0.5 min-w-[16px] text-center"
                                >
                                  {child.badge}
                                </Badge>
                              )}
                              {child.adminOnly && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-purple-500 text-purple-400 ml-2">
                                  ADMIN
                                </Badge>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}

// Predefined navigation sections for common academy pages
export const academyNavigationSections: NavigationSection[] = [
  {
    id: 'main',
    title: 'Main Navigation',
    icon: <Home className="w-4 h-4" />,
    items: [
      {
        id: 'home',
        label: 'Home',
        icon: <Home className="w-4 h-4" />,
        href: '/',
        description: 'Return to the main academy page'
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <BarChart3 className="w-4 h-4" />,
        href: '/dashboard',
        description: 'View your progress and stats'
      }
    ]
  },
  {
    id: 'learning',
    title: 'Learning',
    icon: <BookOpen className="w-4 h-4" />,
    items: [
      {
        id: 'courses',
        label: 'All Courses',
        icon: <BookOpen className="w-4 h-4" />,
        href: '/courses',
        description: 'Browse all available courses',
        isFeatured: true
      },
      {
        id: 'tracks',
        label: 'Learning Tracks',
        icon: <Target className="w-4 h-4" />,
        href: '/tracks',
        description: 'Follow structured learning paths'
      },
      {
        id: 'achievements',
        label: 'Achievements',
        icon: <Award className="w-4 h-4" />,
        href: '/achievements',
        description: 'View your earned badges and rewards'
      }
    ]
  },
  {
    id: 'community',
    title: 'Community',
    icon: <Users className="w-4 h-4" />,
    items: [
      {
        id: 'squads',
        label: 'Squads',
        icon: <Users className="w-4 h-4" />,
        href: '/squads',
        description: 'Join and interact with your squad'
      },
      {
        id: 'leaderboard',
        label: 'Leaderboard',
        icon: <Trophy className="w-4 h-4" />,
        href: '/leaderboard',
        description: 'See top performers and rankings'
      },
      {
        id: 'bounties',
        label: 'Bounties',
        icon: <Zap className="w-4 h-4" />,
        href: '/bounties',
        description: 'Complete tasks and earn rewards'
      }
    ]
  },
  {
    id: 'tools',
    title: 'Tools & Resources',
    icon: <Settings className="w-4 h-4" />,
    items: [
      {
        id: 'media',
        label: 'My Media',
        icon: <Video className="w-4 h-4" />,
        href: '/media',
        description: 'Manage your uploaded content'
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: <User className="w-4 h-4" />,
        href: '/profile',
        description: 'Customize your profile and settings'
      }
    ]
  },
  {
    id: 'admin',
    title: 'Admin Tools',
    icon: <Shield className="w-4 h-4" />,
    adminOnly: true,
    items: [
      {
        id: 'admin-dashboard',
        label: 'Admin Dashboard',
        icon: <BarChart3 className="w-4 h-4" />,
        href: '/admin-dashboard',
        description: 'Manage academy settings and users',
        adminOnly: true
      },
      {
        id: 'user-management',
        label: 'User Management',
        icon: <Users className="w-4 h-4" />,
        href: '/admin/users',
        description: 'View and manage user accounts',
        adminOnly: true
      },
      {
        id: 'course-management',
        label: 'Course Management',
        icon: <BookOpen className="w-4 h-4" />,
        href: '/admin/courses',
        description: 'Manage course visibility and content',
        adminOnly: true
      },
      {
        id: 'placement-progress',
        label: 'Placement Progress',
        icon: <Target className="w-4 h-4" />,
        href: '/admin/placement-progress',
        description: 'Monitor student placement progress',
        adminOnly: true
      }
    ]
  }
];

// Specialized navigation for specific page types
export const coursePageNavigation: NavigationSection[] = [
  {
    id: 'course-progress',
    title: 'Course Progress',
    icon: <CheckCircle className="w-4 h-4" />,
    items: [
      {
        id: 'current-lesson',
        label: 'Current Lesson',
        icon: <BookOpen className="w-4 h-4" />,
        href: '#',
        description: 'Continue where you left off',
        isNew: true
      },
      {
        id: 'completed-lessons',
        label: 'Completed',
        icon: <CheckCircle className="w-4 h-4" />,
        href: '#',
        description: 'Review completed content'
      }
    ]
  },
  {
    id: 'related-courses',
    title: 'Related Courses',
    icon: <Lightbulb className="w-4 h-4" />,
    items: [
      {
        id: 'prerequisites',
        label: 'Prerequisites',
        icon: <ArrowUp className="w-4 h-4" />,
        href: '#',
        description: 'Courses you should complete first'
      },
      {
        id: 'next-steps',
        label: 'Next Steps',
        icon: <ArrowRight className="w-4 h-4" />,
        href: '#',
        description: 'Continue your learning journey'
      }
    ]
  }
];

export const dashboardNavigation: NavigationSection[] = [
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    icon: <Zap className="w-4 h-4" />,
    items: [
      {
        id: 'resume-course',
        label: 'Resume Course',
        icon: <Play className="w-4 h-4" />,
        href: '#',
        description: 'Continue your current course',
        isFeatured: true
      },
      {
        id: 'take-quiz',
        label: 'Take Quiz',
        icon: <Target className="w-4 h-4" />,
        href: '#',
        description: 'Test your knowledge'
      }
    ]
  },
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    icon: <Clock className="w-4 h-4" />,
    items: [
      {
        id: 'last-visited',
        label: 'Last Visited',
        icon: <Bookmark className="w-4 h-4" />,
        href: '#',
        description: 'Return to where you left off'
      }
    ]
  }
];
