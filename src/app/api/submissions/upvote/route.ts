import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { submissionId, emoji, walletAddress, squad } = await req.json();
    
    if (!submissionId || !emoji || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Try database first
    try {
      const { data: submission, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (fetchError || !submission) {
        throw new Error('Submission not found in database');
      }

      // Parse existing upvotes
      const upvotes = submission.upvotes || {};
      if (!upvotes[emoji]) {
        upvotes[emoji] = [];
      }

      // Check if wallet already upvoted this emoji
      const existingVoteIndex = upvotes[emoji].findIndex((vote: any) => vote.walletAddress === walletAddress);
      
      if (existingVoteIndex !== -1) {
        // Remove existing vote (toggle off)
        upvotes[emoji].splice(existingVoteIndex, 1);
      } else {
        // Add new vote
        upvotes[emoji].push({
          walletAddress,
          squad,
          timestamp: new Date().toISOString()
        });
      }

      // Calculate total upvotes
      const totalUpvotes = Object.values(upvotes).reduce((total: number, votes: any) => {
        return total + votes.length;
      }, 0);

      // Update submission in database
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          upvotes,
          total_upvotes: totalUpvotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ 
        success: true, 
        upvotes,
        totalUpvotes,
        isUpvoted: existingVoteIndex === -1
      });

    } catch (dbError) {
      console.log('Database operation failed, falling back to JSON file');
      
      // Fallback to JSON file
      const filePath = path.join(process.cwd(), 'public', 'submissions.json');
      
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'No submissions found' }, { status: 404 });
      }

      const submissions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const submissionIndex = submissions.findIndex((s: any) => s.id === submissionId);
      
      if (submissionIndex === -1) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      const submission = submissions[submissionIndex];
      
      // Initialize upvotes structure if it doesn't exist
      if (!submission.upvotes) {
        submission.upvotes = {};
      }
      
      // Initialize emoji reactions if they don't exist
      if (!submission.upvotes[emoji]) {
        submission.upvotes[emoji] = [];
      }
      
      // Check if user already upvoted this emoji
      const existingVoteIndex = submission.upvotes[emoji].findIndex((vote: any) => vote.walletAddress === walletAddress);
      
      if (existingVoteIndex !== -1) {
        // Remove existing vote (toggle off)
        submission.upvotes[emoji].splice(existingVoteIndex, 1);
      } else {
        // Add new vote
        submission.upvotes[emoji].push({
          walletAddress,
          squad,
          timestamp: new Date().toISOString()
        });
      }
      
      // Calculate total upvotes for this submission
      const totalUpvotes = Object.values(submission.upvotes).reduce((total: number, votes: any) => {
        return total + votes.length;
      }, 0);
      
      // Update submission with new upvote data
      submissions[submissionIndex] = {
        ...submission,
        totalUpvotes,
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));
      
      return NextResponse.json({ 
        success: true, 
        upvotes: submission.upvotes,
        totalUpvotes,
        isUpvoted: existingVoteIndex === -1
      });
    }
  } catch (error) {
    console.error('[UPVOTE ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('submissionId');
    
    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    // Try database first
    try {
      const { data: submission, error } = await supabase
        .from('submissions')
        .select('upvotes, total_upvotes')
        .eq('id', submissionId)
        .single();

      if (error || !submission) {
        throw new Error('Submission not found in database');
      }

      return NextResponse.json({
        upvotes: submission.upvotes || {},
        totalUpvotes: submission.total_upvotes || 0
      });

    } catch (dbError) {
      console.log('Database operation failed, falling back to JSON file');
      
      // Fallback to JSON file
      const filePath = path.join(process.cwd(), 'public', 'submissions.json');
      
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'No submissions found' }, { status: 404 });
      }

      const submissions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const submission = submissions.find((s: any) => s.id === submissionId);
      
      if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      return NextResponse.json({
        upvotes: submission.upvotes || {},
        totalUpvotes: submission.totalUpvotes || 0
      });
    }
  } catch (error) {
    console.error('[GET UPVOTES ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 