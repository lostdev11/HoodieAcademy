export type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toString(): string } | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  request?: (args: { method: string; params?: any }) => Promise<any>;
  on?: (event: 'connect' | 'disconnect' | 'accountChanged', handler: (...args: any[]) => void) => void;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}
export {};
