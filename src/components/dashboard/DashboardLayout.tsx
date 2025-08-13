'use client';

import Image from "next/image";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function DashboardLayout({ 
  children, 
  sidebarCollapsed = false, 
  onToggleSidebar 
}: DashboardLayoutProps) {
  return (
    <div className="relative min-h-screen flex">
      {/* Sidebar */}
      <aside className="z-20">
        <DashboardSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={onToggleSidebar} 
        />
      </aside>

      {/* Main content */}
      <main className="relative flex-1 p-4 md:p-8">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hoodie-dashboard.png"
            alt="Hoodie Academy Lounge"
            fill
            priority
            className="object-cover"
          />
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        </div>

        {children}
      </main>
    </div>
  );
}
