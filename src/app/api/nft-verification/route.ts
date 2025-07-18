import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('NFT Verification API: Checking wallet:', walletAddress);
    // TEMP DEBUG: Log the Helius API key (first 6 chars only for safety)
    console.log('HELIUS_API_KEY:', process.env.HELIUS_API_KEY ? process.env.HELIUS_API_KEY.slice(0, 6) + '...' : 'NOT SET');

    // Use Helius searchAssets RPC endpoint for NFT verification
    const apiUrl = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
    let nfts = [];
    let apiUsed = 'Helius searchAssets RPC';
    try {
      console.log(`Trying Helius searchAssets RPC...`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'nft-verification',
          method: 'searchAssets',
          params: {
            ownerAddress: walletAddress,
            tokenType: 'all',
            limit: 100
          }
        })
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`Helius searchAssets RPC response:`, data);
        console.log(`Helius searchAssets RPC result:`, JSON.stringify(data.result, null, 2));
        nfts = data.result?.items || [];
        console.log(`Helius NFTs found:`, nfts.length);
        console.log(`Helius NFTs full items:`, JSON.stringify(nfts, null, 2));
        if (nfts.length > 0) {
          console.log(`First Helius NFT:`, nfts[0]);
        }
      } else {
        console.log(`Helius searchAssets RPC failed with status:`, response.status);
        const errorText = await response.text();
        console.log(`Helius searchAssets RPC error response:`, errorText);
      }
    } catch (error) {
      console.error(`Helius searchAssets RPC error:`, error);
    }
    // Check for WifHoodie NFTs
    const WIFHOODIE_COLLECTION_ID = "H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ";
    const hasWifHoodie = nfts.some((nft: any) =>
      Array.isArray(nft.grouping) &&
      nft.grouping.some(
        (group: any) =>
          group.group_key === "collection" &&
          group.group_value === WIFHOODIE_COLLECTION_ID
      )
    );
    return NextResponse.json({
      success: true,
      isHolder: hasWifHoodie,
      nftsFound: nfts.length,
      apiUsed,
      walletAddress,
      nfts: nfts.slice(0, 5) // Return first 5 NFTs for debugging
    });

  } catch (error) {
    console.error('NFT Verification API error:', error);
    return NextResponse.json(
      { error: 'Failed to verify NFT ownership' },
      { status: 500 }
    );
  }
} 