// src/types/phantom.d.ts
import type { PublicKey } from '@solana/web3.js';

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: PublicKey | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  on(event: 'connect'|'disconnect'|'accountChanged', handler: (arg?: any) => void): void;
  removeListener(event: 'connect'|'disconnect'|'accountChanged', handler: (arg?: any) => void): void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}
