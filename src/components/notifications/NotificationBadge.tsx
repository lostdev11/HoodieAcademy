'use client';

import { motion } from 'framer-motion';

interface NotificationBadgeProps {
  count?: number;
  showDot?: boolean;
  position?: 'top-right' | 'top-left' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export function NotificationBadge({ 
  count = 0, 
  showDot = true,
  position = 'top-right',
  size = 'md',
  pulse = true
}: NotificationBadgeProps) {
  // Don't render if no notifications
  if (count === 0 && !showDot) return null;

  const sizeClasses = {
    sm: 'w-2 h-2 text-[8px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  const positionClasses = {
    'top-right': 'absolute -top-1 -right-1',
    'top-left': 'absolute -top-1 -left-1',
    'inline': 'relative'
  };

  // Just a dot
  if (showDot && count === 0) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`
          ${sizeClasses[size]}
          ${positionClasses[position]}
          bg-red-500 rounded-full
          ${pulse ? 'animate-pulse' : ''}
          shadow-lg shadow-red-500/50
        `}
      />
    );
  }

  // Dot with count
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`
        ${sizeClasses[size]}
        ${positionClasses[position]}
        bg-gradient-to-br from-red-500 to-red-600
        rounded-full
        flex items-center justify-center
        text-white font-bold
        ${pulse ? 'animate-pulse' : ''}
        shadow-lg shadow-red-500/50
        border-2 border-white dark:border-slate-900
        z-10
      `}
    >
      {count > 99 ? '99+' : count > 0 ? count : ''}
    </motion.div>
  );
}

// Wrapper component for navigation items
export function NotificationWrapper({ 
  children, 
  count = 0,
  showDot = false 
}: { 
  children: React.ReactNode;
  count?: number;
  showDot?: boolean;
}) {
  return (
    <div className="relative inline-block">
      {children}
      {(count > 0 || showDot) && (
        <NotificationBadge count={count} showDot={showDot} />
      )}
    </div>
  );
}

