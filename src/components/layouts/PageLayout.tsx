'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";

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
  profileImage = "🧑‍🎓"
}: PageLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
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
        <div className="flex justify-start gap-3 mb-6">
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {children}
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
