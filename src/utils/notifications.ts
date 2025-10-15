/**
 * Notification Utilities
 * 
 * Helper functions for working with notifications
 */

export interface NotificationItem {
  id: string;
  type: 'announcement' | 'event' | 'bounty' | 'course' | 'submission' | 'feedback' | 'permission';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  link?: string;
}

/**
 * Get the localStorage key for notification timestamps
 */
export function getNotificationKey(walletAddress: string, type: string): string {
  return `notification_seen_${walletAddress}_${type}`;
}

/**
 * Mark a notification type as seen
 */
export function markNotificationAsSeen(walletAddress: string, type: string): void {
  if (typeof window === 'undefined') return;
  const key = getNotificationKey(walletAddress, type);
  localStorage.setItem(key, new Date().toISOString());
}

/**
 * Get the last seen timestamp for a notification type
 */
export function getLastSeenTimestamp(walletAddress: string, type: string): Date | null {
  if (typeof window === 'undefined') return null;
  const key = getNotificationKey(walletAddress, type);
  const timestamp = localStorage.getItem(key);
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Clear all notification timestamps for a user
 */
export function clearAllNotificationTimestamps(walletAddress: string): void {
  if (typeof window === 'undefined') return;
  
  const types = [
    'announcement',
    'event',
    'bounty',
    'course',
    'submission',
    'feedback',
    'permission'
  ];
  
  types.forEach(type => {
    const key = getNotificationKey(walletAddress, type);
    localStorage.removeItem(key);
  });
}

/**
 * Format notification count for display
 */
export function formatNotificationCount(count: number): string {
  if (count === 0) return '';
  if (count > 99) return '99+';
  return count.toString();
}

/**
 * Get notification color by type
 */
export function getNotificationColor(type: NotificationItem['type']): string {
  const colors = {
    announcement: 'bg-blue-500',
    event: 'bg-purple-500',
    bounty: 'bg-yellow-500',
    course: 'bg-green-500',
    submission: 'bg-orange-500',
    feedback: 'bg-pink-500',
    permission: 'bg-red-500'
  };
  return colors[type] || 'bg-gray-500';
}

/**
 * Get notification icon by type
 */
export function getNotificationIcon(type: NotificationItem['type']): string {
  const icons = {
    announcement: '📢',
    event: '📅',
    bounty: '💰',
    course: '📚',
    submission: '📝',
    feedback: '💬',
    permission: '✋'
  };
  return icons[type] || '🔔';
}

/**
 * Sort notifications by date (newest first)
 */
export function sortNotifications(notifications: NotificationItem[]): NotificationItem[] {
  return [...notifications].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Filter unread notifications
 */
export function filterUnread(notifications: NotificationItem[]): NotificationItem[] {
  return notifications.filter(n => !n.read);
}

/**
 * Group notifications by date
 */
export function groupNotificationsByDate(notifications: NotificationItem[]): Record<string, NotificationItem[]> {
  const groups: Record<string, NotificationItem[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  notifications.forEach(notification => {
    const date = new Date(notification.created_at);
    
    if (date >= today) {
      groups.today.push(notification);
    } else if (date >= yesterday) {
      groups.yesterday.push(notification);
    } else if (date >= weekAgo) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
}

/**
 * Calculate total notification count
 */
export function getTotalCount(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

/**
 * Format time ago string
 */
export function getTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

/**
 * Debounce function for notification fetching
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Create a notification sound (optional feature)
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  
  // Check if sound is enabled
  const soundEnabled = localStorage.getItem('notification_sound_enabled') !== 'false';
  if (!soundEnabled) return;

  // Play a simple beep using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
}

/**
 * Toggle notification sound setting
 */
export function toggleNotificationSound(): boolean {
  if (typeof window === 'undefined') return false;
  
  const currentSetting = localStorage.getItem('notification_sound_enabled') !== 'false';
  const newSetting = !currentSetting;
  localStorage.setItem('notification_sound_enabled', newSetting.toString());
  return newSetting;
}

/**
 * Get notification sound setting
 */
export function isNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('notification_sound_enabled') !== 'false';
}

