// Centralized wallet type definitions
export interface SolanaWallet {
  isPhantom?: boolean;
  isConnected: boolean;
  publicKey: {
    toString(): string;
  } | null;
  on(event: string, callback: () => void): void;
  removeListener(event: string, callback: () => void): void;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): void;
}

declare global {
  interface Window {
    solana?: SolanaWallet;
    ethereum?: any;
  }
}
