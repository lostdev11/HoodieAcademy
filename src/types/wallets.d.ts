export {};

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      isSolflare?: boolean;
      isConnected?: boolean;   // <- add optional flag
      publicKey?: { toString(): string } | null;
      [k: string]: any;
    };
  }
}
