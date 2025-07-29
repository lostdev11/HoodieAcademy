import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { index, status, feedback } = await req.json();
    
    if (typeof index !== 'number' || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'submissions.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'No submissions found' }, { status: 404 });
    }

    const submissions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (index < 0 || index >= submissions.length) {
      return NextResponse.json({ error: 'Invalid submission index' }, { status: 400 });
    }

    // Update the submission
    submissions[index] = {
      ...submissions[index],
      status,
      feedback: feedback || undefined,
      reviewed_at: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[REVIEW SUBMISSION ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 