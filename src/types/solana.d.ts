// src/types/solana.d.ts
// Canonical global type definitions for Solana and Ethereum wallets
// This file should be the ONLY place that declares window.solana and window.ethereum

type CanonicalSolanaProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isConnected?: boolean;
  publicKey?: { toString(): string } | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect?: () => Promise<void>;
  signTransaction?: (transaction: any) => Promise<any>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  off?: (event: string, handler: (...args: any[]) => void) => void;
  [k: string]: any;
};

declare global {
  interface Window {
    /** Canonical type for window.solana used across the app */
    solana?: CanonicalSolanaProvider;

    /** Phantom exposes its provider via window.phantom.solana before window.solana is set */
    phantom?: {
      solana?: CanonicalSolanaProvider;
      [k: string]: any;
    };

    /** Canonical type for window.solflare used across the app */
    solflare?: {
      isSolflare?: boolean;
      isConnected?: boolean;
      publicKey?: { toString(): string } | null;
      connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
      disconnect?: () => Promise<void>;
      signTransaction?: (transaction: any) => Promise<any>;
      signAllTransactions?: (transactions: any[]) => Promise<any[]>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      off?: (event: string, handler: (...args: any[]) => void) => void;
      [k: string]: any;
    };
    
    /** Canonical type for window.ethereum used across the app */
    ethereum?: {
      isMetaMask?: boolean;
      providers?: Array<{
        isMetaMask?: boolean;
        request: (args: { method: string; params?: any[] }) => Promise<any>;
        on?: (event: string, handler: (...args: any[]) => void) => void;
        removeListener?: (event: string, handler: (...args: any[]) => void) => void;
        [k: string]: any;
      }>;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
      [k: string]: any;
    };
  }
}

// Re-export the canonical type so all existing imports keep working.
export type { SolanaWallet } from "@solana/wallet-adapter-base";

export {};
