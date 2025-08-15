'use client';
import { useDevice } from '@/hooks/use-device';
import { usePhantom } from '@/hooks/use-phantom';
import { useMemo } from 'react';

function phantomBrowseUrl(currentHref: string) {
  return `https://phantom.app/ul/browse?url=${encodeURIComponent(currentHref)}`;
}

export default function SmartConnect() {
  const { isMobile, isDesktop, hasPhantom, isPhantomInApp } = useDevice();
  const { address, connecting, connect, disconnect, isReady } = usePhantom();

  const currentHref = typeof window !== 'undefined' ? window.location.href : '';
  const openInPhantomUrl = useMemo(() => phantomBrowseUrl(currentHref), [currentHref]);

  // ✅ Flow A: Inside Phantom in-app browser (mobile)
  if (isMobile && isPhantomInApp) {
    if (!isReady) {
      return <button className="btn w-full" disabled>Loading Phantom…</button>;
    }
    return address ? (
      <button className="btn w-full" onClick={disconnect}>
        Disconnect {address.slice(0,4)}…{address.slice(-4)}
      </button>
    ) : (
      <button className="btn w-full" onClick={connect} disabled={connecting}>
        {connecting ? 'Connecting…' : 'Connect Phantom'}
      </button>
    );
  }

  // ✅ Flow B: Mobile browser NOT inside Phantom → deep link into Phantom
  if (isMobile && !isPhantomInApp) {
    return (
      <a className="btn w-full" href={openInPhantomUrl}>
        Open in Phantom
      </a>
    );
  }

  // ✅ Flow C: Desktop
  if (isDesktop) {
    if (hasPhantom && isReady) {
      return address ? (
        <button className="btn" onClick={disconnect}>
          Disconnect {address.slice(0,4)}…{address.slice(-4)}
        </button>
      ) : (
        <button className="btn" onClick={connect} disabled={connecting}>
          {connecting ? 'Connecting…' : 'Connect Phantom'}
        </button>
      );
    }
    // No Phantom extension
    return (
      <a
        className="btn"
        href="https://phantom.app/download"
        target="_blank"
        rel="noreferrer"
      >
        Install Phantom
      </a>
    );
  }

  return null;
}
