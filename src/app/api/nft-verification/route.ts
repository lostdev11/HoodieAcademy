import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    let walletAddress = null;

    try {
      const body = await request.json();
      walletAddress = body.walletAddress;
      console.log('🧠 Parsed walletAddress:', walletAddress);
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON body:', jsonError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    console.log('🧠 API Triggered: walletAddress =', walletAddress);

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('[🔍] Checking wallet:', walletAddress);
    // Use the public env variable so it works on Vercel and locally
    const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

    if (!HELIUS_API_KEY) {
      console.error('[❌] Missing NEXT_PUBLIC_HELIUS_API_KEY env variable');
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    let nfts = [];
    let apiUsed = 'None';
    const apiErrors: string[] = [];

    // Try Helius RPC
    try {
      console.log('[📡] Trying Helius RPC API...');
      const heliusResponse = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'nft-verification',
          method: 'getAssetsByOwner',
          params: { ownerAddress: walletAddress, page: 1, limit: 1000 },
        }),
      });

      if (heliusResponse.ok) {
        const result = await heliusResponse.json();
        if (result?.result?.items?.length) {
          nfts = result.result.items;
          apiUsed = 'Helius RPC API';
          console.log(`[✅] Helius returned ${nfts.length} NFTs`);
        }
      } else {
        const error = await heliusResponse.text();
        apiErrors.push(`Helius RPC failed: ${heliusResponse.status} - ${error}`);
      }
    } catch (e: any) {
      console.error('[❌] Helius RPC error:', e.message || e);
      apiErrors.push(`Helius RPC error: ${e.message || e}`);
    }

    // Try Solscan fallback
    if (nfts.length === 0) {
      try {
        console.log('[📡] Trying Solscan API...');
        const solscanResponse = await fetch(`https://api.solscan.io/account/tokens?account=${walletAddress}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (solscanResponse.ok) {
          const result = await solscanResponse.json();
          nfts = (result.data || result).filter((t: any) => t.tokenAmount?.decimals === 0 || t.decimals === 0);
          apiUsed = 'Solscan API';
          console.log(`[✅] Solscan returned ${nfts.length} NFT tokens`);
        } else {
          const error = await solscanResponse.text();
          apiErrors.push(`Solscan failed: ${solscanResponse.status} - ${error}`);
        }
      } catch (e: any) {
        console.error('[❌] Solscan error:', e.message || e);
        apiErrors.push(`Solscan error: ${e.message || e}`);
      }
    }

    // Check if any NFT is part of WifHoodie
    const WIFHOODIE_COLLECTION_ID = 'H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ';
    const hasWifHoodie = nfts.some((nft: any) => {
      const id = nft.id || nft.mint;
      const name = nft.content?.metadata?.name || nft.name || nft.tokenInfo?.name || '';
      const symbol = nft.content?.metadata?.symbol || nft.symbol || nft.tokenInfo?.symbol || '';
      const grouping = nft.grouping || [];

      return (
        id === WIFHOODIE_COLLECTION_ID ||
        grouping.some((g: any) => g.group_key === 'collection' && g.group_value === WIFHOODIE_COLLECTION_ID) ||
        name.toLowerCase().includes('wifhoodie') ||
        symbol.toLowerCase().includes('wifhoodie') ||
        symbol.toLowerCase().includes('wif')
      );
    });

    // Return result
    return NextResponse.json({
      success: true,
      isHolder: hasWifHoodie,
      nftsFound: nfts.length,
      walletAddress,
      apiUsed,
      nfts: nfts.slice(0, 5),
      apiErrors: apiErrors.length > 0 ? apiErrors : undefined,
      debug: {
        collectionId: WIFHOODIE_COLLECTION_ID,
        totalApisTried: 2,
        heliusAvailable: !!HELIUS_API_KEY,
        fallbackUsed: apiUsed === 'Solscan API',
      },
    });
  } catch (error: any) {
    console.error('❌ NFT Verification API error:', error?.message || error);
    console.error('🔍 Full error object:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify NFT ownership',
        details: error?.message || JSON.stringify(error)
      },
      { status: 500 }
    );
  }
} 