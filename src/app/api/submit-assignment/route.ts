import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { 
      slug, 
      content,
      walletAddress 
    } = await req.json();
    
    if (!slug || !content) {
      return NextResponse.json({ error: 'Missing course slug or content' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = getSupabaseBrowser();
    
    // Record course completion in Supabase
    if (walletAddress) {
      try {
        const { error: completionError } = await supabase
          .from('course_completions')
          .upsert({
            wallet_address: walletAddress,
            course_id: slug,
            completed_at: new Date().toISOString(),
            approved: false // Default to pending approval
          }, {
            onConflict: 'wallet_address,course_id'
          });

        if (completionError) {
          console.error('Error recording course completion:', completionError);
        } else {
          console.log(`Course completion recorded for ${walletAddress} - ${slug}`);
        }
      } catch (error) {
        console.error('Error recording course completion:', error);
      }
    }

    // Save submission to local file (keeping existing functionality)
    const filePath = path.join(process.cwd(), 'public', 'submissions.json');
    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : [];

    const submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Assignment for ${slug}`,
      squad: 'Unknown',
      description: content,
      courseRef: slug,
      bountyId: '',
      author: walletAddress || 'Anonymous',
      timestamp: new Date().toISOString(),
      status: 'pending',
      upvotes: {},
      totalUpvotes: 0,
            imageUrl: undefined
    };

    existing.push(submission);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

    return NextResponse.json({ 
      success: true, 
      submissionId: submission.id 
    });
  } catch (err) {
    console.error('[SUBMIT ERROR]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 