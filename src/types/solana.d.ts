// src/types/solana.d.ts
import type { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: PublicKey | null; // Phantom exposes null until connected
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;

  // Common (optional) methods you might call
  signTransaction?: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
  signAllTransactions?: (txs: (Transaction | VersionedTransaction)[]) => Promise<(Transaction | VersionedTransaction)[]>;
  signAndSendTransaction?: (
    tx: Transaction | VersionedTransaction,
    opts?: { preflightCommitment?: string }
  ) => Promise<{ signature: string }>;

  on?: (event: string, handler: (...args: any[]) => void) => void;
  off?: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

// Use this across the app
export type SolanaWallet = PhantomProvider;
