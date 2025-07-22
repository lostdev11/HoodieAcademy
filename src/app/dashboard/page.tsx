"use client";

import { useState, useEffect } from "react";
import TokenGate from "@/components/TokenGate";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Play, BookOpen, AlertCircle, Bell, Clock } from "lucide-react";
import GlobalBulletinBoard from "@/components/GlobalBulletinBoard";

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [profileImage, setProfileImage] = useState<string>("🧑‍🎓");
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedCoursesCount, setCompletedCoursesCount] = useState(0);
  const [totalCoursesCount, setTotalCoursesCount] = useState(6);
  const [squadId, setSquadId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Example: fetch live data here if needed
  useEffect(() => {
    // TODO: Fetch real user data, progress, squad, etc. from Supabase if needed
    // setProfileImage(...)
    // setOverallProgress(...)
    // setCompletedCoursesCount(...)
    // setTotalCoursesCount(...)
    // setSquadId(...)
  }, []);

  return (
    <TokenGate>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Sidebar */}
        <DashboardSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-800/50 border-b border-cyan-500/30 p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-cyan-500/30 shadow-lg flex items-center justify-center bg-gradient-to-br from-cyan-400 to-pink-400">
                    <span className="text-lg sm:text-xl">{profileImage}</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400">Dashboard</h1>
                  <p className="text-gray-300 text-sm sm:text-base">Welcome back, Hoodie Scholar!</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-sm text-gray-400">Current Time</div>
                <div className="text-lg text-cyan-400 font-mono">{currentTime}</div>
              </div>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            {/* Progress Overview */}
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400">Overall Academy Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-purple-400">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-3 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-cyan-400">{completedCoursesCount}</p>
                      <p className="text-sm text-gray-400">Courses Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">15</p>
                      <p className="text-sm text-gray-400">Lessons Finished</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">8</p>
                      <p className="text-sm text-gray-400">Quizzes Passed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-pink-400">5</p>
                      <p className="text-sm text-gray-400">NFT Badges</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Bulletin Board */}
            <Card className="bg-slate-800/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Global Bulletin Board</span>
                  {squadId && (
                    <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                      {squadId}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GlobalBulletinBoard squadId={squadId} />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </TokenGate>
  );
} 