'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PhantomProvider } from '@/types/phantom';
import { PublicKey } from '@solana/web3.js';

export function usePhantom() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const providerRef = useRef<PhantomProvider | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = window.solana;
    if (p?.isPhantom) providerRef.current = p;

    // silent reconnect if already trusted (works nicely in Phantom mobile)
    (async () => {
      try {
        if (providerRef.current) {
          const res = await providerRef.current.connect({ onlyIfTrusted: true });
          const pk = res?.publicKey ?? providerRef.current.publicKey;
          if (pk instanceof PublicKey) setAddress(pk.toString());
        }
      } catch {}
    })();

    const onConnect = ({ publicKey }: { publicKey: PublicKey }) =>
      setAddress(publicKey.toString());
    const onDisconnect = () => setAddress(null);
    const onAccountChanged = (pk?: PublicKey | null) => {
      if (!pk) setAddress(null);
      else setAddress(pk.toString());
    };

    providerRef.current?.on('connect', onConnect);
    providerRef.current?.on('disconnect', onDisconnect);
    providerRef.current?.on('accountChanged', onAccountChanged);

    return () => {
      providerRef.current?.removeListener('connect', onConnect);
      providerRef.current?.removeListener('disconnect', onDisconnect);
      providerRef.current?.removeListener('accountChanged', onAccountChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (connecting) return;
    const p = providerRef.current;
    if (!p?.isPhantom) throw new Error('Phantom not detected');
    try {
      setConnecting(true);
      // NOTE: On mobile, first-time connect should be called with NO args
      const { publicKey } = await p.connect();
      setAddress(publicKey.toString());
      return publicKey.toString();
    } finally {
      setConnecting(false);
    }
  }, [connecting]);

  const disconnect = useCallback(async () => {
    const p = providerRef.current;
    if (!p) return;
    try { await p.disconnect(); } finally { setAddress(null); }
  }, []);

  return {
    address,
    connecting,
    connect,
    disconnect,
    provider: providerRef.current,
    isReady: !!providerRef.current
  };
}
