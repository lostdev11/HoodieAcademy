'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  /**
   * Animation variant (default: 'fade')
   */
  variant?: 'fade' | 'slide' | 'scale' | 'slideUp';
  /**
   * Animation duration in seconds (default: 0.3)
   */
  duration?: number;
  /**
   * Custom className
   */
  className?: string;
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  },
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  },
};

/**
 * Smooth page transition wrapper using Framer Motion
 * 
 * @example
 * <PageTransition variant="slideUp">
 *   <YourPageContent />
 * </PageTransition>
 */
export function PageTransition({
  children,
  variant = 'fade',
  duration = 0.3,
  className,
}: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[variant]}
      transition={{ duration, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger children animation for lists
 */
export function StaggerChildren({ 
  children, 
  className,
  staggerDelay = 0.1 
}: { 
  children: ReactNode; 
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual stagger item
 */
export function StaggerItem({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: {
            duration: 0.4,
            ease: 'easeOut',
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade in when element enters viewport
 */
export function FadeInWhenVisible({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

