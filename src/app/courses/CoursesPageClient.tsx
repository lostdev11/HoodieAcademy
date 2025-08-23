'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ArrowDown, ArrowRight, LockKeyhole, CheckCircle, LineChart, Clock, Filter, Shield, RefreshCw, Info } from "lucide-react";
import { MilestoneBadge } from "@/components/course-roadmap/MilestoneBadge";
import { RiskArt } from "@/components/course-roadmap/RiskArt";
import { HoodieIcon } from "@/components/icons/HoodieIcon";
import type { CourseCardProps } from "@/components/course-roadmap/CourseCard";
import { CourseCard } from "@/components/course-roadmap/CourseCard";
import { GatedCourseCard } from "@/components/course-roadmap/GatedCourseCard";
import { PixelHoodieIcon } from "@/components/icons/PixelHoodieIcon";
import { SaberHoodieIcon } from "@/components/icons/SaberHoodieIcon";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { GlowingCoinIcon } from "@/components/icons/GlowingCoinIcon";
import TokenGate from "@/components/TokenGate";
import { Card, CardContent } from "@/components/ui/card";
import { squadTracks, getSquadForCourse, getCoursesForSquad } from '@/lib/squadData';
import { isCurrentUserAdmin, getConnectedWallet, getCompletedCoursesCount } from '@/lib/utils';
import { storeSquad } from '@/utils/squad-storage';
import { fetchUserByWallet } from '@/lib/supabase';
import SquadFilter from '@/components/SquadFilter';
import { MobileNavigation } from '@/components/dashboard/MobileNavigation';
import { SyllabusPanel } from '@/components/SyllabusPanel';
import PageLayout from "@/components/layouts/PageLayout";
import { CardFeedLayout, CardFeedItem, CardFeedSection, CardFeedGrid, InfoCard, ActionCard } from "@/components/layouts/CardFeedLayout";
import { coursePageNavigation } from "@/components/layouts/NavigationDrawer";
import { getSupabaseBrowser } from '@/lib/supabaseClient';

interface Course {
  id: string;
  title: string;
  emoji: string;
  squad: string;
  level: string;
  access: string;
  description: string;
  totalLessons: number;
  category: string;
  created_at: string;
  updated_at: string;
  is_visible: boolean;
  is_published: boolean;
}

type FilterType = 'all' | 'squads' | 'completed' | 'collab';

interface CoursesPageClientProps {
  initialCourses?: Course[];
}

export default function CoursesPageClient({ initialCourses = [] }: CoursesPageClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedSquad, setSelectedSquad] = useState<string>('All');
  const [courseCompletionStatus, setCourseCompletionStatus] = useState<Record<string, { completed: boolean, progress: number }>>({});
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [syllabusPanel, setSyllabusPanel] = useState<{
    isOpen: boolean;
    data: any;
    courseTitle: string | null;
  }>({
    isOpen: false,
    data: null,
    courseTitle: null
  });

  // Course state with realtime updates
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const supabase = getSupabaseBrowser();

  // Initialize courses from Supabase with realtime updates
  useEffect(() => {
    // Set initial courses
    setCourses(initialCourses);

    // Subscribe to realtime changes
    const channel = supabase
      .channel('courses-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'courses' 
      }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const newCourse = payload.new as Course;
          if (newCourse.is_visible && newCourse.is_published) {
            setCourses(prev => [newCourse, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedCourse = payload.new as Course;
          setCourses(prev => 
            prev.map(course => 
              course.id === updatedCourse.id ? updatedCourse : course
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedCourse = payload.old as Course;
          setCourses(prev => 
            prev.filter(course => course.id !== deletedCourse.id)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, initialCourses]);

  // Load user's squad using utility
  useEffect(() => {
    const savedSquad = getSquadName();
    if (savedSquad) {
      if (isAdmin) {
        console.log('Found squad data:', savedSquad);
      }
      setUserSquad(savedSquad);
    }
  }, [isAdmin]);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isCurrentUserAdmin();
        setIsAdmin(adminStatus);
        if (adminStatus) {
          console.log('✅ User is admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  // Load user display name and SNS domain
  useEffect(() => {
    const loadUserDisplayName = async () => {
      try {
        // Check if user has a custom display name set
        const customDisplayName = localStorage.getItem('userDisplayName');
        if (customDisplayName) {
          setUserDisplayName(customDisplayName);
          return;
        }

        // Try to resolve SNS domain for the wallet
        const storedWallet = localStorage.getItem('walletAddress');
        if (storedWallet) {
          const resolvedName = storedWallet;
          console.log('Courses: Resolved SNS name:', resolvedName);
          setUserDisplayName(resolvedName);
        }
      } catch (error) {
        console.error('Courses: Error resolving SNS domain:', error);
        // Fallback to default name
        setUserDisplayName('Hoodie Scholar');
      }
    };

    loadUserDisplayName();
  }, []);

  // Update current time
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get filtered courses based on current filter and squad selection
  const getFilteredCourses = () => {
    // Filter courses based on visibility and published status
    const visibleCourses = courses.filter(course => 
      course.is_visible && course.is_published
    );
    
    if (activeFilter === 'squads') {
      if (selectedSquad === 'All') {
        return visibleCourses.filter(course => course.squad);
      } else {
        return visibleCourses.filter(course => 
          course.squad && course.squad.toLowerCase().includes(selectedSquad.toLowerCase())
        );
      }
    } else if (activeFilter === 'completed') {
      return visibleCourses.filter(course => courseCompletionStatus[course.id]?.completed);
    } else if (activeFilter === 'collab') {
      // Filter for courses that might be collaborative based on squad or category
      return visibleCourses.filter(course => 
        course.squad === 'Rangers' || 
        course.category === 'collaborative'
      );
    }
    
    return visibleCourses;
  };

  // Get completed courses count
  const completedCoursesCount = Object.values(courseCompletionStatus).filter(status => status.completed).length;

  // Helper function to get squad name (you may need to implement this)
  const getSquadName = () => {
    // Implementation depends on your squad storage system
    return localStorage.getItem('userSquad');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-cyan-400 text-2xl animate-pulse">Loading courses...</span>
      </div>
    );
  }

  return (
    <TokenGate>
      <PageLayout
        title="📚 Academy Courses"
        subtitle="Master Web3, NFTs, and crypto trading with our comprehensive course library"
        showHomeButton={true}
        showBackButton={true}
        backHref="/dashboard"
        backgroundImage={undefined}
        backgroundOverlay={false}
        navigationDrawerTitle="Course Navigation"
        navigationDrawerSubtitle="Navigate through your learning journey"
      >
        {/* Current Time Display */}
        <CardFeedItem
          title="Current Time"
          subtitle="Real-time clock for your learning sessions"
          badge={currentTime}
          badgeVariant="outline"
        >
          <div className="text-center">
            <div className="text-3xl font-mono text-cyan-400 mb-2">
              {currentTime}
            </div>
            <p className="text-sm text-gray-400">
              Keep track of your study time and maintain consistent learning habits
            </p>
          </div>
        </CardFeedItem>

        {/* Squad Assignment Notice */}
        {userSquad && (
          <InfoCard
            title="Your Squad Assignment"
            icon="🎯"
            variant="success"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {(() => {
                  const squadData = squadTracks.find(s => 
                    s.name === userSquad || s.id === userSquad
                  );
                  return squadData?.icon || '🎯';
                })()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Your Squad: {(() => {
                    const squadData = squadTracks.find(s => 
                      s.name === userSquad || s.id === userSquad
                    );
                    return squadData?.name || userSquad;
                  })()}
                </h3>
                <p className="text-gray-300">
                  {(() => {
                    const squadData = squadTracks.find(s => 
                      s.name === userSquad || s.id === userSquad
                    );
                    return squadData?.description || '';
                  })()}
                </p>
              </div>
            </div>
            {/* Debug info for admins */}
            {isAdmin && (
              <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-cyan-500/30">
                <p className="text-cyan-400 text-sm font-semibold mb-2">Debug: Squad Data</p>
                <div className="text-xs text-gray-400">
                  userSquad = "{userSquad}" (type: {typeof userSquad})
                </div>
                <Button
                  onClick={() => {
                    if (window.confirm('Clear and fix squad data in localStorage?')) {
                      localStorage.removeItem('userSquad');
                      setUserSquad(null);
                      console.log('Squad data cleared from localStorage');
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                >
                  Clear Squad Data
                </Button>
              </div>
            )}
          </InfoCard>
        )}

        {/* No Squad Notice */}
        {!userSquad && !isAdmin && (
          <InfoCard
            title="Squad Assignment Required"
            icon="⚠️"
            variant="warning"
          >
            <div className="text-center">
              <p className="text-orange-400 font-semibold mb-2">Complete onboarding to access squad-specific courses</p>
              <p className="text-gray-300 text-sm">Join a squad to unlock specialized content and community features</p>
            </div>
          </InfoCard>
        )}

        {/* Filter Controls */}
        <ActionCard
          title="Course Filters"
          subtitle="Filter courses by type, squad, or completion status"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          }
        >
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4">
            <Button
              onClick={() => setActiveFilter('all')}
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white w-full sm:w-auto min-h-[44px]"
            >
              <Filter className="w-4 h-4 mr-2" />
              All Courses
            </Button>
            <Button
              onClick={() => setActiveFilter('squads')}
              variant={activeFilter === 'squads' ? 'default' : 'outline'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white w-full sm:w-auto min-h-[44px]"
            >
              <HoodieIcon className="w-4 h-4 mr-2" />
              Squad Courses
            </Button>
            <Button
              onClick={() => setActiveFilter('completed')}
              variant={activeFilter === 'completed' ? 'default' : 'outline'}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white w-full sm:w-auto min-h-[44px]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed ({completedCoursesCount})
            </Button>
          </div>
        </ActionCard>

        {/* Squad Filter */}
        <CardFeedItem
          title="Squad Selection"
          subtitle="Filter courses by specific squad or view all"
        >
          <div className="flex justify-center">
            <SquadFilter
              onChange={setSelectedSquad}
              selectedSquad={selectedSquad}
            />
          </div>
        </CardFeedItem>

        {/* Course Grid */}
        <CardFeedSection
          title="Available Courses"
          subtitle={`${getFilteredCourses().length} courses available for your learning journey`}
        >
          {/* Debug info for admins */}
          {isAdmin && (
            <InfoCard
              title="Debug: Courses Display"
              icon="🔍"
              variant="default"
            >
              <div className="text-xs text-gray-400">
                {getFilteredCourses().map(course => (
                  <div key={course.id} className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${course.is_visible ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className={`w-2 h-2 rounded-full ${course.is_published ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
                    <span>{course.title}</span>
                    <span className="text-gray-500">({course.id})</span>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}
          
          <CardFeedGrid cols={3}>
            {getFilteredCourses().map((course) => (
              <div key={course.id} className="h-full">
                {course.access === 'gated' ? (
                  <GatedCourseCard
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    badge={course.level}
                    emoji={course.emoji}
                    pathType="tech"
                    squad={course.squad}
                    level={course.level}
                    access={course.access}
                  />
                ) : (
                  <CourseCard
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    badge={course.level}
                    emoji={course.emoji}
                    pathType="tech"
                    href={`/courses/${course.id}`}
                    totalLessons={course.totalLessons}
                    onOpenSyllabus={(courseId, courseTitle) => {
                      setSyllabusPanel({
                        isOpen: true,
                        data: { courseId, courseTitle },
                        courseTitle: courseTitle
                      });
                    }}
                  />
                )}
              </div>
            ))}
          </CardFeedGrid>
        </CardFeedSection>

        {/* Syllabus Panel */}
        <SyllabusPanel
          isOpen={syllabusPanel.isOpen}
          onClose={() => setSyllabusPanel({ isOpen: false, data: null, courseTitle: null })}
          data={syllabusPanel.data}
          courseTitle={syllabusPanel.courseTitle}
        />
      </PageLayout>
    </TokenGate>
  );
} 