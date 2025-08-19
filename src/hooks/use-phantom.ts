// src/hooks/use-phantom.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// Use the canonical window.solana types from src/types/solana.d.ts
type Phantomish = NonNullable<typeof window.solana> & { isPhantom?: boolean };

function getSolana(): Phantomish | null {
  if (typeof window === "undefined") return null;
  return (window.solana as Phantomish) ?? null;
}

export function usePhantom() {
  const providerRef = useRef<Phantomish | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const p = getSolana();
    if (p?.isPhantom) providerRef.current = p;
    setIsReady(Boolean(providerRef.current));

    // Silent reconnect if already trusted
    (async () => {
      try {
        const prov = providerRef.current;
        if (!prov) return;

        // Some providers return void from connect({ onlyIfTrusted })
        const res = await prov.connect?.({ onlyIfTrusted: true });
        const key =
          (res as any)?.publicKey?.toString?.() ??
          (prov as any)?.publicKey?.toString?.();

        if (key) {
          setConnected(true);
          setAddress(key);
        }
      } catch {
        /* not yet trusted / user declined */
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    const prov = providerRef.current ?? getSolana();
    if (!prov) throw new Error("Phantom not found");
    providerRef.current = prov;

    setConnecting(true);
    try {
      const res = await prov.connect?.();
      const key =
        (res as any)?.publicKey?.toString?.() ??
        (prov as any)?.publicKey?.toString?.();

      if (!key) throw new Error("Failed to retrieve public key");
      setConnected(true);
      setAddress(key);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const prov = providerRef.current ?? getSolana();
    if (prov?.disconnect) {
      await prov.disconnect();
    }
    setConnected(false);
    setAddress(null);
  }, []);

  return {
    provider: providerRef.current,
    connected,
    address,
    connecting,
    isReady,
    connect,
    disconnect,
  };
}
