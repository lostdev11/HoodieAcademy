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
import { fetchUserByWallet } from '@/lib/supabase';
import SquadFilter from '@/components/SquadFilter';
import { MobileNavigation } from '@/components/dashboard/MobileNavigation';
import { SyllabusPanel } from '@/components/SyllabusPanel';
import { getVisibleCourses, type Course, initializeCourses } from '@/lib/coursesData';
import PageLayout from "@/components/layouts/PageLayout";
import { CardFeedLayout, CardFeedItem, CardFeedSection, CardFeedGrid, InfoCard, ActionCard } from "@/components/layouts/CardFeedLayout";
import { coursePageNavigation } from "@/components/layouts/NavigationDrawer";

// Get visible courses dynamically instead of at import time
const getCourses = (isAdmin: boolean = false) => {
  // Always initialize courses from storage to get latest admin changes
  initializeCourses(isAdmin);
  return getVisibleCourses(isAdmin);
};

type FilterType = 'all' | 'squads' | 'completed' | 'collab';

export default function CoursesPageClient() {
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

  // Add state to force re-renders when courses change
  const [coursesVersion, setCoursesVersion] = useState(0);
  const [userDisplayName, setUserDisplayName] = useState<string>("");

  // Initialize courses from localStorage on mount
  useEffect(() => {
    // Force initialization of courses from localStorage
    initializeCourses(isAdmin);
    if (isAdmin) {
      console.log('Courses initialized from localStorage');
    }

    // Listen for course visibility changes from admin
    const handleCoursesVisibilityChanged = () => {
      console.log('Courses visibility changed, refreshing courses...');
      setCoursesVersion(prev => prev + 1);
    };

    window.addEventListener('coursesVisibilityChanged', handleCoursesVisibilityChanged);
    
    return () => {
      window.removeEventListener('coursesVisibilityChanged', handleCoursesVisibilityChanged);
    };
  }, [isAdmin]);

  // Clean up corrupted squad data in localStorage
  useEffect(() => {
    const savedSquad = localStorage.getItem('userSquad');
    if (savedSquad) {
      try {
        const parsedSquad = JSON.parse(savedSquad);
        if (parsedSquad && typeof parsedSquad === 'object' && parsedSquad.name) {
          // If it's a full squad object, clean it up
          if (isAdmin) {
            console.log('Found corrupted squad data:', parsedSquad);
          }
          const squadId = parsedSquad.name || parsedSquad.id || savedSquad;
          setUserSquad(squadId);
          // Clean up localStorage to only store the squad ID/name
          localStorage.setItem('userSquad', squadId);
          if (isAdmin) {
            console.log('Cleaned up squad data in localStorage:', squadId);
          }
        } else {
          if (isAdmin) {
            console.log('Found valid squad data:', savedSquad);
          }
          setUserSquad(savedSquad);
        }
      } catch (error) {
        if (isAdmin) {
          console.log('Error parsing squad data, using as-is:', savedSquad);
        }
        setUserSquad(savedSquad);
      }
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
          const { getDisplayNameWithSNS } = await import('@/services/sns-resolver');
          const resolvedName = await getDisplayNameWithSNS(storedWallet);
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
    const courses = getCourses(isAdmin);
    
    if (activeFilter === 'squads') {
      if (selectedSquad === 'All') {
        return courses.filter(course => course.squad);
      } else {
        return courses.filter(course => 
          course.squad && course.squad.toLowerCase().includes(selectedSquad.toLowerCase())
        );
      }
    } else if (activeFilter === 'completed') {
      return courses.filter(course => courseCompletionStatus[course.id]?.completed);
    } else if (activeFilter === 'collab') {
      // Filter for courses that might be collaborative based on squad or category
      return courses.filter(course => 
        course.squad === 'Rangers' || 
        course.category === 'collaborative' ||
        course.pathType === 'converged'
      );
    }
    
    return courses;
  };

  // Get completed courses count
  const completedCoursesCount = Object.values(courseCompletionStatus).filter(status => status.completed).length;

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
        // navigationSections={coursePageNavigation}
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
              onClick={() => setCoursesVersion(prev => prev + 1)}
              className="text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${coursesVersion > 0 ? 'animate-spin' : ''}`} />
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
                    <span className={`w-2 h-2 rounded-full ${course.isVisible ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className={`w-2 h-2 rounded-full ${course.isPublished ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
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
                {course.isGated ? (
                  <GatedCourseCard
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    badge={course.badge}
                    emoji={course.emoji}
                    pathType={course.pathType}
                    squad={course.squad}
                    level={course.level}
                    access={course.access}
                  />
                ) : (
                  <CourseCard
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    badge={course.badge}
                    emoji={course.emoji}
                    pathType={course.pathType}
                    href={course.href}
                    localStorageKey={course.localStorageKey}
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