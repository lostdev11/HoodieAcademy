import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { LeaderboardService } from "@/services/leaderboard-service"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Leaderboard integration utilities
export const leaderboardService = LeaderboardService.getInstance();

// Initialize user in leaderboard system
export const initializeUserInLeaderboard = (walletAddress: string, displayName: string, squad?: string) => {
  leaderboardService.initializeUser(walletAddress, displayName, squad);
};

// Update score when lesson is completed
export const updateScoreForLessonCompletion = (walletAddress: string, courseId: string, lessonIndex: number, totalLessons: number) => {
  leaderboardService.updateUserScore(walletAddress, {
    lessonCompleted: true
  });
  
  // Update course progress
  const progress = Math.round(((lessonIndex + 1) / totalLessons) * 100);
  const isCompleted = progress === 100;
  
  leaderboardService.updateProgress({
    walletAddress,
    courseId,
    progress,
    score: 0, // Will be updated when quiz is completed
    completed: isCompleted,
    lessonsCompleted: lessonIndex + 1,
    totalLessons,
    quizzesPassed: 0,
    totalQuizzes: 0
  });
};

// Update score when quiz is completed
export const updateScoreForQuizCompletion = (walletAddress: string, courseId: string, quizScore: number, totalQuestions: number, lessonsCompleted: number, totalLessons: number) => {
  const percentage = Math.round((quizScore / totalQuestions) * 100);
  
  leaderboardService.updateUserScore(walletAddress, {
    quizScore: percentage
  });
  
  // Update course progress
  const progress = Math.round((lessonsCompleted / totalLessons) * 100);
  const isCompleted = progress === 100;
  
  leaderboardService.updateProgress({
    walletAddress,
    courseId,
    progress,
    score: percentage,
    completed: isCompleted,
    lessonsCompleted,
    totalLessons,
    quizzesPassed: 1,
    totalQuizzes: 1
  });
};

// Update score when course is completed
export const updateScoreForCourseCompletion = (walletAddress: string, courseId: string, finalScore: number) => {
  leaderboardService.updateUserScore(walletAddress, {
    courseCompleted: true
  });
  
  leaderboardService.updateProgress({
    walletAddress,
    courseId,
    progress: 100,
    score: finalScore,
    completed: true,
    lessonsCompleted: 0, // Will be calculated from course data
    totalLessons: 0,
    quizzesPassed: 0,
    totalQuizzes: 0
  });
};

// Update score when badge is earned
export const updateScoreForBadgeEarned = (walletAddress: string) => {
  leaderboardService.updateUserScore(walletAddress, {
    badgeEarned: true
  });
};

// Get user's current rank
export const getUserRank = (walletAddress: string): number => {
  return leaderboardService.getUserRank(walletAddress);
};

// Get user's current score
export const getUserScore = (walletAddress: string): number => {
  return leaderboardService.getUserScore(walletAddress);
};

// Admin password - in production, this would be stored securely and hashed
export const ADMIN_PASSWORD = "darkhoodie2024";

// Demo wallet that should NOT have admin access (for live data testing)
export const DEMO_WALLET = "JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU";

// Check if a password is correct for admin access
export function isAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

// Check if current user is admin (using session storage)
export function isCurrentUserAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  
  const adminSession = sessionStorage.getItem('adminAuthenticated');
  const connectedWallet = getConnectedWallet();
  
  // If user is using demo wallet, they should NOT have admin access
  if (connectedWallet && connectedWallet.toLowerCase() === DEMO_WALLET.toLowerCase()) {
    return false;
  }
  
  return adminSession === 'true';
}

// Set admin authentication in session
export function setAdminAuthenticated(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  
  const connectedWallet = getConnectedWallet();
  
  // Prevent demo wallet from getting admin access
  if (connectedWallet && connectedWallet.toLowerCase() === DEMO_WALLET.toLowerCase()) {
    console.log('Demo wallet detected - admin access denied for live data testing');
    return;
  }
  
  if (authenticated) {
    sessionStorage.setItem('adminAuthenticated', 'true');
  } else {
    sessionStorage.removeItem('adminAuthenticated');
  }
}

// Force remove admin access for demo wallet
export function removeDemoWalletAdminAccess(): void {
  if (typeof window === 'undefined') return;
  
  const connectedWallet = getConnectedWallet();
  if (connectedWallet && connectedWallet.toLowerCase() === DEMO_WALLET.toLowerCase()) {
    sessionStorage.removeItem('adminAuthenticated');
    console.log('Admin access removed for demo wallet');
  }
}

// Get connected wallet address from localStorage (for other features)
export function getConnectedWallet(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('walletAddress') || localStorage.getItem('connectedWallet');
}

// Safe localStorage utility to prevent SSR errors
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

// Events and Announcements utilities
export const EVENTS_KEY = 'events';
export const ANNOUNCEMENTS_KEY = 'announcements';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: 'class' | 'event' | 'workshop' | 'meetup';
  location?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'important';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

// Get all events
export const getEvents = (): Event[] => {
  try {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
};

// Get upcoming events (within next 30 days)
export const getUpcomingEvents = (): Event[] => {
  const events = getEvents();
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate <= thirtyDaysFromNow;
  });
};

// Get all announcements
export const getAnnouncements = (): Announcement[] => {
  try {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(ANNOUNCEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading announcements:', error);
    return [];
  }
};

// Get active announcements
export const getActiveAnnouncements = (): Announcement[] => {
  const announcements = getAnnouncements();
  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // Get today's date as YYYY-MM-DD
  
  return announcements.filter((announcement) => {
    if (!announcement.isActive) return false;
    
    // Compare dates as strings to avoid timezone issues
    const startDateString = announcement.startDate;
    if (startDateString > todayString) return false;
    
    if (announcement.endDate) {
      const endDateString = announcement.endDate;
      return endDateString >= todayString;
    }
    return true;
  });
};

// Get scheduled (future) announcements
export const getScheduledAnnouncements = (): Announcement[] => {
  const announcements = getAnnouncements();
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  return announcements.filter((announcement) => {
    if (!announcement.isActive) return false;
    
    const startDateString = announcement.startDate;
    return startDateString > todayString; // Future start date
  });
};

// Get all active announcements (current + scheduled) for admin view
export const getAllActiveAnnouncements = (): Announcement[] => {
  const announcements = getAnnouncements();
  return announcements.filter((announcement) => announcement.isActive);
};

// Save events
export const saveEvents = (events: Event[]): void => {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('eventsUpdated', { detail: events }));
  } catch (error) {
    console.error('Error saving events:', error);
  }
};

// Save announcements
export const saveAnnouncements = (announcements: Announcement[]): void => {
  try {
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    // Dispatch custom event for real-time updates
    const event = new CustomEvent('announcementsUpdated', { detail: announcements });
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Error saving announcements:', error);
  }
};

// Add event
export const addEvent = (event: Event): void => {
  const events = getEvents();
  events.push(event);
  saveEvents(events);
};

// Update event
export const updateEvent = (eventId: string, updatedEvent: Event): void => {
  const events = getEvents();
  const updatedEvents = events.map(e => e.id === eventId ? updatedEvent : e);
  saveEvents(updatedEvents);
};

// Delete event
export const deleteEvent = (eventId: string): void => {
  const events = getEvents();
  const updatedEvents = events.filter(e => e.id !== eventId);
  saveEvents(updatedEvents);
};

// Add announcement
export const addAnnouncement = (announcement: Announcement): void => {
  const announcements = getAnnouncements();
  announcements.push(announcement);
  saveAnnouncements(announcements);
};

// Update announcement
export const updateAnnouncement = (announcementId: string, updatedAnnouncement: Announcement): void => {
  const announcements = getAnnouncements();
  const updatedAnnouncements = announcements.map(a => a.id === announcementId ? updatedAnnouncement : a);
  saveAnnouncements(updatedAnnouncements);
};

// Delete announcement
export const deleteAnnouncement = (announcementId: string): void => {
  const announcements = getAnnouncements();
  const updatedAnnouncements = announcements.filter(a => a.id !== announcementId);
  saveAnnouncements(updatedAnnouncements);
};

// Toggle announcement active status
export const toggleAnnouncementActive = (announcementId: string): void => {
  const announcements = getAnnouncements();
  const updatedAnnouncements = announcements.map(a => 
    a.id === announcementId ? { ...a, isActive: !a.isActive } : a
  );
  saveAnnouncements(updatedAnnouncements);
};

// Debug function to help troubleshoot announcement issues
export const debugAnnouncements = (): void => {
  if (typeof window === 'undefined') return;
  
  const allAnnouncements = getAnnouncements();
  const activeAnnouncements = getActiveAnnouncements();
  const today = new Date().toISOString().split('T')[0];
  
  console.log('=== Announcement Debug Info ===');
  console.log('Today (YYYY-MM-DD):', today);
  console.log('All announcements:', allAnnouncements);
  console.log('Active announcements:', activeAnnouncements);
  console.log('localStorage announcements key:', localStorage.getItem(ANNOUNCEMENTS_KEY));
  console.log('================================');
};

// Hook for real-time updates (can be used in components)
export const useEventsAndAnnouncementsUpdates = (callback: () => void) => {
  if (typeof window !== 'undefined') {
    const handleUpdate = () => callback();
    window.addEventListener('eventsUpdated', handleUpdate);
    window.addEventListener('announcementsUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('eventsUpdated', handleUpdate);
      window.removeEventListener('announcementsUpdated', handleUpdate);
    };
  }
};
