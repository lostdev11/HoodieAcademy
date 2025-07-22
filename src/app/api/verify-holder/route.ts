import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();
    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
    }
    const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
    if (!HELIUS_API_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }
    const heliusRes = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'nft-verification',
        method: 'getAssetsByOwner',
        params: { ownerAddress: walletAddress, page: 1, limit: 1000 },
      }),
    });
    const heliusData = await heliusRes.json();
    const nfts = heliusData?.result?.items || [];
    const isHolder = nfts.some((nft: any) =>
      nft.grouping?.some(
        (g: any) =>
          g.group_key === 'collection' &&
          g.group_value === 'H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ'
      )
    );
    return NextResponse.json({ isHolder });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify NFT ownership' }, { status: 500 });
  }
} 