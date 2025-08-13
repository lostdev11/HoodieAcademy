export function normalizeNftImageUrl(raw?: string): string | null {
  if (!raw) return null;
  // IPFS
  if (raw.startsWith("ipfs://")) {
    const cid = raw.replace("ipfs://", "");
    // pick your gateway; keep consistent to whitelist it once
    return `https://ipfs.io/ipfs/${cid}`;
  }
  // arweave or http(s)
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}

// when parsing Helius asset:
export function extractImageUrl(asset: any): string | null {
  // try common fields
  const img =
    asset?.content?.links?.image ||
    asset?.content?.metadata?.image ||
    asset?.content?.files?.[0]?.uri ||
    asset?.content?.json?.image; // depends on endpoint shape
  return normalizeNftImageUrl(img);
}
