"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// This type matches window.solana from wallet-adapter; its `disconnect` is optional.
import type { SolanaWallet } from "@solana/wallet-adapter-base";

declare global {
  interface Window {
    solana?: SolanaWallet & { isPhantom?: boolean };
  }
}

export function usePhantom() {
  const providerRef = useRef<(SolanaWallet & { isPhantom?: boolean }) | null>(null);
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = window.solana;
    if (p?.isPhantom) providerRef.current = p;

    // Silent reconnect if already trusted
    (async () => {
      try {
        const prov = providerRef.current;
        if (!prov) return;
        const res = await prov.connect?.({ onlyIfTrusted: true });
        // Some providers return void when onlyIfTrusted is false; guard it
        // If `connect` returned nothing, try reading publicKey directly
        const key = res?.publicKey?.toString?.() ?? prov.publicKey?.toString?.();
        if (key) {
          setConnected(true);
          setPublicKey(key);
        }
      } catch {
        // ignore: not yet trusted / user cancelled
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    const prov = providerRef.current;
    if (!prov) throw new Error("Phantom not found");
    const res = await prov.connect?.();
    const key = res?.publicKey?.toString?.() ?? prov.publicKey?.toString?.();
    if (!key) throw new Error("Failed to retrieve public key");
    setConnected(true);
    setPublicKey(key);
  }, []);

  const disconnect = useCallback(async () => {
    const prov = providerRef.current;
    if (prov?.disconnect) {
      await prov.disconnect();
    }
    setConnected(false);
    setPublicKey(null);
  }, []);

  return {
    provider: providerRef.current,
    connected,
    publicKey,
    connect,
    disconnect,
  };
}
