import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { 
      title, 
      squad, 
      description, 
      courseRef, 
      bountyId, 
      author,
      file 
    } = await req.json();
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Missing title or description' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'submissions.json');
    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : [];

    const submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      squad: squad || 'Unknown',
      description,
      courseRef: courseRef || '',
      bountyId: bountyId || '',
      author: author || 'Anonymous',
      timestamp: new Date().toISOString(),
      status: 'pending',
      upvotes: {},
      totalUpvotes: 0,
      imageUrl: file ? `/uploads/${file.name}` : undefined
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