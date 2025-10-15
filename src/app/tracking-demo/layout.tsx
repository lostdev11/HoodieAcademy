'use client';

import { ReactNode } from 'react';
import { TrackingProvider } from '@/components/TrackingProvider';

export default function TrackingDemoLayout({ children }: { children: ReactNode }) {
  return (
    <TrackingProvider>
      {children}
    </TrackingProvider>
  );
}

