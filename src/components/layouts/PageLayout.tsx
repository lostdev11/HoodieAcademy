'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ArrowLeft, Menu, X, BookOpen, Trophy, Users, Settings, User, BarChart3, Video, MessageCircle, ChevronRight } from "lucide-react";
import Image from "next/image";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavigationDrawer, academyNavigationSections } from "./NavigationDrawer";

interface NavigationSection {
  id: string;
  title: string;
  icon?: any;
  items: {
    id: string;
    label: string;
    icon?: any;
    href: string;
    description?: string;
    isNew?: boolean;
  }[];
}

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  backHref?: string;
  backgroundImage?: string;
  backgroundOverlay?: boolean;
  profileImage?: string;
  navigationSections?: NavigationSection[];
  showNavigationDrawer?: boolean;
  navigationDrawerTitle?: string;
  navigationDrawerSubtitle?: string;
}

export default function PageLayout({ 
  children, 
  title,
  subtitle,
  showHomeButton = true,
  showBackButton = false,
  backHref = "/dashboard",
  backgroundImage = "/images/hoodie-dashboard.png",
  backgroundOverlay = true,
  profileImage = "🧑‍🎓",
  navigationSections = academyNavigationSections,
  showNavigationDrawer = true,
  navigationDrawerTitle = "Quick Navigation",
  navigationDrawerSubtitle = "Navigate through the academy"
}: PageLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNavigationDrawerOpen, setIsNavigationDrawerOpen] = useState(false);

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  const toggleNavigationDrawer = () => setIsNavigationDrawerOpen(!isNavigationDrawerOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 overflow-x-hidden">
      {/* Background image */}
      {backgroundImage && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={backgroundImage}
            alt="Page Background"
            fill
            priority
            className="object-cover"
          />
          {backgroundOverlay && (
            <>
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
            </>
          )}
        </div>
      )}

      {/* Mobile Header */}
      <MobileHeader 
        onOpenSidebar={openMobileSidebar}
        title={title}
        showHomeButton={showHomeButton}
        profileImage={profileImage}
      />

      {/* Desktop Header */}
      {(title || subtitle) && (
        <div className="hidden lg:block bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              {title && (
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-gray-300 text-sm sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation Buttons */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            {showHomeButton && (
              <Button
                asChild
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300"
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>
            )}
            
            {showBackButton && (
              <Button
                asChild
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-blue-400 hover:text-blue-300 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300"
              >
                <Link href={backHref}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            )}
          </div>

          {/* Navigation Drawer Toggle */}
          {showNavigationDrawer && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleNavigationDrawer}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-purple-400 hover:text-purple-300 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
            >
              <Menu className="w-4 h-4 mr-2" />
              {isNavigationDrawerOpen ? 'Hide' : 'Show'} Navigation
            </Button>
          )}
        </div>
      </div>

      {/* Main Content with Vertical Card Feed Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Vertical Card Feed Container */}
            <div className="space-y-6">
              {children}
            </div>
          </div>

          {/* Desktop Navigation Drawer - Temporarily disabled for build */}
          {showNavigationDrawer && (
            <div className={`hidden lg:block w-80 transition-all duration-300 ${isNavigationDrawerOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
              <div className="p-4 bg-slate-800 rounded-lg">
                <h3 className="text-white font-semibold">{navigationDrawerTitle || 'Navigation'}</h3>
                <p className="text-gray-400 text-sm">{navigationDrawerSubtitle || 'Navigate through the site'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
        profileImage={profileImage}
      />
    </div>
  );
}
