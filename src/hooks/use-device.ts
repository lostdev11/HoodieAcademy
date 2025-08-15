'use client';
import { useEffect, useMemo, useState } from 'react';

export function useDevice() {
  const [ua, setUa] = useState<string>('');
  const [hasPhantom, setHasPhantom] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setUa(navigator.userAgent || '');
    setHasPhantom(!!window.solana?.isPhantom);
  }, []);

  const isMobile = useMemo(
    () => /Android|iPhone|iPad|iPod|Mobile/i.test(ua),
    [ua]
  );

  // Phantom's in-app browser sets "Phantom" in UA
  const isPhantomInApp = useMemo(() => /Phantom/i.test(ua), [ua]);

  return {
    isMobile,
    isDesktop: !isMobile,
    hasPhantom,
    isPhantomInApp,
  };
}
