export function inBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getWindow(): Window & typeof globalThis & { solflare?: any; solana?: any } | null {
  return inBrowser() ? (window as any) : null;
}

export function hasSolflare(): boolean {
  if (!inBrowser()) return false;
  const w = window as any;
  return Boolean(w.solflare || w.solana?.isSolflare);
}

export function getSolflareProvider(): any | null {
  const w = getWindow();
  if (!w) return null;
  return w.solflare ?? (w.solana?.isSolflare ? w.solana : null) ?? null;
}

export function getSolana(): any | null {
  const w = getWindow();
  return w?.solana ?? null;
}

export function isAnyWalletConnected(): boolean {
  const sol = getSolana();
  return Boolean(sol?.isConnected ?? sol?.publicKey);
}
