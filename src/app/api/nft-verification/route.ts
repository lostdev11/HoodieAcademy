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
    
    // Check if API key is available
    if (!process.env.HELIUS_API_KEY) {
      console.error('HELIUS_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Use Helius REST API for NFT verification
    const apiUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/nfts?api-key=${process.env.HELIUS_API_KEY}`;
    let nfts = [];
    let apiUsed = 'Helius REST API';
    try {
      console.log(`Trying Helius REST API...`);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`Helius REST API response:`, data);
        nfts = Array.isArray(data) ? data : [];
        console.log(`Helius NFTs found:`, nfts.length);
        if (nfts.length > 0) {
          console.log(`First Helius NFT:`, nfts[0]);
        }
      } else {
        console.log(`Helius REST API failed with status:`, response.status);
        const errorText = await response.text();
        console.log(`Helius REST API error response:`, errorText);
        return NextResponse.json(
          { 
            error: 'Helius API request failed',
            status: response.status,
            details: errorText
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error(`Helius REST API error:`, error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch NFT data from Helius API',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    // Check for WifHoodie NFTs
    const WIFHOODIE_COLLECTION_ID = "H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ";
    const hasWifHoodie = nfts.some((nft: any) => {
      // Check by mint address
      const isWifHoodieByMint = nft.mint === WIFHOODIE_COLLECTION_ID;
      // Check by collection address
      const isWifHoodieByCollection = nft.collection === WIFHOODIE_COLLECTION_ID || nft.collection?.address === WIFHOODIE_COLLECTION_ID;
      // Check by token name
      const tokenName = nft.tokenInfo?.name || nft.content?.metadata?.name || nft.name || '';
      const isWifHoodieByName = tokenName.toLowerCase().includes('wifhoodie') || 
                                tokenName.toLowerCase().includes('wif hoodie');
      // Check by symbol
      const tokenSymbol = nft.tokenInfo?.symbol || nft.content?.metadata?.symbol || nft.symbol || '';
      const isWifHoodieBySymbol = tokenSymbol.toLowerCase().includes('wifhoodie') || 
                                 tokenSymbol.toLowerCase().includes('wif');
      
      return isWifHoodieByMint || isWifHoodieByCollection || isWifHoodieByName || isWifHoodieBySymbol;
    });
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