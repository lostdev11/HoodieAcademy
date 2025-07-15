import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('NFT Verification API: Checking wallet:', walletAddress);

    // Try multiple API endpoints for better reliability
    const apis = [
      {
        name: 'Solscan',
        url: `https://api.solscan.io/account/tokens?account=${walletAddress}`,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        } as Record<string, string>
      },
      {
        name: 'Helius (if API key available)',
        url: `https://api.helius.xyz/v1/addresses/${walletAddress}/nfts?api-key=${process.env.HELIUS_API_KEY}`,
        headers: {
          'Content-Type': 'application/json',
        } as Record<string, string>
      }
    ];

    let nfts = [];
    let apiUsed = '';

    for (const api of apis) {
      try {
        console.log(`Trying ${api.name} API...`);
        
        const response = await fetch(api.url, {
          method: 'GET',
          headers: api.headers,
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`${api.name} API response:`, data);
          
          if (api.name === 'Solscan') {
            nfts = data.data?.filter((token: any) => token.tokenAmount?.decimals === 0) || [];
          } else if (api.name.includes('Helius')) {
            nfts = Array.isArray(data) ? data : [];
          }
          
          apiUsed = api.name;
          break;
        } else {
          console.log(`${api.name} API failed with status:`, response.status);
        }
      } catch (error) {
        console.error(`${api.name} API error:`, error);
      }
    }

    // Check for WifHoodie NFTs
    const WIFHOODIE_COLLECTION_ID = "H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ";
    
    const hasWifHoodie = nfts.some((nft: any) => {
      // Check by mint address
      const isWifHoodieByMint = nft.mint === WIFHOODIE_COLLECTION_ID;
      
      // Check by token name
      const tokenName = nft.tokenInfo?.name || nft.content?.metadata?.name || '';
      const isWifHoodieByName = tokenName.toLowerCase().includes('wifhoodie') || 
                                tokenName.toLowerCase().includes('wif hoodie');
      
      // Check by symbol
      const tokenSymbol = nft.tokenInfo?.symbol || nft.content?.metadata?.symbol || '';
      const isWifHoodieBySymbol = tokenSymbol.toLowerCase().includes('wifhoodie') || 
                                 tokenSymbol.toLowerCase().includes('wif');
      
      return isWifHoodieByMint || isWifHoodieByName || isWifHoodieBySymbol;
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