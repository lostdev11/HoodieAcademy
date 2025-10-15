'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface NotificationCounts {
  // Admin notifications
  newSubmissions: number;
  newFeedback: number;
  pendingMentorships: number;
  newUsers: number;
  pendingPermissions: number;
  
  // User notifications
  newAnnouncements: number;
  newEvents: number;
  newBounties: number;
  newCourses: number;
  unreadMessages: number;
}

interface NotificationContextType {
  counts: NotificationCounts;
  refreshCounts: () => Promise<void>;
  markAsRead: (type: keyof NotificationCounts) => void;
  clearAll: () => void;
  getTotalCount: () => number;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultCounts: NotificationCounts = {
  newSubmissions: 0,
  newFeedback: 0,
  pendingMentorships: 0,
  newUsers: 0,
  pendingPermissions: 0,
  newAnnouncements: 0,
  newEvents: 0,
  newBounties: 0,
  newCourses: 0,
  unreadMessages: 0,
};

export function NotificationProvider({ 
  children,
  walletAddress,
  isAdmin = false
}: { 
  children: React.ReactNode;
  walletAddress?: string;
  isAdmin?: boolean;
}) {
  const [counts, setCounts] = useState<NotificationCounts>(defaultCounts);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Fetch notification counts from API
  const refreshCounts = useCallback(async () => {
    if (!walletAddress) {
      setCounts(defaultCounts);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications/counts?wallet=${walletAddress}&is_admin=${isAdmin}`);
      if (response.ok) {
        const data = await response.json();
        setCounts(data.counts || defaultCounts);
        setLastFetch(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch notification counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isAdmin]);

  // Mark a notification type as read
  const markAsRead = useCallback((type: keyof NotificationCounts) => {
    setCounts(prev => ({
      ...prev,
      [type]: 0
    }));

    // Store in localStorage for persistence
    if (typeof window !== 'undefined' && walletAddress) {
      const key = `notifications_${walletAddress}_${type}`;
      localStorage.setItem(key, new Date().toISOString());
    }
  }, [walletAddress]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setCounts(defaultCounts);
    
    // Clear localStorage
    if (typeof window !== 'undefined' && walletAddress) {
      Object.keys(defaultCounts).forEach(type => {
        const key = `notifications_${walletAddress}_${type}`;
        localStorage.setItem(key, new Date().toISOString());
      });
    }
  }, [walletAddress]);

  // Get total notification count
  const getTotalCount = useCallback(() => {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }, [counts]);

  // Initial fetch
  useEffect(() => {
    if (walletAddress) {
      refreshCounts();
    }
  }, [walletAddress, refreshCounts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(() => {
      refreshCounts();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [walletAddress, refreshCounts]);

  const value: NotificationContextType = {
    counts,
    refreshCounts,
    markAsRead,
    clearAll,
    getTotalCount,
    isLoading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use notifications
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

