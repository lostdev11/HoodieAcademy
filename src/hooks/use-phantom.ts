"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PhantomProvider } from "@/types/phantom";

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export function usePhantom() {
  const providerRef = useRef<PhantomProvider | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = window.solana;
    if (p?.isPhantom) providerRef.current = p;
    setIsReady(Boolean(providerRef.current));

    // Silent reconnect if already trusted
    (async () => {
      try {
        const prov = providerRef.current;
        if (!prov) return;
        const res = await prov.connect?.({ onlyIfTrusted: true });
        const key = res?.publicKey?.toString?.() ?? prov.publicKey?.toString?.();
        if (key) {
          setConnected(true);
          setAddress(key);
        }
      } catch {
        // not trusted or user declined; ignore
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    const prov = providerRef.current;
    if (!prov) throw new Error("Phantom not found");
    setConnecting(true);
    try {
      const res = await prov.connect?.();
      const key = res?.publicKey?.toString?.() ?? prov.publicKey?.toString?.();
      if (!key) throw new Error("Failed to retrieve public key");
      setConnected(true);
      setAddress(key);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const prov = providerRef.current;
    if (prov?.disconnect) {
      await prov.disconnect();
    }
    setConnected(false);
    setAddress(null);
  }, []);

  return {
    // keep old fields if others use them
    provider: providerRef.current,
    connected,

    // fields SmartConnect expects
    address,
    connecting,
    isReady,

    // actions
    connect,
    disconnect,
  };
}
