import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const CLAIM_PRICE_SOL = 0.05; // Hard-coded claim price
const TREASURY_WALLET = process.env.STARTER_PACK_TREASURY_WALLET || '';
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const SKIP_PAYMENT_CHECK =
  process.env.STARTER_PACK_SKIP_PAYMENT_CHECK === 'true' ||
  process.env.NEXT_PUBLIC_STARTER_PACK_SKIP_PAYMENT_CHECK === 'true';

/**
 * POST /api/starter-pack/claim
 * Creates a new starter pack claim after verifying on-chain payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, paymentTxSignature } = body;

    if (!walletAddress || !paymentTxSignature) {
      return NextResponse.json(
        { error: 'Wallet address and payment transaction signature are required' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    try {
      new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate treasury wallet is configured
    if (!TREASURY_WALLET) {
      console.error('STARTER_PACK_TREASURY_WALLET not configured');
      return NextResponse.json(
        { error: 'Treasury wallet not configured' },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if wallet already has a claim
    const { data: existingClaim } = await supabase
      .from('starter_pack_claims')
      .select('id, status')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Wallet already has a claim', claim: existingClaim },
        { status: 400 }
      );
    }

    let paymentVerified = false;
    let paymentAmount = 0;

    if (SKIP_PAYMENT_CHECK) {
      console.warn('[STARTER PACK] Skipping payment verification (development mode).');
      paymentVerified = true;
      paymentAmount = CLAIM_PRICE_SOL;
    } else {
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

      try {
        const tx = await connection.getTransaction(paymentTxSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });

        if (!tx || !tx.meta) {
          return NextResponse.json(
            { error: 'Transaction not found or invalid' },
            { status: 400 }
          );
        }

        // Check if transaction was successful
        if (tx.meta.err) {
          return NextResponse.json(
            { error: 'Payment transaction failed', details: tx.meta.err },
            { status: 400 }
          );
        }

        // Find transfer to treasury wallet
        const treasuryPubkey = new PublicKey(TREASURY_WALLET);
        const preBalances = tx.meta.preBalances || [];
        const postBalances = tx.meta.postBalances || [];

        // Check account keys for treasury wallet
        const accountKeys = tx.transaction.message.accountKeys;
        const treasuryIndex = accountKeys.findIndex(
          (key) => key.toString() === TREASURY_WALLET
        );

        if (treasuryIndex >= 0) {
          const balanceChange = postBalances[treasuryIndex] - preBalances[treasuryIndex];
          paymentAmount = balanceChange / LAMPORTS_PER_SOL;

          // Verify payment amount matches claim price (with small tolerance for fees)
          const expectedAmount = CLAIM_PRICE_SOL * LAMPORTS_PER_SOL;
          if (balanceChange >= expectedAmount * 0.99) { // 99% tolerance
            paymentVerified = true;
          }
        }

        // Alternative: Check transfer instructions
        if (!paymentVerified && tx.transaction.message.instructions) {
          for (const instruction of tx.transaction.message.instructions) {
            if ('programId' in instruction) {
              const programId = instruction.programId.toString();
              // System program transfer
              if (programId === '11111111111111111111111111111111') {
                // Decode transfer instruction (simplified check)
                // In production, you'd want to properly decode the instruction
                const data = (instruction as any).data;
                if (data && data.length >= 4) {
                  // Check if this is a transfer (instruction discriminator = 2)
                  if (data[0] === 2) {
                    // Verify destination is treasury
                    const keys = (instruction as any).keys;
                    if (keys && keys.length >= 2) {
                      const destination = keys[1].pubkey?.toString();
                      if (destination === TREASURY_WALLET) {
                        // Extract amount (last 8 bytes of data)
                        const amountBytes = data.slice(data.length - 8);
                        const amount = Number(
                          BigInt('0x' + Buffer.from(amountBytes).toString('hex'))
                        );
                        paymentAmount = amount / LAMPORTS_PER_SOL;
                        if (paymentAmount >= CLAIM_PRICE_SOL * 0.99) {
                          paymentVerified = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error verifying payment transaction:', error);
        return NextResponse.json(
          { error: 'Failed to verify payment transaction', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }

      if (!paymentVerified) {
        return NextResponse.json(
          { error: 'Payment verification failed. Please ensure you sent exactly 0.05 SOL to the treasury wallet.' },
          { status: 400 }
        );
      }
    }

    // Create claim record
    const { data: claim, error: claimError } = await supabase
      .from('starter_pack_claims')
      .insert({
        wallet_address: walletAddress,
        status: 'pending',
        payment_tx_signature: paymentTxSignature,
        payment_amount_sol: paymentAmount,
        treasury_wallet: TREASURY_WALLET,
        payment_verified: true,
        payment_verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (claimError) {
      console.error('Error creating claim:', claimError);
      return NextResponse.json(
        { error: 'Failed to create claim', details: claimError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      claim,
      message: 'Claim created successfully. Waiting for admin approval.'
    });
  } catch (error) {
    console.error('Error in claim creation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/starter-pack/claim
 * Get claim status for a wallet
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: claim, error } = await supabase
      .from('starter_pack_claims')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      console.error('Error fetching claim:', error);
      return NextResponse.json(
        { error: 'Failed to fetch claim', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ claim: claim || null });
  } catch (error) {
    console.error('Error in GET claim:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

