import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { submissionId, emoji, userId, squad } = await req.json();
    
    if (!submissionId || !emoji || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
    const existingVoteIndex = submission.upvotes[emoji].findIndex((vote: any) => vote.userId === userId);
    
    if (existingVoteIndex !== -1) {
      // Remove existing vote (toggle off)
      submission.upvotes[emoji].splice(existingVoteIndex, 1);
    } else {
      // Add new vote
      submission.upvotes[emoji].push({
        userId,
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
  } catch (error) {
    console.error('[GET UPVOTES ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 