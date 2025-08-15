// src/types/window.d.ts
import type { SolanaWallet } from './wallet';

declare global {
  interface Window {
    solana?: SolanaWallet;
  }
}

export {};
