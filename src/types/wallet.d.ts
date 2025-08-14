// src/types/wallet.ts

export type ConnectOptions = {
  onlyIfTrusted?: boolean;
};

export interface SolanaWallet {
  isPhantom?: boolean;
  isConnected?: boolean;
  publicKey?: { toString(): string };

  // allow both forms: connect() and connect({ onlyIfTrusted })
  connect(options?: ConnectOptions): Promise<{ publicKey: { toString(): string } }>;

  disconnect?: () => Promise<void>;

  on?: (
    event: 'connect' | 'disconnect' | 'accountChanged',
    handler: (...args: any[]) => void
  ) => void;

  removeListener?: (
    event: 'connect' | 'disconnect' | 'accountChanged',
    handler: (...args: any[]) => void
  ) => void;
}

declare global {
  interface Window {
    solana?: SolanaWallet;
    ethereum?: any;
  }
}
