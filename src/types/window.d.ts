// src/types/window.d.ts
import type { SolanaWallet } from './wallet';

interface SolflareWallet {
  isSolflare?: boolean;
  isConnected: boolean;
  publicKey: { toString(): string } | null;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}

interface Window {
  solana?: any; // Phantom wallet
  solflare?: SolflareWallet; // Solflare wallet
}

export {};
