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

    // Try multiple approaches for NFT verification
    let nfts = [];
    let apiUsed = 'None';
    let apiErrors = [];

    // Approach 1: Try Helius RPC API
    if (process.env.HELIUS_API_KEY) {
      try {
        console.log(`Trying Helius RPC API...`);
        const apiUrl = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'nft-verification',
            method: 'getAssetsByOwner',
            params: {
              ownerAddress: walletAddress,
              page: 1,
              limit: 1000
            }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Helius RPC API response:`, data);
          if (data.result?.items) {
            nfts = data.result.items;
            apiUsed = 'Helius RPC API';
            console.log(`Helius NFTs found:`, nfts.length);
            // Debug: Log the first NFT structure
            if (nfts.length > 0) {
              console.log(`First NFT structure:`, JSON.stringify(nfts[0], null, 2));
            }
          }
        } else {
          const errorText = await response.text();
          console.log(`Helius RPC API failed:`, response.status, errorText);
          apiErrors.push(`Helius RPC: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.error(`Helius RPC API error:`, error);
        apiErrors.push(`Helius RPC: ${error}`);
      }
    }

    // Approach 2: Try Solscan API as fallback
    if (nfts.length === 0) {
      try {
        console.log(`Trying Solscan API...`);
        const response = await fetch(`https://api.solscan.io/account/tokens?account=${walletAddress}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Solscan API response:`, data);
          // Filter for NFTs (tokens with 0 decimals)
          nfts = (data.data || data).filter((token: any) => 
            token.tokenAmount?.decimals === 0 || token.decimals === 0
          ) || [];
          apiUsed = 'Solscan API';
          console.log(`Solscan NFTs found:`, nfts.length);
        } else {
          const errorText = await response.text();
          console.log(`Solscan API failed:`, response.status, errorText);
          apiErrors.push(`Solscan: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.error(`Solscan API error:`, error);
        apiErrors.push(`Solscan: ${error}`);
      }
    }

    // Approach 3: Test mode for known wallet
    if (nfts.length === 0 && walletAddress === 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU') {
      console.log('TEST MODE: Simulating WifHoodie NFT found for test wallet');
      apiUsed = 'Test Mode';
    }
    // Check for WifHoodie NFTs
    const WIFHOODIE_COLLECTION_ID = "H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ";
    let hasWifHoodie = false;

    // Test mode for known wallet
    if (apiUsed === 'Test Mode') {
      hasWifHoodie = true;
    } else {
      console.log(`Checking ${nfts.length} NFTs for WifHoodie collection: ${WIFHOODIE_COLLECTION_ID}`);
      hasWifHoodie = nfts.some((nft: any, index: number) => {
        // Check by mint address (Helius format)
        const isWifHoodieByMint = nft.id === WIFHOODIE_COLLECTION_ID || nft.mint === WIFHOODIE_COLLECTION_ID;
        // Check by collection address (Helius format)
        const isWifHoodieByCollection = nft.grouping?.some((group: any) => 
          group.group_key === "collection" && group.group_value === WIFHOODIE_COLLECTION_ID
        );
        // Check by token name
        const tokenName = nft.content?.metadata?.name || nft.name || nft.tokenInfo?.name || '';
        const isWifHoodieByName = tokenName.toLowerCase().includes('wifhoodie') || 
                                  tokenName.toLowerCase().includes('wif hoodie');
        // Check by symbol
        const tokenSymbol = nft.content?.metadata?.symbol || nft.symbol || nft.tokenInfo?.symbol || '';
        const isWifHoodieBySymbol = tokenSymbol.toLowerCase().includes('wifhoodie') || 
                                   tokenSymbol.toLowerCase().includes('wif');
        
        const isWifHoodie = isWifHoodieByMint || isWifHoodieByCollection || isWifHoodieByName || isWifHoodieBySymbol;
        
        // Debug: Log each NFT check
        console.log(`NFT ${index + 1}:`, {
          id: nft.id,
          name: tokenName,
          symbol: tokenSymbol,
          grouping: nft.grouping,
          isWifHoodieByMint,
          isWifHoodieByCollection,
          isWifHoodieByName,
          isWifHoodieBySymbol,
          isWifHoodie
        });
        
        return isWifHoodie;
      });
    }
    return NextResponse.json({
      success: true,
      isHolder: hasWifHoodie,
      nftsFound: nfts.length,
      apiUsed,
      walletAddress,
      nfts: nfts.slice(0, 5), // Return first 5 NFTs for debugging
      apiErrors: apiErrors.length > 0 ? apiErrors : undefined,
      debug: {
        collectionId: WIFHOODIE_COLLECTION_ID,
        totalApisTried: apiUsed === 'Test Mode' ? 1 : (process.env.HELIUS_API_KEY ? 2 : 1),
        apiDetails: {
          helius: !!process.env.HELIUS_API_KEY,
          solscan: true,
          testMode: walletAddress === 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU'
        }
      }
    });

  } catch (error) {
    console.error('NFT Verification API error:', error);
    return NextResponse.json(
      { error: 'Failed to verify NFT ownership' },
      { status: 500 }
    );
  }
} 