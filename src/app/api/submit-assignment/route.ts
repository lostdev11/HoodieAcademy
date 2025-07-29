import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { slug, content } = await req.json();
    if (!slug || !content) {
      return NextResponse.json({ error: 'Missing slug or content' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'submissions.json');
    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : [];

    const submission = {
      slug,
      content,
      timestamp: new Date().toISOString()
    };

    existing.push(submission);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[SUBMIT ERROR]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 