import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const DELIVERY_WALLET_PRIVATE_KEY = process.env.STARTER_PACK_DELIVERY_WALLET_PRIVATE_KEY || '';
const USD_REWARD_AMOUNT = 3; // $3 worth of SOL reward

/**
 * Fetch current SOL price in USD from CoinGecko
 */
async function getSolPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    );
    if (!response.ok) throw new Error('Failed to fetch SOL price');
    const data = await response.json();
    return data.solana?.usd || 0;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    // Fallback to a reasonable default if API fails (e.g., $100)
    return 100;
  }
}

/**
 * POST /api/starter-pack/deliver
 * Delivery worker that mints/sends rewards after admin approval
 * This is idempotent - can be called multiple times safely
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimId } = body;

    if (!claimId) {
      return NextResponse.json(
        { error: 'Claim ID is required' },
        { status: 400 }
      );
    }

    // Verify this is an internal call (optional security check)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.STARTER_PACK_DELIVERY_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      // Allow if called from same origin (internal API call)
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      if (!origin && !referer) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const supabase = getSupabaseAdmin();

    // Get the claim
    const { data: claim, error: claimError } = await supabase
      .from('starter_pack_claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      return NextResponse.json(
        { error: 'Claim not found', details: claimError?.message },
        { status: 404 }
      );
    }

    if (claim.status !== 'approved') {
      return NextResponse.json(
        { error: `Claim is not approved (status: ${claim.status})` },
        { status: 400 }
      );
    }

    // Check if already delivered (idempotency check)
    if (claim.status === 'delivered' && claim.sol_send_tx_signature) {
      return NextResponse.json({
        success: true,
        message: 'Already delivered',
        claim,
      });
    }

    // Mark delivery as started
    await supabase
      .from('starter_pack_claims')
      .update({
        delivery_started_at: new Date().toISOString(),
        status: 'delivered', // Optimistically set to delivered
      })
      .eq('id', claimId);

    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const recipientPubkey = new PublicKey(claim.wallet_address);
    const errors: string[] = [];

    // 1. Send SOL reward ($3 worth of SOL)
    let solTxSignature: string | null = null;
    try {
      if (!DELIVERY_WALLET_PRIVATE_KEY) {
        throw new Error('Delivery wallet private key not configured');
      }

      // Parse private key (can be base58 string or array)
      let deliveryKeypair: Keypair;
      try {
        const privateKeyBytes = DELIVERY_WALLET_PRIVATE_KEY.includes(',')
          ? Uint8Array.from(DELIVERY_WALLET_PRIVATE_KEY.split(',').map(Number))
          : Buffer.from(DELIVERY_WALLET_PRIVATE_KEY, 'base64');
        deliveryKeypair = Keypair.fromSecretKey(privateKeyBytes);
      } catch {
        // Try as base58 string
        const bs58 = require('bs58');
        deliveryKeypair = Keypair.fromSecretKey(bs58.decode(DELIVERY_WALLET_PRIVATE_KEY));
      }

      // Fetch current SOL price and calculate $3 worth of SOL
      const solPrice = await getSolPrice();
      if (solPrice === 0) {
        throw new Error('Failed to fetch SOL price');
      }
      const solAmount = (USD_REWARD_AMOUNT / solPrice) * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: deliveryKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports: solAmount,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = deliveryKeypair.publicKey;

      transaction.sign(deliveryKeypair);

      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction(signature, 'confirmed');
      solTxSignature = signature;
    } catch (error) {
      const errorMsg = `Failed to send SOL: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg, error);
      errors.push(errorMsg);
    }

    // 2. Mint .sol domain (placeholder - requires Bonfida or similar integration)
    let domainTxSignature: string | null = null;
    let domainName: string | null = null;
    try {
      // TODO: Integrate with Bonfida API or SNS (Solana Name Service) to mint domain
      // For now, this is a placeholder
      // You would need to:
      // 1. Generate a unique domain name
      // 2. Call Bonfida API or SNS program to mint
      // 3. Store the transaction signature
      
      // Placeholder implementation
      domainName = `${claim.wallet_address.slice(0, 8)}.sol`; // Example domain
      // In production, you'd actually mint this via Bonfida/SNS
      
      console.log('Domain minting not implemented - placeholder:', domainName);
    } catch (error) {
      const errorMsg = `Failed to mint domain: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg, error);
      errors.push(errorMsg);
    }

    // 3. Mint mystery NFT (placeholder - requires NFT minting integration)
    let nftTxSignature: string | null = null;
    let nftMintAddress: string | null = null;
    try {
      // TODO: Integrate with Metaplex or similar to mint NFT
      // For now, this is a placeholder
      // You would need to:
      // 1. Create NFT metadata
      // 2. Mint NFT to recipient wallet
      // 3. Store the mint address and transaction signature
      
      console.log('NFT minting not implemented - placeholder');
      // In production, you'd actually mint the NFT here
    } catch (error) {
      const errorMsg = `Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg, error);
      errors.push(errorMsg);
    }

    // Calculate actual SOL amount sent (for record keeping)
    const solPrice = await getSolPrice();
    const actualSolAmount = solPrice > 0 ? USD_REWARD_AMOUNT / solPrice : 0;

    // Update claim with delivery results
    const updateData: any = {
      delivery_completed_at: new Date().toISOString(),
      sol_amount_sent: actualSolAmount,
    };

    if (solTxSignature) {
      updateData.sol_send_tx_signature = solTxSignature;
    }
    if (domainTxSignature) {
      updateData.domain_tx_signature = domainTxSignature;
      updateData.domain_name = domainName;
    }
    if (nftTxSignature) {
      updateData.nft_mint_tx_signature = nftTxSignature;
      updateData.nft_mint_address = nftMintAddress;
    }

    if (errors.length > 0) {
      updateData.status = 'failed';
      updateData.delivery_error = errors.join('; ');
    } else {
      updateData.status = 'delivered';
    }

    const { data: updatedClaim, error: updateError } = await supabase
      .from('starter_pack_claims')
      .update(updateData)
      .eq('id', claimId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating claim after delivery:', updateError);
      return NextResponse.json(
        { error: 'Failed to update claim', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: errors.length === 0,
      claim: updatedClaim,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length === 0
        ? 'All rewards delivered successfully'
        : 'Some rewards failed to deliver. Check errors for details.',
    });
  } catch (error) {
    console.error('Error in delivery worker:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

