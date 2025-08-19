import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { bountyXPService } from '@/services/bounty-xp-service';
import { retailstarIncentiveService } from '@/services/retailstar-incentive-service';

export async function GET() {
  try {
    // First try to get from database
    const { data: dbSubmissions, error: dbError } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbSubmissions && !dbError) {
      return NextResponse.json(dbSubmissions);
    }

    // Fallback to JSON file
    const filePath = path.join(process.cwd(), 'public', 'submissions.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }

    const submissions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('[FETCH SUBMISSIONS ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, squad, courseRef, bountyId, walletAddress, imageUrl } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Check if user can submit to this bounty (max 3 submissions)
    if (bountyId) {
      const { data: existingSubmissions } = await supabase
        .from('bounty_submissions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('bounty_id', bountyId);

      if (existingSubmissions && existingSubmissions.length >= 3) {
        return NextResponse.json({ 
          error: 'Maximum submissions reached for this bounty (3 submissions max)' 
        }, { status: 400 });
      }
    }

    // Create submission in database
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        title,
        description,
        squad,
        course_ref: courseRef,
        bounty_id: bountyId,
        wallet_address: walletAddress,
        image_url: imageUrl,
        status: 'pending',
        upvotes: {},
        total_upvotes: 0
      })
      .select()
      .single();

    if (error) {
      console.error('[CREATE SUBMISSION ERROR]', error);
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }

    // Award XP for bounty submission if this is a bounty submission
    if (bountyId && submission) {
      try {
        const { data: xpResult } = await supabase.rpc('award_bounty_xp', {
          p_wallet_address: walletAddress,
          p_bounty_id: bountyId,
          p_submission_id: submission.id,
          p_xp_amount: 10
        });

        console.log('[BOUNTY XP AWARDED]', { walletAddress, bountyId, xpAwarded: 10 });
      } catch (xpError) {
        console.error('[BOUNTY XP ERROR]', xpError);
        // Don't fail the submission if XP award fails
      }

      // Award Retailstar Rewards for bounty submission
      try {
        // Determine performance tier based on submission quality
        // For now, award basic tier for any submission
        const performance = 'basic'; // Could be enhanced with quality assessment
        
        // Temporarily disabled - retailstar rewards not ready yet
        console.log('[RETAILSTAR REWARDS DISABLED]', { walletAddress, bountyId });
        
        // const rewardResult = await retailstarIncentiveService.awardRetailstarReward({
        //   userId: walletAddress,
        //   taskId: bountyId,
        //   squad: squad || 'creators', // Default to creators if no squad specified
        //   tier: performance
        // });

        // if (rewardResult.success) {
        //   console.log('[RETAILSTAR REWARDS AWARDED]', { 
        //     walletAddress, 
        //     bountyId, 
        //     rewards: rewardResult.rewards 
        //   });
        // } else {
        //   console.log('[RETAILSTAR REWARDS SKIPPED]', { 
        //     walletAddress, 
        //     bountyId, 
        //     error: rewardResult.error 
        //   });
        // }
        // } catch (rewardError) {
        //   console.error('[RETAILSTAR REWARDS ERROR]', rewardError);
        //   // Don't fail the submission if reward award fails
        // }
    }

    return NextResponse.json({
      ...submission,
      xpAwarded: bountyId ? 10 : 0
    });
  } catch (error) {
    console.error('[CREATE SUBMISSION ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 