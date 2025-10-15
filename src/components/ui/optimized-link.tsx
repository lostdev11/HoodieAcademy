'use client';

import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { AnchorHTMLAttributes, forwardRef, MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>,
    LinkProps {
  /**
   * Whether to prefetch on hover (default: true)
   */
  prefetchOnHover?: boolean;
  
  /**
   * Custom prefetch delay in ms (default: 0)
   */
  prefetchDelay?: number;
}

/**
 * Optimized Link component with hover prefetching for faster navigation
 * 
 * @example
 * <OptimizedLink href="/courses" prefetchOnHover>
 *   View Courses
 * </OptimizedLink>
 */
export const OptimizedLink = forwardRef<HTMLAnchorElement, OptimizedLinkProps>(
  ({ 
    href, 
    prefetchOnHover = true, 
    prefetchDelay = 0,
    onMouseEnter,
    className,
    children,
    ...props 
  }, ref) => {
    const router = useRouter();

    const handleMouseEnter = (e: MouseEvent<HTMLAnchorElement>) => {
      if (prefetchOnHover && typeof href === 'string') {
        if (prefetchDelay > 0) {
          setTimeout(() => {
            router.prefetch(href);
          }, prefetchDelay);
        } else {
          router.prefetch(href);
        }
      }
      
      onMouseEnter?.(e);
    };

    return (
      <Link
        ref={ref}
        href={href}
        onMouseEnter={handleMouseEnter}
        className={cn(className)}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

OptimizedLink.displayName = 'OptimizedLink';

