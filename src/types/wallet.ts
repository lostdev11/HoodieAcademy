// src/types/wallet.ts
// Type definitions for Solana wallet integration

import type { PublicKey } from '@solana/web3.js';

export interface SolanaWallet {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isConnected?: boolean;
  publicKey?: PublicKey | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect?: () => Promise<void>;
  signTransaction?: (transaction: any) => Promise<any>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  off?: (event: string, handler: (...args: any[]) => void) => void;
  [k: string]: any;
}

// Note: @solana/wallet-adapter-base doesn't export SolanaWallet
// The interface above provides the necessary types for the application
