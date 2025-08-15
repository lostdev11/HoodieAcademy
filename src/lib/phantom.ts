export type SolanaWallet = {
  publicKey?: { toString(): string } | null;
  connect?: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect?: () => Promise<void>;
  request?: (args: { method: string; params?: any }) => Promise<any>;
  on?: (event: 'connect' | 'disconnect' | 'accountChanged', handler: (...args: any[]) => void) => void;
};

export const getWallet = (): SolanaWallet | null => {
  if (typeof window === 'undefined') return null;
  const p = (window as any).solana as any;
  return p && p.isPhantom ? (p as unknown as SolanaWallet) : null;
};

export const isWalletConnected = (wallet?: SolanaWallet | null): boolean =>
  Boolean(wallet?.publicKey);

export const ensureConnected = async (wallet: SolanaWallet) => {
  if (!wallet.publicKey) {
    if (wallet.connect) {
      await wallet.connect();
    } else if (wallet.request) {
      await wallet.request({ method: 'connect' });
    }
  }
  return wallet.publicKey;
};
