'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { logPageView } from '@/lib/tracking/client';
import { UsePageViewOptions } from '@/types/tracking';

/**
 * Hook for tracking page views
 * Automatically logs page view events when the pathname changes
 */
export function usePageView(options: UsePageViewOptions = {}) {
  const { sessionId, debounceMs = 1000 } = options;
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip initial load
    if (previousPathname.current === null) {
      previousPathname.current = pathname;
      return;
    }

    // Skip if pathname hasn't changed
    if (previousPathname.current === pathname) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce page view logging
    timeoutRef.current = setTimeout(async () => {
      const referrer = previousPathname.current || undefined;
      
      const result = await logPageView(pathname, referrer, sessionId || undefined);
      if (!result.success) {
        console.error('Failed to log page view:', result.error);
      }

      previousPathname.current = pathname;
    }, debounceMs);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, sessionId, debounceMs]);
}